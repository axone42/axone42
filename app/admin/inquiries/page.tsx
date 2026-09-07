import { Suspense } from 'react';
import Inbox from './Inbox';
export default function InquiriesPage() { return <Suspense fallback={<p>상담 목록 준비 중…</p>}><Inbox /></Suspense>; }
