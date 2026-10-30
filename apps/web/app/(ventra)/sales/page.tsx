import { Suspense } from 'react';
import { SalesPage } from '../../ui/ventra-pages';
export default function Page(){return <Suspense fallback={<p role="status">Loading workspace…</p>}><SalesPage/></Suspense>;}
