/**
 * Label layout engine to prevent text overlapping.
 */
import type { Point } from '@/types/land';

export interface MapLabel {
  id: string;
  text: string;
  subText?: string;
  preferredX: number;
  preferredY: number;
  width: number;
  height: number;
  priority: number; // Lower is higher priority (0 = cannot move)
  anchor: 'start' | 'middle' | 'end';
  category: 'dimension' | 'direction' | 'corner' | 'element' | 'area' | 'compass' | 'annotation' | 'surrounding';
  allowedMovement: 'horizontal' | 'vertical' | 'both' | 'none';
  // Final calculated position
  x?: number;
  y?: number;
}

interface BBox {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
}

function getLabelBBox(label: MapLabel): BBox {
  const x = label.x ?? label.preferredX;
  const y = label.y ?? label.preferredY;
  const halfW = label.width / 2;
  const h = label.height;
  
  if (label.anchor === 'middle') {
    return { minX: x - halfW, maxX: x + halfW, minY: y - h, maxY: y + h / 4 };
  } else if (label.anchor === 'start') {
    return { minX: x, maxX: x + label.width, minY: y - h, maxY: y + h / 4 };
  } else {
    return { minX: x - label.width, maxX: x, minY: y - h, maxY: y + h / 4 };
  }
}

function checkCollision(b1: BBox, b2: BBox, padding = 4): boolean {
  return !(
    b1.maxX + padding < b2.minX ||
    b1.minX > b2.maxX + padding ||
    b1.maxY + padding < b2.minY ||
    b1.minY > b2.maxY + padding
  );
}

export function resolveLabelLayout(labels: MapLabel[]): MapLabel[] {
  // Sort by priority (lowest number first, so high priority is processed first)
  const sorted = [...labels].sort((a, b) => a.priority - b.priority);
  
  // Initialize with preferred positions
  sorted.forEach(l => {
    l.x = l.preferredX;
    l.y = l.preferredY;
  });

  const resolved: MapLabel[] = [];

  for (let i = 0; i < sorted.length; i++) {
    const current = sorted[i]!;
    
    // Check against already resolved labels
    let collision = true;
    let iterations = 0;
    const maxIterations = 50;
    
    // We try to move the current label if it collides
    let dx = 0;
    let dy = 0;
    const stepSize = 4;
    
    while (collision && iterations < maxIterations && current.allowedMovement !== 'none') {
      collision = false;
      const currentBBox = getLabelBBox({ ...current, x: current.x! + dx, y: current.y! + dy });
      
      for (const placed of resolved) {
        if (checkCollision(currentBBox, getLabelBBox(placed))) {
          collision = true;
          
          // Determine push direction based on relative position and allowed movement
          const dxToPlaced = currentBBox.minX - getLabelBBox(placed).minX;
          const dyToPlaced = currentBBox.minY - getLabelBBox(placed).minY;
          
          if (current.allowedMovement === 'vertical' || (current.allowedMovement === 'both' && Math.abs(dyToPlaced) > Math.abs(dxToPlaced))) {
             dy += (dyToPlaced > 0 ? stepSize : -stepSize);
          } else if (current.allowedMovement === 'horizontal' || current.allowedMovement === 'both') {
             dx += (dxToPlaced > 0 ? stepSize : -stepSize);
          }
          break;
        }
      }
      iterations++;
    }
    
    current.x! += dx;
    current.y! += dy;
    resolved.push(current);
  }

  return sorted; // Contains updated x/y
}
