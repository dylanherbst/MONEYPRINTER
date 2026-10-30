import { Suspense } from 'react';
import { InboxPage } from '../../ui/ventra-pages';
export default function Page(){return <Suspense fallback={<p role="status">Loading workspace…</p>}><InboxPage/></Suspense>;}
