/**
 * LandMap.tsx — The core SVG map renderer.
 * 
 * Takes computed polygon data and renders the complete land map
 * with dimensions, labels, compass, divisions, elements, and info panels.
 */
import React, { useMemo } from 'react';
import type {
  LandProject,
  ComputedPolygon,
  Point,
  Division,
  CardinalDirection,
  Language,
  PositionPreset,
} from '@/types/land';
import { computePolygon, calculateBoundingBox, calculateCentroid, calculatePolygonArea } from '@/geometry/polygon';
import { calculateDimensionLine, calculateElementPosition } from '@/geometry/dimensions';
import { calculateEqualAreaDivisions, calculateEqualWidthDivisions, createDivisionsFromPolygons } from '@/geometry/divisions';
import { convertUnits, formatNumber, unitLabel, areaUnitLabel, unitLabelHi, areaUnitLabelHi } from '@/geometry/units';
import { t, translateDirectionBoth } from '@/i18n/translations';
import { deriveBoundariesFromCoordinates } from '@/geometry/polygon';

interface DragState {
  type: 'corner' | 'element';
  id: string; // 'A', 'B', 'C', 'D' or element id
  startLogical: Point;
  startSvg: Point;
}

interface LandMapProps {
  project: LandProject;
  width?: number;
  height?: number;
  onUpdate?: (updates: Partial<LandProject>) => void;
}

// SVG layout constants
const PADDING = 120;       // padding around the polygon for labels
const INFO_PANEL_WIDTH = 280;
const MIN_SVG_WIDTH = 900;
const MIN_SVG_HEIGHT = 650;

const LandMap: React.FC<LandMapProps> = ({ project, width, height, onUpdate }) => {
  const svgRef = React.useRef<SVGSVGElement>(null);
  const [dragState, setDragState] = React.useState<DragState | null>(null);

  const computed = useMemo(() => {
    // 1. Compute the polygon
    const polygon = computePolygon(project.boundaries, project.geometry);
    
    // 2. Calculate scale
    const GAP = 120; // 120px gap for right-side dimensions/labels
    const bbox = calculateBoundingBox(polygon.points);
    const availableWidth = (width || MIN_SVG_WIDTH) - PADDING * 2 - (project.display.showInfoPanel ? INFO_PANEL_WIDTH + GAP : 0);
    const availableHeight = (height || MIN_SVG_HEIGHT) - PADDING * 2 - 60;
    
    const scaleX = availableWidth / Math.max(bbox.width, 1);
    const scaleY = availableHeight / Math.max(bbox.height, 1);
    const scale = Math.min(scaleX, scaleY);

    // Center polygon within available space
    const scaledWidth = bbox.width * scale;
    const scaledHeight = bbox.height * scale;
    const offsetX = PADDING + (availableWidth - scaledWidth) / 2;
    const offsetY = PADDING + 40 + (availableHeight - scaledHeight) / 2;

    // 3. Scale polygon points
    const scaledPoints = polygon.points.map(p => ({
      x: offsetX + (p.x - bbox.minX) * scale,
      y: offsetY + (p.y - bbox.minY) * scale,
    })) as [Point, Point, Point, Point];

    // 4. Calculate divisions
    let divisionData: Division[] = [];
    if (project.divisions.enabled && project.divisions.count > 1) {
      let subPolygons: Point[][];
      
      if (project.divisions.method === 'equal-area') {
        subPolygons = calculateEqualAreaDivisions(scaledPoints, project.divisions.count, project.divisions.orientation);
      } else {
        subPolygons = calculateEqualWidthDivisions(scaledPoints, project.divisions.count, project.divisions.orientation);
      }
      
      const colors = project.divisions.divisions.map(d => d.color);
      divisionData = createDivisionsFromPolygons(subPolygons, colors);
      
      // Calculate areas in original units (divide by scale^2)
      divisionData = divisionData.map(d => ({
        ...d,
        area: (d.area || 0) / (scale * scale),
      }));
    }

    // 5. Area comparison
    const calculatedArea = polygon.area;
    let areaComparison;
    if (project.declaredArea && project.declaredArea > 0) {
      const diff = Math.abs(calculatedArea - project.declaredArea);
      const pct = (diff / project.declaredArea) * 100;
      areaComparison = {
        declared: project.declaredArea,
        calculated: calculatedArea,
        differencePercent: pct,
      };
    }

    return {
      polygon,
      scaledPoints,
      scale,
      divisionData,
      areaComparison,
      bbox,
      offsetX,
      offsetY,
    };
  }, [project, width, height]);

  const { polygon, scaledPoints, scale, divisionData, areaComparison, bbox, offsetX, offsetY } = computed;
  const [A, B, C, D] = scaledPoints;
  const lang = project.language;
  const unit = project.unit;

  // Calculate total SVG dimensions
  const scaledBbox = calculateBoundingBox(scaledPoints);
  const svgWidth = Math.max(MIN_SVG_WIDTH, scaledBbox.maxX + PADDING + INFO_PANEL_WIDTH + 40);
  const svgHeight = Math.max(MIN_SVG_HEIGHT, scaledBbox.maxY + PADDING + 40);

  // Direction labels mapped to sides based on orientation
  const dirMap = project.orientation;

  // Helper to get bilingual direction text
  const dirLabel = (dir: CardinalDirection) => translateDirectionBoth(dir);

  // Area text
  const displayArea = project.declaredArea || polygon.area;
  const areaText = formatNumber(Math.round(displayArea));
  const areaUnit = lang === 'hi' ? areaUnitLabelHi(unit) : (lang === 'both' ? `${areaUnitLabel(unit)}` : areaUnitLabel(unit));

  // Meter conversion
  const toMeters = (val: number) => convertUnits(val, unit, 'm').toFixed(2);
  const formatLength = (val: number) => Number(val.toFixed(2));

  // Polygon path
  const polyPath = scaledPoints.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ') + ' Z';
  
  // Centroid of polygon
  const centroid = calculateCentroid(scaledPoints);

  const handlePointerDown = (e: React.PointerEvent<SVGElement>, cornerId: 'A' | 'B' | 'C' | 'D') => {
    if (!onUpdate) return;
    e.stopPropagation();
    
    // Initialize coordinate mode if not already
    let currentCoords = project.geometry.coordinates;
    if (project.geometry.mode !== 'coordinate' || !currentCoords?.A) {
      currentCoords = {
        A: polygon.points[0],
        B: polygon.points[1],
        C: polygon.points[2],
        D: polygon.points[3],
      };
      onUpdate({
        geometry: {
          ...project.geometry,
          mode: 'coordinate',
          coordinates: currentCoords,
        },
      });
    }

    const svg = svgRef.current;
    if (!svg) return;
    
    const pt = svg.createSVGPoint();
    pt.x = e.clientX;
    pt.y = e.clientY;
    const svgP = pt.matrixTransform(svg.getScreenCTM()!.inverse());

    setDragState({
      type: 'corner',
      id: cornerId,
      startLogical: currentCoords[cornerId]!,
      startSvg: { x: svgP.x, y: svgP.y },
    });
    
    // Capture pointer
    (e.target as Element).setPointerCapture(e.pointerId);
  };

  const handleElementPointerDown = (e: React.PointerEvent<SVGElement>, elementId: string, currentX: number, currentY: number) => {
    if (!onUpdate) return;
    e.stopPropagation();
    
    const svg = svgRef.current;
    if (!svg) return;
    
    const pt = svg.createSVGPoint();
    pt.x = e.clientX;
    pt.y = e.clientY;
    const svgP = pt.matrixTransform(svg.getScreenCTM()!.inverse());

    setDragState({
      type: 'element',
      id: elementId,
      // Store the logical start position of the element
      startLogical: {
        x: (currentX - offsetX) / scale + bbox.minX,
        y: (currentY - offsetY) / scale + bbox.minY,
      },
      startSvg: { x: svgP.x, y: svgP.y },
    });
    
    (e.target as Element).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent<SVGSVGElement>) => {
    if (!dragState || !svgRef.current || !onUpdate) return;
    
    const svg = svgRef.current;
    const pt = svg.createSVGPoint();
    pt.x = e.clientX;
    pt.y = e.clientY;
    const svgP = pt.matrixTransform(svg.getScreenCTM()!.inverse());

    const dxSvg = svgP.x - dragState.startSvg.x;
    const dySvg = svgP.y - dragState.startSvg.y;

    const dxLogical = dxSvg / scale;
    const dyLogical = dySvg / scale;
    
    let newX = dragState.startLogical.x + dxLogical;
    let newY = dragState.startLogical.y + dyLogical;
    
    // Apply snapping if needed
    if (project.snapIncrement > 0 && !e.altKey) {
      newX = Math.round(newX / project.snapIncrement) * project.snapIncrement;
      newY = Math.round(newY / project.snapIncrement) * project.snapIncrement;
    }
    
    // Constrained mode (shift key)
    if (project.editMode === 'constrained' || e.shiftKey) {
      if (Math.abs(dxSvg) > Math.abs(dySvg)) {
        newY = dragState.startLogical.y; // constrain horizontal
      } else {
        newX = dragState.startLogical.x; // constrain vertical
      }
    }
    
    
    if (dragState.type === 'corner') {
      const currentCoords = project.geometry.coordinates || {
          A: polygon.points[0],
          B: polygon.points[1],
          C: polygon.points[2],
          D: polygon.points[3],
      };
      
      const newCoords = {
        ...currentCoords,
        [dragState.id]: { x: newX, y: newY },
      } as { A: Point; B: Point; C: Point; D: Point };

      // Update boundaries and area derived from new coordinates
      const newBoundaries = deriveBoundariesFromCoordinates(newCoords, project.boundaries);

      onUpdate({
        geometry: {
          ...project.geometry,
          mode: 'coordinate',
          coordinates: newCoords,
        },
        boundaries: newBoundaries,
      });
    } else if (dragState.type === 'element') {
      // Find element and update its customX/customY
      const newElements = project.elements.map(el => {
        if (el.id === dragState.id) {
          return { ...el, position: 'custom' as PositionPreset, customX: newX, customY: newY };
        }
        return el;
      });
      onUpdate({ elements: newElements });
    }
  };

  const handlePointerUp = (e: React.PointerEvent<SVGElement>) => {
    if (dragState) {
      setDragState(null);
      (e.target as Element).releasePointerCapture(e.pointerId);
    }
  };

  return (
    <svg
      ref={svgRef}
      xmlns="http://www.w3.org/2000/svg"
      viewBox={`0 0 ${svgWidth} ${svgHeight}`}
      width={svgWidth}
      height={svgHeight}
      style={{ fontFamily: "'Inter', 'Noto Sans Devanagari', sans-serif", touchAction: 'none' }}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerUp}
    >
      <defs>
        {/* Arrowhead markers */}
        <marker id="arrowStart" markerWidth="10" markerHeight="7" refX="0" refY="3.5" orient="auto" markerUnits="strokeWidth">
          <polygon points="10 0, 0 3.5, 10 7" fill="#334155" />
        </marker>
        <marker id="arrowEnd" markerWidth="10" markerHeight="7" refX="10" refY="3.5" orient="auto" markerUnits="strokeWidth">
          <polygon points="0 0, 10 3.5, 0 7" fill="#334155" />
        </marker>
        {/* Survey tick marker */}
        <marker id="tick" markerWidth="8" markerHeight="8" refX="4" refY="4" orient="auto" markerUnits="strokeWidth">
          <line x1="4" y1="0" x2="4" y2="8" stroke="#334155" strokeWidth="1.5" />
        </marker>
        {/* Gate pattern */}
        <pattern id="gatePattern" width="6" height="6" patternUnits="userSpaceOnUse">
          <line x1="0" y1="6" x2="6" y2="0" stroke="#795548" strokeWidth="1" />
        </pattern>
      </defs>

      {/* White background */}
      <rect x="0" y="0" width={svgWidth} height={svgHeight} fill="white" />

      {/* ══════ TITLE ══════ */}
      <TitleSection
        x={scaledBbox.minX + (scaledBbox.maxX - scaledBbox.minX) / 2}
        y={28}
        area={areaText}
        areaUnit={areaUnit}
        lang={lang}
        hasDivisions={project.divisions.enabled && project.divisions.count > 1}
      />

      {/* ══════ LAND POLYGON ══════ */}
      {/* Division fills or single fill */}
      {divisionData.length > 1 ? (
        divisionData.map((div, i) => (
          div.polygon && (
            <polygon
              key={div.id}
              points={div.polygon.map(p => `${p.x},${p.y}`).join(' ')}
              fill={div.color}
              stroke="#334155"
              strokeWidth="1"
            />
          )
        ))
      ) : (
        <path d={polyPath} fill="#f8fafc" stroke="#334155" strokeWidth="1" />
      )}

      {/* Polygon outline (always on top) */}
      <path d={polyPath} fill="none" stroke="#0f172a" strokeWidth="2" />

      {/* ══════ DIVISION LINES & LABELS ══════ */}
      {divisionData.length > 1 && divisionData.map((div, i) => {
        if (!div.polygon) return null;
        const divCentroid = calculateCentroid(div.polygon);
        const divArea = div.area || 0;
        const partName = lang === 'hi' ? (div.nameHi || div.name) : 
                         lang === 'both' ? `${div.nameHi || div.name}` : div.name;
        const colorLabel = i === 0 ? (lang === 'hi' ? '(हरा भाग)' : lang === 'both' ? '(हरा भाग)' : '(Green)') :
                           (lang === 'hi' ? '(पीला भाग)' : lang === 'both' ? '(पीला भाग)' : '(Yellow)');
        
        return (
          <g key={div.id}>
            <text x={divCentroid.x} y={divCentroid.y - 30} textAnchor="middle"
              fontSize="14" fontWeight="700" fill="#1a237e">
              {partName}
            </text>
            <text x={divCentroid.x} y={divCentroid.y - 12} textAnchor="middle"
              fontSize="11" fontWeight="500" fill="#37474f">
              {colorLabel}
            </text>
            <text x={divCentroid.x} y={divCentroid.y + 10} textAnchor="middle"
              fontSize="11" fontWeight="600" fill="#37474f">
              {lang === 'hi' ? 'क्षेत्रफल' : lang === 'both' ? 'क्षेत्रफल' : 'Area'}
            </text>
            <text x={divCentroid.x} y={divCentroid.y + 32} textAnchor="middle"
              fontSize="20" fontWeight="800" fill="#1a237e">
              {formatNumber(Math.round(divArea))}
            </text>
            <text x={divCentroid.x} y={divCentroid.y + 50} textAnchor="middle"
              fontSize="11" fontWeight="600" fill="#37474f">
              {areaUnit} ({lang === 'hi' || lang === 'both' ? 'लगभग' : 'approx.'})
            </text>
          </g>
        );
      })}

      {/* Area label in center (only when no divisions) */}
      {divisionData.length <= 1 && (
        <g>
          <text x={centroid.x} y={centroid.y - 20} textAnchor="middle"
            fontSize="13" fontWeight="700" fill="#1a237e">
            {lang === 'hi' ? 'पूरी जमीन (कोई बंटवारा नहीं)' :
             lang === 'both' ? 'पूरी जमीन (कोई बंटवारा नहीं)' :
             'Entire Land (No Division)'}
          </text>
          <text x={centroid.x} y={centroid.y + 10} textAnchor="middle"
            fontSize="24" fontWeight="800" fill="#1a237e">
            {areaText}
          </text>
          <text x={centroid.x} y={centroid.y + 30} textAnchor="middle"
            fontSize="13" fontWeight="700" fill="#37474f">
            {areaUnit}
          </text>
        </g>
      )}

      {/* ══════ DIMENSION LINES ══════ */}
      {project.display.showDimensions && (
        <>
          {/* Top edge (D→A): East boundary */}
          <DimensionLineComponent
            p1={D} p2={A}
            value={formatLength(project.boundaries.east)}
            valueM={toMeters(project.boundaries.east)}
            unit={unitLabel(unit)}
            direction={dirLabel(dirMap.top)}
            offset={30}
            side="top"
            lang={lang}
            sideDesc={lang === 'hi' || lang === 'both' ? 'ऊपर की सीधी साइड' : 'Upper Straight Side'}
          />
          
          {/* Bottom edge (C→B or B→C): West boundary */}
          <DimensionLineComponent
            p1={C} p2={B}
            value={formatLength(project.boundaries.west)}
            valueM={toMeters(project.boundaries.west)}
            unit={unitLabel(unit)}
            direction={dirLabel(dirMap.bottom)}
            offset={-30}
            side="bottom"
            lang={lang}
            sideDesc={lang === 'hi' || lang === 'both' ? 'नीचे की तिरछी साइड' : 'Lower Sloped Side'}
          />

          {/* Right edge (A→B): South boundary */}
          <DimensionLineComponent
            p1={A} p2={B}
            value={formatLength(project.boundaries.south)}
            valueM={toMeters(project.boundaries.south)}
            unit={unitLabel(unit)}
            direction={dirLabel(dirMap.right)}
            offset={30}
            side="right"
            lang={lang}
            sideDesc={lang === 'hi' || lang === 'both' ? 'दायां साइड' : 'Right Side'}
          />

          {/* Left edge (D→C): North boundary */}
          <DimensionLineComponent
            p1={D} p2={C}
            value={formatLength(project.boundaries.north)}
            valueM={toMeters(project.boundaries.north)}
            unit={unitLabel(unit)}
            direction={dirLabel(dirMap.left)}
            offset={-30}
            side="left"
            lang={lang}
            sideDesc={lang === 'hi' || lang === 'both' ? 'बायां साइड' : 'Left Side'}
          />
        </>
      )}

      {/* ══════ CORNER LABELS & HANDLES ══════ */}
      {project.display.showCornerLabels && (
        <>
          <CornerLabel point={A} label={project.cornerLabels.A} position="top-right"
            id="A" isInteractive={project.editMode !== 'presentation'} onPointerDown={handlePointerDown} isDragging={dragState?.id === 'A'} />
          <CornerLabel point={B} label={project.cornerLabels.B} position="bottom-right"
            id="B" isInteractive={project.editMode !== 'presentation'} onPointerDown={handlePointerDown} isDragging={dragState?.id === 'B'} />
          <CornerLabel point={C} label={project.cornerLabels.C} position="bottom-left"
            id="C" isInteractive={project.editMode !== 'presentation'} onPointerDown={handlePointerDown} isDragging={dragState?.id === 'C'} />
          <CornerLabel point={D} label={project.cornerLabels.D} position="top-left"
            id="D" isInteractive={project.editMode !== 'presentation'} onPointerDown={handlePointerDown} isDragging={dragState?.id === 'D'} />
        </>
      )}

      {/* ══════ DIRECTION LABELS on polygon edges ══════ */}
      {project.display.showDirectionLabels && (
        <>
          <DirectionLabel p1={D} p2={A} direction={dirMap.top} offset={-65} side="top" />
          <DirectionLabel p1={C} p2={B} direction={dirMap.bottom} offset={70} side="bottom" />
          <DirectionLabel p1={A} p2={B} direction={dirMap.right} offset={70} side="right" />
          <DirectionLabel p1={D} p2={C} direction={dirMap.left} offset={-70} side="left" />
        </>
      )}

      {/* ══════ SURROUNDINGS LABELS ══════ */}
      {project.display.showSurroundings && (
        <SurroundingsLabels
          points={scaledPoints}
          surroundings={project.surroundings}
          orientation={project.orientation}
          lang={lang}
        />
      )}

      {/* ══════ ELEMENTS ══════ */}
      {project.elements.map(elem => {
        let pos: Point;
        if (elem.position === 'custom' && elem.customX !== undefined && elem.customY !== undefined) {
          // Map from logical to scaled space
          pos = {
            x: offsetX + (elem.customX - bbox.minX) * scale,
            y: offsetY + (elem.customY - bbox.minY) * scale,
          };
        } else {
          pos = calculateElementPosition(
            scaledPoints,
            elem.position,
            elem.offsetX,
            elem.offsetY,
            scale
          );
        }
        
        return (
          <ElementIcon
            key={elem.id}
            x={pos.x}
            y={pos.y}
            element={elem}
            lang={lang}
            scale={scale}
            isInteractive={project.editMode !== 'presentation'}
            isDragging={dragState?.id === elem.id}
            onPointerDown={(e) => handleElementPointerDown(e, elem.id, pos.x, pos.y)}
          />
        );
      })}

      {/* ══════ COMPASS ══════ */}
      {project.display.showCompass !== 'off' && (
        <Compass
          x={PADDING - 50}
          y={svgHeight - 110}
          size={project.display.showCompass === 'detailed' ? 70 : 45}
          orientation={project.orientation}
          lang={lang}
        />
      )}

      {/* ══════ INFO PANELS ══════ */}
      {project.display.showInfoPanel && (
        <InfoPanels
          x={svgWidth - INFO_PANEL_WIDTH - 20}
          y={PADDING}
          project={project}
          polygon={polygon}
          divisionData={divisionData}
          areaComparison={areaComparison}
          lang={lang}
        />
      )}

      {/* ══════ DISCLAIMER ══════ */}
      {project.display.showDisclaimer && (
        <text x={svgWidth / 2} y={svgHeight - 10} textAnchor="middle"
          fontSize="8" fill="#94a3b8" fontStyle="italic">
          {t('disclaimer', lang === 'both' ? 'hi' : lang)}
        </text>
      )}

      {/* Geometry status indicator */}
      <g transform={`translate(${svgWidth - 160}, ${svgHeight - 30})`}>
        <rect x="0" y="0" width="150" height="22" rx="11" 
          fill={polygon.status === 'reliable' ? '#dcfce7' : polygon.status === 'approximate' ? '#fef3c7' : '#fecaca'} />
        <circle cx="12" cy="11" r="4" 
          fill={polygon.status === 'reliable' ? '#16a34a' : polygon.status === 'approximate' ? '#ca8a04' : '#dc2626'} />
        <text x="22" y="15" fontSize="9" fontWeight="600"
          fill={polygon.status === 'reliable' ? '#16a34a' : polygon.status === 'approximate' ? '#ca8a04' : '#dc2626'}>
          {lang === 'hi' ? t(`geometry${polygon.status.charAt(0).toUpperCase() + polygon.status.slice(1)}` as keyof typeof import('@/i18n/translations').en, 'hi') :
           `Geometry: ${polygon.status.charAt(0).toUpperCase() + polygon.status.slice(1)}`}
        </text>
      </g>
    </svg>
  );
};

// ─── Sub-components ──────────────────────────────────────────

/** Title section at top of map */
const TitleSection: React.FC<{
  x: number; y: number; area: string; areaUnit: string; lang: Language; hasDivisions: boolean;
}> = ({ x, y, area, areaUnit, lang, hasDivisions }) => (
  <g>
    {/* Title text */}
    <text x={x} y={y} textAnchor="middle" fontSize="14" fontWeight="700" fill="#0f172a" letterSpacing="0.05em">
      {lang === 'hi' || lang === 'both' ? 'जमीन का नक्शा (SITE PLAN)' : 'SITE PLAN'}
    </text>
    
    {/* Area badge */}
    <text x={x} y={y + 20} textAnchor="middle" fontSize="12" fontWeight="600" fill="#334155">
      {lang === 'hi' || lang === 'both' ? 'कुल क्षेत्रफल' : 'TOTAL AREA'} : {area} {areaUnit}
    </text>
    
    {/* Division status */}
    {!hasDivisions && (
      <text x={x} y={y + 36} textAnchor="middle" fontSize="10" fontWeight="400" fill="#64748b">
        {lang === 'hi' || lang === 'both' ? '(कोई बंटवारा नहीं है)' : '(NO DIVISIONS)'}
      </text>
    )}
  </g>
);

/** Dimension line with arrows and measurement text */
const DimensionLineComponent: React.FC<{
  p1: Point; p2: Point; value: number; valueM: string; unit: string;
  direction: string; offset: number; side: string; lang: Language; sideDesc: string;
}> = ({ p1, p2, value, valueM, unit, direction, offset, side, lang, sideDesc }) => {
  const dimLine = calculateDimensionLine(p1, p2, Math.abs(offset), offset < 0 ? 'left' : 'right');
  const isVertical = side === 'left' || side === 'right';

  return (
    <g>
      {/* Extension lines from polygon to dimension line */}
      <line x1={p1.x} y1={p1.y} x2={dimLine.start.x} y2={dimLine.start.y}
        stroke="#94a3b8" strokeWidth="0.5" />
      <line x1={p2.x} y1={p2.y} x2={dimLine.end.x} y2={dimLine.end.y}
        stroke="#94a3b8" strokeWidth="0.5" />

      {/* Dimension line with arrows */}
      <line
        x1={dimLine.start.x} y1={dimLine.start.y}
        x2={dimLine.end.x} y2={dimLine.end.y}
        stroke="#334155" strokeWidth="1"
        markerStart="url(#tick)" markerEnd="url(#tick)"
      />

      {/* Measurement text */}
      {isVertical ? (
        <g>
          <rect x={dimLine.textPosition.x + (side === 'left' ? -25 : 5)} y={dimLine.textPosition.y - 35} width="20" height="70" fill="rgba(255, 255, 255, 0.85)" />
          <text
            x={dimLine.textPosition.x + (side === 'left' ? -15 : 15)}
            y={dimLine.textPosition.y}
            textAnchor="middle"
            fontSize="11" fontWeight="600" fill="#0f172a"
            transform={`rotate(${side === 'left' ? -90 : 90}, ${dimLine.textPosition.x + (side === 'left' ? -15 : 15)}, ${dimLine.textPosition.y})`}
          >
            {value} {unit}
          </text>
          <text
            x={dimLine.textPosition.x + (side === 'left' ? -30 : 30)}
            y={dimLine.textPosition.y}
            textAnchor="middle"
            fontSize="8" fontWeight="500" fill="#475569"
            transform={`rotate(${side === 'left' ? -90 : 90}, ${dimLine.textPosition.x + (side === 'left' ? -30 : 30)}, ${dimLine.textPosition.y})`}
          >
            {sideDesc}
          </text>
        </g>
      ) : (
        <g>
          <rect x={dimLine.textPosition.x - 40} y={dimLine.textPosition.y + (side === 'top' ? -20 : 12)} width="80" height="12" fill="rgba(255, 255, 255, 0.85)" />
          <text
            x={dimLine.textPosition.x}
            y={dimLine.textPosition.y + (side === 'top' ? -12 : 20)}
            textAnchor="middle"
            fontSize="11" fontWeight="600" fill="#0f172a"
          >
            {value} {unit}
          </text>
        </g>
      )}
    </g>
  );
};

/** Corner label (A, B, C, D) with drag handle */
const CornerLabel: React.FC<{
  point: Point; label: string; position: string; id: 'A'|'B'|'C'|'D';
  isInteractive?: boolean; isDragging?: boolean;
  onPointerDown?: (e: React.PointerEvent<SVGCircleElement>, id: 'A'|'B'|'C'|'D') => void;
}> = ({ point, label, position, id, isInteractive, isDragging, onPointerDown }) => {
  let dx = 0, dy = 0;
  switch (position) {
    case 'top-right': dx = 12; dy = -8; break;
    case 'bottom-right': dx = 12; dy = 18; break;
    case 'bottom-left': dx = -12; dy = 18; break;
    case 'top-left': dx = -12; dy = -8; break;
  }

  return (
    <g>
      {isInteractive && (
        <circle 
          cx={point.x} cy={point.y} r="16" 
          fill={isDragging ? 'rgba(15, 23, 42, 0.1)' : 'transparent'}
          stroke={isDragging ? '#0f172a' : 'transparent'}
          strokeWidth="1"
          style={{ cursor: 'move', touchAction: 'none' }}
          onPointerDown={e => onPointerDown?.(e, id)}
        />
      )}
      <circle cx={point.x} cy={point.y} r={isDragging ? "4" : "2"} fill="#0f172a" style={{ pointerEvents: 'none' }} />
      <text
        x={point.x + dx} y={point.y + dy}
        textAnchor="middle" fontSize="12" fontWeight="600" fill="#0f172a"
        style={{ pointerEvents: 'none' }}
      >
        {label}
      </text>
    </g>
  );
};

/** Direction label on polygon edge */
const DirectionLabel: React.FC<{
  p1: Point; p2: Point; direction: CardinalDirection; offset: number; side: string;
}> = ({ p1, p2, direction, offset, side }) => {
  const mid = { x: (p1.x + p2.x) / 2, y: (p1.y + p2.y) / 2 };
  const isVertical = side === 'left' || side === 'right';

  const dx = isVertical ? offset : 0;
  const dy = isVertical ? 0 : offset;

  const enDir = direction.split(' ')[0]?.toUpperCase() || direction.toUpperCase();
  // Get hindi
  const hiMap: Record<string, string> = {
    NORTH: 'उत्तर', SOUTH: 'दक्षिण', EAST: 'पूर्व', WEST: 'पश्चिम',
    'उत्तर': 'उत्तर', 'दक्षिण': 'दक्षिण', 'पूर्व': 'पूर्व', 'पश्चिम': 'पश्चिम',
  };

  return (
    <g>
      <text
        x={mid.x + dx} y={mid.y + dy}
        textAnchor="middle" fontSize="9" fontWeight="600" fill="#64748b" letterSpacing="0.05em"
        transform={isVertical ? `rotate(${side === 'left' ? -90 : 90}, ${mid.x + dx}, ${mid.y + dy})` : undefined}
      >
        {translateDirectionBoth(direction.replace(/\s*\(.*\)/, '').toLowerCase() as CardinalDirection)}
      </text>
    </g>
  );
};

/** Surroundings labels outside polygon */
const SurroundingsLabels: React.FC<{
  points: [Point, Point, Point, Point];
  surroundings: LandProject['surroundings'];
  orientation: LandProject['orientation'];
  lang: Language;
}> = ({ points, surroundings, orientation, lang }) => {
  const [A, B, C, D] = points;

  const sides: Array<{
    p1: Point; p2: Point; dir: CardinalDirection; offsetDir: string;
  }> = [
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

        const mid = { x: (p1.x + p2.x) / 2, y: (p1.y + p2.y) / 2 };
        const isVert = offsetDir === 'left' || offsetDir === 'right';
        const label = lang === 'hi' ? (info.labelHi || info.label) :
                     lang === 'both' ? (info.labelHi || info.label) : info.label;

        if (!label) return null;

        let x = mid.x, y = mid.y;
        if (offsetDir === 'top') y -= 85;
        else if (offsetDir === 'bottom') y += 90;
        else if (offsetDir === 'left') x -= 95;
        else if (offsetDir === 'right') x += 95;

        return (
          <text key={dir} x={x} y={y} textAnchor="middle" fontSize="9" fontWeight="500" fill="#546e7a"
            transform={isVert ? `rotate(${offsetDir === 'left' ? -90 : 90}, ${x}, ${y})` : undefined}>
            {label}
          </text>
        );
      })}
    </g>
  );
};

/** Element icon renderer (temple, etc.) */
const ElementIcon: React.FC<{
  x: number; y: number; element: LandProject['elements'][0]; lang: Language; scale: number;
  isInteractive?: boolean; isDragging?: boolean;
  onPointerDown?: (e: React.PointerEvent<SVGGElement>) => void;
}> = ({ x, y, element, lang, scale, isInteractive, isDragging, onPointerDown }) => {
  const size = Math.max(element.width * scale * 0.6, 30);

  // Temple icon (simplified SVG)
  const renderIcon = () => {
    switch (element.type) {
      case 'temple':
        return (
          <g transform={`translate(${x - size / 2}, ${y - size / 2})`}>
            {/* Temple base */}
            <rect x={size * 0.15} y={size * 0.6} width={size * 0.7} height={size * 0.35} fill="#d4a574" stroke="#8b6914" strokeWidth="1" rx="2" />
            {/* Temple body */}
            <rect x={size * 0.25} y={size * 0.35} width={size * 0.5} height={size * 0.3} fill="#e8c8a0" stroke="#8b6914" strokeWidth="1" />
            {/* Temple dome */}
            <path d={`M ${size * 0.5} ${size * 0.05} Q ${size * 0.25} ${size * 0.15} ${size * 0.25} ${size * 0.35} L ${size * 0.75} ${size * 0.35} Q ${size * 0.75} ${size * 0.15} ${size * 0.5} ${size * 0.05}`}
              fill="#c0392b" stroke="#922b21" strokeWidth="1" />
            {/* Flag */}
            <line x1={size * 0.5} y1={0} x2={size * 0.5} y2={size * 0.08} stroke="#8b6914" strokeWidth="1.5" />
            <polygon points={`${size * 0.5},0 ${size * 0.65},${size * 0.04} ${size * 0.5},${size * 0.08}`} fill="#ff6f00" />
          </g>
        );
      case 'tree':
        return (
          <g transform={`translate(${x - 8}, ${y - 16})`}>
            <circle cx="8" cy="6" r="8" fill="#4caf50" stroke="#2e7d32" strokeWidth="1" />
            <rect x="6" y="12" width="4" height="8" fill="#795548" />
          </g>
        );
      case 'house':
        return (
          <g transform={`translate(${x - 12}, ${y - 12})`}>
            <rect x="2" y="10" width="20" height="14" fill="#fff9c4" stroke="#f57f17" strokeWidth="1" />
            <polygon points="12,0 0,10 24,10" fill="#e65100" stroke="#bf360c" strokeWidth="1" />
            <rect x="9" y="14" width="6" height="10" fill="#4e342e" />
          </g>
        );
      case 'gate':
        return (
          <g transform={`translate(${x - 10}, ${y - 6})`}>
            <rect x="0" y="0" width="20" height="12" fill="none" stroke="#795548" strokeWidth="2" />
            <line x1="10" y1="0" x2="10" y2="12" stroke="#795548" strokeWidth="1.5" />
            <rect x="0" y="0" width="3" height="12" fill="#795548" />
            <rect x="17" y="0" width="3" height="12" fill="#795548" />
          </g>
        );
      default:
        return (
          <circle cx={x} cy={y} r="8" fill="#90a4ae" stroke="#546e7a" strokeWidth="1.5" />
        );
    }
  };

  const nameText = element.displayMode !== 'icon-only'
    ? (lang === 'hi' ? (element.nameHi || element.name) :
       lang === 'both' ? `${element.name}\n${element.nameHi || ''}` :
       element.name)
    : null;

  const dirText = element.displayMode === 'icon-name-direction'
    ? (lang === 'hi' || lang === 'both' ? `(${translateDirectionBoth(element.position.replace(/-/g, ' ') as unknown as CardinalDirection)})` : `(${element.position})`)
    : null;

  return (
    <g 
      style={{ cursor: isInteractive ? 'move' : 'default', touchAction: 'none' }}
      onPointerDown={isInteractive ? onPointerDown : undefined}
    >
      {isInteractive && (
        <rect 
          x={x - size / 2 - 10} y={y - size / 2 - 10} 
          width={size + 20} height={size + 20} 
          fill={isDragging ? 'rgba(26, 35, 126, 0.1)' : 'transparent'}
          stroke={isDragging ? '#1a237e' : 'transparent'}
          strokeWidth="1" strokeDasharray="4 4" rx="4"
        />
      )}
      {renderIcon()}
      {nameText && (
        <>
          <text x={x} y={y + size / 2 + 14} textAnchor="middle" fontSize="10" fontWeight="700" fill="#1a237e">
            {element.name}
          </text>
          {element.nameHi && (lang === 'hi' || lang === 'both') && (
            <text x={x} y={y + size / 2 + 26} textAnchor="middle" fontSize="10" fontWeight="600" fill="#37474f">
              {element.nameHi}
            </text>
          )}
        </>
      )}
      {dirText && (
        <text x={x} y={y + size / 2 + 38} textAnchor="middle" fontSize="8" fill="#78909c">
          {dirText}
        </text>
      )}
    </g>
  );
};

/** Professional compass rose */
const Compass: React.FC<{
  x: number; y: number; size: number; orientation: LandProject['orientation']; lang: Language;
}> = ({ x, y, size, orientation, lang }) => {
  // Map cardinal directions to visual positions based on orientation
  const dirToAngle: Record<CardinalDirection, number> = { north: -90, east: 0, south: 90, west: 180 };
  
  // In our orientation system, 'top' direction should point up (-90°)
  const topAngle = dirToAngle[orientation.top] ?? 0;
  const rightAngle = dirToAngle[orientation.right] ?? 90;
  const bottomAngle = dirToAngle[orientation.bottom] ?? 180;
  const leftAngle = dirToAngle[orientation.left] ?? -90;

  const r = size / 2;
  const hiLabel = (d: CardinalDirection) => {
    const map: Record<CardinalDirection, string> = { north: 'उत्तर', south: 'दक्षिण', east: 'पूर्व', west: 'पश्चिम' };
    return map[d];
  };
  const enLabel = (d: CardinalDirection) => d.charAt(0).toUpperCase() + d.slice(1).toUpperCase();

  // Find where North actually is
  let northVisualAngle = -90; // default up
  if (orientation.top === 'north') northVisualAngle = -90;
  else if (orientation.right === 'north') northVisualAngle = 0;
  else if (orientation.bottom === 'north') northVisualAngle = 90;
  else if (orientation.left === 'north') northVisualAngle = 180;

  const dirs: Array<{ dir: CardinalDirection; angle: number }> = [
    { dir: orientation.top, angle: -90 },
    { dir: orientation.right, angle: 0 },
    { dir: orientation.bottom, angle: 90 },
    { dir: orientation.left, angle: 180 },
  ];

  return (
    <g transform={`translate(${x}, ${y})`}>
      {/* Title */}
      <text x={0} y={-r - 20} textAnchor="middle" fontSize="9" fontWeight="700" fill="#37474f">
        {lang === 'hi' || lang === 'both' ? 'दिशा सूचक (Compass)' : 'Compass'}
      </text>

      {/* Outer circle */}
      <circle cx={0} cy={0} r={r + 5} fill="none" stroke="#90a4ae" strokeWidth="1.5" />
      <circle cx={0} cy={0} r={r - 2} fill="#fafafa" stroke="#b0bec5" strokeWidth="1" />

      {/* Cross lines */}
      <line x1={-r + 5} y1={0} x2={r - 5} y2={0} stroke="#cfd8dc" strokeWidth="0.5" />
      <line x1={0} y1={-r + 5} x2={0} y2={r - 5} stroke="#cfd8dc" strokeWidth="0.5" />

      {/* North pointer - always point to where North is */}
      <g transform={`rotate(${northVisualAngle})`}>
        <polygon points={`0,${-r + 8} -6,4 0,-2 6,4`} fill="#c62828" />
        <polygon points={`0,${r - 8} -6,-4 0,2 6,-4`} fill="#78909c" />
      </g>

      {/* Direction labels */}
      {dirs.map(({ dir, angle }) => {
        const labelR = r + 18;
        const rad = (angle * Math.PI) / 180;
        const lx = Math.cos(rad) * labelR;
        const ly = Math.sin(rad) * labelR;

        return (
          <g key={dir}>
            <text x={lx} y={ly + 4} textAnchor="middle" fontSize="8" fontWeight="700"
              fill={dir === 'north' ? '#c62828' : '#37474f'}>
              {hiLabel(dir)}
            </text>
            <text x={lx} y={ly + 14} textAnchor="middle" fontSize="7" fontWeight="600" fill="#78909c">
              ({enLabel(dir)})
            </text>
          </g>
        );
      })}

      {/* Center dot */}
      <circle cx={0} cy={0} r="3" fill="#1a237e" />
    </g>
  );
};

/** Information panels on the right side of the map */
const InfoPanels: React.FC<{
  x: number; y: number; project: LandProject; polygon: ComputedPolygon;
  divisionData: Division[]; areaComparison?: { declared: number; calculated: number; differencePercent: number };
  lang: Language;
}> = ({ x, y, project, polygon, divisionData, areaComparison, lang }) => {
  const unit = project.unit;
  const ul = unitLabel(unit);
  const aul = areaUnitLabel(unit);
  const toM = (v: number) => convertUnits(v, unit, 'm').toFixed(2);
  let currentY = y;
  const panelWidth = INFO_PANEL_WIDTH;
  const lineHeight = 18;

  const panels: React.ReactNode[] = [];

  // ── Boundaries Panel ──
  const boundaryRows = [
    { dir: 'east', hi: 'पूर्व', en: 'EAST', desc: lang === 'hi' || lang === 'both' ? `ऊपर की सीधी साइड ${project.boundaries.east} ${ul}` : `Upper Straight Side ${project.boundaries.east} ${ul}` },
    { dir: 'west', hi: 'पश्चिम', en: 'WEST', desc: lang === 'hi' || lang === 'both' ? `तिरछी साइड ${project.boundaries.west} ${ul}` : `Sloped Side ${project.boundaries.west} ${ul}` },
    { dir: 'north', hi: 'उत्तर', en: 'NORTH', desc: lang === 'hi' || lang === 'both' ? `बायां साइड ${project.boundaries.north} ${ul}` : `Left Side ${project.boundaries.north} ${ul}` },
    { dir: 'south', hi: 'दक्षिण', en: 'SOUTH', desc: lang === 'hi' || lang === 'both' ? `दायां साइड ${project.boundaries.south} ${ul} (लगभग)` : `Right Side ${project.boundaries.south} ${ul} (approx.)` },
  ];

  const bPanelH = 30 + boundaryRows.length * lineHeight + 10;
  panels.push(
    <g key="boundaries" transform={`translate(${x}, ${currentY})`}>
      <rect x="0" y="0" width={panelWidth} height={bPanelH} rx="8" fill="white" stroke="#e2e8f0" strokeWidth="1.5" />
      <text x={panelWidth / 2} y="20" textAnchor="middle" fontSize="11" fontWeight="800" fill="#1a237e">
        {lang === 'hi' || lang === 'both' ? 'सीमाएँ (Boundaries)' : 'Boundaries'}
      </text>
      <line x1="10" y1="26" x2={panelWidth - 10} y2="26" stroke="#e2e8f0" strokeWidth="1" />
      {boundaryRows.map((row, i) => (
        <g key={row.dir}>
          <text x="12" y={40 + i * lineHeight} fontSize="9" fontWeight="600" fill="#37474f">
            {row.hi} ({row.en})
          </text>
          <text x={panelWidth - 12} y={40 + i * lineHeight} textAnchor="end" fontSize="9" fontWeight="500" fill="#546e7a">
            = {row.desc}
          </text>
        </g>
      ))}
    </g>
  );
  currentY += bPanelH + 12;

  // ── Corner Positions Panel ──
  const corners = [
    { label: 'A', desc: lang === 'hi' || lang === 'both' ? 'उत्तर-पूर्व कोना (ऊपर दायां)' : 'North-East Corner (Upper Right)' },
    { label: 'B', desc: lang === 'hi' || lang === 'both' ? 'दक्षिण-पूर्व कोना (नीचे दायां)' : 'South-East Corner (Lower Right)' },
    { label: 'C', desc: lang === 'hi' || lang === 'both' ? 'दक्षिण-पश्चिम कोना (नीचे बायां)' : 'South-West Corner (Lower Left)' },
    { label: 'D', desc: lang === 'hi' || lang === 'both' ? 'उत्तर-पश्चिम कोना (ऊपर बायां)' : 'North-West Corner (Upper Left)' },
  ];

  const cPanelH = 30 + corners.length * lineHeight + 10;
  panels.push(
    <g key="corners" transform={`translate(${x}, ${currentY})`}>
      <rect x="0" y="0" width={panelWidth} height={cPanelH} rx="8" fill="white" stroke="#e2e8f0" strokeWidth="1.5" />
      <text x={panelWidth / 2} y="20" textAnchor="middle" fontSize="11" fontWeight="800" fill="#1a237e">
        {lang === 'hi' || lang === 'both' ? 'कोनों की स्थिति' : 'Corner Positions'}
      </text>
      <line x1="10" y1="26" x2={panelWidth - 10} y2="26" stroke="#e2e8f0" strokeWidth="1" />
      {corners.map((c, i) => (
        <g key={c.label}>
          <text x="12" y={40 + i * lineHeight} fontSize="9" fontWeight="700" fill="#c62828">{c.label}</text>
          <text x="28" y={40 + i * lineHeight} fontSize="9" fontWeight="500" fill="#546e7a">= {c.desc}</text>
        </g>
      ))}
    </g>
  );
  currentY += cPanelH + 12;

  // ── Surroundings Panel ──
  const surroundingRows = [
    { hi: 'पूर्व (ऊपर)', en: 'East (Top)', val: project.surroundings.east.labelHi || project.surroundings.east.label },
    { hi: 'पश्चिम (नीचे)', en: 'West (Bottom)', val: project.surroundings.west.labelHi || project.surroundings.west.label },
    { hi: 'उत्तर (बायां)', en: 'North (Left)', val: project.surroundings.north.labelHi || project.surroundings.north.label },
    { hi: 'दक्षिण (दायां)', en: 'South (Right)', val: project.surroundings.south.labelHi || project.surroundings.south.label },
  ];

  const sPanelH = 30 + surroundingRows.length * (lineHeight + 2) + 10;
  panels.push(
    <g key="surroundings" transform={`translate(${x}, ${currentY})`}>
      <rect x="0" y="0" width={panelWidth} height={sPanelH} rx="8" fill="white" stroke="#e2e8f0" strokeWidth="1.5" />
      <text x={panelWidth / 2} y="20" textAnchor="middle" fontSize="11" fontWeight="800" fill="#1a237e">
        {lang === 'hi' || lang === 'both' ? 'आस-पास की जानकारी' : 'Surroundings Information'}
      </text>
      <line x1="10" y1="26" x2={panelWidth - 10} y2="26" stroke="#e2e8f0" strokeWidth="1" />
      {surroundingRows.map((row, i) => (
        <g key={i}>
          <text x="12" y={42 + i * (lineHeight + 2)} fontSize="9" fontWeight="600" fill="#37474f">
            {lang === 'hi' || lang === 'both' ? row.hi : row.en}
          </text>
          <text x={panelWidth - 12} y={42 + i * (lineHeight + 2)} textAnchor="end" fontSize="9" fontWeight="500" fill="#546e7a">
            {row.val || '—'}
          </text>
        </g>
      ))}
    </g>
  );
  currentY += sPanelH + 12;

  // ── Summary Panel ──
  const displayArea = project.declaredArea || polygon.area;
  const summaryItems = [
    `${lang === 'hi' || lang === 'both' ? 'कुल क्षेत्रफल' : 'Total Area'} = ${formatNumber(Math.round(displayArea))} ${lang === 'hi' || lang === 'both' ? areaUnitLabelHi(unit) : areaUnitLabel(unit)}`,
    divisionData.length > 1
      ? `${lang === 'hi' || lang === 'both' ? 'बंटवारा' : 'Divisions'} = ${divisionData.length} ${lang === 'hi' || lang === 'both' ? 'हिस्से' : 'parts'}`
      : (lang === 'hi' || lang === 'both' ? 'कोई बंटवारा नहीं है – पूरी जमीन एक है' : 'No division – Entire land is one'),
    ...(divisionData.length > 1 ? divisionData.map((d, i) =>
      `${d.nameHi || d.name} = ${formatNumber(Math.round(d.area || 0))} ${lang === 'hi' || lang === 'both' ? areaUnitLabelHi(unit) : areaUnitLabel(unit)}`
    ) : []),
    `${lang === 'hi' || lang === 'both' ? 'चारों तरफ की नाप ऊपर अनुसार है' : 'All dimensions as shown above'}`,
    ...(project.elements.length > 0 ? [`${lang === 'hi' || lang === 'both' ? 'मंदिर उत्तर-पूर्व दिशा में स्थित है' : 'Temple in North-East direction'}`] : []),
  ];

  const mPanelH = 30 + summaryItems.length * (lineHeight) + 10;
  panels.push(
    <g key="summary" transform={`translate(${x}, ${currentY})`}>
      <rect x="0" y="0" width={panelWidth} height={mPanelH} rx="8" fill="white" stroke="#e2e8f0" strokeWidth="1.5" />
      <text x={panelWidth / 2} y="20" textAnchor="middle" fontSize="11" fontWeight="800" fill="#1a237e">
        {lang === 'hi' || lang === 'both' ? 'मुख्य बातें (सारांश)' : 'Main Summary'}
      </text>
      <line x1="10" y1="26" x2={panelWidth - 10} y2="26" stroke="#e2e8f0" strokeWidth="1" />
      {summaryItems.map((item, i) => (
        <text key={i} x="18" y={42 + i * lineHeight} fontSize="9" fontWeight="500" fill="#37474f">
          • {item}
        </text>
      ))}
    </g>
  );

  return <>{panels}</>;
};

export default React.memo(LandMap);
