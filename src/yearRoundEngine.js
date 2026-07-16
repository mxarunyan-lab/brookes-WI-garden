const DAY = 24 * 60 * 60 * 1000;

function daysSince(value, now = new Date()) {
  if (!value) return Infinity;
  return Math.max(0, Math.floor((now.getTime() - new Date(value).getTime()) / DAY));
}

export function getSeasonMode(date = new Date()) {
  const month = date.getMonth() + 1;
  if ([12, 1, 2].includes(month)) return {
    id: 'winter',
    label: 'Winter garden mode',
    headline: 'Grow indoors. Plan outside.',
    focus: 'Hydroponics, grow lights, seed inventory, winter sowing, and next-season planning.',
  };
  if ([3, 4].includes(month)) return {
    id: 'seed-starting',
    label: 'Seed-starting mode',
    headline: 'Start, sprout, and pot up.',
    focus: 'Indoor starts, germination, grow-light care, greenhouse prep, and cool-season sowing.',
  };
  if ([5, 6].includes(month)) return {
    id: 'transition',
    label: 'Outdoor transition mode',
    headline: 'Move plants out safely.',
    focus: 'Frost checks, hardening off, transplanting, direct sowing, and rain-aware watering.',
  };
  if ([7, 8].includes(month)) return {
    id: 'growth-harvest',
    label: 'Growth and harvest mode',
    headline: 'Keep it growing. Pick it on time.',
    focus: 'Soil checks, harvests, heat protection, greenhouse ventilation, and fall crop starts.',
  };
  return {
    id: 'fall-shutdown',
    label: 'Fall and shutdown mode',
    headline: 'Harvest, protect, and prepare.',
    focus: 'Frost protection, garlic, cleanup, overwintering, seed saving, and winter setup.',
  };
}

function plantTask(plant, now, weather) {
  const stage = String(plant.stage || '').toLowerCase();
  const lastSoil = daysSince(plant.lastSoilCheck, now);
  const lastWatered = daysSince(plant.lastWatered, now);
  const outdoor = !['indoor', 'basement', 'hydro'].includes(plant.spaceType);

  if (stage.includes('harvest') || stage.includes('ready')) {
    return {
      id: `harvest-${plant.id}`,
      kind: 'plantDetail',
      plant,
      priority: 95,
      title: `Check ${plant.name} for harvest`,
      subtitle: 'Review readiness and record what you pick.',
      action: 'Review',
      tone: 'gold',
    };
  }

  if (stage.includes('seed') || stage.includes('germinat') || stage.includes('sprout')) {
    return {
      id: `seedling-${plant.id}`,
      kind: 'plantDetail',
      plant,
      priority: 88,
      title: `Check ${plant.name} seedlings`,
      subtitle: 'Check moisture, light distance, and growth stage.',
      action: 'Check',
      tone: 'green',
    };
  }

  if (stage.includes('harden')) {
    return {
      id: `harden-${plant.id}`,
      kind: 'plantDetail',
      plant,
      priority: 92,
      title: `Continue hardening off ${plant.name}`,
      subtitle: 'Use today’s weather to decide how long they stay outside.',
      action: 'Guide Me',
      tone: 'gold',
    };
  }

  const rainLikely = weather?.dailyRainChance >= 70;
  if (lastSoil >= 2 || lastWatered >= 3) {
    return {
      id: `soil-${plant.id}`,
      kind: 'soil',
      plant,
      priority: outdoor && rainLikely ? 62 : 80,
      title: `Check ${plant.name} soil`,
      subtitle: outdoor && rainLikely
        ? 'Rain is likely. Check first and probably skip watering.'
        : 'Feel the soil before deciding whether to water.',
      action: 'Check Soil',
      tone: 'green',
    };
  }

  return null;
}

export function buildYearRoundTasks({ garden, weather, date = new Date() }) {
  const tasks = [];
  const mode = getSeasonMode(date);
  const spaces = garden.spaces || [];
  const plants = (garden.plants || []).map((plant) => ({
    ...plant,
    spaceType: spaces.find((space) => space.id === plant.spaceId)?.type || '',
  }));

  if (!garden.profile?.setupComplete) {
    tasks.push({
      id: 'finish-setup',
      kind: 'setup',
      priority: 100,
      title: 'Finish Brooke’s garden setup',
      subtitle: 'Confirm the spaces she actually uses so the app can stop guessing.',
      action: 'Finish Setup',
      tone: 'green',
    });
  }

  if (!plants.length) {
    tasks.push({
      id: 'setup-first-plant',
      kind: 'setupPlant',
      priority: 99,
      title: 'Add what is actually growing',
      subtitle: 'Plants, seedlings, hydroponic pods, and overwintered plants all belong here.',
      action: 'Add Plant',
      tone: 'green',
    });
  }

  plants.forEach((plant) => {
    const task = plantTask(plant, date, weather);
    if (task) tasks.push(task);
  });

  if (spaces.some((space) => space.type === 'greenhouse')) {
    tasks.push({
      id: 'greenhouse-check',
      kind: 'greenhouse',
      priority: weather?.high >= 80 ? 90 : 55,
      title: weather?.high >= 80 ? 'Check and vent the greenhouse' : 'Log greenhouse conditions',
      subtitle: weather?.high >= 80
        ? `Green Bay may reach ${weather.high}°. Check temperature before heat builds.`
        : 'Record temperature, humidity, or a quick note.',
      action: 'Check',
      tone: weather?.high >= 80 ? 'gold' : 'quiet',
    });
  }

  if (spaces.some((space) => space.type === 'hydro')) {
    tasks.push({
      id: 'hydro-weekly',
      kind: 'navigate',
      target: 'garden',
      priority: mode.id === 'winter' ? 78 : 42,
      title: 'Review the hydroponic crop cycle',
      subtitle: 'Check empty pods, harvest timing, and what should be replanted next.',
      action: 'Review',
      tone: 'quiet',
    });
  }

  tasks.push({
    id: 'review-planting',
    kind: 'navigate',
    target: 'plant',
    priority: 50,
    title: mode.id === 'winter' ? 'See what can be started indoors' : 'See what makes sense to plant next',
    subtitle: mode.focus,
    action: 'Review',
    tone: 'gold',
  });

  return tasks
    .sort((a, b) => b.priority - a.priority)
    .slice(0, 6);
}

export function migrateGarden(input, starterGarden) {
  const garden = input && typeof input === 'object' ? input : starterGarden;
  const spaces = [...(garden.spaces || [])];
  const ensure = (space) => {
    if (!spaces.some((item) => item.type === space.type)) spaces.push(space);
  };
  ensure({ id: 'indoor-starts', name: 'Indoor Starts', type: 'indoor', capacity: 24 });
  ensure({ id: 'basement-grow', name: 'Basement Grow Area', type: 'basement', capacity: 24 });

  return {
    ...starterGarden,
    ...garden,
    profile: {
      ...starterGarden.profile,
      ...(garden.profile || {}),
      setupComplete: Boolean(garden.profile?.setupComplete || (garden.plants || []).length),
      reminderLevel: garden.profile?.reminderLevel || 'normal',
    },
    spaces,
    plants: garden.plants || [],
    activity: garden.activity || [],
    version: 3,
  };
}
