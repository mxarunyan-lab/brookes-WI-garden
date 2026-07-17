import { cropCatalog } from './data.js';
import { normalizeLifecycleStage } from './gardenIntelligence.js';

const DAY = 86400000;
const DIRECT_SOW_IDS = new Set(['lettuce','spinach','kale','radish','peas','carrot','corn','green-bean','cucumber','zucchini','winter-squash','pumpkin','green-onion','cilantro','dill','parsley']);
const LARGE_CROP_IDS = new Set(['corn','cucumber','zucchini','winter-squash','pumpkin']);
const WARM_START_IDS = new Set(['bell-pepper','hot-pepper','tomato','onion','marigold','basil']);
const COOL_FALL_IDS = new Set(['lettuce','spinach','kale','radish','carrot','peas','cabbage','broccoli','cauliflower']);
const OUTDOOR_TYPES = new Set(['bed','black-square-bed','white-oval-bed','in-ground','container','potato-grow-bag']);
const INDOOR_TYPES = new Set(['indoor','basement','seed-tray','greenhouse','hydro']);
const PLANTING_TASK_TYPES = new Set(['Start Seeds','Direct Sow','Transplant','Pot Up','Harden Off','Prepare Space','Install Support','Plan Succession','Thin Seedlings','Reserve Space']);

export const plantingDateKey = (value = new Date()) => {
  if (typeof value === 'string') return value.slice(0, 10);
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? new Date().toISOString().slice(0, 10) : date.toISOString().slice(0, 10);
};

export const addPlantingDays = (value, days) => {
  const date = new Date(`${plantingDateKey(value)}T12:00:00`);
  date.setDate(date.getDate() + days);
  return plantingDateKey(date);
};

export function plantingWeekBounds(now = new Date()) {
  const date = new Date(`${plantingDateKey(now)}T12:00:00`);
  const start = new Date(date);
  start.setDate(date.getDate() - date.getDay());
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  return { start: plantingDateKey(start), end: plantingDateKey(end) };
}

const normalizeText = value => String(value || '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();

function matchCropId(record = {}) {
  if (record.cropId && cropCatalog.some(crop => crop.id === record.cropId)) return record.cropId;
  const text = normalizeText(`${record.name || ''} ${record.variety || ''}`);
  if (/california wonder|bell pepper|sweet pepper/.test(text)) return 'bell-pepper';
  if (/jalapeno|jalapeño|serrano|cayenne|hot pepper|chili|chile/.test(text)) return 'hot-pepper';
  const exact = cropCatalog.find(crop => {
    const cropName = normalizeText(crop.name);
    return text === cropName || text.includes(cropName) || cropName.includes(text);
  });
  return exact?.id || '';
}

function availability(record = {}) {
  const status = normalizeText(`${record.status || ''} ${record.availability || ''}`);
  const quantity = Number(record.quantity ?? record.seedsRemaining ?? record.amount ?? 0);
  const reserved = Number(record.reservedQuantity ?? record.reserved ?? 0);
  const blocked = Boolean(record.deletedAt || record.discarded || record.available === false || /discarded|unavailable|used up|empty/.test(status));
  return { quantity, reserved, available: Math.max(0, quantity - reserved), blocked };
}

export function normalizedSeedInventory(garden = {}) {
  const rows = [];
  (garden.seedPackets || []).forEach(packet => {
    const stock = availability(packet);
    if (stock.blocked || stock.available <= 0) return;
    rows.push({
      ...packet,
      inventoryId: packet.id,
      source: 'packet',
      exactPacket: true,
      cropId: matchCropId(packet),
      quantityAvailable: stock.available,
      brand: packet.brand || '',
      packetYear: Number(packet.packetYear) || null,
      daysToMaturity: Number(packet.daysToMaturity) || null,
      packetNotes: packet.notes || packet.packetNotes || '',
      startGuidance: packet.seedStartingGuidance || packet.startGuidance || packet.notes || '',
      germinationEstimate: packet.germinationEstimate || packet.germination || '',
      growthHabit: packet.growthHabit || '',
      containerSuitability: packet.containerSuitability || '',
    });
  });
  (garden.seeds || []).forEach(seed => {
    const stock = availability(seed);
    if (stock.blocked || stock.available <= 0) return;
    rows.push({
      ...seed,
      inventoryId: seed.id,
      source: 'seed-record',
      exactPacket: false,
      cropId: matchCropId(seed),
      quantityAvailable: stock.available,
      brand: seed.brand || '',
      packetYear: Number(seed.packetYear) || null,
      daysToMaturity: Number(seed.daysToMaturity) || null,
      packetNotes: seed.notes || '',
      startGuidance: seed.seedStartingGuidance || seed.startGuidance || seed.notes || '',
      germinationEstimate: seed.germinationEstimate || seed.germination || '',
      growthHabit: seed.growthHabit || '',
      containerSuitability: seed.containerSuitability || '',
    });
  });
  const deduped = new Map();
  rows
    .sort((a, b) => Number(b.exactPacket) - Number(a.exactPacket))
    .forEach(row => {
      const key = `${row.cropId || normalizeText(row.name)}|${normalizeText(row.variety)}`;
      if (!deduped.has(key)) deduped.set(key, row);
    });
  return [...deduped.values()];
}

function packetAge(packet, now = new Date()) {
  return packet.packetYear ? now.getFullYear() - Number(packet.packetYear) : null;
}

function recommendationMethod(packet, recommendation) {
  const guidance = normalizeText(packet.startGuidance);
  if (/direct sow|sow outdoors|plant outdoors/.test(guidance)) return 'Direct Sow';
  if (/start indoors|sow indoors|indoor start|transplant/.test(guidance)) return 'Start Indoors';
  const status = normalizeText(recommendation?.status);
  if (status.includes('start seeds indoors')) return 'Start Indoors';
  if (status.includes('grow indoors')) return 'Grow Indoors';
  if (status.includes('plant or care for outdoors') && DIRECT_SOW_IDS.has(packet.cropId)) return 'Direct Sow';
  return 'Plan Ahead';
}

function spaceScore(space, crop, method, garden) {
  const activePlants = (garden.plants || []).filter(plant => !plant.deletedAt && !plant.archived && plant.spaceId === space.id).length;
  const capacity = Number(space.capacity) || 0;
  if (capacity && activePlants >= capacity) return null;
  const indoorMethod = method === 'Start Indoors' || method === 'Grow Indoors';
  if (indoorMethod && !INDOOR_TYPES.has(space.type)) return null;
  if (!indoorMethod && !OUTDOOR_TYPES.has(space.type)) return null;
  let score = 100 - activePlants * 4;
  const warnings = [];
  const sun = normalizeText(space.sunExposure);
  if (crop?.sun?.includes('8+') && /shade|part shade/.test(sun)) {
    score -= 35;
    warnings.push('Sun exposure may be too low.');
  }
  if (space.type === 'container' && LARGE_CROP_IDS.has(crop?.id)) {
    score -= 30;
    warnings.push('This crop may outgrow a typical container.');
  }
  if (space.type === 'container' && !space.size) warnings.push('Container size is not recorded.');
  if (space.drainageQuality && /poor/.test(normalizeText(space.drainageQuality))) warnings.push('Drainage is recorded as poor.');
  if (space.expectedAvailableDate && space.expectedAvailableDate > plantingDateKey()) {
    score -= 20;
    warnings.push(`Expected available ${space.expectedAvailableDate}.`);
  }
  return { ...space, score, warnings, activePlants, capacity };
}

export function suitableSpacesFor({ crop, method, garden }) {
  return (garden.spaces || [])
    .filter(space => !space.hidden && !space.deletedAt)
    .map(space => spaceScore(space, crop, method, garden))
    .filter(Boolean)
    .sort((a, b) => b.score - a.score || a.name.localeCompare(b.name));
}

function suggestionSuppressed(garden, id) {
  const decision = (garden.taskHistory || []).find(entry => entry.taskId === id && ['skipped', 'not-needed'].includes(entry.status));
  const scheduled = (garden.reminders || []).some(reminder => !reminder.deletedAt && reminder.enabled !== false && reminder.sourceSuggestionId === id);
  return Boolean(decision || scheduled);
}

function packetAlreadyStarted(garden, packet) {
  return (garden.plants || []).some(plant => !plant.deletedAt && !plant.archived && (
    plant.seedId === packet.inventoryId ||
    plant.sourcePacketId === packet.inventoryId ||
    (packet.cropId && plant.cropId === packet.cropId && normalizeText(plant.variety) === normalizeText(packet.variety))
  ));
}

function packetDisplayName(packet) {
  return [packet.brand, packet.variety || packet.name].filter(Boolean).join(' ') || packet.name || 'Saved seed packet';
}

function uncertaintyFor(packet, crop, spaces, weather) {
  const notes = [];
  if (!packet.startGuidance) notes.push('Packet start guidance is not recorded, so general crop timing is being used.');
  if (!packet.daysToMaturity) notes.push('Days to maturity are not recorded.');
  if (!spaces.length) notes.push('No clearly suitable open growing space is recorded yet.');
  if (weather?.isStormingNow) notes.push('Current storms may delay outdoor work.');
  else if (Number(weather?.high) >= 92) notes.push('Current heat may make transplanting risky.');
  else if (Number(weather?.low) <= 36) notes.push('Cold conditions may delay outdoor planting.');
  if (packet.exactPacket && !notes.length) return 'Exact packet details and the current garden setup were used.';
  return notes.join(' ');
}

function createOwnedRecommendation(packet, recommendation, garden, weather, now) {
  const crop = cropCatalog.find(item => item.id === packet.cropId) || null;
  const method = recommendationMethod(packet, recommendation);
  const age = packetAge(packet, now);
  const spaces = suitableSpacesFor({ crop, method, garden });
  const id = `planting-suggestion-${packet.source}-${packet.inventoryId}-${now.getFullYear()}`;
  const recommendationStatus = normalizeText(recommendation?.status);
  const seasonalNow = (recommendationStatus.includes('start seeds indoors') && method === 'Start Indoors') || (recommendationStatus.includes('grow indoors') && method === 'Grow Indoors') || (recommendationStatus.includes('plant or care for outdoors') && method === 'Direct Sow');
  const strongNow = seasonalNow && !((age ?? 0) >= 4);
  return {
    id,
    source: packet.source,
    exactPacket: packet.exactPacket,
    owned: true,
    packet,
    crop,
    cropId: packet.cropId,
    title: packetDisplayName(packet),
    variety: packet.variety || crop?.variety || '',
    method: (age ?? 0) >= 4 ? 'Germination Test' : method,
    timing: packet.plantingWindow || packet.startingWindow || recommendation?.timing || 'Timing needs confirmation',
    why: recommendation?.note || crop?.summary || 'This packet is saved in the household seed inventory.',
    uncertainty: uncertaintyFor(packet, crop, spaces, weather),
    quantityAvailable: packet.quantityAvailable,
    packetYear: packet.packetYear,
    daysToMaturity: packet.daysToMaturity,
    depth: packet.depth || crop?.depth || '',
    spacing: packet.spacing || crop?.spacing || '',
    spaces,
    recommendedSpaceId: spaces[0]?.id || '',
    strongNow,
    oldPacket: (age ?? 0) >= 4,
    suggestionTask: {
      id,
      kind: 'plantingSuggestion',
      taskType: (age ?? 0) >= 4 ? 'Germination Test' : method,
      title: packetDisplayName(packet),
      reason: recommendation?.note || crop?.summary || 'Seed inventory recommendation.',
      dueDate: plantingDateKey(now),
      priority: 55,
      manual: false,
    },
  };
}

function createSecondaryRecommendation(crop, recommendation, garden, now, source = 'purchase') {
  if (!crop || !recommendation) return null;
  const method = recommendationMethod({ cropId: crop.id, startGuidance: '' }, recommendation);
  const spaces = suitableSpacesFor({ crop, method, garden });
  const id = `planting-suggestion-${source}-${crop.id}-${now.getFullYear()}`;
  return {
    id,
    source,
    exactPacket: false,
    owned: false,
    crop,
    cropId: crop.id,
    title: crop.name,
    variety: crop.variety || '',
    method,
    timing: recommendation.timing,
    why: recommendation.note || crop.summary,
    uncertainty: 'No available household seed packet is recorded. This is secondary to owned-seed options.',
    quantityAvailable: null,
    spaces,
    recommendedSpaceId: spaces[0]?.id || '',
    strongNow: method !== 'Plan Ahead',
    suggestionTask: { id, kind: 'plantingSuggestion', taskType: method, title: crop.name, reason: recommendation.note || crop.summary, dueDate: plantingDateKey(now), priority: 35 },
  };
}

export function buildGrowNowRecommendations({ garden = {}, recommendations = [], weather = null, now = new Date() }) {
  const inventory = normalizedSeedInventory(garden);
  const recommendationMap = new Map(recommendations.map(item => [item.id, item]));
  const owned = inventory
    .map(packet => createOwnedRecommendation(packet, recommendationMap.get(packet.cropId), garden, weather, now))
    .filter(item => item.strongNow && !suggestionSuppressed(garden, item.id) && !packetAlreadyStarted(garden, item.packet))
    .sort((a, b) => Number(b.exactPacket) - Number(a.exactPacket) || b.quantityAvailable - a.quantityAvailable);

  const ownedCropIds = new Set(inventory.map(item => item.cropId).filter(Boolean));
  const plannedCropIds = new Set((garden.yearPlan?.crops || []).filter(item => ['definitely', 'maybe'].includes(item.status)).map(item => item.cropId));
  const savedIdeas = recommendations
    .filter(item => plannedCropIds.has(item.id) && !ownedCropIds.has(item.id))
    .map(item => createSecondaryRecommendation(cropCatalog.find(crop => crop.id === item.id), item, garden, now, 'saved-idea'))
    .filter(item => item?.crop && item.strongNow && !suggestionSuppressed(garden, item.id));
  const purchase = recommendations
    .filter(item => !ownedCropIds.has(item.id) && !plannedCropIds.has(item.id))
    .map(item => createSecondaryRecommendation(cropCatalog.find(crop => crop.id === item.id), item, garden, now, 'purchase'))
    .filter(item => item?.crop && item.strongNow && !suggestionSuppressed(garden, item.id));

  return [...owned, ...savedIdeas, ...purchase].slice(0, 6);
}

function stageAction(plant) {
  const stage = normalizeLifecycleStage(plant.stage);
  const map = {
    Planned: ['Confirm Seed Purchase', 'Mark Seed Purchased'],
    'Seed Purchased': ['Start Seeds', 'Start Seeds'],
    'Seed Started': ['Confirm Germination', 'Mark Germinating'],
    Germinating: ['Confirm Seedling', 'Mark Seedling'],
    Seedling: ['Pot Up Seedling', 'Mark Potted Up'],
    'Potted Up': ['Begin Hardening Off', 'Begin Hardening Off'],
    'Hardening Off': ['Confirm Transplanting', 'Mark Transplanted'],
  };
  const [title, label] = map[stage] || ['Review Planting Stage', 'Open Plant'];
  return { stage, title, label };
}

export function isPlantingTask(task) {
  if (!task || task.informational || task.weatherDriven) return false;
  if (PLANTING_TASK_TYPES.has(task.taskType)) return true;
  if (task.kind === 'setupPlant' || task.kind === 'seasonalGuide') return true;
  if (task.kind === 'navigate' && task.target === 'plan-plant') return true;
  return String(task.id || '').startsWith('harden-');
}

export function buildPlantingActions({ tasks = [], timeline = [], garden = {}, completions = [] }) {
  const completionIds = new Set((completions || []).map(item => typeof item === 'string' ? item : item.id));
  const candidates = [];
  tasks.filter(isPlantingTask).filter(task => !completionIds.has(task.id)).forEach(task => {
    const plant = task.plant || (garden.plants || []).find(item => item.id === task.plantId);
    const space = task.space || (garden.spaces || []).find(item => item.id === (task.spaceId || plant?.spaceId));
    const actionType = task.kind === 'setupPlant' ? 'Add Plant' : task.kind === 'seasonalGuide' ? 'Plan Seasonal Planting' : task.kind === 'navigate' ? 'Plan Ahead' : task.taskType || 'Planting Work';
    candidates.push({
      id: `task-${task.id}`,
      source: 'task',
      original: task,
      taskId: task.id,
      date: plantingDateKey(task.dueDate),
      title: task.title,
      detail: task.subtitle || task.reason || '',
      reason: task.reason || '',
      timing: task.when || task.dueDate || 'Today',
      actionType,
      actionLabel: task.kind === 'setupPlant' ? 'Add Plant' : task.action && !/open|review/i.test(task.action) ? task.action : actionType === 'Harden Off' ? 'Complete Today’s Step' : 'Open',
      plant,
      space,
      confidence: task.manual ? 'Confirmed' : 'Suggested',
      priority: Number(task.priority) || 50,
      dedupeKey: `${plant?.id || task.id}|${normalizeText(actionType)}|${plantingDateKey(task.dueDate)}`,
    });
  });
  timeline.filter(item => !item.historical && !item.informational && ['stage', 'succession'].includes(item.type)).forEach(item => {
    const plant = (garden.plants || []).find(entry => entry.id === item.plantId);
    if (!plant) return;
    const space = (garden.spaces || []).find(entry => entry.id === plant.spaceId);
    if (item.type === 'stage' && normalizeLifecycleStage(plant.stage) === 'Hardening Off') {
      const hardeningPlan = (garden.hardeningPlans || []).find(plan => plan.plantId === plant.id && !plan.deletedAt);
      if (hardeningPlan && !hardeningPlan.complete) return;
    }
    const stage = item.type === 'stage' ? stageAction(plant) : null;
    const actionType = item.type === 'succession' ? 'Plan Succession' : stage.label;
    candidates.push({
      id: `timeline-${item.id}`,
      source: 'timeline',
      original: item,
      date: plantingDateKey(item.date),
      title: item.type === 'succession' ? item.title : `${stage.title}: ${plant.name}`,
      detail: item.detail || '',
      reason: item.type === 'succession' ? 'This crop has succession planting enabled.' : `The plant is currently marked ${stage.stage}.`,
      timing: item.date,
      actionType,
      actionLabel: item.type === 'succession' ? 'Start Next Batch' : stage.label,
      plant,
      space,
      confidence: 'Estimated',
      priority: Number(item.priority) || 40,
      dedupeKey: `${plant.id}|${normalizeText(actionType)}|${plantingDateKey(item.date)}`,
    });
  });
  const unique = new Map();
  candidates.forEach(item => {
    const current = unique.get(item.dedupeKey);
    if (!current || item.source === 'task' || item.priority > current.priority) unique.set(item.dedupeKey, item);
  });
  return [...unique.values()].sort((a, b) => a.date.localeCompare(b.date) || b.priority - a.priority);
}

function nextWindowForCrop(cropId, now = new Date()) {
  const year = now.getFullYear();
  const today = plantingDateKey(now);
  const range = (startMonth, startDay, endMonth, endDay, label, reason) => {
    let targetYear = year;
    let start = `${targetYear}-${String(startMonth).padStart(2, '0')}-${String(startDay).padStart(2, '0')}`;
    let end = `${targetYear}-${String(endMonth).padStart(2, '0')}-${String(endDay).padStart(2, '0')}`;
    if (start < today && end >= today) start = today;
    if (end < today) {
      targetYear += 1;
      start = `${targetYear}-${String(startMonth).padStart(2, '0')}-${String(startDay).padStart(2, '0')}`;
      end = `${targetYear}-${String(endMonth).padStart(2, '0')}-${String(endDay).padStart(2, '0')}`;
    }
    return { start, end, label, reason };
  };
  if (COOL_FALL_IDS.has(cropId)) return range(8, 1, 9, 15, 'Estimated fall planting window', 'Cool-season crops can use Green Bay’s late-summer and early-fall window.');
  if (cropId === 'garlic') return range(9, 20, 10, 25, 'Estimated fall planting window', 'Hardneck garlic is generally planted before the ground freezes.');
  if (WARM_START_IDS.has(cropId)) return range(2, 15, 4, 1, 'Estimated indoor-start window', 'Long-season warm crops usually need an indoor head start before Green Bay’s outdoor season.');
  return range(5, 15, 6, 15, 'Estimated outdoor planting window', 'General Green Bay seasonal guidance is being used because an exact packet window is not recorded.');
}

export function buildPlanAhead({ actions = [], garden = {}, recommendations = [], weather = null, now = new Date() }) {
  const today = plantingDateKey(now);
  const bounds = plantingWeekBounds(now);
  const groups = { comingSoon: [], laterSeason: [], nextSeason: [] };
  actions.filter(action => action.date > bounds.end).forEach(action => {
    const days = Math.round((new Date(`${action.date}T12:00:00`) - new Date(`${today}T12:00:00`)) / DAY);
    const target = days <= 14 ? groups.comingSoon : days <= 90 ? groups.laterSeason : groups.nextSeason;
    target.push({ ...action, planKind: 'action' });
  });
  const recommendationMap = new Map(recommendations.map(item => [item.id, item]));
  normalizedSeedInventory(garden).forEach(packet => {
    const owned = createOwnedRecommendation(packet, recommendationMap.get(packet.cropId), garden, weather, now);
    if (owned.strongNow || suggestionSuppressed(garden, owned.id) || packetAlreadyStarted(garden, packet)) return;
    if (owned.oldPacket) {
      groups.comingSoon.push({ ...owned, planKind: 'seed', date: addPlantingDays(today, 7), timing: 'Suggested within the next week', why: 'This owned packet is old enough that a germination test is recommended before relying on it.' });
      return;
    }
    const window = nextWindowForCrop(packet.cropId, now);
    const days = Math.round((new Date(`${window.start}T12:00:00`) - new Date(`${today}T12:00:00`)) / DAY);
    const target = days <= 14 ? groups.comingSoon : days <= 120 ? groups.laterSeason : groups.nextSeason;
    target.push({ ...owned, planKind: 'seed', date: window.start, timing: `${window.start}–${window.end}`, why: window.reason, windowLabel: window.label, strongNow: false });
  });
  (garden.yearPlan?.crops || []).filter(item => ['definitely', 'maybe'].includes(item.status)).forEach(item => {
    const crop = cropCatalog.find(entry => entry.id === item.cropId);
    if (!crop) return;
    const id = `planting-suggestion-next-season-${crop.id}-${now.getFullYear() + 1}`;
    if (suggestionSuppressed(garden, id)) return;
    groups.nextSeason.push({
      id,
      source: 'year-plan',
      planKind: 'idea',
      owned: normalizedSeedInventory(garden).some(packet => packet.cropId === crop.id),
      crop,
      cropId: crop.id,
      title: crop.name,
      variety: crop.variety,
      method: 'Next Season',
      date: `${now.getFullYear() + 1}-02-01`,
      timing: 'Next-season plan',
      why: `Saved as ${item.status === 'definitely' ? 'definitely growing' : 'maybe growing'} in the existing Next Year plan.`,
      uncertainty: 'Exact planting dates will be refined from the owned packet and confirmed garden space.',
      spaces: suitableSpacesFor({ crop, method: 'Direct Sow', garden }),
      suggestionTask: { id, kind: 'plantingSuggestion', taskType: 'Next Season', title: crop.name, reason: 'Saved in the Next Year plan.', dueDate: `${now.getFullYear() + 1}-02-01`, priority: 25 },
    });
  });
  Object.values(groups).forEach(items => items.sort((a, b) => String(a.date).localeCompare(String(b.date))));
  return groups;
}

export function recentPlantUpdates(timeline = []) {
  return timeline
    .filter(item => item.type === 'lifecycle' || item.historical || item.informational)
    .sort((a, b) => plantingDateKey(b.date).localeCompare(plantingDateKey(a.date)));
}
