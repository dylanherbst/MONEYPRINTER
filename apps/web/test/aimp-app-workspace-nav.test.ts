// Owner workspace navigation bar (15 Nov request). The bar is a client component; its list and link rules are plain data in
// workspace-nav-items.ts, which the component renders, so these tests check what it draws.
import assert from 'node:assert/strict';
import test from 'node:test';
import { currentSegment, workspaceNavHref, workspaceNavItems } from '../app/app/[business]/workspace-nav-items.ts';

const item = (label: string) => {
  const i = workspaceNavItems.find((x) => x.label === label);
  assert.ok(i, `${label} is in the bar`);
  return i;
};

test('Overview, Brand, Products and Orders are links with the right addresses for a business id', () => {
  assert.equal(workspaceNavHref('biz-a', item('Orders')), '/app/biz-a/orders');
  assert.equal(workspaceNavHref('biz-a', item('Overview')), '/app/biz-a');
  assert.equal(workspaceNavHref('biz-a', item('Brand')), '/app/biz-a/brand');
  assert.equal(workspaceNavHref('biz-a', item('Products')), '/app/biz-a/products');
  assert.equal(workspaceNavHref('other_1', item('Products')), '/app/other_1/products');
});

test('Website, Domains and Payments are links now that their pages exist (AMP-087, AMP-088)', () => {
  assert.equal(workspaceNavHref('biz-a', item('Website')), '/app/biz-a/website');
  assert.equal(workspaceNavHref('biz-a', item('Domains')), '/app/biz-a/domains');
  assert.equal(workspaceNavHref('biz-a', item('Payments')), '/app/biz-a/payments');
});

test('Dashboard is a link now that the merchant dashboard exists (AMP-062), and it is lit on its own page', () => {
  assert.equal(workspaceNavHref('biz-a', item('Dashboard')), '/app/biz-a/dashboard');
  assert.equal(item('Dashboard').ready, true);
  assert.equal(currentSegment('/app/biz-a/dashboard', 'biz-a'), 'dashboard');
});

test('a page that is not built is plain text, never a link', () => {
  assert.equal(workspaceNavHref('biz-a', { label: 'Later', segment: 'later', ready: false }), null);
});

test('every item is either a link or plain text, never both, and the order is stable', () => {
  assert.deepEqual(workspaceNavItems.map((i) => i.label), ['Overview', 'Dashboard', 'Brand', 'Products', 'Orders', 'Website', 'Domains', 'Payments', 'Marketing', 'Approvals', 'Operator']);
  for (const i of workspaceNavItems) assert.equal(workspaceNavHref('b', i) === null, !i.ready, i.label);
  assert.equal(new Set(workspaceNavItems.map((i) => i.label)).size, workspaceNavItems.length);
});

test('the highlighted item follows the first path segment, so the product editor keeps Products lit', () => {
  assert.equal(currentSegment('/app/biz-a', 'biz-a'), '');
  assert.equal(currentSegment('/app/biz-a/products', 'biz-a'), 'products');
  assert.equal(currentSegment('/app/biz-a/products/prod-1', 'biz-a'), 'products');
  assert.equal(currentSegment('/app/biz-a/brand', 'biz-a'), 'brand');
  assert.equal(currentSegment('/elsewhere', 'biz-a'), '');
  assert.equal(workspaceNavItems.find((i) => i.segment === currentSegment('/app/biz-a/products/prod-1', 'biz-a'))?.label, 'Products');
});
