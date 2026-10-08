/**
 * Core type definitions for the Land Map Generator.
 * All geometry, state, and rendering types live here.
 */

// ─── Units & Orientation ─────────────────────────────────────────────

export type Unit = 'ft' | 'm' | 'yd';

export type CardinalDirection = 'north' | 'south' | 'east' | 'west';

export interface Orientation {
  top: CardinalDirection;
  right: CardinalDirection;
  bottom: CardinalDirection;
  left: CardinalDirection;
}

// ─── Geometry Primitives ─────────────────────────────────────────────

export interface Point {
  x: number;
  y: number;
}

export interface BoundingBox {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
  width: number;
  height: number;
}

// ─── Boundaries ──────────────────────────────────────────────────────

export interface Boundaries {
  north: number;
  east: number;
  south: number;
  west: number;
  locked: {
    north: boolean;
    east: boolean;
    south: boolean;
    west: boolean;
  };
}

export interface CornerAngles {
  A?: number; // NE corner angle in degrees
  B?: number; // SE corner angle in degrees
  C?: number; // SW corner angle in degrees
  D?: number; // NW corner angle in degrees
}

export interface CornerLabels {
  A: string;
  B: string;
  C: string;
  D: string;
}

// ─── Geometry Mode ───────────────────────────────────────────────────

export type GeometryMode = 'approximate' | 'angle-assisted' | 'coordinate' | 'bearing';

export type GeometryStatus = 'reliable' | 'approximate' | 'invalid' | 'edited';

export interface GeometryConfig {
  mode: GeometryMode;
  corners?: CornerAngles;
  coordinates?: {
    A?: Point;
    B?: Point;
    C?: Point;
    D?: Point;
  };
  bearings?: {
    AB?: { distance: number; bearing: number };
    BC?: { distance: number; bearing: number };
    CD?: { distance: number; bearing: number };
    DA?: { distance: number; bearing: number };
  };
}

// ─── Computed Polygon ────────────────────────────────────────────────

export interface ComputedPolygon {
  /** Corners in order: A (top-right), B (bottom-right), C (bottom-left), D (top-left) */
  points: [Point, Point, Point, Point];
  area: number;
  status: GeometryStatus;
  warnings: string[];
}

// ─── Divisions ───────────────────────────────────────────────────────

export type DivisionMethod =
  | 'equal-area'
  | 'equal-width'
  | 'equal-length'
  | 'custom-dimensions'
  | 'custom-percentage';

export interface Division {
  id: string;
  name: string;
  nameHi?: string;
  area?: number;
  percentage?: number;
  color: string;
  polygon?: Point[];
}

export interface DivisionConfig {
  enabled: boolean;
  count: number;
  method: DivisionMethod;
  orientation: 'vertical' | 'horizontal';
  divisions: Division[];
}

// ─── Elements ────────────────────────────────────────────────────────

export type ElementType =
  | 'temple'
  | 'house'
  | 'gate'
  | 'road'
  | 'garden'
  | 'tree'
  | 'well'
  | 'parking'
  | 'shop'
  | 'water-tank'
  | 'boundary-wall'
  | 'open-area'
  | 'custom';

export type PositionPreset =
  | 'north-east'
  | 'north-west'
  | 'south-east'
  | 'south-west'
  | 'center'
  | 'north'
  | 'south'
  | 'east'
  | 'west'
  | 'custom';

export type ElementDisplayMode = 'icon-only' | 'icon-name' | 'icon-name-direction';

export interface LandElement {
  id: string;
  type: ElementType;
  name: string;
  nameHi?: string;
  position: PositionPreset;
  offsetX: number; // offset from nearest boundary in land units
  offsetY: number;
  width: number;
  height: number;
  rotation: number;
  label?: string;
  displayMode: ElementDisplayMode;
  customX?: number;
  customY?: number;
}

// ─── Surroundings ────────────────────────────────────────────────────

export type SurroundingType =
  | 'road'
  | 'open-road'
  | 'lane'
  | 'neighbor'
  | 'empty'
  | 'other';

export interface SurroundingInfo {
  type: SurroundingType;
  label: string;
  labelHi?: string;
}

export interface Surroundings {
  north: SurroundingInfo;
  east: SurroundingInfo;
  south: SurroundingInfo;
  west: SurroundingInfo;
}

// ─── Gate ────────────────────────────────────────────────────────────

export interface GateConfig {
  id: string;
  side: CardinalDirection;
  distanceFromStart: number; // distance from the start corner of that side
  width: number;
  label?: string;
}

// ─── Display Settings ────────────────────────────────────────────────

export type CompassStyle = 'off' | 'compact' | 'detailed';

export interface DisplaySettings {
  showCompass: CompassStyle;
  showDimensions: boolean;
  showCornerLabels: boolean;
  showDirectionLabels: boolean;
  showArea: boolean;
  showSurroundings: boolean;
  showInfoPanel: boolean;
  showDisclaimer: boolean;
  showGrid: boolean;
}

// ─── Language ────────────────────────────────────────────────────────

export type Language = 'en' | 'hi' | 'both';

export type EditMode = 'presentation' | 'free' | 'constrained';

export interface LandProject {
  name: string;
  unit: Unit;
  language: Language;
  orientation: Orientation;
  boundaries: Boundaries;
  declaredArea?: number;
  geometry: GeometryConfig;
  cornerLabels: CornerLabels;
  divisions: DivisionConfig;
  elements: LandElement[];
  gates: GateConfig[];
  surroundings: Surroundings;
  display: DisplaySettings;
  // Interactive Editor States
  editMode: EditMode;
  snapIncrement: number;
  selection?: {
    type: 'corner' | 'boundary' | 'element' | 'division';
    id: string; // e.g., 'A', 'north', or element id
  };
}

// ─── Computed State (derived from project) ───────────────────────────

export interface ComputedState {
  polygon: ComputedPolygon;
  divisionPolygons: Division[];
  elementPositions: Array<{
    element: LandElement;
    svgX: number;
    svgY: number;
  }>;
  gatePositions: Array<{
    gate: GateConfig;
    start: Point;
    end: Point;
  }>;
  scale: number;
  svgWidth: number;
  svgHeight: number;
  areaComparison?: {
    declared: number;
    calculated: number;
    differencePercent: number;
  };
}
