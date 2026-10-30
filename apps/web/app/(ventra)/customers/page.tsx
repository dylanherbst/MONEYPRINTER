import { Suspense } from 'react';
import { CustomersPage } from '../../ui/ventra-pages';
export default function Page(){return <Suspense fallback={<p role="status">Loading workspace…</p>}><CustomersPage/></Suspense>;}
