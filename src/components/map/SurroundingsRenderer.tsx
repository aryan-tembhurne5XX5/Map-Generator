import React from 'react';
import { Point, LandProject, Language, CardinalDirection } from '@/types/land';
import { segmentNormal } from '@/geometry/polygon';

interface SurroundingsRendererProps {
  points: [Point, Point, Point, Point];
  surroundings: LandProject['surroundings'];
  orientation: LandProject['orientation'];
  lang: Language;
  scale: number;
}

export const SurroundingsRenderer: React.FC<SurroundingsRendererProps> = ({
  points,
  surroundings,
  orientation,
  lang,
  scale,
}) => {
  const [A, B, C, D] = points;

  // D->A (top), A->B (right), B->C (bottom), C->D (left)
  const sides = [
    { p1: D, p2: A, dir: orientation.top, offsetDir: 'top' },
    { p1: A, p2: B, dir: orientation.right, offsetDir: 'right' },
    { p1: B, p2: C, dir: orientation.bottom, offsetDir: 'bottom' },
    { p1: C, p2: D, dir: orientation.left, offsetDir: 'left' },
  ];

  return (
    <g>
      {sides.map(({ p1, p2, dir, offsetDir }) => {
        const info = surroundings[dir];
        if (!info || info.type === 'empty') return null;

        const label = lang === 'hi' ? (info.labelHi || info.label) :
          lang === 'both' ? (info.labelHi || info.label) : info.label;
        if (!label) return null;

        const isVert = offsetDir === 'left' || offsetDir === 'right';

        // ──────────────────────────────────────────────────────────────────
        // ROAD: rendered with pure SVG geometry to guarantee zero gap.
        // The inner edge of the road band is EXACTLY the property boundary.
        // ──────────────────────────────────────────────────────────────────
        if (
          info.type === 'road' ||
          info.type === 'open-road' ||
          info.type === 'lane'
        ) {
          const widthLogical = info.width || 12;
          const widthPx = widthLogical * scale;

          const dx = p2.x - p1.x;
          const dy = p2.y - p1.y;
          const len = Math.hypot(dx, dy);

          if (len === 0) return null;

          // Property centroid
          const centroid = {
            x: (A.x + B.x + C.x + D.x) / 4,
            y: (A.y + B.y + C.y + D.y) / 4,
          };

          // Boundary midpoint
          const mid = {
            x: (p1.x + p2.x) / 2,
            y: (p1.y + p2.y) / 2,
          };

          // Unit normal pointing to the left of p1 -> p2
          const leftNormal = {
            x: -dy / len,
            y: dx / len,
          };

          // Vector from the land centroid toward the boundary midpoint
          const outwardVector = {
            x: mid.x - centroid.x,
            y: mid.y - centroid.y,
          };

          // Choose the normal that points away from the land centroid.
          const dot =
            leftNormal.x * outwardVector.x +
            leftNormal.y * outwardVector.y;

          const outwardNormal =
            dot >= 0
              ? leftNormal
              : {
                x: -leftNormal.x,
                y: -leftNormal.y,
              };

          // Inner edge: exact property boundary.
          const innerStart = { x: p1.x, y: p1.y };
          const innerEnd = { x: p2.x, y: p2.y };

          // Outer edge: offset outward from the boundary.
          const outerStart = {
            x: p1.x + outwardNormal.x * widthPx,
            y: p1.y + outwardNormal.y * widthPx,
          };

          const outerEnd = {
            x: p2.x + outwardNormal.x * widthPx,
            y: p2.y + outwardNormal.y * widthPx,
          };

          // Dashed centerline: halfway between the two road edges.
          const centerStart = {
            x: (innerStart.x + outerStart.x) / 2,
            y: (innerStart.y + outerStart.y) / 2,
          };

          const centerEnd = {
            x: (innerEnd.x + outerEnd.x) / 2,
            y: (innerEnd.y + outerEnd.y) / 2,
          };

          // Labels sit beyond the outside edge of the road.
          const labelGap = 12;

          const nameX =
            (outerStart.x + outerEnd.x) / 2 +
            outwardNormal.x * labelGap;

          const nameY =
            (outerStart.y + outerEnd.y) / 2 +
            outwardNormal.y * labelGap;

          const widthX =
            (outerStart.x + outerEnd.x) / 2 +
            outwardNormal.x * (labelGap + 12);

          const widthY =
            (outerStart.y + outerEnd.y) / 2 +
            outwardNormal.y * (labelGap + 12);

          // Keep text upright and readable.
          const angleDeg = Math.atan2(dy, dx) * (180 / Math.PI);

          const labelAngle =
            angleDeg > 90 || angleDeg < -90
              ? angleDeg + 180
              : angleDeg;

          return (
            <g key={dir}>
              {/* Road surface, entirely outside the property */}
              <polygon
                points={[
                  `${innerStart.x},${innerStart.y}`,
                  `${innerEnd.x},${innerEnd.y}`,
                  `${outerEnd.x},${outerEnd.y}`,
                  `${outerStart.x},${outerStart.y}`,
                ].join(' ')}
                fill="#ffffff"
                stroke="none"
              />

              {/* Outer road edge */}
              <line
                x1={outerStart.x}
                y1={outerStart.y}
                x2={outerEnd.x}
                y2={outerEnd.y}
                stroke="#1e293b"
                strokeWidth="1.2"
              />

              {/* Dashed road centerline */}
              <line
                x1={centerStart.x}
                y1={centerStart.y}
                x2={centerEnd.x}
                y2={centerEnd.y}
                stroke="#1e293b"
                strokeWidth="1"
                strokeDasharray="8 6"
              />

              {/* Road name */}
              <text
                x={nameX}
                y={nameY}
                textAnchor="middle"
                fontSize="10"
                fontWeight="600"
                fill="#334155"
                transform={`rotate(${labelAngle}, ${nameX}, ${nameY})`}
              >
                {label}
              </text>

              {/* Road width */}
              <text
                x={widthX}
                y={widthY}
                textAnchor="middle"
                fontSize="8"
                fill="#475569"
                transform={`rotate(${labelAngle}, ${widthX}, ${widthY})`}
              >
                {widthLogical} ft
              </text>

              {/* Optional survey number */}
              {info.surveyNumber && (
                <text
                  x={
                    (outerStart.x + outerEnd.x) / 2 +
                    outwardNormal.x * (labelGap + 28)
                  }
                  y={
                    (outerStart.y + outerEnd.y) / 2 +
                    outwardNormal.y * (labelGap + 28)
                  }
                  textAnchor="middle"
                  fontSize="9"
                  fill="#64748b"
                >
                  {info.surveyNumber}
                </text>
              )}
            </g>
          );
        }
        // ── Non-road surroundings (neighbor, park, water, etc.) ────────────
        const mid = { x: (p1.x + p2.x) / 2, y: (p1.y + p2.y) / 2 };
        let tx = mid.x, ty = mid.y;
        if (offsetDir === 'top') ty -= 80;
        else if (offsetDir === 'bottom') ty += 85;
        else if (offsetDir === 'left') tx -= 90;
        else if (offsetDir === 'right') tx += 90;

        return (
          <text
            key={dir}
            x={tx} y={ty}
            textAnchor="middle"
            fontSize="10" fontWeight="500" fill="#546e7a"
            transform={isVert ? `rotate(${offsetDir === 'left' ? -90 : 90}, ${tx}, ${ty})` : undefined}
          >
            {label}
          </text>
        );
      })}
    </g>
  );
};
