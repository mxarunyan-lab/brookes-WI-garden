import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
import { chromium } from 'playwright';

const base = (process.env.APP_URL || 'http://127.0.0.1:4173').replace(/\/$/, '');
const widths = [320, 375, 390, 430];
const now = new Date().toISOString();
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
  spaces: [{ id: 'qa-bed', name: 'QA Raised Bed', type: 'bed', capacity: 12, hidden: false, deletedAt: null }],
  seedPackets: [{
    id: 'qa-iceberg',
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
    germinationEstimate: '7–14 days',
    successionGuidance: 'Sow every 14 days.',
    packetIntelligence: { vision: { exactIdentitySupportedByImages: true, overallAnalysisConfidence: 'high' } },
    deletedAt: null,
  }],
  plants: [], reminders: [], taskHistory: [], seedTransactions: [], seedUsage: [], activity: [],
  harvests: [], problems: [], succession: [], trays: [], growLights: [], hardeningPlans: [],
  hydroPods: [], greenhouseReadings: [], plantingDecisions: [], shoppingItems: [],
  weatherRecommendationHistory: [], vacationPlans: [], calculatorResults: [], environmentalRecords: [],
  environmentalCorrections: [], wateringEvents: [], soilCheckEvents: [], photos: [], attachments: [],
  qrLabels: [], offlineOperations: [], yearPlan: { crops: [] },
};

const intersect = (a, b) => (
  Math.min(a.right, b.right) - Math.max(a.left, b.left) > 1
  && Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top) > 1
);

await mkdir('phase474-audit/planting-desk-typography', { recursive: true });
const browser = await chromium.launch({ headless: true });
const results = [];

try {
  for (const width of widths) {
    const page = await browser.newPage({ viewport: { width, height: 1000 }, deviceScaleFactor: 1 });
    const errors = [];
    page.on('pageerror', (error) => errors.push(String(error?.stack || error)));
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
      body: JSON.stringify({ current: { temperature: 72, condition: 'Partly cloudy' }, forecast: [], daily: [] }),
    }));
    await page.goto(`${base}/?page=plan-plant`, { waitUntil: 'networkidle', timeout: 30000 });
    await page.locator('main').first().waitFor({ state: 'visible', timeout: 10000 });

    const headingCount = await page.locator('.planting-section-heading.intelligence-heading').count();
    assert.ok(headingCount >= 2, `Expected saved-seed and other-opportunity headings at ${width}px`);
    const headingReports = [];
    for (let index = 0; index < headingCount; index += 1) {
      const heading = page.locator('.planting-section-heading.intelligence-heading').nth(index);
      const report = await heading.evaluate((node) => {
        const rect = (name, element) => {
          if (!element) return null;
          const box = element.getBoundingClientRect();
          const style = getComputedStyle(element);
          return {
            name,
            left: box.left,
            top: box.top,
            right: box.right,
            bottom: box.bottom,
            width: box.width,
            height: box.height,
            display: style.display,
            lineHeight: style.lineHeight,
          };
        };
        const span = node.querySelector(':scope > span');
        const pieces = [
          rect('eyebrow', span?.querySelector(':scope > small')),
          rect('title', span?.querySelector(':scope > strong')),
          rect('description', span?.querySelector(':scope > p')),
          rect('count', node.querySelector(':scope > em')),
        ].filter(Boolean);
        return {
          text: node.innerText,
          pieces,
          overflow: node.scrollWidth > node.clientWidth + 1,
          spanOverflow: span ? span.scrollWidth > span.clientWidth + 1 : false,
        };
      });
      for (let i = 0; i < report.pieces.length; i += 1) {
        for (let j = i + 1; j < report.pieces.length; j += 1) {
          const a = report.pieces[i];
          const b = report.pieces[j];
          assert.equal(intersect(a, b), false,
            `Heading text overlaps at ${width}px (${index}): ${a.name}/${b.name}`);
        }
      }
      const title = report.pieces.find((piece) => piece.name === 'title');
      assert.ok(title && title.width > 25, `Heading title is still trapped in a 25px badge at ${width}px (${index})`);
      assert.equal(report.overflow, false, `Heading overflows at ${width}px (${index})`);
      assert.equal(report.spanOverflow, false, `Heading copy overflows at ${width}px (${index})`);
      headingReports.push(report);
    }

    const drawerCount = await page.locator('.garden-calendar-drawer > summary').count();
    assert.equal(drawerCount, 2, `Expected Packet Calendar and Plant Lifecycle drawers at ${width}px`);
    const drawerReports = [];
    for (let index = 0; index < drawerCount; index += 1) {
      const summary = page.locator('.garden-calendar-drawer > summary').nth(index);
      const report = await summary.evaluate((node) => {
        const box = (name, element) => {
          const rect = element.getBoundingClientRect();
          return { name, left: rect.left, top: rect.top, right: rect.right, bottom: rect.bottom, width: rect.width, height: rect.height };
        };
        const span = node.querySelector(':scope > span');
        const eyebrow = span.querySelector(':scope > small');
        const title = span.querySelector(':scope > strong');
        const arrow = node.querySelector(':scope > svg');
        return {
          text: node.innerText,
          pieces: [box('eyebrow', eyebrow), box('title', title), box('arrow', arrow)],
          overflow: node.scrollWidth > node.clientWidth + 1,
          spanOverflow: span.scrollWidth > span.clientWidth + 1,
        };
      });
      for (let i = 0; i < report.pieces.length; i += 1) {
        for (let j = i + 1; j < report.pieces.length; j += 1) {
          assert.equal(intersect(report.pieces[i], report.pieces[j]), false,
            `Drawer text overlaps at ${width}px (${index}): ${report.pieces[i].name}/${report.pieces[j].name}`);
        }
      }
      assert.ok(report.pieces.find((piece) => piece.name === 'title').width > 25,
        `Drawer title is still trapped in a 25px badge at ${width}px (${index})`);
      assert.equal(report.overflow, false, `Drawer summary overflows at ${width}px (${index})`);
      assert.equal(report.spanOverflow, false, `Drawer copy overflows at ${width}px (${index})`);
      drawerReports.push(report);
    }

    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1), false,
      `Planting Desk page horizontally overflows at ${width}px`);
    assert.deepEqual(errors, [], `Planting Desk page errors at ${width}px: ${errors.join('\n')}`);
    await page.screenshot({ path: `phase474-audit/planting-desk-typography/planting-desk-${width}.png`, fullPage: true });
    results.push({ width, headingReports, drawerReports });
    await page.close();
  }
  await writeFile('phase474-audit/planting-desk-typography/results.json', JSON.stringify({ ok: true, results }, null, 2));
  console.log(JSON.stringify({ ok: true, widths, headingChecks: results.length }, null, 2));
} finally {
  await browser.close();
}
