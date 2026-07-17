import { newId } from './data.js';

export const PLANT_LIFECYCLE_STAGES = [
  'Planned',
  'Seed Purchased',
  'Seed Started',
  'Germinating',
  'Seedling',
  'Potted Up',
  'Hardening Off',
  'Transplanted',
  'Established',
  'Flowering',
  'Fruiting',
  'Harvesting',
  'Dormant',
  'Finished',
];

export const GROWING_SPACE_TYPES = [
  { value: 'bed', label: 'Raised Bed' },
  { value: 'in-ground', label: 'In Ground Bed' },
  { value: 'container', label: 'Container Planter' },
  { value: 'potato-grow-bag', label: 'Potato Grow Bag' },
  { value: 'seed-tray', label: 'Seed Tray' },
  { value: 'indoor', label: 'Indoor Plant Area' },
  { value: 'greenhouse', label: 'Greenhouse Space' },
];

const LEGACY_STAGE_MAP = {
  Seed: 'Seed Started',
  Growing: 'Established',
  Producing: 'Fruiting',
  'Ready to harvest': 'Harvesting',
  Overwintering: 'Dormant',
  Failed: 'Finished',
};

export function normalizeLifecycleStage(stage) {
  if (PLANT_LIFECYCLE_STAGES.includes(stage)) return stage;
  return LEGACY_STAGE_MAP[stage] || 'Established';
}

export function createStageHistoryEntry({ stage, enteredAt, notes = '', photos = [], actor = 'System' }) {
  return {
    id: newId('stage'),
    stage: normalizeLifecycleStage(stage),
    enteredAt: enteredAt || new Date().toISOString(),
    notes: String(notes || '').trim(),
    photos: Array.isArray(photos) ? photos : [],
    actor,
  };
}

export function normalizeStageHistory(plant, actor = 'System') {
  const existing = Array.isArray(plant.stageHistory) ? plant.stageHistory : [];
  if (existing.length) {
    return existing
      .map((entry) => ({
        ...entry,
        id: entry.id || newId('stage'),
        stage: normalizeLifecycleStage(entry.stage),
        enteredAt: entry.enteredAt || entry.dateEntered || entry.at || plant.stageUpdatedAt || plant.plantedAt || new Date().toISOString(),
        notes: entry.notes || '',
        photos: Array.isArray(entry.photos) ? entry.photos : [],
        actor: entry.actor || actor,
      }))
      .sort((a, b) => String(a.enteredAt).localeCompare(String(b.enteredAt)));
  }
  return [createStageHistoryEntry({
    stage: plant.stage,
    enteredAt: plant.stageUpdatedAt || plant.plantedAt || plant.createdAt,
    notes: 'Imported from the existing plant record.',
    actor,
  })];
}

export function normalizeSpaceIntelligence(space) {
  return {
    soilType: '',
    drainageQuality: '',
    mulchStatus: '',
    irrigationMethod: '',
    sunExposure: '',
    size: '',
    material: '',
    drainageHoles: false,
    selfWateringReservoir: false,
    bagSize: '',
    seedPotatoesPlanted: '',
    hillingStage: '',
    lastHilledDate: '',
    ...space,
  };
}

export function buildPlantJourneyEvents({ plant, activity = [], harvests = [], problems = [] }) {
  const stageEvents = normalizeStageHistory(plant).map((entry) => ({
    id: entry.id,
    type: 'stage',
    at: entry.enteredAt,
    title: entry.stage,
    detail: entry.notes || 'Lifecycle stage entered.',
    photos: entry.photos || [],
  }));
  const linkedActivity = activity
    .filter((entry) => entry.plantId === plant.id)
    .map((entry) => ({ id: entry.id, type: entry.type || 'task', at: entry.at, title: entry.title, detail: entry.detail || '', completed: true }));
  const harvestEvents = harvests
    .filter((entry) => entry.plantId === plant.id)
    .map((entry) => ({ id: entry.id, type: 'harvest', at: entry.at, title: 'Harvest recorded', detail: `${entry.amount || ''} ${entry.unit || ''}${entry.note ? ` • ${entry.note}` : ''}`.trim(), completed: true }));
  const problemEvents = problems
    .filter((entry) => entry.plantId === plant.id)
    .map((entry) => ({ id: entry.id, type: 'problem', at: entry.at, title: entry.type || 'Plant issue recorded', detail: entry.note || '', completed: entry.status === 'resolved' }));
  return [...stageEvents, ...linkedActivity, ...harvestEvents, ...problemEvents]
    .filter((entry) => entry.at)
    .sort((a, b) => String(b.at).localeCompare(String(a.at)));
}
