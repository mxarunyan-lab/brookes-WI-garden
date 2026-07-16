export const colors = {
  green: '#063c27',
  gold: '#efb52b',
  cream: '#fbf7ec',
  red: '#c64231',
  blue: '#4c8fb7',
};

export const GREEN_BAY = {
  name: 'Green Bay, Wisconsin',
  shortName: 'Green Bay',
  zone: '5b',
  latitude: 44.5133,
  longitude: -88.0133,
  timezone: 'America/Chicago',
};

export const starterGarden = {
  profile: {
    gardenerName: 'Brooke',
    location: GREEN_BAY.name,
    zone: GREEN_BAY.zone,
  },
  spaces: [
    { id: 'raised-bed-1', name: 'Raised Bed 1', type: 'bed', capacity: 12 },
    { id: 'greenhouse', name: 'Greenhouse', type: 'greenhouse', capacity: 8 },
    { id: 'hydroponics', name: 'Hydroponics', type: 'hydro', capacity: 10 },
  ],
  plants: [],
  activity: [],
};

export const cropCatalog = [
  {
    id: 'lettuce',
    name: 'Lettuce',
    variety: 'Leaf & Head',
    family: 'vegetables',
    depth: '¼ inch',
    sun: '4–6 hours',
    harvest: '35–60 days',
    succession: 'Every 10–14 days',
    summary: 'A cool-season crop that grows best before or after the hottest part of summer.',
  },
  {
    id: 'onions',
    name: 'Green Onions',
    variety: 'Bunching',
    family: 'vegetables',
    depth: '¼ inch',
    sun: '6+ hours',
    harvest: '45–70 days',
    succession: 'Every 2–3 weeks',
    summary: 'A forgiving crop that can be sown in small batches through much of the growing season.',
  },
  {
    id: 'garlic',
    name: 'Garlic',
    variety: 'Hardneck',
    family: 'vegetables',
    depth: '2–3 inches',
    sun: '6+ hours',
    harvest: 'The following July',
    succession: 'One fall planting',
    summary: 'Hardneck garlic is planted outdoors in fall so it can overwinter and form bulbs next summer.',
  },
  {
    id: 'spinach',
    name: 'Spinach',
    variety: 'Bloomsdale',
    family: 'vegetables',
    depth: '½ inch',
    sun: '4–6 hours',
    harvest: '35–50 days',
    succession: 'Every 10–14 days',
    summary: 'Spinach prefers cool soil and is most reliable as a spring or fall crop in Green Bay.',
  },
  {
    id: 'peppers',
    name: 'Peppers',
    variety: 'Bell & Sweet',
    family: 'vegetables',
    depth: '¼ inch indoors',
    sun: '8+ hours',
    harvest: '60–90 days from transplant',
    succession: 'One indoor start',
    summary: 'Peppers need a long, warm season. Start them indoors early and protect them from cold nights.',
  },
  {
    id: 'basil',
    name: 'Basil',
    variety: 'Genovese',
    family: 'herbs',
    depth: '¼ inch',
    sun: '6+ hours',
    harvest: '30–60 days',
    succession: 'Every 3–4 weeks',
    summary: 'Basil loves warmth and can be pinched regularly to keep it producing tender leaves.',
  },
  {
    id: 'marigold',
    name: 'Marigolds',
    variety: 'French',
    family: 'flowers',
    depth: '¼ inch',
    sun: '6+ hours',
    harvest: 'Blooms in 50–60 days',
    succession: 'Usually one planting',
    summary: 'A warm-season flower that adds color and works well around vegetable beds.',
  },
];

function recommendationFor(cropId, date = new Date()) {
  const month = date.getMonth() + 1;
  const day = date.getDate();

  switch (cropId) {
    case 'lettuce':
      if (month <= 4) return { status: 'Direct Sow', timing: 'Now', tone: 'green', action: 'Plant now', note: 'Cool weather is ideal.' };
      if (month === 5) return { status: 'Plant Carefully', timing: 'Cool spot', tone: 'gold', action: 'See heat tips', note: 'Choose shade and heat-tolerant varieties.' };
      if (month === 7 && day >= 20) return { status: 'Start Fall Crop', timing: 'Now', tone: 'green', action: 'Plan a batch', note: 'Start a small fall planting.' };
      if (month === 7) return { status: 'Plan Fall Crop', timing: 'Late July', tone: 'gold', action: 'Set reminder', note: 'Wait for slightly cooler conditions.' };
      if (month === 8 || month === 9) return { status: 'Direct Sow', timing: 'Now', tone: 'green', action: 'Plant now', note: 'A good window for fall lettuce.' };
      return { status: 'Wait', timing: 'Spring', tone: 'red', action: 'View timing', note: 'The outdoor window is closed.' };
    case 'onions':
      if (month >= 4 && month <= 8) return { status: 'Direct Sow', timing: 'Now', tone: 'green', action: 'Plant now', note: 'Sow a short row for a steady supply.' };
      if (month <= 3) return { status: 'Start Indoors', timing: 'Now', tone: 'gold', action: 'See steps', note: 'Start early for spring planting.' };
      return { status: 'Wait', timing: 'Spring', tone: 'red', action: 'View timing', note: 'Outdoor growth will be limited.' };
    case 'garlic':
      if (month >= 9 && month <= 11) return { status: 'Plant Outdoors', timing: 'Now', tone: 'green', action: 'See steps', note: 'Plant before the ground freezes.' };
      return { status: 'Wait for Fall', timing: 'October', tone: 'gold', action: 'Plan ahead', note: 'Hardneck garlic belongs in the fall calendar.' };
    case 'spinach':
      if (month === 3 || month === 4) return { status: 'Direct Sow', timing: 'Now', tone: 'green', action: 'Plant now', note: 'Cool soil is ideal.' };
      if (month === 7 && day >= 25) return { status: 'Start Fall Crop', timing: 'Now', tone: 'green', action: 'Plan a batch', note: 'Begin a fall crop in a cool location.' };
      if (month === 8 || month === 9) return { status: 'Direct Sow', timing: 'Now', tone: 'green', action: 'Plant now', note: 'A strong fall planting window.' };
      return { status: 'Wait for Cool Weather', timing: 'Late summer', tone: 'gold', action: 'Set reminder', note: 'Heat can make spinach bolt.' };
    case 'peppers':
      if (month <= 3) return { status: 'Start Indoors', timing: 'Now', tone: 'green', action: 'See steps', note: 'Give seedlings a long indoor head start.' };
      if (month === 4 || month === 5) return { status: 'Transplant Carefully', timing: 'After warm nights', tone: 'gold', action: 'Check conditions', note: 'Wait until nights stay reliably warm.' };
      if (month >= 6 && month <= 9) return { status: 'Care & Harvest', timing: 'Existing plants', tone: 'green', action: 'Track a plant', note: 'It is too late to start from seed outdoors, but existing plants need consistent warmth and moisture.' };
      return { status: 'Wait', timing: 'Start indoors Feb–Mar', tone: 'red', action: 'View timing', note: 'Plan next season’s indoor start.' };
    case 'basil':
      if (month >= 5 && month <= 7) return { status: 'Plant or Transplant', timing: 'Now', tone: 'green', action: 'Plant now', note: 'Warm weather supports fast growth.' };
      if (month === 8) return { status: 'Harvest & Pinch', timing: 'Existing plants', tone: 'green', action: 'Track a plant', note: 'Keep pinching flowers to extend harvest.' };
      if (month <= 4) return { status: 'Start Indoors', timing: 'Now', tone: 'gold', action: 'See steps', note: 'Keep seedlings warm.' };
      return { status: 'Wait', timing: 'Late spring', tone: 'red', action: 'View timing', note: 'Basil dislikes cold conditions.' };
    case 'marigold':
      if (month >= 5 && month <= 7) return { status: 'Plant Starts', timing: 'Now', tone: 'green', action: 'Add to garden', note: 'Transplants establish quickly in warm soil.' };
      if (month <= 4) return { status: 'Start Indoors', timing: 'Now', tone: 'gold', action: 'See steps', note: 'Start ahead of the last frost.' };
      return { status: 'Wait', timing: 'Late spring', tone: 'red', action: 'View timing', note: 'The outdoor season is winding down.' };
    default:
      return { status: 'Review', timing: 'Today', tone: 'gold', action: 'Learn more', note: '' };
  }
}

export function getCropRecommendations(date = new Date()) {
  return cropCatalog.map((crop) => ({ ...crop, ...recommendationFor(crop.id, date) }));
}

export function newId(prefix) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

export function formatDateTime(value) {
  if (!value) return 'Not recorded';
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(value));
}
