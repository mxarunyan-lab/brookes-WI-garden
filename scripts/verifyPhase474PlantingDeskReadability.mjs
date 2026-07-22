import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
import { chromium } from 'playwright';

const base = (process.env.APP_URL || 'http://127.0.0.1:4173').replace(/\/$/, '');
const widths = [320, 375, 390, 430];
const now = new Date().toISOString();
const today = now.slice(0, 10);

const garden = {
  schemaVersion: 10,
  profile: {
    gardenerName: 'Archie',
    activeProfileId: 'archie',
    gardenName: 'The Runyan Garden',
    location: 'Green Bay, Wisconsin 54302',
    zip: '54302',
    zone: '5b',
    lastFrost: 'May 15',
    firstFrost: 'October 10',
    notifications: { weather: true, tasks: true, shopping: true },
  },
  spaces: [{
    id: 'qa-raised-bed',
    name: 'QA Raised Bed',
    type: 'bed',
    capacity: 12,
    hidden: false,
    deletedAt: null,
    createdAt: now,
    updatedAt: now,
    createdBy: 'Archie',
    updatedBy: 'Archie',
    revision: 1,
  }],
  seedPackets: [{
    id: 'qa-iceberg-packet',
    operationId: 'qa-iceberg-operation',
    brand: 'Burpee',
    name: 'Lettuce',
    crop: 'Lettuce',
    cropId: 'lettuce',
    variety: 'Iceberg A — Extra Long Mobile Readability Certification Name',
    productName: 'Burpee Iceberg A Lettuce',
    packetYear: '2026',
    quantity: 100,
    originalQuantity: 100,
    reservedQuantity: 0,
    countType: 'exact',
    status: 'active',
    sowingMethod: 'Direct Sow',
    sunlight: 'Full sun',
    daysToMaturity: 70,
    maturityBasis: 'sowing',
    depth: '0.25 inches',
    spacing: '12 inches',
    thinningSpacing: '12 inches',
    rowSpacing: '18 inches',
    germinationEstimate: '7–14 days',
    successionGuidance: 'Sow another small batch every 14 days for a continued harvest.',
    directSowGuidance: 'Direct sow outdoors when soil and weather conditions are suitable.',
    seasonalWindow: 'Spring and fall',
    frostTiming: 'Tolerates light frost',
    packetIntelligence: {
      vision: {
        exactIdentitySupportedByImages: true,
        overallAnalysisConfidence: 'high',
        packetIdentityConfidence: 'high',
      },
    },
    deletedAt: null,
    createdAt: now,
    updatedAt: now,
    createdBy: 'Archie',
    updatedBy: 'Archie',
    revision: 1,
  }],
  plants: [],
  reminders: [],
  taskHistory: [],
  seedTransactions: [],
  seedUsage: [],
  activity: [],
  harvests: [],
  problems: [],
  succession: [],
  trays: [],
  growLights: [],
  hardeningPlans: [],
  hydroPods: [],
  greenhouseReadings: [],
  plantingDecisions: [],
  shoppingItems: [],
  weatherRecommendationHistory: [],
  vacationPlans: [],
  calculatorResults: [],
  environmentalRecords: [],
  environmentalCorrections: [],
  wateringEvents: [],
  soilCheckEvents: [],
  photos: [],
  attachments: [],
  qrLabels: [],
  offlineOperations: [],
  yearPlan: { crops: [] },
};

const overlaps = (a, b) => (
  Math.min(a.right, b.right) - Math.max(a.left, b.left) > 1
  && Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top) > 1
);

await mkdir('phase474-audit/planting-desk', { recursive: true });
const browser = await chromium.launch({ headless: true });
const results = [];

try {
  for (const width of widths) {
    const page = await browser.newPage({ viewport: { width, height: 1000 }, deviceScaleFactor: 1 });
    const pageErrors = [];
    page.on('pageerror', (error) => pageErrors.push(String(error?.stack || error)));
    await page.addInitScript((seedGarden) => {
      localStorage.clear();
      sessionStorage.clear();
      localStorage.setItem('runyan-garden-active-profile', 'archie');
      localStorage.setItem('brookes-garden-state-v2', JSON.stringify(seedGarden));
      localStorage.setItem('brookes-garden-page-v2', 'plan-plant');
    }, garden);
    await page.route('**/api/weather**', (route) => route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        source: 'qa',
        current: { temperature: 72, condition: 'Partly cloudy' },
        forecast: [],
        daily: [],
        fetchedAt: now,
      }),
    }));

    await page.goto(`${base}/?page=plan-plant`, { waitUntil: 'networkidle', timeout: 30000 });
    await page.locator('main').first().waitFor({ state: 'visible', timeout: 10000 });
    assert.match(await page.locator('main').innerText(), /Planting Desk/i);
    assert.match(await page.locator('main').innerText(), /Iceberg A/i, `Iceberg packet recommendation missing at ${width}px`);

    const nonEmptyGroup = page
      .locator('.saved-seed-queue-groups details.opportunity-group')
      .filter({ has: page.locator('.intelligence-queue-card.collapsed-recommendation') })
      .first();
    await nonEmptyGroup.waitFor({ state: 'visible', timeout: 10000 });
    if (!(await nonEmptyGroup.getAttribute('open'))) {
      await nonEmptyGroup.locator(':scope > summary').click();
    }

    const card = nonEmptyGroup.locator('.intelligence-queue-card.collapsed-recommendation').first();
    await card.waitFor({ state: 'visible', timeout: 10000 });
    const summary = card.locator(':scope > summary');

    const layout = await summary.evaluate((node) => {
      const visible = (element) => {
        if (!element) return false;
        const style = getComputedStyle(element);
        const rect = element.getBoundingClientRect();
        return style.display !== 'none' && style.visibility !== 'hidden' && rect.width > 0 && rect.height > 0;
      };
      const box = (name, element) => {
        const rect = element.getBoundingClientRect();
        return {
          name,
          left: rect.left,
          top: rect.top,
          right: rect.right,
          bottom: rect.bottom,
          width: rect.width,
          height: rect.height,
        };
      };
      const elements = [
        ['copy', node.querySelector('.recommendation-summary-copy')],
        ['badge', node.querySelector('.recommendation-confidence,.seed-status-badge')],
        ['action', node.querySelector('.recommendation-summary-action')],
        ['arrow', node.querySelector(':scope > svg')],
      ].filter(([, element]) => visible(element)).map(([name, element]) => box(name, element));
      const pairs = [];
      for (let i = 0; i < elements.length; i += 1) {
        for (let j = i + 1; j < elements.length; j += 1) {
          const a = elements[i];
          const b = elements[j];
          if (Math.min(a.right, b.right) - Math.max(a.left, b.left) > 1
            && Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top) > 1) {
            pairs.push(`${a.name}/${b.name}`);
          }
        }
      }
      const cardNode = node.closest('.collapsed-recommendation');
      const copyNode = node.querySelector('.recommendation-summary-copy');
      return {
        elements,
        pairs,
        summaryOverflow: node.scrollWidth > node.clientWidth + 1,
        cardOverflow: cardNode.scrollWidth > cardNode.clientWidth + 1,
        copyOverflow: copyNode.scrollWidth > copyNode.clientWidth + 1,
        pageOverflow: document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
      };
    });

    for (let i = 0; i < layout.elements.length; i += 1) {
      for (let j = i + 1; j < layout.elements.length; j += 1) {
        assert.equal(overlaps(layout.elements[i], layout.elements[j]), false,
          `Planting Desk elements overlap at ${width}px: ${layout.elements[i].name}/${layout.elements[j].name}`);
      }
    }
    assert.deepEqual(layout.pairs, [], `Planting Desk summary overlaps at ${width}px`);
    assert.equal(layout.summaryOverflow, false, `Planting Desk summary overflows at ${width}px`);
    assert.equal(layout.cardOverflow, false, `Planting Desk card overflows at ${width}px`);
    assert.equal(layout.copyOverflow, false, `Planting Desk recommendation text overflows at ${width}px`);
    assert.equal(layout.pageOverflow, false, `Planting Desk page horizontally overflows at ${width}px`);
    assert.deepEqual(pageErrors, [], `Planting Desk page errors at ${width}px: ${pageErrors.join('\n')}`);

    await page.screenshot({
      path: `phase474-audit/planting-desk/iceberg-recommendation-${width}.png`,
      fullPage: true,
    });
    results.push({ width, ok: true, layout });
    await page.close();
  }

  await writeFile('phase474-audit/planting-desk/results.json', JSON.stringify({ ok: true, results }, null, 2));
  console.log(JSON.stringify({ ok: true, widths, checks: results.length }, null, 2));
} finally {
  await browser.close();
}
