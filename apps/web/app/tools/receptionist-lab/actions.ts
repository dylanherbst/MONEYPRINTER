'use server';
// Runs one simulated call for the Receptionist Test Lab. Everything happens in memory (scripted model, fake store,
// fake calendar, recording senders): no call is placed or answered, nothing is sent, no database or provider is used.
import { fixtureById, fixtures, simulateCall } from '../../../lib/front-office/receptionist/simulate';
import type { SimResult } from '../../../lib/front-office/receptionist/simulate';

export type LabState = { result: SimResult | null; error: string | null };

export async function runLab(_prev: LabState, form: FormData): Promise<LabState> {
  const id = String(form.get('fixture') ?? '');
  const fixture = fixtureById(id) ?? fixtures[0];
  const lines = String(form.get('lines') ?? '').slice(0, 3000).split('\n').map(l => l.trim()).filter(Boolean).slice(0, 8);
  try {
    const result = await simulateCall(fixture, {
      liveSwitch: form.get('live') === 'on',
      receptionistOn: form.get('receptionistOn') === 'on',
      transfer: form.get('transfer') === 'on',
      calendar: form.get('calendar') === 'on',
      callerLines: form.get('custom') === 'on' ? lines : [],
    });
    return { result, error: null };
  } catch (e) {
    return { result: null, error: e instanceof Error ? e.message : 'The simulation failed.' };
  }
}
