'use client';
import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Inbox as InboxIcon, RefreshCw, Mail, Globe, CheckCircle2, Clock, ExternalLink } from 'lucide-react';
import type { Inquiry, InquiryStatus } from '@/lib/inquiries';
import styles from './inbox.module.css';

const statuses: Record<InquiryStatus, string> = { new: '신규 접수', in_progress: '상담 중', closed: '처리 완료' };
const slackStatuses = { pending: '전송 대기', sending: '전송 중', sent: '전송 완료', failed: '재시도 대기' };
type Data = { inquiries: Inquiry[]; total: number; pending: number; integrations: { database: boolean; slack: boolean; gmail: boolean } };
const date = (v: string) => new Date(v).toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' });
export default function Inbox() {
  const params = useSearchParams();
  const ticket = params.get('ticket') || '';
  const [data, setData] = useState<Data>();
  const [page, setPage] = useState(1), [status, setStatus] = useState(''), [source, setSource] = useState('');
  const [error, setError] = useState(''), [notice, setNotice] = useState(''), [loading, setLoading] = useState(true), [retrying, setRetrying] = useState(false);
  const refresh = useCallback(async (signal?: AbortSignal) => {
    setLoading(true); setError('');
    try {
      const res = await fetch(`/api/admin/inquiries?${new URLSearchParams({ page: String(page), status, source, ticket })}`, { cache: 'no-store', signal });
      if (res.status === 401) { window.location.href = `/admin/login?from=${encodeURIComponent('/admin/inquiries' + (ticket ? '?ticket=' + ticket : ''))}`; return; }
      const json = await res.json(); if (!res.ok) throw new Error(json.error);
      setData(json);
    } catch (e) { if (!signal?.aborted) setError(e instanceof Error ? e.message : '목록을 불러오지 못했습니다.'); }
    finally { if (!signal?.aborted) setLoading(false); }
  }, [page, status, source, ticket]);
  useEffect(() => { const c = new AbortController(); void refresh(c.signal); return () => c.abort(); }, [refresh]);
  async function retry() {
    setRetrying(true); setNotice('');
    try {
      const res = await fetch('/api/admin/inquiries/retry', { method: 'POST' }); const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      setNotice(json.configured ? `${json.sent}건 전송했습니다. 실패한 알림은 5분 뒤 재시도할 수 있습니다.` : 'Slack 수신 채널 연결이 필요합니다.');
      await refresh();
    } catch (e) { setError(e instanceof Error ? e.message : '재전송 실패'); }
    finally { setRetrying(false); }
  }
  return <div className={`container ${styles.page}`}>
    <div className={styles.heading}><div><p className="eyebrow">Admin · Customer inbox</p><h1><InboxIcon aria-hidden /> 상담 접수함</h1><p>홈페이지와 Gmail로 들어온 문의를 확인하고 후속 상담을 관리합니다.</p></div>
      <nav aria-label="관리자 메뉴"><Link href="/admin/projects">프로젝트 관리 <ExternalLink size={14} /></Link><button type="button" onClick={async () => { await fetch('/api/admin/logout', { method: 'POST' }); window.location.href = '/admin/login'; }}>로그아웃</button></nav></div>
    {data && <div className={styles.integrations}>
      <span><CheckCircle2 size={16} /> DB 저장 연결됨</span><span><Clock size={16} /> Slack {data.integrations.slack ? '알림 설정됨' : '채널 연결 필요'} · 대기 {data.pending}건</span>
      <span><Mail size={16} /> Gmail {data.integrations.gmail ? '수신 API 준비됨 · 메일함 연결 별도' : '메일함 연결 필요'}</span>
    </div>}
    <div className={styles.filters}>
      {ticket && <Link href="/admin/inquiries">전체 상담 보기</Link>}
      <label>처리 상태<select aria-label="처리 상태" value={status} onChange={e => { setStatus(e.target.value); setPage(1); }}><option value="">전체 상태</option>{Object.entries(statuses).map(([v, label]) => <option key={v} value={v}>{label}</option>)}</select></label>
      <label>접수 경로<select aria-label="접수 경로" value={source} onChange={e => { setSource(e.target.value); setPage(1); }}><option value="">전체 경로</option><option value="website">홈페이지</option><option value="gmail">Gmail</option></select></label>
      <button type="button" onClick={() => void refresh()} disabled={loading}><RefreshCw size={16} /> 새로고침</button>
      <button type="button" onClick={retry} disabled={retrying || !data?.integrations.slack}>{retrying ? '전송 중…' : '대기 알림 재전송'}</button>
    </div>
    {notice && <p role="status" className={styles.notice}>{notice}</p>}{error && <p role="alert" className={styles.error}>{error}</p>}
    {loading ? <p role="status">상담 목록을 불러오고 있습니다…</p> : data && <>
      <p className={styles.count}>총 {data.total}건 · 최신 접수순</p>
      {data.inquiries.length === 0 ? <div className={styles.empty}><InboxIcon size={32} /><h2>접수된 상담이 없습니다</h2><p>새 상담이 접수되면 이곳에 표시됩니다.</p></div> : data.inquiries.map(inquiry => <InquiryCard key={`${inquiry.id}:${inquiry.version}`} inquiry={inquiry} open={params.get('ticket') === inquiry.ticket_id} onSaved={refresh} />)}
      <div className={styles.pagination}><button disabled={page === 1} onClick={() => setPage(page - 1)}>이전</button><span>{page} / {Math.max(1, Math.ceil(data.total / 25))}</span><button disabled={page * 25 >= data.total} onClick={() => setPage(page + 1)}>다음</button></div>
    </>}
  </div>;
}
function InquiryCard({ inquiry: i, open, onSaved }: { inquiry: Inquiry; open: boolean; onSaved: () => Promise<void> }) {
  const [status, setStatus] = useState(i.status), [note, setNote] = useState(i.note), [saving, setSaving] = useState(false), [error, setError] = useState('');
  async function save() {
    setSaving(true); setError('');
    try {
      const res = await fetch('/api/admin/inquiries', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: i.id, status, note, version: i.version }) });
      const json = await res.json(); if (!res.ok) throw new Error(json.error); await onSaved();
    } catch (e) { setError(e instanceof Error ? e.message : '저장 실패'); } finally { setSaving(false); }
  }
  return <details className={styles.card} open={open || undefined}>
    <summary><div className={styles.cardTop}><span className={styles.source}>{i.source === 'website' ? <Globe size={15} /> : <Mail size={15} />}{i.source === 'website' ? '홈페이지' : 'Gmail'}</span><span className={styles.badge}>{statuses[i.status]}</span><time dateTime={i.created_at}>{date(i.created_at)}</time></div>
      <h2>{i.name} <small>{i.company}</small></h2><p>{i.subject || i.service || '이메일 문의'}</p><div className={styles.meta}><span>{i.ticket_id}</span><span>Slack · {slackStatuses[i.slack_status]}</span><span>내용 보기</span></div></summary>
    <div className={styles.detail}>
      <dl><div><dt>이메일</dt><dd><a href={`mailto:${i.email}`}>{i.email}</a></dd></div><div><dt>연락처</dt><dd>{i.phone || '-'}</dd></div><div><dt>관심 프로젝트</dt><dd>{i.project || '-'}</dd></div><div><dt>예상 비용</dt><dd>{i.estimate || '-'}</dd></div>{i.source === 'gmail' && <div><dt>메일 수신 시각</dt><dd>{date(i.received_at)}</dd></div>}</dl>
      <h3>문의 내용</h3><p className={styles.message}>{i.message}</p>
      {i.slack_error && <p className={styles.error}>알림: {i.slack_error} · 상담 내용은 저장되어 있습니다.</p>}
      <div className={styles.edit}><label>처리 상태<select aria-label="처리 상태" value={status} onChange={e => setStatus(e.target.value as InquiryStatus)}>{Object.entries(statuses).map(([v, label]) => <option key={v} value={v}>{label}</option>)}</select></label>
        <label>내부 상담 메모<textarea value={note} onChange={e => setNote(e.target.value)} maxLength={5000} rows={3} placeholder="연락 일자와 다음 할 일을 기록하세요." /></label>
        {error && <p role="alert" className={styles.error}>{error}</p>}<button className="btn btn--primary" onClick={save} disabled={saving || (status === i.status && note === i.note)}>{saving ? '저장 중…' : '변경 내용 저장'}</button></div>
    </div>
  </details>;
}
