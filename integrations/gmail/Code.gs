/** AXONE Gmail intake. Secrets belong in Script Properties, never in this file. */
function installAxoneGmail() {
  const p = PropertiesService.getScriptProperties();
  if (!p.getProperty('AXONE_INGEST_SECRET') || !p.getProperty('AXONE_MAILBOX') || !p.getProperty('AXONE_GMAIL_QUERY')) {
    throw new Error('Set AXONE_INGEST_SECRET, AXONE_MAILBOX and AXONE_GMAIL_QUERY in Script Properties first.');
  }
  const profile = Gmail.Users.getProfile('me');
  if (profile.emailAddress.toLowerCase() !== p.getProperty('AXONE_MAILBOX').toLowerCase()) throw new Error('Wrong Google account.');
  if (!p.getProperty('AXONE_START')) p.setProperty('AXONE_START', String(Math.floor(Date.now() / 1000)));
  if (!ScriptApp.getProjectTriggers().some(t => t.getHandlerFunction() === 'syncAxoneGmail')) {
    ScriptApp.newTrigger('syncAxoneGmail').timeBased().everyMinutes(5).create();
  }
  console.log('Gmail intake enabled for new matching messages. Existing mail was not imported.');
}

function syncAxoneGmail() {
  const lock = LockService.getScriptLock();
  if (!lock.tryLock(1000)) return;
  try {
    const p = PropertiesService.getScriptProperties();
    const secret = p.getProperty('AXONE_INGEST_SECRET');
    const mailbox = p.getProperty('AXONE_MAILBOX');
    const query = p.getProperty('AXONE_GMAIL_QUERY');
    const start = Number(p.getProperty('AXONE_START'));
    if (!secret || !mailbox || !query || !start) throw new Error('Run installAxoneGmail first.');
    if (Gmail.Users.getProfile('me').emailAddress.toLowerCase() !== mailbox.toLowerCase()) throw new Error('Wrong mailbox.');
    // Re-scan the latest seven days so delayed labels/indexing are picked up.
    // DB uniqueness (mailbox + message ID) prevents repeat consultations/Slack posts.
    const after = Math.max(start, Math.floor(Date.now() / 1000) - 7 * 86400);
    let pageToken = p.getProperty('AXONE_PAGE_TOKEN') || undefined;
    const scanAfter = Number(p.getProperty('AXONE_SCAN_AFTER')) || after;
    p.setProperty('AXONE_SCAN_AFTER', String(scanAfter));
    const began = Date.now();
    do {
      const batch = Gmail.Users.Messages.list('me', { q: `(${query}) -in:sent -in:drafts -in:spam -in:trash after:${scanAfter}`,
        maxResults: 25, pageToken: pageToken });
      for (const entry of (batch.messages || [])) {
        const mail = Gmail.Users.Messages.get('me', entry.id, { format: 'full' });
        const headers = mail.payload.headers || [];
        const header = name => (headers.find(h => h.name.toLowerCase() === name.toLowerCase()) || {}).value || '';
        const rawFrom = header('From');
        const from = (rawFrom.match(/<([^<>]+)>/) || [null, rawFrom])[1].trim();
        if (from.toLowerCase() === mailbox.toLowerCase()) continue;
        // Do not re-import optional AXONE system notifications as new customer mail.
        const subject = header('Subject');
        if (subject.indexOf('[AXONE 문의]') === 0) continue;
        const plain = axonePlainText(mail.payload) || mail.snippet || '(본문 없음)';
        const response = UrlFetchApp.fetch('https://axone.ai.kr/api/integrations/gmail', {
          method: 'post', contentType: 'application/json', muteHttpExceptions: true, followRedirects: false,
          headers: { Authorization: 'Bearer ' + secret },
          payload: JSON.stringify({ mailbox, messageId: mail.id, name: rawFrom.replace(/<[^<>]+>/, '').replace(/^"|"$/g, '').trim().slice(0, 100),
            from, subject: subject.slice(0, 500), receivedAt: new Date(Number(mail.internalDate)).toISOString(),
            message: plain.length > 19000 ? plain.slice(0, 19000) + '\n[긴 본문 생략 · 원문은 Gmail에서 확인]' : plain }),
        });
        if (response.getResponseCode() !== 200 || !JSON.parse(response.getContentText()).ok) {
          throw new Error('AXONE intake failed (HTTP ' + response.getResponseCode() + '). The same batch will retry.');
        }
      }
      pageToken = batch.nextPageToken;
      if (pageToken) p.setProperty('AXONE_PAGE_TOKEN', pageToken);
      else { p.deleteProperty('AXONE_PAGE_TOKEN'); p.deleteProperty('AXONE_SCAN_AFTER'); }
    } while (pageToken && Date.now() - began < 180000);
  } finally { lock.releaseLock(); }
}

function axonePlainText(part) {
  if (part.filename) return ''; // Attachments stay in Gmail.
  if (part.mimeType === 'text/plain' && part.body && part.body.data) {
    return Utilities.newBlob(Utilities.base64DecodeWebSafe(part.body.data)).getDataAsString('UTF-8');
  }
  return (part.parts || []).map(axonePlainText).filter(Boolean).join('\n');
}
