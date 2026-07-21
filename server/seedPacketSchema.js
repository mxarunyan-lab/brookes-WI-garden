import { z } from 'zod';

const nullableText = z.string().trim().max(500).nullable();
const nullableNumber = z.number().finite().nonnegative().nullable();
const confidence = z.enum(['high', 'medium', 'low']);
const evidenceSource = z.enum(['front', 'back', 'both', 'barcode', 'official-source', 'inferred']);
const evidenceValue = z.union([
  z.string().max(500),
  z.number().finite(),
  z.boolean(),
  z.array(z.string().max(160)).max(20),
]).nullable();
const evidence = z.object({
  value: evidenceValue,
  sourceImage: evidenceSource,
  visibleEvidence: z.string().trim().max(500),
  confidence,
  printed: z.boolean(),
  normalized: z.boolean(),
}).strict();

export const evidenceKeys = [
  'brand', 'crop', 'variety', 'productName', 'category', 'designations', 'notableClaims', 'colorDescription',
  'packetWeightValue', 'packetWeightUnit', 'printedSeedCount', 'inventoryBasis', 'estimatedSeedCount',
  'estimatedSeedCountSource', 'estimatedSeedCountConfidence', 'packetYear', 'packedForYear', 'sellByDate', 'purchasePrice',
  'barcode', 'barcodeFormat', 'sku', 'catalogNumber', 'lotNumber', 'productCode', 'barcodeConfidence',
  'barcodeMethod', 'checkDigitValid', 'visibleDigits',
  'sunlight', 'daysToHarvest', 'daysToMaturity', 'maturityBasis', 'emergenceMinimumDays', 'emergenceMaximumDays',
  'germinationTemperatureMinimum', 'germinationTemperatureMaximum', 'plantingDepthValue', 'plantingDepthUnit',
  'thinningSpacingValue', 'thinningSpacingUnit', 'finalSpacingValue', 'finalSpacingUnit', 'rowSpacingValue', 'rowSpacingUnit',
  'containerMinimumDiameterValue', 'containerMinimumDiameterUnit', 'plantsPerContainer', 'plantHeight', 'plantSpread',
  'growthHabit', 'containerFriendly',
  'sowingMethod', 'directSowGuidance', 'indoorStartGuidance', 'transplantGuidance', 'seasonalWindow', 'frostTiming',
  'moistureGuidance', 'soilGuidance', 'fertilizingGuidance', 'successionGuidance', 'harvestGuidance', 'regionalGuidance',
  'treatmentInformation', 'seedSavingRestrictions', 'specialCare',
  'successionRecommended', 'successionIntervalDays', 'successionReminderText', 'successionReason',
];

const fieldEvidenceShape = Object.fromEntries(evidenceKeys.map((key) => [key, evidence.nullable()]));

const packetIdentity = z.object({
  brand: nullableText,
  crop: nullableText,
  variety: nullableText,
  productName: nullableText,
  category: nullableText,
  designations: z.array(z.string().trim().max(80)).max(12),
  notableClaims: z.array(z.string().trim().max(160)).max(20),
  colorDescription: nullableText,
}).strict();

const inventory = z.object({
  packetWeightValue: nullableNumber,
  packetWeightUnit: z.enum(['g', 'mg', 'oz', 'lb', 'count']).nullable(),
  printedSeedCount: z.number().finite().int().nonnegative().nullable(),
  inventoryBasis: z.enum(['exact-count', 'approximate-count', 'weight', 'unknown']),
  estimatedSeedCount: z.number().finite().int().nonnegative().nullable(),
  estimatedSeedCountSource: nullableText,
  estimatedSeedCountConfidence: confidence.nullable(),
  packetYear: z.number().int().min(1900).max(2100).nullable(),
  packedForYear: z.number().int().min(1900).max(2100).nullable(),
  sellByDate: nullableText,
  purchasePrice: z.number().finite().nonnegative().max(1000).nullable(),
}).strict();

const machineIdentifiers = z.object({
  barcode: nullableText,
  barcodeFormat: z.enum(['UPC-A', 'UPC-E', 'EAN-8', 'EAN-13', 'CODE-128', 'unknown']).nullable(),
  sku: nullableText,
  catalogNumber: nullableText,
  lotNumber: nullableText,
  productCode: nullableText,
  barcodeConfidence: confidence.nullable(),
  barcodeMethod: z.enum(['machine-decoder', 'vision-read', 'both', 'unavailable']).nullable(),
  checkDigitValid: z.boolean().nullable(),
  visibleDigits: nullableText,
}).strict();

const growing = z.object({
  sunlight: nullableText,
  daysToHarvest: z.number().finite().int().min(1).max(1000).nullable(),
  daysToMaturity: z.number().finite().int().min(1).max(1000).nullable(),
  maturityBasis: z.enum(['sowing', 'transplant', 'unknown']).nullable(),
  emergenceMinimumDays: z.number().finite().int().min(0).max(365).nullable(),
  emergenceMaximumDays: z.number().finite().int().min(0).max(365).nullable(),
  germinationTemperatureMinimum: z.number().finite().min(-50).max(150).nullable(),
  germinationTemperatureMaximum: z.number().finite().min(-50).max(150).nullable(),
  plantingDepthValue: z.number().finite().nonnegative().max(100).nullable(),
  plantingDepthUnit: z.enum(['inch', 'cm']).nullable(),
  thinningSpacingValue: z.number().finite().nonnegative().max(1000).nullable(),
  thinningSpacingUnit: z.enum(['inch', 'cm']).nullable(),
  finalSpacingValue: z.number().finite().nonnegative().max(1000).nullable(),
  finalSpacingUnit: z.enum(['inch', 'cm']).nullable(),
  rowSpacingValue: z.number().finite().nonnegative().max(1000).nullable(),
  rowSpacingUnit: z.enum(['inch', 'cm']).nullable(),
  containerMinimumDiameterValue: z.number().finite().nonnegative().max(1000).nullable(),
  containerMinimumDiameterUnit: z.enum(['inch', 'cm']).nullable(),
  plantsPerContainer: z.number().finite().int().min(1).max(10000).nullable(),
  plantHeight: nullableText,
  plantSpread: nullableText,
  growthHabit: nullableText,
  containerFriendly: z.boolean().nullable(),
}).strict();

const instructions = z.object({
  sowingMethod: nullableText,
  directSowGuidance: nullableText,
  indoorStartGuidance: nullableText,
  transplantGuidance: nullableText,
  seasonalWindow: nullableText,
  frostTiming: nullableText,
  moistureGuidance: nullableText,
  soilGuidance: nullableText,
  fertilizingGuidance: nullableText,
  successionGuidance: nullableText,
  harvestGuidance: nullableText,
  regionalGuidance: nullableText,
  warnings: z.array(z.string().trim().max(240)).max(20),
  treatmentInformation: nullableText,
  seedSavingRestrictions: nullableText,
  specialCare: nullableText,
}).strict();

const automation = z.object({
  successionRecommended: z.boolean(),
  successionIntervalDays: z.number().finite().int().min(1).max(365).nullable(),
  successionReminderText: nullableText,
  successionReason: nullableText,
  otherSuggestedReminders: z.array(z.object({
    text: z.string().trim().max(240),
    reason: z.string().trim().max(240),
    daysAfterPlanting: z.number().finite().int().min(0).max(3650).nullable(),
  }).strict()).max(10),
}).strict();

const quality = z.object({
  frontUsable: z.boolean(),
  backUsable: z.boolean(),
  packetIdentityConfidence: confidence,
  overallConfidence: confidence,
  exactIdentitySupportedByImages: z.boolean(),
  manualReviewFields: z.array(z.string().max(100)).max(50),
  unreadableFields: z.array(z.string().max(100)).max(100),
  contradictoryFields: z.array(z.string().max(100)).max(50),
  analysisNotes: z.array(z.string().trim().max(300)).max(30),
}).strict();

export const seedPacketVisionSchema = z.object({
  analysisVersion: z.literal('seed-packet-vision-v1'),
  packetIdentity,
  inventory,
  growing,
  instructions,
  automation,
  machineIdentifiers,
  quality,
  fieldEvidence: z.object(fieldEvidenceShape).strict(),
  rawVisibleText: z.object({front: z.string().max(10000), back: z.string().max(10000)}).strict(),
  warnings: z.array(z.string().trim().max(300)).max(40),
}).strict();

const bannedIdentity = /\b(full sun|part sun|vegetable|heirloom|organic|container|days? to|harvest|depth|spacing|germination)\b/i;
const fragment = /^(?:\d+\s*)?(?:outdoor sown|to harvest|full sun|part sun)$/i;
const priceFragment = /(?:^|\s)\$\s*\d|\b(?:usd|price)\b/i;
const suspiciousJoinedLabel = /\b(?:full\s+sun|vegetable|heirloom)\b.*\b(?:lettuce|seeds?)\b/i;
const evidenceRequired = [
  ['packetIdentity', 'brand'], ['packetIdentity', 'crop'], ['packetIdentity', 'variety'], ['packetIdentity', 'productName'],
  ['inventory', 'packetWeightValue'], ['inventory', 'printedSeedCount'], ['inventory', 'packetYear'],
  ['growing', 'sunlight'], ['growing', 'daysToHarvest'], ['growing', 'daysToMaturity'], ['growing', 'plantingDepthValue'],
  ['growing', 'emergenceMinimumDays'], ['growing', 'emergenceMaximumDays'], ['growing', 'thinningSpacingValue'],
  ['growing', 'containerMinimumDiameterValue'], ['growing', 'plantsPerContainer'],
  ['instructions', 'directSowGuidance'], ['instructions', 'moistureGuidance'], ['instructions', 'soilGuidance'],
  ['instructions', 'successionGuidance'], ['instructions', 'harvestGuidance'],
  ['automation', 'successionRecommended'], ['automation', 'successionIntervalDays'],
  ['machineIdentifiers', 'barcode'], ['machineIdentifiers', 'lotNumber'],
];

const valueAt = (object, group, key) => object[group]?.[key];
const isPresent = (value) => value !== null && value !== '' && value !== undefined && (!Array.isArray(value) || value.length > 0);

export function emptyFieldEvidence() {
  return Object.fromEntries(evidenceKeys.map((key) => [key, null]));
}

export function validateSeedPacketAnalysis(input) {
  const parsed = seedPacketVisionSchema.parse(input);
  const errors = [];
  const {packetIdentity: identity, instructions: guide, inventory: quantity, growing: metrics, machineIdentifiers: machine, fieldEvidence: fieldEvidenceMap, quality: imageQuality, automation: automationInfo} = parsed;

  if (identity.variety && bannedIdentity.test(identity.variety)) errors.push('variety contains a non-variety label');
  if (identity.productName && (bannedIdentity.test(identity.productName) || suspiciousJoinedLabel.test(identity.productName))) errors.push('productName contains an unrelated label');
  if (identity.crop && identity.variety && identity.crop.toLowerCase() === identity.variety.toLowerCase()) errors.push('crop and variety were merged incorrectly');

  for (const [key, value] of Object.entries({
    directSowGuidance: guide.directSowGuidance,
    moistureGuidance: guide.moistureGuidance,
    soilGuidance: guide.soilGuidance,
    harvestGuidance: guide.harvestGuidance,
  })) {
    if (value && (value.length < 12 || fragment.test(value) || /^\$/.test(value))) errors.push(`${key} is incomplete or malformed`);
  }
  if (guide.directSowGuidance && !/\b(sow|plant|outdoor|direct)\b/i.test(guide.directSowGuidance)) errors.push('directSowGuidance is incomplete or malformed');
  if (guide.moistureGuidance && priceFragment.test(guide.moistureGuidance)) errors.push('moistureGuidance contains a price fragment');
  if (guide.directSowGuidance && /\bgo\s+fe\b|\boutdoor\s+sown\s*$/i.test(guide.directSowGuidance)) errors.push('directSowGuidance contains malformed scanner text');

  if (quantity.inventoryBasis === 'weight' && quantity.printedSeedCount !== null) errors.push('weight-only inventory cannot claim a printed seed count');
  if (quantity.inventoryBasis === 'exact-count' && quantity.printedSeedCount === null) errors.push('exact-count inventory requires a printed seed count');
  if (quantity.estimatedSeedCount !== null && !quantity.estimatedSeedCountSource) errors.push('estimated seed count requires a source');
  if (metrics.emergenceMinimumDays !== null && metrics.emergenceMaximumDays !== null && metrics.emergenceMinimumDays > metrics.emergenceMaximumDays) errors.push('emergence range is reversed');
  if (metrics.germinationTemperatureMinimum !== null && metrics.germinationTemperatureMaximum !== null && metrics.germinationTemperatureMinimum > metrics.germinationTemperatureMaximum) errors.push('germination temperature range is reversed');
  if (automationInfo.successionRecommended && !automationInfo.successionIntervalDays && !guide.successionGuidance) errors.push('succession recommendation lacks an interval or printed guidance');

  if (machine.barcode) {
    const digits = machine.barcode.replace(/\D/g, '');
    if (![8, 12, 13, 14].includes(digits.length) && machine.barcodeFormat !== 'CODE-128') errors.push('barcode length is unsupported');
  }
  if (machine.checkDigitValid === false && machine.barcodeMethod === 'machine-decoder') errors.push('machine-decoded barcode failed check digit');

  for (const [group, key] of evidenceRequired) {
    const value = valueAt(parsed, group, key);
    if (isPresent(value) && !fieldEvidenceMap[key]) errors.push(`${key} is missing field evidence`);
  }
  for (const key of evidenceKeys) {
    const item = fieldEvidenceMap[key];
    if (item && !String(item.visibleEvidence || '').trim()) errors.push(`${key} evidence is empty`);
  }

  if (imageQuality.exactIdentitySupportedByImages && (!identity.brand || !identity.crop || !identity.variety)) errors.push('exact identity was claimed without brand, crop, and variety');
  if (imageQuality.frontUsable === false && imageQuality.exactIdentitySupportedByImages) errors.push('front image cannot be unusable while exact image identity is claimed');

  if (errors.length) {
    const error = new Error('Seed packet analysis failed validation');
    error.code = 'MODEL_RESPONSE_INVALID';
    error.validationErrors = errors;
    throw error;
  }
  return parsed;
}

const generatedSchema = z.toJSONSchema(seedPacketVisionSchema, {target: 'draft-7', unrepresentable: 'any'});
delete generatedSchema.$schema;
export const seedPacketJsonSchema = {
  name: 'seed_packet_vision',
  description: 'A fully structured, evidence-backed analysis of the front and back of one seed packet.',
  strict: true,
  schema: generatedSchema,
};
