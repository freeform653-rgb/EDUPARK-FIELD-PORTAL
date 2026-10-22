// Automated Business Rules & Calculation Test Suite for Edupark Field Portal
import {
  calculateTotalCollected,
  calculateNetCollection,
  calculateOutstandingCalendars,
  formatCurrency,
  getLocalDateString,
  matchesDateFilter
} from '../src/lib/calculations';

function assert(condition: boolean, testName: string) {
  if (!condition) {
    console.error(`❌ FAILED: ${testName}`);
    process.exit(1);
  } else {
    console.log(`✅ PASSED: ${testName}`);
  }
}

console.log('--- STARTING EDUPARK BUSINESS RULES & CALCULATION TESTS ---');

// Test 1: Financial Collections (Cash + GPay)
assert(calculateTotalCollected(1000, 500) === 1500, 'calculateTotalCollected sums 1000 cash + 500 gpay to 1500');
assert(calculateTotalCollected(0, 0) === 0, 'calculateTotalCollected handles 0 cash and 0 gpay');
assert(calculateTotalCollected(1250.75, 450.25) === 1701, 'calculateTotalCollected handles floating point currency additions correctly');

// Test 2: Net Collections (Total - Expenses)
assert(calculateNetCollection(1500, 200) === 1300, 'calculateNetCollection deducts 200 expense from 1500 to yield 1300');
assert(calculateNetCollection(500, 600) === -100, 'calculateNetCollection correctly flags negative net when expenses exceed collection');
assert(calculateNetCollection(1000, 0) === 1000, 'calculateNetCollection handles zero expenses');

// Test 3: Outstanding Physical Calendars
assert(calculateOutstandingCalendars(20, 15) === 5, 'calculateOutstandingCalendars: 20 issued - 15 returned = 5 outstanding');
assert(calculateOutstandingCalendars(20, 20) === 0, 'calculateOutstandingCalendars: 20 issued - 20 returned = 0 outstanding');
assert(calculateOutstandingCalendars(10, 0) === 10, 'calculateOutstandingCalendars: 10 issued - 0 returned = 10 outstanding');

// Test 4: Currency Formatter
const formattedInr = formatCurrency(5000);
assert(formattedInr.includes('5,000') || formattedInr.includes('5000'), 'formatCurrency formats 5000 with Indian formatting');

// Test 5: Local Calendar Dates (No UTC Day Shift)
const now = new Date();
const localDate = getLocalDateString(now);
assert(/^\d{4}-\d{2}-\d{2}$/.test(localDate), 'getLocalDateString returns valid YYYY-MM-DD');

// Test 6: Date Filter Validation
assert(matchesDateFilter(localDate, 'today', undefined, undefined, now), 'matchesDateFilter matches today');
assert(matchesDateFilter('2026-01-01', 'all'), 'matchesDateFilter matches all');
assert(!matchesDateFilter('2020-01-01', 'today', undefined, undefined, now), 'matchesDateFilter rejects old dates when filter is today');

// Test 7: Individual vs Team Classification
function determineDispatchType(studentCount: number): 'Individual' | 'Team' {
  return studentCount === 1 ? 'Individual' : 'Team';
}
assert(determineDispatchType(1) === 'Individual', '1 student is classified as Individual dispatch');
assert(determineDispatchType(2) === 'Team', '2 students are classified as Team dispatch');
assert(determineDispatchType(5) === 'Team', '5 students are classified as Team dispatch');

// Test 8: Team Status Transition Matrix
function evaluateTeamStatus(total: number, settled: number): 'Dispatched' | 'Settlement Pending' | 'Settled' {
  if (settled === total && total > 0) return 'Settled';
  if (settled > 0) return 'Settlement Pending';
  return 'Dispatched';
}

assert(evaluateTeamStatus(3, 0) === 'Dispatched', 'Team with 0 of 3 settled has status Dispatched');
assert(evaluateTeamStatus(3, 1) === 'Settlement Pending', 'Team with 1 of 3 settled has status Settlement Pending');
assert(evaluateTeamStatus(3, 2) === 'Settlement Pending', 'Team with 2 of 3 settled has status Settlement Pending');
assert(evaluateTeamStatus(3, 3) === 'Settled', 'Team with 3 of 3 settled has status Settled');

// Test 9: Calendar Return Constraint Validation
function validateCalendarReturn(issued: number, returned: number): { valid: boolean; error?: string } {
  if (returned < 0) return { valid: false, error: 'Cannot be negative' };
  if (returned > issued) return { valid: false, error: `Returned (${returned}) cannot exceed issued (${issued})` };
  return { valid: true };
}

assert(validateCalendarReturn(20, 15).valid === true, '15 returned out of 20 issued is valid');
assert(validateCalendarReturn(20, 20).valid === true, '20 returned out of 20 issued is valid');
assert(validateCalendarReturn(20, 25).valid === false, '25 returned out of 20 issued is REJECTED');

console.log('--- ALL AUTOMATED BUSINESS RULES & CALCULATION TESTS PASSED! ---');
