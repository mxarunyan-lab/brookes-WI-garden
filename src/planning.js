import { cropCatalog, newId } from './data.js';

const DAY = 86400000;
const cropMap = Object.fromEntries(cropCatalog.map((crop) => [crop.id, crop]));

const harvestDays = {
  lettuce: 45,
  onions: 55,
  garlic: 270,
  spinach: 42,
  peppers: 80,
  basil: 45,
  marigold: 55,
};

const stageSteps = ['Seed', 'Germinating', 'Seedling', 'Growing', 'Flowering', 'Producing', 'Ready to harvest'];

function dateOnly(value) {
  const date = value ? new Date(`${value}T12:00:00`) : new Date();
  return Number.isNaN(date.getTime()) ? new Date() : date;
}

export function addDays(value, days) {
  const date = dateOnly(value);
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
}

export function daysFromNow(value) {
  return Math.ceil((dateOnly(value).getTime() - dateOnly(new Date().toISOString().slice(0, 10)).getTime()) / DAY);
}

export function prettyDate(value) {
  return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' }).format(dateOnly(value));
}

export function nextStage(current) {
  const index = stageSteps.indexOf(current);
  return stageSteps[Math.min(stageSteps.length - 1, Math.max(0, index + 1))];
}

export function normalizePlanning(garden) {
  return {
    ...garden,
    seeds: Array.isArray(garden.seeds) ? garden.seeds : [],
    succession: Array.isArray(garden.succession) ? garden.succession : [],
    harvests: Array.isArray(garden.harvests) ? garden.harvests : [],
    plants: (garden.plants || []).map((plant) => ({
      batchName: plant.batchName || 'Batch 1',
      quantity: Number(plant.quantity) || 1,
      successionEnabled: Boolean(plant.successionEnabled),
      successionDays: Number(plant.successionDays) || 14,
      ...plant,
    })),
  };
}

export function buildTimeline(garden, now = new Date()) {
  const today = now.toISOString().slice(0, 10);
  const items = [];

  (garden.plants || []).forEach((plant) => {
    const crop = cropMap[plant.cropId];
    const planted = plant.plantedAt || today;
    const harvestDate = plant.expectedHarvest || addDays(planted, harvestDays[plant.cropId] || 60);
    const harvestDelta = daysFromNow(harvestDate);

    if (plant.stage === 'Ready to harvest' || (harvestDelta >= -7 && harvestDelta <= 30)) {
      items.push({
        id: `harvest-${plant.id}`,
        type: 'harvest',
        plantId: plant.id,
        date: harvestDate,
        title: plant.stage === 'Ready to harvest' ? `Harvest ${plant.name}` : `Check ${plant.name} for harvest`,
        detail: `${plant.batchName || 'Current batch'} • ${crop?.harvest || 'Check maturity'}`,
        priority: plant.stage === 'Ready to harvest' ? 1 : 3,
      });
    }

    if (['Seed', 'Germinating', 'Seedling'].includes(plant.stage)) {
      const checkDate = addDays(planted, plant.stage === 'Seed' ? 5 : 3);
      items.push({ id: `stage-${plant.id}`, type: 'stage', plantId: plant.id, date: checkDate, title: `Check ${plant.name} progress`, detail: `Current stage: ${plant.stage}`, priority: 2 });
    }

    if (plant.successionEnabled) {
      const existing = (garden.succession || []).find((item) => item.plantId === plant.id && item.status !== 'done');
      const due = existing?.dueDate || addDays(planted, plant.successionDays || 14);
      items.push({
        id: existing?.id || `succession-${plant.id}`,
        type: 'succession',
        plantId: plant.id,
        date: due,
        title: `Start the next ${plant.name} batch`,
        detail: `${plant.quantity || 1} now • repeats every ${plant.successionDays || 14} days`,
        priority: 2,
      });
    }
  });

  (garden.succession || []).filter((item) => !item.plantId && item.status !== 'done').forEach((item) => items.push({ ...item, type: 'succession', priority: 2 }));

  return items
    .filter((item) => daysFromNow(item.date) >= -7 && daysFromNow(item.date) <= 60)
    .sort((a, b) => a.date.localeCompare(b.date) || a.priority - b.priority);
}

export function splitTimeline(items) {
  return {
    week: items.filter((item) => daysFromNow(item.date) <= 7),
    month: items.filter((item) => daysFromNow(item.date) > 7 && daysFromNow(item.date) <= 30),
    later: items.filter((item) => daysFromNow(item.date) > 30),
  };
}

export function seedStatusForCrop(garden, cropId) {
  const seed = (garden.seeds || []).find((item) => item.cropId === cropId || item.name.toLowerCase() === cropMap[cropId]?.name.toLowerCase());
  if (!seed) return { label: 'Not in seed box', tone: 'red', seed: null };
  if (Number(seed.quantity) <= 0) return { label: 'Out of seeds', tone: 'red', seed };
  const age = new Date().getFullYear() - Number(seed.packetYear || new Date().getFullYear());
  if (age >= 4) return { label: 'Test germination', tone: 'gold', seed };
  if (Number(seed.quantity) <= 5) return { label: 'Running low', tone: 'gold', seed };
  return { label: 'Already owned', tone: 'green', seed };
}

export function createSuccession(plant, interval = 14, quantity = 6) {
  return {
    id: newId('succession'),
    plantId: plant.id,
    cropId: plant.cropId,
    title: `Start the next ${plant.name} batch`,
    detail: `${quantity} plants or seeds`,
    dueDate: addDays(new Date().toISOString().slice(0, 10), interval),
    date: addDays(new Date().toISOString().slice(0, 10), interval),
    interval,
    quantity,
    status: 'scheduled',
  };
}
