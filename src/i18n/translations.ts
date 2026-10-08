/**
 * Internationalization (i18n) support.
 * Supports English (en) and Hindi (hi) with a 'both' mode.
 */
import type { Language, CardinalDirection, ElementType } from '@/types/land';

interface Translations {
  // App
  appTitle: string;
  // Sections
  landDimensions: string;
  orientation: string;
  boundaries: string;
  divisions: string;
  elements: string;
  surroundings: string;
  advancedGeometry: string;

  // Directions
  north: string;
  south: string;
  east: string;
  west: string;

  // Direction descriptions
  topSide: string;
  rightSide: string;
  bottomSide: string;
  leftSide: string;

  // Corner labels
  cornerA: string;
  cornerB: string;
  cornerC: string;
  cornerD: string;

  // Map labels
  totalArea: string;
  declaredArea: string;
  calculatedArea: string;
  approximateArea: string;
  difference: string;

  // Measurements
  length: string;
  width: string;
  area: string;
  unit: string;

  // Division
  divideInto: string;
  parts: string;
  part: string;
  equalArea: string;
  equalWidth: string;
  noDivision: string;
  entireLandNoDivision: string;

  // Elements
  temple: string;
  house: string;
  gate: string;
  road: string;
  garden: string;
  tree: string;
  well: string;
  parking: string;
  shop: string;
  waterTank: string;
  boundaryWall: string;
  openArea: string;
  custom: string;

  // Surroundings
  openRoad: string;
  lane: string;
  neighbor: string;
  empty: string;
  other: string;
  neighborLand: string;
  slopingSide: string;
  openRoadLane: string;

  // Panels
  landDetails: string;
  boundaryInfo: string;
  cornerPositions: string;
  surroundingsInfo: string;
  divisionDetails: string;
  mainSummary: string;

  // Position
  position: string;
  distanceFrom: string;
  size: string;

  // Actions
  generateMap: string;
  exportPNG: string;
  exportSVG: string;
  exportPDF: string;
  saveProject: string;
  loadProject: string;

  // Compass
  compass: string;
  directionIndicator: string;

  // Map header
  landMapTitle: string;
  topViewTitle: string;
  frontViewTitle: string;

  // Geometry status
  geometryApproximate: string;
  geometryReliable: string;
  geometryInvalid: string;
  geometryWarning: string;

  // Misc
  disclaimer: string;
  sqFt: string;
  sqM: string;
  sqYd: string;
  approximately: string;
  straightSide: string;
  slopedSide: string;

  // Side descriptions
  upperStraightSide: string;
  lowerSlopedSide: string;
  leftSideBoundary: string;
  rightSideBoundary: string;

  // Direction mapped labels
  directionNE: string;
  directionSE: string;
  directionSW: string;
  directionNW: string;

  // Descriptions
  upperRight: string;
  lowerRight: string;
  lowerLeft: string;
  upperLeft: string;

  // Front view
  inFront: string;
}

const en: Translations = {
  appTitle: 'Land Map Generator',
  landDimensions: 'Land Dimensions',
  orientation: 'Orientation',
  boundaries: 'Boundaries',
  divisions: 'Divisions',
  elements: 'Elements',
  surroundings: 'Surroundings',
  advancedGeometry: 'Advanced Geometry',

  north: 'North',
  south: 'South',
  east: 'East',
  west: 'West',

  topSide: 'Top',
  rightSide: 'Right',
  bottomSide: 'Bottom',
  leftSide: 'Left',

  cornerA: 'A',
  cornerB: 'B',
  cornerC: 'C',
  cornerD: 'D',

  totalArea: 'Total Area',
  declaredArea: 'Declared Area',
  calculatedArea: 'Calculated Area',
  approximateArea: 'Approximate Area',
  difference: 'Difference',

  length: 'Length',
  width: 'Width',
  area: 'Area',
  unit: 'Unit',

  divideInto: 'Divide into',
  parts: 'parts',
  part: 'Part',
  equalArea: 'Equal Area',
  equalWidth: 'Equal Width',
  noDivision: 'No Division',
  entireLandNoDivision: 'No division – Entire land is one',

  temple: 'Temple',
  house: 'House',
  gate: 'Gate',
  road: 'Road',
  garden: 'Garden',
  tree: 'Tree',
  well: 'Well',
  parking: 'Parking',
  shop: 'Shop',
  waterTank: 'Water Tank',
  boundaryWall: 'Boundary Wall',
  openArea: 'Open Area',
  custom: 'Custom',

  openRoad: 'Open Road',
  lane: 'Lane',
  neighbor: 'Neighbor',
  empty: 'Empty',
  other: 'Other',
  neighborLand: "Neighbor's Land",
  slopingSide: 'Sloping Side',
  openRoadLane: 'Open Road / Lane',

  landDetails: 'Land Details',
  boundaryInfo: 'Boundary Information',
  cornerPositions: 'Corner Positions',
  surroundingsInfo: 'Surroundings Information',
  divisionDetails: 'Division Details',
  mainSummary: 'Main Summary',

  position: 'Position',
  distanceFrom: 'Distance from',
  size: 'Size',

  generateMap: 'Generate Map',
  exportPNG: 'Download PNG',
  exportSVG: 'Download SVG',
  exportPDF: 'Download PDF',
  saveProject: 'Save Project',
  loadProject: 'Load Project',

  compass: 'Compass',
  directionIndicator: 'Direction Indicator',

  landMapTitle: 'Land Map (Top View)',
  topViewTitle: 'Top View',
  frontViewTitle: 'Front View (From East)',

  geometryApproximate: 'Approximate',
  geometryReliable: 'Coordinate-defined',
  geometryInvalid: 'Invalid',
  geometryWarning: 'Provided dimensions cannot form an exact quadrilateral. Map shown as an approximation.',

  disclaimer: 'This map is a visual representation based on user-provided dimensions and is not a legally certified land survey.',
  sqFt: 'sq ft',
  sqM: 'sq m',
  sqYd: 'sq yd',
  approximately: 'approx.',
  straightSide: 'Straight Side',
  slopedSide: 'Sloped Side',

  upperStraightSide: 'Upper Straight Side',
  lowerSlopedSide: 'Lower Sloped Side',
  leftSideBoundary: 'Left Side',
  rightSideBoundary: 'Right Side',

  directionNE: 'North-East',
  directionSE: 'South-East',
  directionSW: 'South-West',
  directionNW: 'North-West',

  upperRight: 'Upper Right',
  lowerRight: 'Lower Right',
  lowerLeft: 'Lower Left',
  upperLeft: 'Upper Left',

  inFront: 'In front',
};

const hi: Translations = {
  appTitle: 'जमीन का नक्शा जनरेटर',

  landDimensions: 'जमीन का माप',
  orientation: 'दिशा विन्यास',
  boundaries: 'सीमाएँ',
  divisions: 'बंटवारा',
  elements: 'तत्व',
  surroundings: 'आस-पास की जानकारी',
  advancedGeometry: 'उन्नत ज्यामिति',

  north: 'उत्तर',
  south: 'दक्षिण',
  east: 'पूर्व',
  west: 'पश्चिम',

  topSide: 'ऊपर',
  rightSide: 'दायां',
  bottomSide: 'नीचे',
  leftSide: 'बायां',

  cornerA: 'A',
  cornerB: 'B',
  cornerC: 'C',
  cornerD: 'D',

  totalArea: 'कुल क्षेत्रफल',
  declaredArea: 'घोषित क्षेत्रफल',
  calculatedArea: 'गणना क्षेत्रफल',
  approximateArea: 'अनुमानित क्षेत्रफल',
  difference: 'अंतर',

  length: 'लंबाई',
  width: 'चौड़ाई',
  area: 'क्षेत्रफल',
  unit: 'इकाई',

  divideInto: 'बांटें',
  parts: 'भाग',
  part: 'हिस्सा',
  equalArea: 'बराबर क्षेत्रफल',
  equalWidth: 'बराबर चौड़ाई',
  noDivision: 'कोई बंटवारा नहीं',
  entireLandNoDivision: 'कोई बंटवारा नहीं – पूरी जमीन एक है',

  temple: 'मंदिर',
  house: 'मकान',
  gate: 'गेट',
  road: 'सड़क',
  garden: 'बगीचा',
  tree: 'पेड़',
  well: 'कुआँ',
  parking: 'पार्किंग',
  shop: 'दुकान',
  waterTank: 'पानी की टंकी',
  boundaryWall: 'चारदीवारी',
  openArea: 'खुला क्षेत्र',
  custom: 'अन्य',

  openRoad: 'खुली सड़क',
  lane: 'गली',
  neighbor: 'पड़ोसी',
  empty: 'खाली',
  other: 'अन्य',
  neighborLand: 'पड़ोसी की भूमि',
  slopingSide: 'तिरछी साइड',
  openRoadLane: 'सामने खुला रास्ता / गली',

  landDetails: 'जमीन का विवरण',
  boundaryInfo: 'सीमा जानकारी',
  cornerPositions: 'कोनों की स्थिति',
  surroundingsInfo: 'आस-पास की जानकारी',
  divisionDetails: 'बंटवारे का विवरण',
  mainSummary: 'मुख्य बातें (सारांश)',

  position: 'स्थिति',
  distanceFrom: 'दूरी',
  size: 'आकार',

  generateMap: 'नक्शा बनाएं',
  exportPNG: 'PNG डाउनलोड',
  exportSVG: 'SVG डाउनलोड',
  exportPDF: 'PDF डाउनलोड',
  saveProject: 'प्रोजेक्ट सहेजें',
  loadProject: 'प्रोजेक्ट लोड करें',

  compass: 'दिशा सूचक',
  directionIndicator: 'दिशा सूचक (Compass)',

  landMapTitle: 'जमीन का नक्शा (ऊपर से देखने पर)',
  topViewTitle: 'ऊपर से दृश्य',
  frontViewTitle: 'सामने से देखने पर (पूर्व दिशा से)',

  geometryApproximate: 'अनुमानित',
  geometryReliable: 'निर्देशांक-आधारित',
  geometryInvalid: 'अमान्य',
  geometryWarning: 'दिए गए माप से सटीक चतुर्भुज नहीं बन सकता। नक्शा अनुमानित है।',

  disclaimer: 'यह नक्शा उपयोगकर्ता द्वारा दिए गए मापों पर आधारित दृश्य प्रतिनिधित्व है और कानूनी रूप से प्रमाणित भूमि सर्वेक्षण नहीं है।',
  sqFt: 'वर्गफुट',
  sqM: 'वर्ग मी.',
  sqYd: 'वर्ग गज',
  approximately: 'लगभग',
  straightSide: 'सीधी साइड',
  slopedSide: 'तिरछी साइड',

  upperStraightSide: 'ऊपर की सीधी साइड',
  lowerSlopedSide: 'नीचे की तिरछी साइड',
  leftSideBoundary: 'बायां साइड',
  rightSideBoundary: 'दायां साइड',

  directionNE: 'उत्तर-पूर्व',
  directionSE: 'दक्षिण-पूर्व',
  directionSW: 'दक्षिण-पश्चिम',
  directionNW: 'उत्तर-पश्चिम',

  upperRight: 'ऊपर दायां',
  lowerRight: 'नीचे दायां',
  lowerLeft: 'नीचे बायां',
  upperLeft: 'ऊपर बायां',

  inFront: 'सामने',
};

/**
 * Get translated string by key.
 */
export function t(key: keyof Translations, lang: Language): string {
  if (lang === 'hi') return hi[key];
  if (lang === 'both') return `${en[key]} / ${hi[key]}`;
  return en[key];
}

/**
 * Get bilingual text: "English (Hindi)"
 */
export function tBilingual(key: keyof Translations): string {
  return `${en[key]} (${hi[key]})`;
}

/**
 * Translate a cardinal direction.
 */
export function translateDirection(dir: CardinalDirection, lang: Language): string {
  const key = dir as keyof Translations;
  return t(key, lang);
}

/**
 * Translate a direction with both languages: "पूर्व (EAST)"
 */
export function translateDirectionBoth(dir: CardinalDirection): string {
  const hiText = hi[dir as keyof Translations];
  const enText = en[dir as keyof Translations].toUpperCase();
  return `${hiText} (${enText})`;
}

/**
 * Translate element type.
 */
export function translateElementType(type: ElementType, lang: Language): string {
  return t(type as keyof Translations, lang);
}

/**
 * Get corner direction description.
 */
export function getCornerDescription(corner: string, lang: Language): string {
  const map: Record<string, keyof Translations> = {
    A: 'directionNE',
    B: 'directionSE',
    C: 'directionSW',
    D: 'directionNW',
  };
  const posMap: Record<string, keyof Translations> = {
    A: 'upperRight',
    B: 'lowerRight',
    C: 'lowerLeft',
    D: 'upperLeft',
  };

  const dirKey = map[corner];
  const posKey = posMap[corner];
  if (!dirKey || !posKey) return corner;

  const dirText = t(dirKey, lang);
  const posText = t(posKey, lang);
  return `${dirText} (${posText})`;
}

export type { Translations };
export { en, hi };