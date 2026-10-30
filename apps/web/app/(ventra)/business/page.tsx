import { Suspense } from 'react';
import { BusinessPage } from '../../ui/ventra-pages';
export default function Page(){return <Suspense fallback={<p role="status">Loading workspace…</p>}><BusinessPage/></Suspense>;}
