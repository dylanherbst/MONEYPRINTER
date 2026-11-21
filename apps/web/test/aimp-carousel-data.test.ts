// The workspace carousel's numbers come from the real overview view model. These tests check the grouping and counts without a browser.
import assert from 'node:assert/strict';
import test from 'node:test';
import { buildCarouselData, GROUP_OF } from '../app/app/[business]/carousel/carousel-data.ts';
import { buildBusinessOverview } from '../lib/aimp/overview/index.ts';
import { DEMO_OVERVIEW_NOW, demoSnapshot } from '../lib/aimp/overview/demo.ts';
import { buildOverviewViewModel } from '../app/app/[business]/view-model.ts';

const data = (state: 'new_setup' | 'live') => buildCarouselData(buildOverviewViewModel({ overview: buildBusinessOverview({ ...demoSnapshot(state), businessId: 'biz-a' }, DEMO_OVERVIEW_NOW), businessName: 'Test shop' }));

test('every launch step belongs to exactly one group and the counts add up', () => {
  const d = data('new_setup');
  assert.equal(d.count.build.total + d.count.growth.total, d.total);
  assert.equal(d.count.build.done + d.count.growth.done, d.done);
  for (const t of d.tasks) assert.equal(t.group, GROUP_OF[t.id] ?? 'build', t.id);
});

test('the next step is the first step not done, and a finished launch has none', () => {
  const d = data('new_setup');
  const first = d.tasks.find((t) => !t.done);
  assert.equal(d.next?.label, first?.label);
  assert.ok(d.percent >= 0 && d.percent <= 100);
});

test('links use the business id and never point at a different business', () => {
  const d = data('live');
  assert.equal(d.businessId, 'biz-a');
  assert.equal(d.marketingHref, '/app/biz-a/marketing');
  assert.equal(d.ordersHref, '/app/biz-a/orders');
});
