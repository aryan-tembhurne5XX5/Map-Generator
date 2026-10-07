/**
 * Dimension line calculations for SVG rendering.
 * Produces offset dimension lines with arrowheads and text positions.
 */
import type { Point } from '@/types/land';
import { segmentAngle, segmentNormal, midpoint, distance } from './polygon';

export interface DimensionLineData {
  /** Start point of the dimension line (offset from polygon edge) */
  start: Point;
  /** End point of the dimension line */
  end: Point;
  /** Position for the measurement text */
  textPosition: Point;
  /** Rotation angle for the text in degrees */
  textRotation: number;
  /** Position for the direction label (further offset) */
  directionLabelPosition: Point;
  /** The actual measurement value */
  length: number;
  /** Arrow angle for start arrowhead */
  arrowAngle: number;
}

/**
 * Calculate an offset dimension line for a polygon edge.
 * 
 * @param p1 - Start point of the polygon edge
 * @param p2 - End point of the polygon edge
 * @param offset - Distance to offset from the edge (in SVG units)
 * @param outward - Direction to offset ('left' = outward for CW polygon)
 * @returns DimensionLineData
 */
export function calculateDimensionLine(
  p1: Point,
  p2: Point,
  offset: number,
  outward: 'left' | 'right' = 'right'
): DimensionLineData {
  const normal = segmentNormal(p1, p2, outward);
  const angle = segmentAngle(p1, p2);
  const angleDeg = (angle * 180) / Math.PI;
  const len = distance(p1, p2);
  const mid = midpoint(p1, p2);

  const start: Point = {
    x: p1.x + normal.x * offset,
    y: p1.y + normal.y * offset,
  };

  const end: Point = {
    x: p2.x + normal.x * offset,
    y: p2.y + normal.y * offset,
  };

  const textPosition: Point = {
    x: mid.x + normal.x * offset,
    y: mid.y + normal.y * offset,
  };

  const directionLabelPosition: Point = {
    x: mid.x + normal.x * (offset + 20),
    y: mid.y + normal.y * (offset + 20),
  };

  // Normalize text rotation so text is always readable (not upside down)
  let textRotation = angleDeg;
  if (textRotation > 90) textRotation -= 180;
  if (textRotation < -90) textRotation += 180;

  return {
    start,
    end,
    textPosition,
    textRotation,
    directionLabelPosition,
    length: len,
    arrowAngle: angleDeg,
  };
}

/**
 * Calculate element position inside the polygon based on preset position.
 */
export function calculateElementPosition(
  polygon: [Point, Point, Point, Point],
  position: string,
  offsetX: number,
  offsetY: number,
  scale: number
): Point {
  const [A, B, C, D] = polygon;

  // Scale offsets
  const ox = offsetX * scale;
  const oy = offsetY * scale;

  switch (position) {
    case 'north-east':
      return { x: A.x - ox, y: A.y + oy };
    case 'north-west':
      return { x: D.x + ox, y: D.y + oy };
    case 'south-east':
      return { x: B.x - ox, y: B.y - oy };
    case 'south-west':
      return { x: C.x + ox, y: C.y - oy };
    case 'center': {
      const cx = (A.x + B.x + C.x + D.x) / 4;
      const cy = (A.y + B.y + C.y + D.y) / 4;
      return { x: cx + ox, y: cy + oy };
    }
    case 'north': {
      const mx = (A.x + D.x) / 2;
      const my = (A.y + D.y) / 2;
      return { x: mx, y: my + oy };
    }
    case 'south': {
      const mx = (B.x + C.x) / 2;
      const my = (B.y + C.y) / 2;
      return { x: mx, y: my - oy };
    }
    case 'east': {
      const mx = (A.x + B.x) / 2;
      const my = (A.y + B.y) / 2;
      return { x: mx - ox, y: my };
    }
    case 'west': {
      const mx = (C.x + D.x) / 2;
      const my = (C.y + D.y) / 2;
      return { x: mx + ox, y: my };
    }
    default:
      return { x: A.x - ox, y: A.y + oy };
  }
}

/**
 * Calculate gate position on a polygon edge.
 */
export function calculateGatePosition(
  polygon: [Point, Point, Point, Point],
  side: string,
  distanceFromStart: number,
  gateWidth: number,
  scale: number
): { start: Point; end: Point; mid: Point } {
  const [A, B, C, D] = polygon;

  let edgeStart: Point;
  let edgeEnd: Point;

  // Map sides to polygon edges
  switch (side) {
    case 'east': // top edge: D to A
      edgeStart = D;
      edgeEnd = A;
      break;
    case 'south': // right edge: A to B
      edgeStart = A;
      edgeEnd = B;
      break;
    case 'west': // bottom edge: B to C (or C to B)
      edgeStart = B;
      edgeEnd = C;
      break;
    case 'north': // left edge: C to D (or D to C)
      edgeStart = C;
      edgeEnd = D;
      break;
    default:
      edgeStart = D;
      edgeEnd = A;
  }

  const edgeLen = distance(edgeStart, edgeEnd);
  const t1 = (distanceFromStart * scale) / edgeLen;
  const t2 = ((distanceFromStart + gateWidth) * scale) / edgeLen;

  const start: Point = {
    x: edgeStart.x + (edgeEnd.x - edgeStart.x) * Math.min(t1, 1),
    y: edgeStart.y + (edgeEnd.y - edgeStart.y) * Math.min(t1, 1),
  };

  const end: Point = {
    x: edgeStart.x + (edgeEnd.x - edgeStart.x) * Math.min(t2, 1),
    y: edgeStart.y + (edgeEnd.y - edgeStart.y) * Math.min(t2, 1),
  };

  return {
    start,
    end,
    mid: midpoint(start, end),
  };
}
