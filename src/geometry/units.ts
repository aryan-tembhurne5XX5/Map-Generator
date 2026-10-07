/**
 * Unit conversion utilities.
 * Internally we work in feet; convert on input/output as needed.
 */
import type { Unit } from '@/types/land';

const CONVERSION_TABLE: Record<Unit, Record<Unit, number>> = {
  ft: { ft: 1, m: 0.3048, yd: 1 / 3 },
  m: { ft: 3.28084, m: 1, yd: 1.09361 },
  yd: { ft: 3, m: 0.9144, yd: 1 },
};

/** Convert a value from one unit to another */
export function convertUnits(value: number, from: Unit, to: Unit): number {
  if (from === to) return value;
  return value * (CONVERSION_TABLE[from]?.[to] ?? 1);
}

/** Convert area from one unit to another (squared) */
export function convertArea(value: number, from: Unit, to: Unit): number {
  if (from === to) return value;
  const factor = CONVERSION_TABLE[from]?.[to] ?? 1;
  return value * factor * factor;
}

/** Format a number with commas and fixed decimals */
export function formatNumber(n: number, decimals = 0): string {
  return n.toLocaleString('en-IN', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

/** Get the unit display label */
export function unitLabel(unit: Unit): string {
  const map: Record<Unit, string> = { ft: 'ft', m: 'm', yd: 'yd' };
  return map[unit];
}

/** Get the area unit display label */
export function areaUnitLabel(unit: Unit): string {
  const map: Record<Unit, string> = {
    ft: 'sq ft',
    m: 'sq m',
    yd: 'sq yd',
  };
  return map[unit];
}

/** Get Hindi unit label */
export function unitLabelHi(unit: Unit): string {
  const map: Record<Unit, string> = { ft: 'फुट', m: 'मी.', yd: 'गज' };
  return map[unit];
}

/** Get Hindi area unit label */
export function areaUnitLabelHi(unit: Unit): string {
  const map: Record<Unit, string> = {
    ft: 'वर्गफुट',
    m: 'वर्ग मी.',
    yd: 'वर्ग गज',
  };
  return map[unit];
}
