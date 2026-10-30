import { Suspense } from 'react';
import { GrowPage } from '../../ui/ventra-pages';
export default function Page(){return <Suspense fallback={<p role="status">Loading workspace…</p>}><GrowPage/></Suspense>;}
