/**
 * Division calculations for splitting land polygons into parts.
 * 
 * Key algorithm: Binary search to find a vertical division line
 * that produces equal (or target) areas in each part.
 */
import type { Point, Division } from '@/types/land';
import { calculatePolygonArea } from './polygon';

/**
 * Clip a polygon by a vertical line at x = cutX.
 * Returns the left and right sub-polygons.
 * 
 * Uses the Sutherland-Hodgman-like approach for a vertical line.
 */
export function clipPolygonByVerticalLine(
  polygon: Point[],
  cutX: number
): { left: Point[]; right: Point[] } {
  const left: Point[] = [];
  const right: Point[] = [];
  const n = polygon.length;

  for (let i = 0; i < n; i++) {
    const curr = polygon[i]!;
    const next = polygon[(i + 1) % n]!;

    const currLeft = curr.x <= cutX;
    const nextLeft = next.x <= cutX;

    if (currLeft) {
      left.push(curr);
    } else {
      right.push(curr);
    }

    // If edge crosses the cut line, add intersection point to both
    if (currLeft !== nextLeft) {
      const t = (cutX - curr.x) / (next.x - curr.x);
      const intersection: Point = {
        x: cutX,
        y: curr.y + t * (next.y - curr.y),
      };
      left.push(intersection);
      right.push(intersection);
    }
  }

  return { left, right };
}

/**
 * Clip a polygon by a horizontal line at y = cutY.
 * Returns the top (y <= cutY) and bottom (y > cutY) sub-polygons.
 */
export function clipPolygonByHorizontalLine(
  polygon: Point[],
  cutY: number
): { top: Point[]; bottom: Point[] } {
  const top: Point[] = [];
  const bottom: Point[] = [];
  const n = polygon.length;

  for (let i = 0; i < n; i++) {
    const curr = polygon[i]!;
    const next = polygon[(i + 1) % n]!;

    const currTop = curr.y <= cutY;
    const nextTop = next.y <= cutY;

    if (currTop) {
      top.push(curr);
    } else {
      bottom.push(curr);
    }

    if (currTop !== nextTop) {
      const t = (cutY - curr.y) / (next.y - curr.y);
      const intersection: Point = {
        x: curr.x + t * (next.x - curr.x),
        y: cutY,
      };
      top.push(intersection);
      bottom.push(intersection);
    }
  }

  return { top, bottom };
}

/**
 * Calculate equal-area divisions using binary search.
 * 
 * For a vertical division into N equal parts:
 * 1. Find the bounding box of the polygon.
 * 2. For each division line, binary search for the x position
 *    that gives the target area.
 * 3. Tolerance: ±0.5 sq units.
 * 
 * @param polygon - The polygon points
 * @param count - Number of divisions
 * @returns Array of sub-polygon point arrays
 */
export function calculateEqualAreaDivisions(
  polygon: Point[],
  count: number
): Point[][] {
  if (count <= 1) return [polygon];

  const totalArea = calculatePolygonArea(polygon);
  const targetArea = totalArea / count;

  // Find bounding box
  let minX = Infinity, maxX = -Infinity;
  for (const p of polygon) {
    if (p.x < minX) minX = p.x;
    if (p.x > maxX) maxX = p.x;
  }

  const results: Point[][] = [];
  let remainingPolygon = [...polygon];

  for (let i = 0; i < count - 1; i++) {
    // Binary search for the cut line position
    let lo = minX;
    let hi = maxX;
    const tolerance = 0.5; // sq unit tolerance
    let bestCutX = (lo + hi) / 2;

    // Update minX for remaining polygon
    let rMinX = Infinity, rMaxX = -Infinity;
    for (const p of remainingPolygon) {
      if (p.x < rMinX) rMinX = p.x;
      if (p.x > rMaxX) rMaxX = p.x;
    }
    lo = rMinX;
    hi = rMaxX;

    // Binary search
    for (let iter = 0; iter < 100; iter++) {
      const mid = (lo + hi) / 2;
      const { left } = clipPolygonByVerticalLine(remainingPolygon, mid);
      const leftArea = calculatePolygonArea(left);

      if (Math.abs(leftArea - targetArea) < tolerance) {
        bestCutX = mid;
        break;
      }

      if (leftArea < targetArea) {
        lo = mid;
      } else {
        hi = mid;
      }
      bestCutX = mid;
    }

    const { left, right } = clipPolygonByVerticalLine(remainingPolygon, bestCutX);
    results.push(left);
    remainingPolygon = right;
  }

  // Last remaining part
  results.push(remainingPolygon);

  return results;
}

/**
 * Calculate equal-width divisions (simply divide bounding box width equally).
 */
export function calculateEqualWidthDivisions(
  polygon: Point[],
  count: number
): Point[][] {
  if (count <= 1) return [polygon];

  let minX = Infinity, maxX = -Infinity;
  for (const p of polygon) {
    if (p.x < minX) minX = p.x;
    if (p.x > maxX) maxX = p.x;
  }

  const width = maxX - minX;
  const stepX = width / count;
  const results: Point[][] = [];
  let remaining = [...polygon];

  for (let i = 0; i < count - 1; i++) {
    const cutX = minX + stepX * (i + 1);
    const { left, right } = clipPolygonByVerticalLine(remaining, cutX);
    results.push(left);
    remaining = right;
  }
  results.push(remaining);

  return results;
}

/**
 * Create Division objects from computed sub-polygons.
 */
export function createDivisionsFromPolygons(
  subPolygons: Point[][],
  colors: string[]
): Division[] {
  const defaultColors = [
    'rgba(76, 175, 80, 0.25)',   // green
    'rgba(255, 235, 59, 0.25)',  // yellow
    'rgba(33, 150, 243, 0.20)',  // blue
    'rgba(255, 152, 0, 0.20)',   // orange
    'rgba(156, 39, 176, 0.15)',  // purple
    'rgba(0, 188, 212, 0.20)',   // cyan
  ];

  return subPolygons.map((poly, i) => {
    const area = calculatePolygonArea(poly);
    return {
      id: `div-${i + 1}`,
      name: `Part ${i + 1}`,
      nameHi: `हिस्सा ${i + 1}`,
      area,
      percentage: 0, // calculated later
      color: colors[i] || defaultColors[i % defaultColors.length] || defaultColors[0]!,
      polygon: poly,
    };
  });
}
