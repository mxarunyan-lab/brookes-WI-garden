import OpenAI from 'openai';

const providers = [];
const normalize = (value) => String(value ?? '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
const now = () => new Date().toISOString();
const compact = (record = {}) => Object.fromEntries(Object.entries(record).filter(([, value]) => value !== null && value !== undefined && value !== '' && (!Array.isArray(value) || value.length)));

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
      containerSuitability: 'Container friendly when plants have about 12 inches of space.',
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
  {
    id: 'sow-right-ailsa-craig-onion',
    officialProductId: 'ailsa-craig-onion',
    barcode: '5060873516058',
    brand: 'Sow Right Seeds',
    crop: 'Onion',
    cropId: 'onion',
    variety: 'Ailsa Craig',
    productName: 'Ailsa Craig Onion',
    category: 'vegetable',
    sourceName: 'Sow Right Seeds official product page',
    sourceUrl: 'https://sowrightseeds.com/products/ailsa-craig-onion',
    identityAliases: ['sow right seeds onion ailsa craig', 'ailsa craig onion', 'onion ailsa craig', '5060873516058'],
    productFields: {
      designations: ['Heirloom', 'Non-GMO'],
      quantity: 130,
      packetWeight: '500 mg',
      barcode: '5060873516058',
      sunlight: 'Full sun',
      notableClaims: 'Jumbo-sized long-day onion · pale yellow bulbs can reach up to 5 pounds · best fresh or for short-term storage',
    },
    guideFields: {
      depth: '1/2 inch',
      spacing: '6–8 inches',
      germinationEstimate: '7–15 days',
      germinationTemperature: '50–70°F',
      sowingMethod: 'Start indoors',
      seedStartingGuidance: 'Start indoors 10–12 weeks before the last frost date.',
      transplantGuidance: 'Onion seedlings tolerate light frosts and may be transplanted early.',
      seasonalWindow: 'Long-day onion; start indoors 10–12 weeks before the last frost and transplant early.',
      frostTiming: 'Seedlings tolerate light frost.',
      waterGuidance: 'Keep well-watered.',
      soilGuidance: 'Plant in rich soil.',
      fertilizingGuidance: 'Nitrogen encourages larger bulb growth.',
      harvestGuidance: 'Harvest at any stage.',
    },
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
  const combined = normalize([identity.brand, identity.crop, identity.variety, identity.productName, identity.sku, identity.catalogNumber, identity.productCode, identity.rawVisibleText].filter(Boolean).join(' '));
  if (combined && product.identityAliases.some((alias) => combined.includes(normalize(alias)))) { points += 35; reasons.push('identity alias'); }
  const exact = Boolean(reasons.includes('exact barcode') || reasons.includes('exact product ID') || (points >= 82 && reasons.includes('brand') && reasons.includes('crop') && reasons.includes('variety')));
  return {score: points, reasons, exact, tier: exact ? 'exact' : points >= 58 ? 'medium' : 'low'};
}

async function verifyKnownOfficialUrl(product, {signal, requireIdentity = false} = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 10_000);
  const abort = () => controller.abort();
  signal?.addEventListener?.('abort', abort, {once: true});
  try {
    const response = await fetch(product.sourceUrl, {
      method: 'GET',
      redirect: 'follow',
      signal: controller.signal,
      headers: {'user-agent': 'RunyanGarden/0.20.4 official seed product verification'},
    });
    if (!response.ok) return {reachable: false, status: response.status, identitySupported: false};
    const html = (await response.text()).slice(0, 750_000);
    const normalizedHtml = normalize(html);
    const identitySupported = [product.crop, product.variety].every((term) => normalize(term) && normalizedHtml.includes(normalize(term)));
    if (requireIdentity && !identitySupported) return {reachable: true, status: response.status, identitySupported: false};
    return {reachable: true, status: response.status, identitySupported};
  } catch (error) {
    return {reachable: false, status: 0, identitySupported: false, reason: error?.name === 'AbortError' ? 'timeout' : 'network'};
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

const nullableString = {anyOf: [{type: 'string'}, {type: 'null'}]};
const nullableInteger = {anyOf: [{type: 'integer'}, {type: 'null'}]};
const webResearchJsonSchema = {
  name: 'official_seed_product_lookup',
  strict: true,
  schema: {
    type: 'object',
    additionalProperties: false,
    required: ['exact', 'reason', 'officialProductId', 'brand', 'crop', 'cropId', 'variety', 'productName', 'category', 'sourceName', 'sourceUrl', 'identityAliases', 'productFields', 'guideFields'],
    properties: {
      exact: {type: 'boolean'},
      reason: {type: 'string'},
      officialProductId: nullableString,
      brand: nullableString,
      crop: nullableString,
      cropId: nullableString,
      variety: nullableString,
      productName: nullableString,
      category: nullableString,
      sourceName: nullableString,
      sourceUrl: nullableString,
      identityAliases: {type: 'array', items: {type: 'string'}},
      productFields: {
        type: 'object',
        additionalProperties: false,
        required: ['designations', 'quantity', 'packetWeight', 'barcode', 'daysToMaturity', 'plantHeight', 'plantSpread', 'sunlight', 'notableClaims', 'colorDescription'],
        properties: {
          designations: {type: 'array', items: {type: 'string'}},
          quantity: nullableInteger,
          packetWeight: nullableString,
          barcode: nullableString,
          daysToMaturity: nullableInteger,
          plantHeight: nullableString,
          plantSpread: nullableString,
          sunlight: nullableString,
          notableClaims: nullableString,
          colorDescription: nullableString,
        },
      },
      guideFields: {
        type: 'object',
        additionalProperties: false,
        required: ['depth', 'spacing', 'rowSpacing', 'thinningSpacing', 'germinationEstimate', 'germinationTemperature', 'sowingMethod', 'seedStartingGuidance', 'directSowGuidance', 'transplantGuidance', 'seasonalWindow', 'frostTiming', 'waterGuidance', 'soilGuidance', 'fertilizingGuidance', 'successionGuidance', 'harvestGuidance', 'regionalGuidance', 'containerSuitability'],
        properties: {
          depth: nullableString,
          spacing: nullableString,
          rowSpacing: nullableString,
          thinningSpacing: nullableString,
          germinationEstimate: nullableString,
          germinationTemperature: nullableString,
          sowingMethod: nullableString,
          seedStartingGuidance: nullableString,
          directSowGuidance: nullableString,
          transplantGuidance: nullableString,
          seasonalWindow: nullableString,
          frostTiming: nullableString,
          waterGuidance: nullableString,
          soilGuidance: nullableString,
          fertilizingGuidance: nullableString,
          successionGuidance: nullableString,
          harvestGuidance: nullableString,
          regionalGuidance: nullableString,
          containerSuitability: nullableString,
        },
      },
    },
  },
};

const KNOWN_BRAND_HOSTS = new Map([
  ['burpee', ['burpee.com']],
  ['sow right seeds', ['sowrightseeds.com']],
  ['botanical interests', ['botanicalinterests.com']],
  ['seed savers exchange', ['seedsavers.org']],
  ['johnny s selected seeds', ['johnnyseeds.com']],
  ['baker creek', ['rareseeds.com']],
  ['high mowing organic seeds', ['highmowingseeds.com']],
  ['territorial seed company', ['territorialseed.com']],
  ['renee s garden', ['reneesgarden.com']],
  ['ferry morse', ['ferrymorse.com']],
]);

function officialHostSupportsBrand(sourceUrl, brand) {
  try {
    const host = new URL(sourceUrl).hostname.toLowerCase().replace(/^www\./, '');
    const known = KNOWN_BRAND_HOSTS.get(normalize(brand));
    if (known) return known.some((domain) => host === domain || host.endsWith(`.${domain}`));
    const compactHost = host.replace(/[^a-z0-9]/g, '');
    const distinctive = normalize(brand).split(' ').filter((token) => token.length >= 4 && !['seed', 'seeds', 'company', 'organic', 'selected'].includes(token));
    return distinctive.some((token) => compactHost.includes(token));
  } catch {
    return false;
  }
}

function cleanWebCandidate(parsed, identity) {
  if (!parsed?.exact || !parsed.sourceUrl || !parsed.brand || !parsed.crop || !parsed.variety) return null;
  if (!officialHostSupportsBrand(parsed.sourceUrl, parsed.brand)) return null;
  if (normalize(identity.brand) && normalize(parsed.brand) !== normalize(identity.brand)) return null;
  if (normalize(identity.crop) && normalize(parsed.crop) !== normalize(identity.crop)) return null;
  if (normalize(identity.variety) && normalize(parsed.variety) !== normalize(identity.variety)) return null;
  if (identity.barcode && parsed.productFields?.barcode && normalize(identity.barcode) !== normalize(parsed.productFields.barcode)) return null;
  const productFields = compact(parsed.productFields);
  const guideFields = compact(parsed.guideFields);
  return {
    id: `official-web-${normalize(parsed.brand)}-${normalize(parsed.crop)}-${normalize(parsed.variety)}`.replace(/\s+/g, '-'),
    officialProductId: parsed.officialProductId || normalize(parsed.sourceUrl).split(' ').slice(-3).join('-'),
    brand: parsed.brand,
    crop: parsed.crop,
    cropId: parsed.cropId || normalize(parsed.crop).replace(/\s+/g, '-'),
    variety: parsed.variety,
    productName: parsed.productName || `${parsed.variety} ${parsed.crop}`,
    category: parsed.category || '',
    barcode: productFields.barcode || '',
    sourceName: parsed.sourceName || `${parsed.brand} official product page`,
    sourceUrl: parsed.sourceUrl,
    identityAliases: [...new Set([...(parsed.identityAliases || []), `${parsed.brand} ${parsed.crop} ${parsed.variety}`, `${parsed.variety} ${parsed.crop}`])],
    productFields,
    guideFields,
    match: {score: 100, reasons: ['official manufacturer page', 'brand', 'crop', 'variety'], exact: true, tier: 'exact'},
  };
}

const dynamicOfficialWebProvider = {
  name: 'official-manufacturer-web-search',
  async find(identity, {signal} = {}) {
    if (!process.env.OPENAI_API_KEY || !identity?.brand || !identity?.crop || !identity?.variety) return null;
    const client = new OpenAI({apiKey: process.env.OPENAI_API_KEY, timeout: Number(process.env.SEED_PACKET_RESEARCH_TIMEOUT_MS || 45_000), maxRetries: 0});
    const model = process.env.SEED_PACKET_RESEARCH_MODEL || process.env.SEED_PACKET_VISION_MODEL || 'gpt-5-mini';
    const prompt = `Find the exact OFFICIAL MANUFACTURER product page for this seed packet. Do not use a retailer, marketplace, blog, another seed company's version of the same variety, or generic crop guidance. Identity: ${JSON.stringify({brand: identity.brand, crop: identity.crop, variety: identity.variety, productName: identity.productName, barcode: identity.barcode, sku: identity.sku, packetYear: identity.packetYear, visibleText: String(identity.rawVisibleText || '').slice(0, 2500)})}. Return exact=false unless the official page clearly matches brand, crop, and variety (or an exact barcode/product ID). Copy only facts supported by that exact official page. Preserve complete instructions without truncating. Use null for facts the manufacturer does not state.`;
    let response;
    try {
      response = await client.responses.create({
        model,
        store: false,
        reasoning: {effort: 'minimal'},
        tools: [{type: 'web_search'}],
        input: prompt,
        text: {format: {type: 'json_schema', ...webResearchJsonSchema}},
      }, {signal});
    } catch {
      return null;
    }
    let parsed;
    try { parsed = JSON.parse(response.output_text || ''); } catch { return null; }
    const candidate = cleanWebCandidate(parsed, identity);
    if (!candidate) return null;
    const liveVerification = await verifyKnownOfficialUrl(candidate, {signal, requireIdentity: true});
    if (!liveVerification.reachable || !liveVerification.identitySupported) return null;
    return {
      exact: true,
      candidate,
      sources: [{name: candidate.sourceName, url: candidate.sourceUrl, type: 'official-product', liveVerification}],
      checkedAt: now(),
      provider: dynamicOfficialWebProvider.name,
      liveVerification,
    };
  },
};

providers.push(officialCatalogProvider, dynamicOfficialWebProvider);

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
