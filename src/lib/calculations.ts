// Financial, Inventory, and Business Rule Calculations for Edupark Field Portal
import { DateFilterType } from '../types/database';

/**
 * Pure calculation: Total Collected = Cash + GPay/UPI
 */
export function calculateTotalCollected(cash: number, gpay: number): number {
  const safeCash = Math.max(0, isNaN(cash) ? 0 : cash);
  const safeGpay = Math.max(0, isNaN(gpay) ? 0 : gpay);
  return Number((safeCash + safeGpay).toFixed(2));
}

/**
 * Pure calculation: Net Collection = Total Collected - Expenses
 */
export function calculateNetCollection(totalCollected: number, expenses: number): number {
  const safeTotal = isNaN(totalCollected) ? 0 : totalCollected;
  const safeExpenses = Math.max(0, isNaN(expenses) ? 0 : expenses);
  return Number((safeTotal - safeExpenses).toFixed(2));
}

/**
 * Pure calculation: Outstanding Calendars = Calendars Issued - Calendars Returned
 */
export function calculateOutstandingCalendars(issued: number, returned: number): number {
  const safeIssued = Math.max(0, isNaN(issued) ? 0 : issued);
  const safeReturned = Math.max(0, isNaN(returned) ? 0 : returned);
  return Math.max(0, safeIssued - safeReturned);
}

/**
 * Format currency with Indian Rupee symbol or locale number formatting
 */
export function formatCurrency(amount: number | null | undefined): string {
  if (amount === null || amount === undefined || isNaN(amount)) {
    return '₹0.00';
  }
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

/**
 * Get local YYYY-MM-DD string without UTC shift issues
 */
export function getLocalDateString(date: Date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Format date for friendly UI presentation (e.g. 22 Oct 2026)
 */
export function formatDisplayDate(dateStr: string): string {
  if (!dateStr) return 'N/A';
  try {
    const [year, month, day] = dateStr.split('-').map(Number);
    if (!year || !month || !day) return dateStr;
    const date = new Date(year, month - 1, day);
    return date.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  } catch {
    return dateStr;
  }
}

/**
 * Date range filter verification ensuring local calendar alignment without UTC shifting
 */
export function matchesDateFilter(
  targetDateStr: string,
  filterType: DateFilterType,
  customStart?: string,
  customEnd?: string,
  referenceDate: Date = new Date()
): boolean {
  if (!targetDateStr) return false;
  if (filterType === 'all') return true;

  const todayStr = getLocalDateString(referenceDate);

  if (filterType === 'today') {
    return targetDateStr === todayStr;
  }

  if (filterType === 'week') {
    const current = new Date(referenceDate);
    const day = current.getDay();
    // Monday as start of week
    const diff = current.getDate() - day + (day === 0 ? -6 : 1);
    const monday = new Date(current.setDate(diff));
    const mondayStr = getLocalDateString(monday);
    return targetDateStr >= mondayStr && targetDateStr <= todayStr;
  }

  if (filterType === 'month') {
    const firstDay = new Date(referenceDate.getFullYear(), referenceDate.getMonth(), 1);
    const firstDayStr = getLocalDateString(firstDay);
    return targetDateStr >= firstDayStr && targetDateStr <= todayStr;
  }

  if (filterType === 'custom') {
    if (customStart && targetDateStr < customStart) return false;
    if (customEnd && targetDateStr > customEnd) return false;
    return true;
  }

  return true;
}
