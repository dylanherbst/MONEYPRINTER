import assert from 'node:assert/strict';
import test from 'node:test';
import { checkAuditRaw } from '../lib/audit-sync.ts';

const action = { finding: 'Slow replies', evidence: 'Noted from three enquiries', impact: 'High', confidence: 'Medium', destination: '/inbox' };
const audit = { version: 1, assessment: 'Steady but quiet.', underperforming: 'Replies', plan: 'Reply within a day.', actions: [action], updatedAt: '2026-11-04T00:00:00.000Z' };

test('a valid saved audit passes', () => { checkAuditRaw(JSON.stringify(audit)); });
test('invalid audits are rejected', () => {
  assert.throws(() => checkAuditRaw('nope'));
  assert.throws(() => checkAuditRaw('null'));
  assert.throws(() => checkAuditRaw(JSON.stringify({ ...audit, plan: '' })));
  assert.throws(() => checkAuditRaw(JSON.stringify({ ...audit, actions: [action, action, action, action] })));
  assert.throws(() => checkAuditRaw(JSON.stringify({ ...audit, actions: [{ ...action, destination: '/evil' }] })));
});
