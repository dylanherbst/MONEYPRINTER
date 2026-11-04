import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import { features, isOpenable, statusLabel } from '../lib/feature-registry.ts';

const md = readFileSync(new URL('../../../docs/agents/FEATURES.md', import.meta.url), 'utf8');
const rows = new Map<string, string>();
for (const line of md.split('\n')) {
  const c = line.split('|').map(s => s.trim());
  if (c.length >= 8 && /^\d$/.test(c[1])) rows.set(c[3], c[4].toLowerCase());
}
const toStatus: Record<string, string> = { working: 'working', 'local draft': 'local-draft', blocked: 'blocked', 'not started': 'not-started' };

test('every registry entry names a real FEATURES.md row and has the same status (FEATURES.md wins)', () => {
  assert.ok(rows.size > 60);
  for (const x of features) {
    assert.ok(rows.has(x.row), `no FEATURES.md row: ${x.row}`);
    assert.equal(toStatus[rows.get(x.row)!], x.status, `${x.id} status differs from FEATURES.md`);
  }
});
test('ids are unique and every entry explains its availability', () => {
  assert.equal(new Set(features.map(x => x.id)).size, features.length);
  for (const x of features) assert.ok(x.availability.length > 8 && x.description && x.requires && x.permissions, x.id);
});
test('blocked and not-started entries are never openable and carry no route', () => {
  for (const x of features.filter(y => y.status === 'blocked' || y.status === 'not-started')) { assert.equal(x.route, null, x.id); assert.equal(isOpenable(x), false); }
  assert.equal(statusLabel('blocked'), 'Needs setup');
  assert.equal(statusLabel('not-started'), 'Coming soon');
});
test('customer routes never point at developer pages except the launcher flow still being wrapped', () => {
  const tools = features.filter(x => x.route?.startsWith('/tools'));
  assert.ok(tools.every(x => x.section === 'start'), 'only the Start a Business flow may still use /tools');
});
