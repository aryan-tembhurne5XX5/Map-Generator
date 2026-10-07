/**
 * Default project configuration matching the reference images.
 */
import type { LandProject } from '@/types/land';
import { v4 as uuidv4 } from 'uuid';

export function createDefaultProject(): LandProject {
  return {
    name: 'Sample Land Plot',
    unit: 'ft',
    language: 'both',
    orientation: {
      top: 'east',
      right: 'south',
      bottom: 'west',
      left: 'north',
    },
    boundaries: {
      north: 42,
      east: 44,
      south: 20,
      west: 27,
      locked: { north: false, east: false, south: false, west: false },
    },
    declaredArea: 1518,
    geometry: {
      mode: 'approximate',
    },
    cornerLabels: {
      A: 'A',
      B: 'B',
      C: 'C',
      D: 'D',
    },
    divisions: {
      enabled: true,
      count: 2,
      method: 'equal-area',
      divisions: [
        {
          id: 'div-1',
          name: 'Part 1',
          nameHi: 'हिस्सा 1',
          area: 759,
          percentage: 50,
          color: 'rgba(76, 175, 80, 0.3)',
        },
        {
          id: 'div-2',
          name: 'Part 2',
          nameHi: 'हिस्सा 2',
          area: 759,
          percentage: 50,
          color: 'rgba(255, 235, 59, 0.3)',
        },
      ],
    },
    elements: [
      {
        id: uuidv4(),
        type: 'temple',
        name: 'Temple',
        nameHi: 'मंदिर',
        position: 'north-east',
        offsetX: 5,
        offsetY: 4,
        width: 6,
        height: 6,
        rotation: 0,
        label: 'Temple / मंदिर',
        displayMode: 'icon-name',
      },
    ],
    gates: [],
    surroundings: {
      east: {
        type: 'open-road',
        label: 'Open Road / Lane',
        labelHi: 'सामने खुला रास्ता / गली',
      },
      west: {
        type: 'other',
        label: 'Sloping Side – 27 ft',
        labelHi: 'तिरछी साइड – 27 फुट',
      },
      north: {
        type: 'neighbor',
        label: "Neighbor's Land",
        labelHi: 'पड़ोसी की भूमि',
      },
      south: {
        type: 'neighbor',
        label: "Neighbor's Land",
        labelHi: 'पड़ोसी की भूमि',
      },
    },
    display: {
      showCompass: 'detailed',
      showDimensions: true,
      showCornerLabels: true,
      showDirectionLabels: true,
      showArea: true,
      showSurroundings: true,
      showInfoPanel: true,
      showDisclaimer: true,
      showGrid: false,
    },
    editMode: 'presentation',
    snapIncrement: 1,
  };
}

/**
 * Create an empty project.
 */
export function createEmptyProject(): LandProject {
  return {
    name: 'New Land Plot',
    unit: 'ft',
    language: 'both',
    orientation: {
      top: 'north',
      right: 'east',
      bottom: 'south',
      left: 'west',
    },
    boundaries: {
      north: 0,
      east: 0,
      south: 0,
      west: 0,
      locked: { north: false, east: false, south: false, west: false },
    },
    geometry: {
      mode: 'approximate',
    },
    cornerLabels: {
      A: 'A',
      B: 'B',
      C: 'C',
      D: 'D',
    },
    divisions: {
      enabled: false,
      count: 1,
      method: 'equal-area',
      divisions: [],
    },
    elements: [],
    gates: [],
    surroundings: {
      east: { type: 'empty', label: '', labelHi: '' },
      west: { type: 'empty', label: '', labelHi: '' },
      north: { type: 'empty', label: '', labelHi: '' },
      south: { type: 'empty', label: '', labelHi: '' },
    },
    display: {
      showCompass: 'detailed',
      showDimensions: true,
      showCornerLabels: true,
      showDirectionLabels: true,
      showArea: true,
      showSurroundings: true,
      showInfoPanel: true,
      showDisclaimer: true,
      showGrid: false,
    },
    editMode: 'presentation',
    snapIncrement: 1,
  };
}
