import { Suspense } from 'react';
import InsightsPage from '../../ui/ventra-insights';
export default function Page(){return <Suspense fallback={<p role="status">Loading workspace…</p>}><InsightsPage/></Suspense>;}
