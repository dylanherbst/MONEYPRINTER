import { connection } from 'next/server';
import { googleConfigFromEnv } from '../../../lib/front-office/calendar/google';
import { anthropicConfigFromEnv } from '../../../lib/front-office/llm';
import { fixtures } from '../../../lib/front-office/receptionist/simulate';
import ReceptionistLab from './lab';

// Isolated test page for the AI Receptionist (task A-4). It runs a simulated inbound call through the real Receptionist
// pipeline. The connection list below only reports whether each real connection is set up (yes or no, never a value);
// the lab itself uses none of them.
export default async function ReceptionistLabPage() {
  await connection();
  const status = [
    { name: 'Live voice switch (FRONT_OFFICE_VOICE_LIVE)', on: process.env.FRONT_OFFICE_VOICE_LIVE === '1', onText: 'ON', offText: 'OFF' },
    { name: 'Voice channel (Vapi)', on: !!process.env.FRONT_OFFICE_VOICE_CHANNEL_ID?.trim(), onText: 'CONNECTED', offText: 'NOT CONNECTED' },
    { name: 'AI model', on: !!anthropicConfigFromEnv(), onText: 'CONFIGURED', offText: 'NOT CONFIGURED' },
    { name: 'Google Calendar', on: !!googleConfigFromEnv(), onText: 'CONNECTED', offText: 'NOT CONNECTED' },
    { name: 'Live sending (FRONT_OFFICE_SEND_LIVE)', on: process.env.FRONT_OFFICE_SEND_LIVE === '1', onText: 'ON', offText: 'OFF' },
  ].map(s => ({ name: s.name, state: s.on ? s.onText : s.offText }));
  return <ReceptionistLab status={status} fixtures={fixtures.map(f => ({ id: f.id, title: f.title, covers: f.covers, lines: f.turns.map(t => t.says) }))} />;
}
