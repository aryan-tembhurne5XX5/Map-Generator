/**
 * Polygon geometry calculations.
 * 
 * Generates quadrilateral vertices from boundary lengths.
 * Uses the Shoelace formula for area calculation.
 * All functions are pure — no side effects.
 */
import type { Point, Boundaries, ComputedPolygon, GeometryConfig, GeometryMode, BoundingBox } from '@/types/land';

/**
 * Calculate polygon area using the Shoelace (Gauss's area) formula.
 * Points should be ordered (either CW or CCW).
 * Returns absolute area.
 */
export function calculatePolygonArea(points: Point[]): number {
  const n = points.length;
  if (n < 3) return 0;

  let area = 0;
  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n;
    const pi = points[i]!;
    const pj = points[j]!;
    area += pi.x * pj.y;
    area -= pj.x * pi.y;
  }
  return Math.abs(area) / 2;
}

/**
 * Calculate the centroid of a polygon.
 */
export function calculateCentroid(points: Point[]): Point {
  const n = points.length;
  if (n === 0) return { x: 0, y: 0 };

  let cx = 0, cy = 0;
  for (const p of points) {
    cx += p.x;
    cy += p.y;
  }
  return { x: cx / n, y: cy / n };
}

/**
 * Calculate the bounding box of a set of points.
 */
export function calculateBoundingBox(points: Point[]): BoundingBox {
  if (points.length === 0) {
    return { minX: 0, minY: 0, maxX: 0, maxY: 0, width: 0, height: 0 };
  }

  let minX = Infinity, minY = Infinity;
  let maxX = -Infinity, maxY = -Infinity;

  for (const p of points) {
    if (p.x < minX) minX = p.x;
    if (p.y < minY) minY = p.y;
    if (p.x > maxX) maxX = p.x;
    if (p.y > maxY) maxY = p.y;
  }

  return { minX, minY, maxX, maxY, width: maxX - minX, height: maxY - minY };
}

/**
 * Distance between two points.
 */
export function distance(a: Point, b: Point): number {
  return Math.sqrt((b.x - a.x) ** 2 + (b.y - a.y) ** 2);
}

/**
 * Lerp between two points at parameter t ∈ [0, 1].
 */
export function lerp(a: Point, b: Point, t: number): Point {
  return {
    x: a.x + (b.x - a.x) * t,
    y: a.y + (b.y - a.y) * t,
  };
}

/**
 * Calculate the midpoint of a segment.
 */
export function midpoint(a: Point, b: Point): Point {
  return lerp(a, b, 0.5);
}

/**
 * Calculate the normal (perpendicular) direction of a segment, pointing outward.
 * Returns a unit vector.
 */
export function segmentNormal(a: Point, b: Point, outward: 'left' | 'right' = 'left'): Point {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const len = Math.sqrt(dx * dx + dy * dy);
  if (len === 0) return { x: 0, y: -1 };

  if (outward === 'left') {
    return { x: -dy / len, y: dx / len };
  }
  return { x: dy / len, y: -dx / len };
}

/**
 * Angle of a segment in radians.
 */
export function segmentAngle(a: Point, b: Point): number {
  return Math.atan2(b.y - a.y, b.x - a.x);
}

/**
 * MODE A: Generate an approximate quadrilateral from four side lengths.
 * 
 * Strategy:
 * - Place the top side (East in default orientation) along the top edge.
 * - The top side = East boundary length.
 * - Corner A is top-right, D is top-left.
 * - Use the law of cosines to find a valid configuration.
 * 
 * Layout (SVG coordinate space, Y increases downward):
 * 
 *   D -------- A      (top edge = east boundary)
 *    \          \
 *     \          \
 *      C -------- B   (bottom edge = west boundary)
 * 
 * In our orientation system:
 * - Top side of map = East boundary
 * - Right side = South boundary  
 * - Bottom side = West boundary
 * - Left side = North boundary
 * 
 * Points are in order: A (top-right), B (bottom-right), C (bottom-left), D (top-left)
 */
export function generateApproximateQuadrilateral(boundaries: Boundaries): ComputedPolygon {
  const { north, east, south, west } = boundaries;
  const warnings: string[] = [];

  // Validate inputs
  if (north <= 0 || east <= 0 || south <= 0 || west <= 0) {
    return {
      points: [{ x: 0, y: 0 }, { x: 100, y: 0 }, { x: 100, y: 100 }, { x: 0, y: 100 }],
      area: 0,
      status: 'invalid',
      warnings: ['All dimensions must be greater than 0.'],
    };
  }

  // Map boundary names to edges in our SVG layout:
  // Top edge (DA) = East boundary (straight, horizontal)
  // Right edge (AB) = South boundary  
  // Bottom edge (BC) = West boundary (sloped)
  // Left edge (CD) = North boundary
  const topLen = east;     // D to A
  const rightLen = south;  // A to B
  const bottomLen = west;  // B to C
  const leftLen = north;   // C to D

  // Place D at top-left origin, A at top-right
  const D: Point = { x: 0, y: 0 };
  const A: Point = { x: topLen, y: 0 };

  // APPROACH: Place C below D, find B via circle intersection.
  //
  // For land plots, the left side (north boundary) typically runs roughly
  // vertical. We place C at angle ~80-90° below D (mostly downward), 
  // then find B at the intersection of:
  //   - Circle centered on A with radius rightLen (south boundary)
  //   - Circle centered on C with radius bottomLen (west boundary)
  //
  // We search over the angle of D→C to find the maximum-area valid quad.
  // For highly asymmetric plots (like 42 left, 20 right), C will be much 
  // lower than B, creating the sloped bottom seen in the reference images.

  let bestPoints: [Point, Point, Point, Point] | null = null;
  let bestArea = 0;

  // Search angle of D→C from 45° to 135° (below horizontal)
  const DEG = Math.PI / 180;

  for (let thetaDeg = 45; thetaDeg <= 135; thetaDeg += 0.25) {
    const theta = thetaDeg * DEG;

    const C: Point = {
      x: D.x + leftLen * Math.cos(theta),
      y: D.y + leftLen * Math.sin(theta),
    };

    if (C.y <= 0) continue; // C must be below D

    // Find B at intersection of two circles:
    // Circle 1: center A, radius rightLen
    // Circle 2: center C, radius bottomLen
    const result = intersectCircles(A, rightLen, C, bottomLen);
    if (!result) continue;

    // Try both intersection points, pick the valid one
    const candidates: Point[] = [];
    if (result.y1 > 0) candidates.push({ x: result.x1, y: result.y1 });
    if (result.y2 > 0) candidates.push({ x: result.x2, y: result.y2 });

    for (const B of candidates) {
      const pts: [Point, Point, Point, Point] = [A, B, C, D];

      // Check convexity / non-self-intersection
      if (!isConvexOrSimple(pts)) continue;

      // Check B is in a reasonable position (between or near A and C horizontally)
      // and below the top edge
      if (B.x < C.x - bottomLen || B.x > A.x + rightLen) continue;

      const area = calculatePolygonArea(pts);

      // Among all valid configurations, pick max area
      if (area > bestArea) {
        bestArea = area;
        bestPoints = pts;
      }
    }
  }

  // Fallback: if no valid configuration found, create a simple shape
  if (!bestPoints) {
    // Simple fallback: approximate trapezoid
    const avgHeight = (leftLen + rightLen) / 2;
    const offset = (topLen - bottomLen) / 2;
    const C: Point = { x: Math.max(0, offset), y: avgHeight };
    const B: Point = { x: Math.max(0, offset) + bottomLen, y: avgHeight };
    bestPoints = [A, B, C, D];
    bestArea = calculatePolygonArea(bestPoints);
    warnings.push('Could not find exact quadrilateral. Using rectangular approximation.');
  }

  // Verify actual side lengths against targets
  const [pA, pB, pC, pD] = bestPoints;
  const sides = [
    { name: 'East (top)', actual: distance(pD, pA), target: topLen },
    { name: 'South (right)', actual: distance(pA, pB), target: rightLen },
    { name: 'West (bottom)', actual: distance(pB, pC), target: bottomLen },
    { name: 'North (left)', actual: distance(pC, pD), target: leftLen },
  ];

  for (const s of sides) {
    if (Math.abs(s.actual - s.target) > 1.0) {
      warnings.push(`${s.name} rendered as ${s.actual.toFixed(1)} instead of ${s.target}`);
    }
  }

  warnings.push('Geometry is approximate because insufficient geometric constraints were provided.');

  return {
    points: bestPoints,
    area: bestArea,
    status: 'approximate',
    warnings,
  };
}


/**
 * Check if a quadrilateral is convex or at least non-self-intersecting.
 */
function isConvexOrSimple(pts: [Point, Point, Point, Point]): boolean {
  const n = pts.length;
  let sign = 0;
  for (let i = 0; i < n; i++) {
    const a = pts[i]!;
    const b = pts[(i + 1) % n]!;
    const c = pts[(i + 2) % n]!;
    const cross = (b.x - a.x) * (c.y - b.y) - (b.y - a.y) * (c.x - b.x);
    if (cross !== 0) {
      if (sign === 0) {
        sign = cross > 0 ? 1 : -1;
      } else if ((cross > 0 ? 1 : -1) !== sign) {
        return false; // Mixed signs = not convex
      }
    }
  }
  return true;
}

/**
 * Find intersection points of two circles.
 * Circle 1: center c1, radius r1
 * Circle 2: center c2, radius r2
 * Returns two intersection points or null if no intersection.
 */
function intersectCircles(
  c1: Point, r1: number,
  c2: Point, r2: number
): { x1: number; y1: number; x2: number; y2: number } | null {
  const dx = c2.x - c1.x;
  const dy = c2.y - c1.y;
  const d = Math.sqrt(dx * dx + dy * dy);

  // Check if circles can intersect
  if (d > r1 + r2 || d < Math.abs(r1 - r2) || d === 0) {
    return null;
  }

  const a = (r1 * r1 - r2 * r2 + d * d) / (2 * d);
  const hSq = r1 * r1 - a * a;
  if (hSq < 0) return null;
  const h = Math.sqrt(hSq);

  const mx = c1.x + a * dx / d;
  const my = c1.y + a * dy / d;

  return {
    x1: mx + h * dy / d,
    y1: my - h * dx / d,
    x2: mx - h * dy / d,
    y2: my + h * dx / d,
  };
}

/**
 * Generate polygon from explicit coordinates.
 */
export function generateFromCoordinates(coords: { A: Point; B: Point; C: Point; D: Point }): ComputedPolygon {
  const points: [Point, Point, Point, Point] = [coords.A, coords.B, coords.C, coords.D];
  const area = calculatePolygonArea(points);

  return {
    points,
    area,
    status: 'reliable',
    warnings: [],
  };
}

/**
 * Derive boundary lengths from explicit coordinates.
 */
export function deriveBoundariesFromCoordinates(
  coords: { A: Point; B: Point; C: Point; D: Point },
  currentBoundaries: Boundaries
): Boundaries {
  return {
    ...currentBoundaries,
    north: distance(coords.C, coords.D),
    east: distance(coords.D, coords.A),
    south: distance(coords.A, coords.B),
    west: distance(coords.B, coords.C),
  };
}

/**
 * Main entry: compute polygon based on geometry mode and boundaries.
 */
export function computePolygon(boundaries: Boundaries, config: GeometryConfig): ComputedPolygon {
  switch (config.mode) {
    case 'coordinate':
      if (config.coordinates?.A && config.coordinates?.B && config.coordinates?.C && config.coordinates?.D) {
        return generateFromCoordinates({
          A: config.coordinates.A,
          B: config.coordinates.B,
          C: config.coordinates.C,
          D: config.coordinates.D,
        });
      }
      return generateApproximateQuadrilateral(boundaries);

    case 'angle-assisted':
      // TODO: Implement angle-assisted mode
      return generateApproximateQuadrilateral(boundaries);

    case 'bearing':
      // TODO: Implement bearing mode
      return generateApproximateQuadrilateral(boundaries);

    case 'approximate':
    default:
      return generateApproximateQuadrilateral(boundaries);
  }
}

/**
 * Validate if the given boundaries can form a valid quadrilateral.
 */
export function validateQuadrilateral(boundaries: Boundaries): { valid: boolean; warnings: string[] } {
  const { north, east, south, west } = boundaries;
  const warnings: string[] = [];

  if (north <= 0) warnings.push('North boundary must be greater than 0.');
  if (east <= 0) warnings.push('East boundary must be greater than 0.');
  if (south <= 0) warnings.push('South boundary must be greater than 0.');
  if (west <= 0) warnings.push('West boundary must be greater than 0.');

  // Triangle inequality check (necessary but not sufficient for quads)
  const sides = [north, east, south, west];
  const total = sides.reduce((a, b) => a + b, 0);
  for (const s of sides) {
    if (s >= total - s) {
      warnings.push(`One side (${s}) is too long relative to the others.`);
    }
  }

  return { valid: warnings.length === 0, warnings };
}
