import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const ts = require('typescript');
const { NextRequest, NextResponse } = require('next/server');
function load(file, mocks = {}, globals = {}) {
  const source = fs.readFileSync(new URL('../' + file, import.meta.url), 'utf8');
  const js = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 } }).outputText;
  const module = { exports: {} };
  vm.runInNewContext(js, { module, exports: module.exports, require: name => name in mocks ? mocks[name] : require(name),
    process: { env: { ADMIN_TOKEN: 'test-admin', GMAIL_INGEST_SECRET: 'test-ingest', GMAIL_MAILBOX: 'test@example.com' } },
    URL, Buffer, AbortSignal, fetch, console: { error() {} }, ...globals });
  return module.exports;
}
const auth = load('lib/admin-auth.ts');
function adminRequest(method = 'GET', headers = {}, body) {
  return new NextRequest('https://axone.ai.kr/api/admin/inquiries', { method, headers, ...(body && { body: JSON.stringify(body) }) });
}
test('admin inbox requires a valid cookie and mutations require same origin', () => {
  assert.equal(auth.adminAccess(adminRequest()).status, 401);
  assert.equal(auth.adminAccess(adminRequest('GET', { cookie: 'axone_admin=wrong' })).status, 401);
  assert.equal(auth.adminAccess(adminRequest('GET', { cookie: 'axone_admin=test-admin' })), null);
  assert.equal(auth.adminAccess(adminRequest('PATCH', { cookie: 'axone_admin=test-admin', origin: 'https://evil.example' }), true).status, 403);
  assert.equal(auth.adminAccess(adminRequest('PATCH', { cookie: 'axone_admin=test-admin', origin: 'https://axone.ai.kr' }), true), null);
  assert.equal(auth.secretMatches(undefined, undefined), false);
});
test('unauthenticated inbox requests never query the database', async () => {
  let reads = 0;
  const api = load('app/api/admin/inquiries/route.ts', {
    '@/lib/admin-auth': auth, '@/lib/inquiries': { listInquiries: async () => { reads++; } }, '@/lib/slack': { slackConfigured: () => false },
  });
  assert.equal((await api.GET(adminRequest())).status, 401); assert.equal(reads, 0);
});
test('Gmail endpoint requires its own secret and the configured mailbox; retries keep message identity', async () => {
  const saved = [], tasks = [];
  const api = load('app/api/integrations/gmail/route.ts', {
    'next/server': { NextResponse, after: fn => tasks.push(fn) }, '@/lib/admin-auth': auth,
    '@/lib/inquiries': { saveInquiry: async i => { saved.push(i); return { inquiry: { id: 'mock', ticket_id: 'AX-GMAIL' } }; } },
    '@/lib/slack': { notifyInquiry: async () => { throw new Error('Slack unavailable'); } },
  });
  const message = { messageId: '123abc', mailbox: 'test@example.com', from: 'customer@example.com', name: 'Customer', subject: '문의', message: '문의 본문', receivedAt: '2026-09-07T00:00:00Z' };
  const req = (body, secret = '') => new Request('https://axone.ai.kr/api/integrations/gmail', { method: 'POST', headers: { Authorization: secret }, body: JSON.stringify(body) });
  assert.equal((await api.POST(req(message))).status, 401);
  assert.equal((await api.POST(req({ ...message, mailbox: 'different@example.com' }, 'Bearer test-ingest'))).status, 422);
  assert.equal(saved.length, 0);
  for (let n = 0; n < 2; n++) assert.equal((await api.POST(req(message, 'Bearer test-ingest'))).status, 200);
  assert.equal(saved[0].externalId, 'test@example.com:123abc'); assert.equal(saved[1].externalId, saved[0].externalId);
  assert.equal(saved[0].consent, undefined); // Receiving email must not fabricate form consent.
  for (const task of tasks) await task();
});
test('Slack treats customer content as plain text and only accepts Slack webhook destinations', () => {
  const slack = load('lib/slack.ts', { '@/lib/inquiries': {} }, { process: { env: { SLACK_WEBHOOK_URL: 'https://evil.example/services/T/B/key' } } });
  assert.equal(slack.slackConfigured(), false);
  const payload = slack.slackPayload({ source: 'website', ticket_id: 'AX-TEST', name: '<!channel>', email: 'a@example.com', message: '<!here> <https://evil.example|click>' });
  assert.equal(payload.blocks[1].text.type, 'plain_text'); assert.equal(payload.blocks[2].text.type, 'plain_text');
  assert.doesNotMatch(payload.text, /!channel|!here|evil/);
  assert.equal(payload.unfurl_links, false);
});
test('Slack failure leaves a retriable record and concurrent claims cannot send twice', async () => {
  let claimed = false, deliveries = 0; const writes = [];
  const sql = async (strings, ...values) => {
    if (strings.join('').includes('RETURNING *')) {
      if (claimed) return []; claimed = true;
      return [{ id: 'id', source: 'website', ticket_id: 'AX-TEST', name: '고객', email: 'a@example.com', message: '상담' }];
    }
    writes.push(values); return [];
  };
  const slack = load('lib/slack.ts', { '@/lib/inquiries': { inquirySql: () => sql } }, {
    process: { env: { SLACK_WEBHOOK_URL: 'https://hooks.slack.com/services/T123/B123/abc123' } },
    fetch: async () => { deliveries++; return new Response('error', { status: 503 }); },
  });
  await Promise.all([slack.notifyInquiry('id'), slack.notifyInquiry('id')]);
  assert.equal(deliveries, 1); assert.equal(writes[0][0], 'failed'); assert.equal(writes[0][1], 'Slack HTTP 503');
});
