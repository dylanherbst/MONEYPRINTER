import { connection } from 'next/server';
import { newLab } from '../../../lib/front-office/setter/lab';
import SetterLab from './lab';

// Isolated test page for the AI Setter (task A-3). Customer messages run through the real inbound router and Setter
// pipeline with a scripted model and an in-memory store and calendar. No paid model is reachable from this page.
export default async function SetterLabPage() {
  await connection();
  return <SetterLab initial={newLab('owner_approval')} />;
}
