import { Suspense } from 'react';
import { SettingsPage } from '../../ui/ventra-pages';
export default function Page(){return <Suspense fallback={<p role="status">Loading workspace…</p>}><SettingsPage/></Suspense>;}
