import { Suspense } from 'react';
import { LoadingState } from '../../design-system/states';
import InsightsPage from '../../ui/ventra-insights';
export default function Page(){return <Suspense fallback={<LoadingState>Loading your workspace…</LoadingState>}><InsightsPage/></Suspense>;}
