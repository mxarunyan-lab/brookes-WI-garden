import crypto from 'node:crypto';
import OpenAI from 'openai';
import sharp from 'sharp';
import {decodeBarcode, validateBarcode} from './barcode.js';
import {researchExactSeedProduct} from './productResearch.js';
import {seedPacketJsonSchema, validateSeedPacketAnalysis} from './seedPacketSchema.js';

const MAX_BYTES = Number(process.env.SEED_PACKET_VISION_MAX_IMAGE_BYTES || 9 * 1024 * 1024);
const MAX_DIMENSION = Number(process.env.SEED_PACKET_VISION_MAX_DIMENSION || 12_000);
const MODEL = process.env.SEED_PACKET_VISION_MODEL || 'gpt-5-mini';
const TIMEOUT = Number(process.env.SEED_PACKET_VISION_TIMEOUT_MS || 90_000);
const IMAGE_DETAIL = ['low', 'high', 'auto'].includes(process.env.SEED_PACKET_VISION_DETAIL) ? process.env.SEED_PACKET_VISION_DETAIL : 'auto';
const REASONING_EFFORT = process.env.SEED_PACKET_VISION_REASONING_EFFORT || 'minimal';
const DEFAULT_REPAIR_PASSES = !/^(0|false|no|off)$/i.test(process.env.SEED_PACKET_VISION_REPAIR_PASSES || '');
const allowed = new Set(['image/jpeg', 'image/png', 'image/webp']);

const prompt = `Act as a meticulous seed-packet document analyst. Inspect the FRONT and BACK images together as one physical packet. Read every clearly visible identity, inventory, planting, timing, care, and harvest fact before returning. Preserve complete printed sentences and ranges; never shorten a sentence merely to fit a field. Use visible text, layout, icons, nearby labels, and front/back context. Never concatenate unrelated labels. FULL SUN is sunlight, VEGETABLE is category, HEIRLOOM and NON-GMO are designations, and long-day/short-day wording belongs in seasonal or regional guidance. Read fractions, ranges, barcode digits, lot, weight, packed-for year, sell-by date, and price separately. Return null rather than inventing, and treat a manufacturer-not-stated value as legitimately absent rather than a failure. Every populated field must have matching fieldEvidence. Every fieldEvidence property not used must be null. Distinguish printed counts from weight-only inventory. Capture succession instructions as automation intelligence. Do not infer an exact seed count from packet weight. Return only the strict schema.`;

function modelError(code, message, status = 502, details = {}) {
  return Object.assign(new Error(message), {code, status, ...details});
}

function upstreamDetails(error) {
  return {
    upstreamStatus: Number(error?.status) || null,
    upstreamCode: error?.code || error?.error?.code || null,
    upstreamType: error?.type || error?.error?.type || null,
    upstreamMessage: String(error?.message || error?.error?.message || '').slice(0, 500) || null,
  };
}

function parseDataUrl(value) {
  const match = String(value || '').match(/^data:(image\/(?:jpeg|png|webp));base64,([A-Za-z0-9+/=]+)$/);
  if (!match) throw modelError('INVALID_IMAGE', 'Unsupported or malformed packet image.', 400);
  const buffer = Buffer.from(match[2], 'base64');
  if (!allowed.has(match[1]) || !buffer.length) throw modelError('UNSUPPORTED_IMAGE', 'Unsupported packet image.', 415);
  if (buffer.length > MAX_BYTES) throw modelError('IMAGE_TOO_LARGE', 'Packet image is too large.', 413);
  return {mime: match[1], buffer};
}

async function normalizeImage(data, side) {
  const source = sharp(data.buffer, {failOn: 'warning', limitInputPixels: 50_000_000});
  const metadata = await source.metadata();
  if (!metadata.width || !metadata.height) throw modelError('INVALID_IMAGE', `${side} packet image has no readable dimensions.`, 400);
  if (metadata.width > MAX_DIMENSION || metadata.height > MAX_DIMENSION) throw modelError('IMAGE_DIMENSIONS_TOO_LARGE', `${side} packet image dimensions are too large.`, 413);
  const buffer = await source.rotate().resize({width: 2400, height: 2400, fit: 'inside', withoutEnlargement: true}).jpeg({quality: 88, mozjpeg: true}).toBuffer();
  return {buffer, metadata: {width: metadata.width, height: metadata.height, format: metadata.format, bytes: data.buffer.length}};
}

const dataUrl = (buffer) => `data:image/jpeg;base64,${buffer.toString('base64')}`;
const hash = (value) => crypto.createHash('sha256').update(value).digest('hex');
const combinedFingerprint = (front, back) => crypto.createHash('sha256').update(front).update(back).digest('hex');

function responseFailure(response) {
  const refusal = response?.output?.flatMap((item) => item?.content || []).find((item) => item?.type === 'refusal');
  if (refusal) return modelError('MODEL_REFUSAL', 'The packet analysis could not be completed from these photos.', 422);
  if (response?.status === 'incomplete') return modelError('UPSTREAM_INCOMPLETE', 'The packet analysis stopped before completion.', 502, {incompleteDetails: response.incomplete_details});
  if (!response?.output_text) return modelError('MODEL_RESPONSE_EMPTY', 'The packet analysis returned no structured result.', 502);
  return null;
}

async function requestStructuredAnalysis(client, input, reason, requestId, fieldsRequested = []) {
  let response;
  try {
    response = await client.responses.create({
      model: MODEL,
      input,
      store: false,
      reasoning: {effort: REASONING_EFFORT},
      text: {format: {type: 'json_schema', ...seedPacketJsonSchema}},
    }, {headers: {'X-Client-Request-Id': requestId}});
  } catch (error) {
    if (error?.status === 429) throw modelError('UPSTREAM_RATE_LIMIT', 'Packet analysis is temporarily busy.', 503);
    if (error?.status === 401 || error?.status === 403) throw modelError('UPSTREAM_AUTH_FAILED', 'Packet analysis could not authenticate with the vision service.', 503, upstreamDetails(error));
    if (error?.status === 400) throw modelError('UPSTREAM_BAD_REQUEST', 'Packet analysis request was rejected by the vision service.', 502, upstreamDetails(error));
    if (error?.name === 'AbortError' || /timeout/i.test(error?.message || '')) throw modelError('UPSTREAM_TIMEOUT', 'Packet analysis timed out upstream.', 504);
    throw modelError('UPSTREAM_REQUEST_FAILED', 'Packet analysis could not reach the vision service.', 502, {...upstreamDetails(error), cause: error});
  }
  const failure = responseFailure(response);
  if (failure) throw failure;
  let parsed;
  try {
    parsed = JSON.parse(response.output_text);
  } catch (error) {
    throw modelError('MODEL_RESPONSE_NOT_JSON', 'Packet analysis returned malformed structured data.', 502, {cause: error});
  }
  return {
    response,
    parsed,
    pass: {
      reason,
      responseId: response.id || null,
      usage: response.usage || null,
      fieldsRequested,
      fieldsAdded: [],
    },
  };
}

const targetedFields = [
  ['packetIdentity.brand', 'brand'],
  ['packetIdentity.crop', 'crop'],
  ['packetIdentity.variety', 'variety'],
  ['packetIdentity.productName', 'productName'],
  ['packetIdentity.category', 'category'],
  ['packetIdentity.designations', 'designations'],
  ['inventory.packetYear', 'packetYear'],
  ['inventory.printedSeedCount', 'printedSeedCount'],
  ['inventory.packetWeightValue', 'packetWeightValue'],
  ['inventory.packetWeightUnit', 'packetWeightUnit'],
  ['growing.sunlight', 'sunlight'],
  ['growing.daysToHarvest', 'daysToHarvest'],
  ['growing.daysToMaturity', 'daysToMaturity'],
  ['growing.emergenceMinimumDays', 'emergenceMinimumDays'],
  ['growing.emergenceMaximumDays', 'emergenceMaximumDays'],
  ['growing.plantingDepthValue', 'plantingDepthValue'],
  ['growing.plantingDepthUnit', 'plantingDepthUnit'],
  ['growing.thinningSpacingValue', 'thinningSpacingValue'],
  ['growing.thinningSpacingUnit', 'thinningSpacingUnit'],
  ['growing.finalSpacingValue', 'finalSpacingValue'],
  ['growing.finalSpacingUnit', 'finalSpacingUnit'],
  ['growing.germinationTemperatureMinimum', 'germinationTemperatureMinimum'],
  ['growing.germinationTemperatureMaximum', 'germinationTemperatureMaximum'],
  ['instructions.directSowGuidance', 'directSowGuidance'],
  ['instructions.indoorStartGuidance', 'indoorStartGuidance'],
  ['instructions.transplantGuidance', 'transplantGuidance'],
  ['instructions.seasonalWindow', 'seasonalWindow'],
  ['instructions.frostTiming', 'frostTiming'],
  ['instructions.fertilizingGuidance', 'fertilizingGuidance'],
  ['instructions.moistureGuidance', 'moistureGuidance'],
  ['instructions.soilGuidance', 'soilGuidance'],
  ['instructions.successionGuidance', 'successionGuidance'],
  ['instructions.harvestGuidance', 'harvestGuidance'],
  ['automation.successionRecommended', 'successionRecommended'],
  ['automation.successionIntervalDays', 'successionIntervalDays'],
];
const readPath = (record, pathValue) => pathValue.split('.').reduce((value, key) => value?.[key], record);
const missingValue = (value) => value === null || value === undefined || value === '' || (Array.isArray(value) && value.length === 0);
function missingTargetedFields(analysis) {
  const missing = targetedFields.filter(([pathValue]) => missingValue(readPath(analysis, pathValue))).map(([pathValue]) => pathValue);
  const identityMissing = missing.some((pathValue) => ['packetIdentity.brand', 'packetIdentity.crop', 'packetIdentity.variety'].includes(pathValue));
  return identityMissing || missing.length ? missing.slice(0, 18) : [];
}
function writePath(record, pathValue, value) {
  const keys = pathValue.split('.');
  let cursor = record;
  keys.slice(0, -1).forEach((key) => { cursor = cursor[key]; });
  cursor[keys.at(-1)] = value;
}
function mergeTargetedRepair(base, repair, fieldsRequested) {
  const merged = structuredClone(base), addedFields = [];
  fieldsRequested.forEach((pathValue) => {
    const next = readPath(repair, pathValue);
    if (!missingValue(readPath(base, pathValue)) || missingValue(next)) return;
    writePath(merged, pathValue, next);
    const evidenceKey = targetedFields.find(([path]) => path === pathValue)?.[1];
    if (evidenceKey && repair.fieldEvidence?.[evidenceKey]) merged.fieldEvidence[evidenceKey] = repair.fieldEvidence[evidenceKey];
    addedFields.push(pathValue);
  });
  merged.warnings = [...new Set([...(base.warnings || []), ...(repair.warnings || [])])];
  merged.quality = {
    ...merged.quality,
    manualReviewFields: [...new Set([...(base.quality?.manualReviewFields || []), ...(repair.quality?.manualReviewFields || [])])].filter((field) => !addedFields.includes(field) && !addedFields.some((pathValue) => pathValue.endsWith(`.${field}`))),
    unreadableFields: [...new Set([...(base.quality?.unreadableFields || []), ...(repair.quality?.unreadableFields || [])])].filter((field) => !addedFields.includes(field) && !addedFields.some((pathValue) => pathValue.endsWith(`.${field}`))),
    contradictoryFields: [...new Set([...(base.quality?.contradictoryFields || []), ...(repair.quality?.contradictoryFields || [])])],
  };
  return {analysis: validateSeedPacketAnalysis(merged), addedFields};
}

const recoverableFieldPaths = {
  brand: ['packetIdentity', 'brand'],
  crop: ['packetIdentity', 'crop'],
  variety: ['packetIdentity', 'variety'],
  productName: ['packetIdentity', 'productName'],
  directSowGuidance: ['instructions', 'directSowGuidance'],
  moistureGuidance: ['instructions', 'moistureGuidance'],
  soilGuidance: ['instructions', 'soilGuidance'],
  harvestGuidance: ['instructions', 'harvestGuidance'],
  successionGuidance: ['instructions', 'successionGuidance'],
  printedSeedCount: ['inventory', 'printedSeedCount'],
  estimatedSeedCount: ['inventory', 'estimatedSeedCount'],
  estimatedSeedCountSource: ['inventory', 'estimatedSeedCountSource'],
  estimatedSeedCountConfidence: ['inventory', 'estimatedSeedCountConfidence'],
  emergenceMinimumDays: ['growing', 'emergenceMinimumDays'],
  emergenceMaximumDays: ['growing', 'emergenceMaximumDays'],
  germinationTemperatureMinimum: ['growing', 'germinationTemperatureMinimum'],
  germinationTemperatureMaximum: ['growing', 'germinationTemperatureMaximum'],
  successionRecommended: ['automation', 'successionRecommended'],
  successionIntervalDays: ['automation', 'successionIntervalDays'],
  successionReminderText: ['automation', 'successionReminderText'],
  successionReason: ['automation', 'successionReason'],
};

function clearEvidence(next, keys = []) {
  keys.forEach((key) => {
    if (next.fieldEvidence?.[key] !== undefined) next.fieldEvidence[key] = null;
  });
}

function markForReview(next, fields = [], note = 'Some packet details were not safely validated and were left blank for review.') {
  next.quality = {
    ...next.quality,
    manualReviewFields: [...new Set([...(next.quality?.manualReviewFields || []), ...fields])],
    unreadableFields: [...new Set([...(next.quality?.unreadableFields || []), ...fields])],
    analysisNotes: [...(next.quality?.analysisNotes || []), note].slice(0, 30),
  };
  next.warnings = [...new Set([...(next.warnings || []), note])].slice(0, 40);
}

function clearRecoverableField(next, field, note) {
  const pathValue = recoverableFieldPaths[field];
  if (!pathValue) return false;
  const [group, key] = pathValue;
  next[group][key] = typeof next[group][key] === 'boolean' ? false : null;
  clearEvidence(next, [field]);
  markForReview(next, [field], note);
  return true;
}

function clearUnsupportedBarcode(input, validationErrors = []) {
  if (!validationErrors.some((message) => /barcode length is unsupported/i.test(String(message)))) return null;
  const next = structuredClone(input);
  next.machineIdentifiers = {
    ...next.machineIdentifiers,
    barcode: null,
    barcodeFormat: null,
    barcodeConfidence: null,
    barcodeMethod: null,
    checkDigitValid: null,
    visibleDigits: null,
  };
  ['barcode', 'barcodeFormat', 'barcodeConfidence', 'barcodeMethod', 'checkDigitValid', 'visibleDigits'].forEach((key) => {
    if (next.fieldEvidence) next.fieldEvidence[key] = null;
  });
  next.quality = {
    ...next.quality,
    manualReviewFields: [...new Set([...(next.quality?.manualReviewFields || []), 'barcode'])],
    unreadableFields: [...new Set([...(next.quality?.unreadableFields || []), 'barcode'])],
    analysisNotes: [...(next.quality?.analysisNotes || []), 'Barcode digits were not safely validated and were left blank for review.'].slice(0, 30),
  };
  next.warnings = [...new Set([...(next.warnings || []), 'Barcode digits were not safely validated and were left blank for review.'])];
  return next;
}

function cleanRecoverableValidationErrors(input, validationErrors = []) {
  let next = clearUnsupportedBarcode(input, validationErrors) || structuredClone(input);
  let changed = next !== input;
  const clearIdentity = (field) => {
    changed = clearRecoverableField(next, field, `${field} was not safely validated and was left blank for review.`) || changed;
    if (field === 'variety') next.quality.exactIdentitySupportedByImages = false;
  };
  validationErrors.forEach((rawMessage) => {
    const message = String(rawMessage);
    if (/variety contains a non-variety label|crop and variety were merged incorrectly/i.test(message)) clearIdentity('variety');
    if (/productName contains an unrelated label/i.test(message)) clearIdentity('productName');
    const guidance = message.match(/^(directSowGuidance|moistureGuidance|soilGuidance|harvestGuidance) is incomplete or malformed/i)?.[1];
    if (guidance) changed = clearRecoverableField(next, guidance, `${guidance} was incomplete and was left blank for review.`) || changed;
    if (/moistureGuidance contains a price fragment/i.test(message)) changed = clearRecoverableField(next, 'moistureGuidance', 'Moisture guidance contained unrelated text and was left blank for review.') || changed;
    if (/directSowGuidance contains malformed scanner text/i.test(message)) changed = clearRecoverableField(next, 'directSowGuidance', 'Direct-sow guidance contained malformed text and was left blank for review.') || changed;
    if (/weight-only inventory cannot claim a printed seed count/i.test(message)) changed = clearRecoverableField(next, 'printedSeedCount', 'Printed seed count conflicted with weight-only inventory and was left blank for review.') || changed;
    if (/exact-count inventory requires a printed seed count/i.test(message)) {
      next.inventory.inventoryBasis = 'unknown';
      clearEvidence(next, ['inventoryBasis']);
      markForReview(next, ['inventoryBasis', 'printedSeedCount'], 'Seed count basis was not safely validated and was left blank for review.');
      changed = true;
    }
    if (/estimated seed count requires a source/i.test(message)) {
      ['estimatedSeedCount', 'estimatedSeedCountSource', 'estimatedSeedCountConfidence'].forEach((field) => {
        changed = clearRecoverableField(next, field, 'Estimated seed count was not safely sourced and was left blank for review.') || changed;
      });
    }
    if (/emergence range is reversed/i.test(message)) {
      ['emergenceMinimumDays', 'emergenceMaximumDays'].forEach((field) => {
        changed = clearRecoverableField(next, field, 'Emergence range was not safely validated and was left blank for review.') || changed;
      });
    }
    if (/germination temperature range is reversed/i.test(message)) {
      ['germinationTemperatureMinimum', 'germinationTemperatureMaximum'].forEach((field) => {
        changed = clearRecoverableField(next, field, 'Germination temperature range was not safely validated and was left blank for review.') || changed;
      });
    }
    if (/succession recommendation lacks an interval or printed guidance/i.test(message)) {
      next.automation.successionRecommended = false;
      ['successionRecommended', 'successionIntervalDays', 'successionReminderText', 'successionReason'].forEach((field) => {
        if (field !== 'successionRecommended') clearRecoverableField(next, field, 'Succession reminder details were not safely validated and were left blank for review.');
      });
      clearEvidence(next, ['successionRecommended']);
      markForReview(next, ['successionRecommended'], 'Succession reminder details were not safely validated and were left blank for review.');
      changed = true;
    }
    if (/machine-decoded barcode failed check digit/i.test(message)) {
      next = clearUnsupportedBarcode(next, ['barcode length is unsupported']) || next;
      changed = true;
    }
    const missingEvidence = message.match(/^([A-Za-z0-9]+) is missing field evidence$/)?.[1];
    if (missingEvidence) changed = clearRecoverableField(next, missingEvidence, `${missingEvidence} did not include matching evidence and was left blank for review.`) || changed;
    if (/exact identity was claimed without brand, crop, and variety|front image cannot be unusable while exact image identity is claimed/i.test(message)) {
      next.quality.exactIdentitySupportedByImages = false;
      markForReview(next, ['brand', 'crop', 'variety'], 'Exact packet identity needs review.');
      changed = true;
    }
  });
  return changed ? next : null;
}

function validateWithRecoverableCleanup(input) {
  let candidate = input;
  for (let attempt = 0; attempt < 4; attempt += 1) {
    try {
      return validateSeedPacketAnalysis(candidate);
    } catch (error) {
      const validationErrors = error.validationErrors || error.issues?.map((issue) => issue.message) || [error.message];
      const cleaned = cleanRecoverableValidationErrors(candidate, validationErrors);
      if (!cleaned) throw error;
      candidate = cleaned;
    }
  }
  return validateSeedPacketAnalysis(candidate);
}

function applyMachineBarcode(analysis, barcode) {
  if (!barcode?.value) return analysis;
  const checked = validateBarcode(barcode.value, barcode.format);
  const visionValue = analysis.machineIdentifiers.barcode;
  const sameValue = visionValue && String(visionValue).replace(/\D/g, '') === String(checked.value).replace(/\D/g, '');
  const contradictoryFields = new Set(analysis.quality.contradictoryFields || []);
  if (visionValue && !sameValue) contradictoryFields.add('barcode');
  return {
    ...analysis,
    machineIdentifiers: {
      ...analysis.machineIdentifiers,
      barcode: checked.value,
      barcodeFormat: checked.format,
      barcodeMethod: sameValue ? 'both' : 'machine-decoder',
      barcodeConfidence: checked.checkDigitValid === true ? 'high' : 'medium',
      checkDigitValid: checked.checkDigitValid,
      visibleDigits: checked.value,
    },
    quality: {...analysis.quality, contradictoryFields: [...contradictoryFields]},
    fieldEvidence: {
      ...analysis.fieldEvidence,
      barcode: {value: checked.value, sourceImage: 'barcode', visibleEvidence: checked.value, confidence: checked.checkDigitValid === true ? 'high' : 'medium', printed: true, normalized: false},
      barcodeFormat: {value: checked.format, sourceImage: 'barcode', visibleEvidence: checked.value, confidence: checked.checkDigitValid === true ? 'high' : 'medium', printed: false, normalized: true},
      barcodeConfidence: {value: checked.checkDigitValid === true ? 'high' : 'medium', sourceImage: 'barcode', visibleEvidence: checked.value, confidence: checked.checkDigitValid === true ? 'high' : 'medium', printed: false, normalized: true},
      barcodeMethod: {value: sameValue ? 'both' : 'machine-decoder', sourceImage: 'barcode', visibleEvidence: checked.value, confidence: checked.checkDigitValid === true ? 'high' : 'medium', printed: false, normalized: true},
      checkDigitValid: {value: checked.checkDigitValid, sourceImage: 'barcode', visibleEvidence: checked.value, confidence: checked.checkDigitValid === true ? 'high' : 'medium', printed: false, normalized: true},
      visibleDigits: {value: checked.value, sourceImage: 'barcode', visibleEvidence: checked.value, confidence: checked.checkDigitValid === true ? 'high' : 'medium', printed: true, normalized: false},
    },
  };
}

export async function analyzeSeedPacket({frontImage, backImage, draftContext}, {openaiClient, requestId = crypto.randomUUID(), barcodeDecoder = decodeBarcode, productResearch = researchExactSeedProduct, repairPasses = DEFAULT_REPAIR_PASSES} = {}) {
  if (!process.env.OPENAI_API_KEY && !openaiClient) throw modelError('VISION_NOT_CONFIGURED', 'Packet analysis is temporarily unavailable.', 503);

  const frontSource = parseDataUrl(frontImage);
  const backSource = parseDataUrl(backImage);
  const [front, back] = await Promise.all([normalizeImage(frontSource, 'Front'), normalizeImage(backSource, 'Back')]);
  const imageHashes = {front: hash(front.buffer), back: hash(back.buffer)};
  const fingerprint = combinedFingerprint(front.buffer, back.buffer);
  const client = openaiClient || new OpenAI({apiKey: process.env.OPENAI_API_KEY, timeout: TIMEOUT, maxRetries: 0});
  const barcodePromise = barcodeDecoder(back.buffer).catch(() => ({value: null, format: null, confidence: null, method: 'unavailable', checkDigitValid: null, visibleDigits: null}));

  const baseInput = [{
    role: 'user',
    content: [
      {type: 'input_text', text: `${prompt}\nExisting trusted draft context: ${JSON.stringify(draftContext || {}).slice(0, 4000)}\nImage 1 is FRONT.`},
      {type: 'input_image', image_url: dataUrl(front.buffer), detail: IMAGE_DETAIL},
      {type: 'input_text', text: 'Image 2 is BACK.'},
      {type: 'input_image', image_url: dataUrl(back.buffer), detail: IMAGE_DETAIL},
    ],
  }];

  const passes = [];
  let first = await requestStructuredAnalysis(client, baseInput, 'primary', requestId);
  passes.push(first.pass);
  let analysis;
  try {
    analysis = validateWithRecoverableCleanup(first.parsed);
  } catch (error) {
    const errors = error.validationErrors || error.issues?.map((issue) => issue.message) || [error.message];
    const repairInput = [...baseInput, {
      role: 'user',
      content: [{
        type: 'input_text',
        text: `Repair the full structured response after reinspecting the original images. Validation errors: ${errors.join('; ')}. Preserve trustworthy fields, correct only unsupported or malformed fields, and return the complete strict schema.`,
      }],
    }];
    const repaired = await requestStructuredAnalysis(client, repairInput, 'validation-repair', requestId, errors);
    passes.push(repaired.pass);
    try {
      analysis = validateWithRecoverableCleanup(repaired.parsed);
      first = repaired;
    } catch (repairError) {
      throw modelError('MODEL_RESPONSE_INVALID', 'Packet analysis could not produce a safe structured result.', 502, {validationErrors: repairError.validationErrors || repairError.issues || []});
    }
  }

  const incompleteFields = repairPasses && passes.length < 2 ? missingTargetedFields(analysis) : [];
  if (incompleteFields.length) {
    const targetedInput = [...baseInput, {
      role: 'user',
      content: [{
        type: 'input_text',
        text: `Targeted second pass. Reinspect the original images only for these missing fields: ${incompleteFields.join(', ')}. Keep already trusted values unchanged. Return the complete strict schema, but populate only fields supported by visible evidence.`,
      }],
    }];
    const targeted = await requestStructuredAnalysis(client, targetedInput, 'targeted-missing-fields', requestId, incompleteFields);
    let targetedAnalysis;
    try {
      targetedAnalysis = validateWithRecoverableCleanup(targeted.parsed);
      const merged = mergeTargetedRepair(analysis, targetedAnalysis, incompleteFields);
      analysis = merged.analysis;
      targeted.pass.fieldsAdded = merged.addedFields;
      passes.push(targeted.pass);
    } catch {
      targeted.pass.fieldsAdded = [];
      passes.push(targeted.pass);
    }
  }

  const barcode = await barcodePromise;
  analysis = validateSeedPacketAnalysis(applyMachineBarcode(analysis, barcode));
  const officialProduct = await productResearch({...analysis.packetIdentity, ...analysis.machineIdentifiers, packetYear: analysis.inventory.packetYear, rawVisibleText: analysis.rawVisibleText}).catch(() => ({exact: false, candidate: null, sources: []}));

  return {
    requestId,
    model: MODEL,
    analyzedAt: new Date().toISOString(),
    analysisPassCount: passes.length,
    analysisPasses: passes,
    imageHashes,
    imageMetadata: {front: front.metadata, back: back.metadata},
    fingerprint,
    analysis,
    barcode,
    officialProduct,
    usage: passes.map((pass) => pass.usage).filter(Boolean),
  };
}
