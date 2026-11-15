// Public site home page: the claims rules, the route every main action opens, and the planting order of the story.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { poseAt, SEED_GONE, SPROUT_START } from '../lib/aimp/plant/timeline.ts';
import { startRoutes } from '../app/start/flow.ts';
import { site } from '../lib/aimp/site-config.ts';

const read = (file: string) => readFileSync(new URL(`../app/plant-lab/${file}`, import.meta.url), 'utf8');
const page = read('page.tsx');
const copy = [page, read('example.tsx'), read('site-header.tsx')].join('\n');

test('no earnings promises, urgency or absolute claims in the site copy', () => {
  for (const banned of [/6-figure/i, /six-figure/i, /financial freedom/i, /passive income/i, /effortless/i, /US\$\d/, /most people start here/i, /exactly once, every time/i, /cancel any time/i, /live now/i, /limited (spots|time)/i]) {
    assert.doesNotMatch(copy, banned, `banned phrase ${banned}`);
  }
  // "guarantee" may only appear where the page says there is none.
  for (const m of copy.matchAll(/.{0,24}guarantee\w*/gi)) assert.match(m[0], /No guaranteed|does not guarantee/, `unqualified guarantee: ${m[0]}`);
  assert.match(page, /We can’t promise that/);                       // the honest answer to "will this make me money?" stays
  assert.match(page, /No guaranteed income\./);
});

test('the hero says what it is and every main action opens the real onboarding', () => {
  assert.match(page, /Start a side hustle without spending weeks building it\./);
  assert.match(page, /Pick an idea\. AI builds your first product, shop and launch content\./);
  assert.match(page, /const CTA = 'Find my side hustle';/);
  assert.match(page, /const START = startRoutes\.welcome;/);
  assert.equal(startRoutes.welcome, '/start');
  assert.doesNotMatch(copy, /plant-lab\/build/, 'the preview flow folder is not in the repository; nothing may link to it');
  assert.doesNotMatch(copy, /\/workspace/, 'the old VENTRA workspace is not part of this product');
});

test('the brand comes from site-config, the page is not indexed and unfinished features are labelled', () => {
  assert.equal(site.name, 'AiMoneyPrinter');
  assert.doesNotMatch(copy, /Seedline|AiMoneyPrinter/, 'pages read the name from site-config');
  assert.match(page, /robots: \{ index: false, follow: false \}/);
  assert.match(page, /in pilot testing/);
  assert.match(page, /Draft pilot pricing/);
});

test('the seed is fully in the ground before any part of the sprout shows', () => {
  for (let p = 0; p <= 1.0001; p += 0.005) {
    const pose = poseAt(p);
    const sproutShowing = pose.growth.trunk > 0 || pose.leaves.a.scale > 0 || pose.leaves.b.scale > 0;
    // The scene removes the seed once sink passes 0.62 (plant-scene.ts: down = smooth(0, 0.62, sink)).
    if (sproutShowing) assert.ok(pose.seed.sink >= 0.62, `sprout showing at p=${p.toFixed(3)} while the seed is still visible`);
  }
  assert.ok(SEED_GONE < SPROUT_START);
  assert.ok(poseAt(SEED_GONE).seed.sink >= 0.62);
  assert.equal(poseAt(SPROUT_START).growth.trunk, 0);
});
