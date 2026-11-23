import { format, formatDistanceToNow, isValid, parseISO } from 'date-fns';

/**
 * Parses input to a valid Date object or returns null if invalid.
 */
function toValidDate(date: string | number | Date | null | undefined): Date | null {
  if (!date) return null;
  if (date instanceof Date) {
    return isValid(date) ? date : null;
  }
  const parsed = typeof date === 'string' ? parseISO(date) : new Date(date);
  return isValid(parsed) ? parsed : null;
}

/**
 * Format a date into a standard readable string.
 * Example: formatDate('2026-11-23T09:00:00Z') => '23 Nov 2026, 09:00 AM'
 */
export function formatDate(
  date: string | number | Date | null | undefined,
  pattern: string = 'dd MMM yyyy, hh:mm a'
): string {
  const valid = toValidDate(date);
  if (!valid) return 'N/A';
  try {
    return format(valid, pattern);
  } catch {
    return 'Invalid date';
  }
}

/**
 * Format date as relative time from now (e.g., '5 minutes ago', 'in 2 hours').
 */
export function formatRelativeTime(date: string | number | Date | null | undefined): string {
  const valid = toValidDate(date);
  if (!valid) return 'N/A';
  try {
    return formatDistanceToNow(valid, { addSuffix: true });
  } catch {
    return 'N/A';
  }
}

/**
 * Format a quantity with its unit (e.g., '25 kg', '100 portions').
 */
export function formatQuantity(quantity: number | undefined | null, unit: string = 'kg'): string {
  if (quantity === undefined || quantity === null || isNaN(quantity)) {
    return `0 ${unit.toLowerCase()}`;
  }
  return `${quantity.toLocaleString()} ${unit.toLowerCase()}`;
}

/**
 * Format distance in meters or kilometers to a human readable format (e.g., '450 m', '3.2 km').
 */
export function formatDistance(distance: number | null | undefined, isKm: boolean = true): string {
  if (distance === null || distance === undefined || isNaN(distance)) {
    return '0 km';
  }
  const km = isKm ? distance : distance / 1000;
  if (km < 1) {
    return `${Math.round(km * 1000)} m`;
  }
  return `${km.toFixed(1)} km`;
}

/**
 * Format ratio/rate to percentage string (e.g. 0.95 -> 95%, or 95 -> 95%).
 */
export function formatPercentage(value: number | null | undefined, decimals: number = 0): string {
  if (value === null || value === undefined || isNaN(value)) {
    return '0%';
  }
  const normalized = value <= 1 && value >= 0 ? value * 100 : value;
  return `${normalized.toFixed(decimals)}%`;
}
