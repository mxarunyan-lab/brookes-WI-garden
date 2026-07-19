const providers = [];
const normalize = (value) => String(value ?? '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
const now = () => new Date().toISOString();

const OFFICIAL_PRODUCTS = [
  {
    id: 'burpee-prod000747',
    officialProductId: 'prod000747',
    brand: 'Burpee',
    crop: 'Lettuce',
    cropId: 'lettuce',
    variety: 'Iceberg A',
    productName: 'Iceberg A Lettuce Seeds',
    category: 'vegetable',
    sourceName: 'Burpee official product page',
    sourceUrl: 'https://www.burpee.com/vegetables/lettuce/lettuce-iceberg-a-prod000747.html',
    guideSourceName: 'Burpee official lettuce growing guide',
    guideUrl: 'https://support.burpee.com/support/solutions/articles/60000961783-learn-about-lettuce',
    identityAliases: ['lettuce iceberg a', 'iceberg a lettuce', 'burpee iceberg a', 'prod000747'],
    productFields: {
      designations: ['Heirloom'],
      daysToMaturity: 85,
      plantHeight: '9–15 inches',
      plantSpread: '6 inches',
      sunlight: 'Full sun',
      notableClaims: 'Crisphead lettuce · thrives in cooler weather',
    },
    guideFields: {
      depth: '1/4 inch',
      spacing: '12 inches',
      rowSpacing: '12 inches',
      germinationEstimate: '7–10 days',
      sowingMethod: 'Direct sow',
      directSowGuidance: 'Sow in average soil in full sun in early spring and again in late summer for a fall crop.',
      seasonalWindow: 'Early spring and late summer for a fall crop',
      waterGuidance: 'Keep evenly moist throughout growth.',
      soilGuidance: 'Average, well-drained soil enriched with organic matter.',
      successionGuidance: 'Sow every two weeks to extend the harvest.',
      harvestGuidance: 'Harvest when the head is firm and full-sized.',
      containerSuitability: 'Container friendly when plants have about 12  inches of space.',
    },
  },
  {
    id: 'burpee-green-ice',
    officialProductId: 'prod000738',
    brand: 'Burpee',
    crop: 'Lettuce',
    cropId: 'lettuce',
    variety: 'Green Ice',
    productName: 'Green Ice Lettuce Seeds',
    category: 'vegetable',
    sourceName: 'Burpee official product page',
    sourceUrl: 'https://www.burpee.com/lettuce-green-ice-prod000738.html',
    identityAliases: ['lettuce green ice', 'green ice lettuce', 'prod000738'],
    productFields: {sunlight: 'Full sun'},
    guideFields: {},
  },
];

function score(identity, product) {
  const brand = normalize(identity.brand);
  const crop = normalize(identity.crop);
  const variety = normalize(identity.variety);
  const productName = normalize(identity.productName);
  const barcode = normalize(identity.barcode);
  const code = normalize(identity.sku || identity.catalogNumber || identity.productCode);
  let points = 0;
  const reasons = [];
  if (barcode && product.barcode && barcode === normalize(product.barcode)) { points += 120; reasons.push('exact barcode'); }
  if (code && code === normalize(product.officialProductId)) { points += 100; reasons.push('exact product ID'); }
  if (brand && brand === normalize(product.brand)) { points += 20; reasons.push('brand'); }
  if (crop && crop === normalize(product.crop)) { points += 24; reasons.push('crop'); }
  if (variety && variety === normalize(product.variety)) { points += 48; reasons.push('variety'); }
  if (productName && (productName === normalize(product.productName) || productName.includes(normalize(product.variety)))) { points += 30; reasons.push('product name'); }
  const combined = normalize([identity.brand, identity.crop, identity.variety, identity.productName, identity.sku, identity.catalogNumber, identity.productCode].filter(Boolean).join(' '));
  if (combined && product.identityAliases.some((alias) => combined.includes(normalize(alias)))) { points += 35; reasons.push('identity alias'); }
  const exact = Boolean(reasons.includes('exact barcode') || reasons.includes('exact product ID') || (points >= 82 && reasons.includes('brand') && reasons.includes('crop') && reasons.includes('variety')));
  return {score: points, reasons, exact, tier: exact ? 'exact' : points >= 58 ? 'medium' : 'low'};
}

async function verifyKnownOfficialUrl(product, {signal} = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 7000);
  const abort = () => controller.abort();
  signal?.addEventListener?.('abort', abort, {once: true});
  try {
    const response = await fetch(product.sourceUrl, {
      method: 'GET',
      redirect: 'follow',
      signal: controller.signal,
      headers: {'user-agent': 'RunyanGarden/0.20.3 product verification'},
    });
    if (!response.ok) return {reachable: false, status: response.status};
    const html = (await response.text()).slice(0, 500_000);
    const identitySupported = [product.brand, product.variety, product.crop].every((term) => normalize(html).includes(normalize(term)));
    return {reachable: true, status: response.status, identitySupported};
  } catch (error) {
    return {reachable: false, status: 0, reason: error?.name === 'AbortError' ? 'timeout' : 'network'};
  } finally {
    clearTimeout(timer);
    signal?.removeEventListener?.('abort', abort);
  }
}

const officialCatalogProvider = {
  name: 'official-curated-catalog',
  async find(identity, {signal} = {}) {
    const ranked = OFFICIAL_PRODUCTS.map((product) => ({...product, match: score(identity, product)})).sort((a, b) => b.match.score - a.match.score);
    const candidate = ranked[0];
    if (!candidate?.match.exact) return null;
    const liveVerification = await verifyKnownOfficialUrl(candidate, {signal});
    return {
      exact: true,
      candidate,
      sources: [
        {name: candidate.sourceName, url: candidate.sourceUrl, type: 'official-product', liveVerification},
        ...(candidate.guideUrl ? [{name: candidate.guideSourceName, url: candidate.guideUrl, type: 'official-guide'}] : []),
      ],
      checkedAt: now(),
      provider: officialCatalogProvider.name,
      liveVerification,
    };
  },
};

providers.push(officialCatalogProvider);

export function registerProductResearchProvider(provider) {
  if (!provider?.find) throw new TypeError('Product research provider must implement find().');
  providers.push(provider);
}

export async function researchExactSeedProduct(identity, {signal} = {}) {
  for (const provider of providers) {
    try {
      const result = await provider.find(identity, {signal});
      if (result?.exact) return result;
    } catch {
      // A failed verification provider must not break packet analysis.
    }
  }
  return {exact: false, candidate: null, sources: [], checkedAt: now(), reason: 'No trusted provider returned an exact product.'};
}

export function configuredResearchProviders() {
  return providers.map((provider) => provider.name || 'unnamed-provider');
}
