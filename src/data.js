export const colors = {
  green: '#063c27',
  gold: '#efb52b',
  cream: '#fbf7ec',
  red: '#c64231',
};

export const cropData = [
  { id: 'lettuce', name: 'Lettuce', variety: 'Leaf & Head', family: 'vegetables', status: 'Direct Sow', timing: 'Now', tone: 'green' },
  { id: 'onions', name: 'Green Onions', variety: 'Bunching', family: 'vegetables', status: 'Direct Sow', timing: 'Now', tone: 'green' },
  { id: 'garlic', name: 'Garlic', variety: 'Hardneck', family: 'vegetables', status: 'Start Indoors', timing: 'Now', tone: 'gold' },
  { id: 'spinach', name: 'Spinach', variety: 'Bloomsdale', family: 'vegetables', status: 'Direct Sow', timing: 'Now', tone: 'green' },
  { id: 'peppers', name: 'Peppers', variety: 'Bell & Sweet', family: 'vegetables', status: 'Wait a Bit', timing: 'May 20+', tone: 'red' },
  { id: 'basil', name: 'Basil', variety: 'Genovese', family: 'herbs', status: 'Start Indoors', timing: 'Now', tone: 'gold' },
  { id: 'marigold', name: 'Marigolds', variety: 'French', family: 'flowers', status: 'Start Indoors', timing: 'Now', tone: 'gold' },
];

export const gardenSpaces = [
  {
    id: 'bed',
    name: 'Raised Bed 1',
    count: '8 of 12 plants',
    progress: 67,
    task: 'Water the peppers',
    harvest: 'Jun 10 – Jul 5',
    type: 'bed',
  },
  {
    id: 'greenhouse',
    name: 'Greenhouse',
    count: '5 of 8 plants',
    progress: 63,
    task: 'Ventilate on sunny days',
    harvest: 'May 25 – Jun 20',
    type: 'greenhouse',
  },
  {
    id: 'hydro',
    name: 'Hydroponics',
    count: '6 of 10 plants',
    progress: 60,
    task: 'Check nutrient levels',
    harvest: 'May 18 – Jun 12',
    type: 'hydro',
  },
];
