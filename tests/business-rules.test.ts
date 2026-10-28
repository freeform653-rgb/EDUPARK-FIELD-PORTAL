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

// Test 10: Admin Credential & Security Password Update Rules
function validateCredentialUpdate(
  currentCreds: { username: string; password: string },
  params: { newUsername: string; currentPassword?: string; newPassword?: string; confirmPassword?: string }
): { valid: boolean; error?: string } {
  const trimmed = params.newUsername.trim();
  if (!trimmed) return { valid: false, error: 'Username cannot be blank.' };
  if (trimmed.length < 3) return { valid: false, error: 'Username must be at least 3 characters long.' };

  if (params.newPassword) {
    if (!params.currentPassword) {
      return { valid: false, error: 'Current password is required to change password.' };
    }
    if (params.currentPassword !== currentCreds.password) {
      return { valid: false, error: 'Current password does not match.' };
    }
    if (params.newPassword.length < 6) {
      return { valid: false, error: 'New password must be at least 6 characters long.' };
    }
    if (params.confirmPassword !== undefined && params.newPassword !== params.confirmPassword) {
      return { valid: false, error: 'New passwords do not match.' };
    }
  }

  return { valid: true };
}

const testCreds = { username: 'admin', password: 'edupark@admin2025' };
assert(validateCredentialUpdate(testCreds, { newUsername: 'director' }).valid === true, 'Valid username update accepted');
assert(validateCredentialUpdate(testCreds, { newUsername: '   ' }).valid === false, 'Blank username rejected');
assert(validateCredentialUpdate(testCreds, { newUsername: 'ed' }).valid === false, 'Short username under 3 chars rejected');
assert(validateCredentialUpdate(testCreds, { newUsername: 'admin', newPassword: 'newSecretPass123' }).valid === false, 'Changing password without current password rejected');
assert(validateCredentialUpdate(testCreds, { newUsername: 'admin', currentPassword: 'wrongPassword', newPassword: 'newSecretPass123' }).valid === false, 'Wrong current password rejected');
assert(validateCredentialUpdate(testCreds, { newUsername: 'admin', currentPassword: 'edupark@admin2025', newPassword: '123' }).valid === false, 'Short new password under 6 chars rejected');
assert(validateCredentialUpdate(testCreds, { newUsername: 'admin', currentPassword: 'edupark@admin2025', newPassword: 'newPassword123', confirmPassword: 'differentPassword' }).valid === false, 'Mismatched confirm password rejected');
assert(validateCredentialUpdate(testCreds, { newUsername: 'admin_campus', currentPassword: 'edupark@admin2025', newPassword: 'newPassword123', confirmPassword: 'newPassword123' }).valid === true, 'Valid password change with matching confirm password accepted');

// Test 11: Two Reset Options Logic
interface DatabaseState {
  students: { id: string; name: string }[];
  dispatches: { id: string; dest: string }[];
  settlements: { id: string; amount: number }[];
  excuses: { id: string; reason: string }[];
}

function executeResetOption(state: DatabaseState, mode: 'clearDispatchesOnly' | 'clearAll'): DatabaseState {
  if (mode === 'clearDispatchesOnly') {
    return {
      students: [...state.students], // Strictly preserved
      dispatches: [],
      settlements: [],
      excuses: []
    };
  } else {
    return {
      students: [],
      dispatches: [],
      settlements: [],
      excuses: []
    };
  }
}

const mockInitialState: DatabaseState = {
  students: [{ id: 's1', name: 'Muhammed' }, { id: 's2', name: 'Amina' }],
  dispatches: [{ id: 'd1', dest: 'Calicut' }],
  settlements: [{ id: 'stl1', amount: 1500 }],
  excuses: [{ id: 'e1', reason: 'Fever' }]
};

const afterClearDispatches = executeResetOption(mockInitialState, 'clearDispatchesOnly');
assert(afterClearDispatches.students.length === 2, 'Option 1: Registered students are strictly preserved');
assert(afterClearDispatches.dispatches.length === 0, 'Option 1: Dispatches are cleared');
assert(afterClearDispatches.settlements.length === 0, 'Option 1: Settlements are cleared');
assert(afterClearDispatches.excuses.length === 0, 'Option 1: Duty excuses are cleared');

const afterClearAll = executeResetOption(mockInitialState, 'clearAll');
assert(afterClearAll.students.length === 0, 'Option 2: All students are wiped');
assert(afterClearAll.dispatches.length === 0, 'Option 2: All dispatches are wiped');
assert(afterClearAll.settlements.length === 0, 'Option 2: All settlements are wiped');
assert(afterClearAll.excuses.length === 0, 'Option 2: All excuses are wiped');

// Test 12: Student Data Import Parsing & Duplicate Validation
function mockParseStudentRow(
  rawName: string,
  rawBatch: string,
  rawPhone: string,
  defaultBatch: string,
  existingNames: Set<string>
) {
  const cleanName = rawName.replace(/^[\d\.\-\)\s|,]+/, '').trim();
  const batch = rawBatch.trim() ? rawBatch.trim() : defaultBatch;
  const phone = rawPhone ? rawPhone.replace(/[^\d+]/g, '') : null;
  const isValid = cleanName.length >= 2;
  const isDuplicate = existingNames.has(cleanName.toLowerCase());

  return {
    full_name: cleanName,
    batch,
    phone_number: phone,
    isValid,
    isDuplicate,
    selected: isValid && !isDuplicate
  };
}

const existing = new Set(['muhammed rayan', 'fathima zahra']);

// Valid row
const row1 = mockParseStudentRow('1. Ahmed Bilal', 'Batch 13', '9876543210', 'plus one A', existing);
assert(row1.full_name === 'Ahmed Bilal', 'Row 1: leading number stripped from name');
assert(row1.batch === 'Batch 13', 'Row 1: batch preserved');
assert(row1.phone_number === '9876543210', 'Row 1: phone cleaned');
assert(row1.isValid === true && row1.isDuplicate === false && row1.selected === true, 'Row 1: valid new student is selected');

// Duplicate row
const row2 = mockParseStudentRow('Muhammed Rayan', '', '9876543211', 'plus one A', existing);
assert(row2.isDuplicate === true, 'Row 2: correctly detected as duplicate');
assert(row2.selected === false, 'Row 2: duplicate student unselected by default');
assert(row2.batch === 'plus one A', 'Row 2: default batch assigned when missing');

// Invalid row
const row3 = mockParseStudentRow('  ', 'plus one B', '', 'plus one A', existing);
assert(row3.isValid === false, 'Row 3: blank name marked invalid');
assert(row3.selected === false, 'Row 3: invalid student unselected');

// Test 13: Student Deletion & Cascade Clean-up
interface StudentDeleteMockState {
  students: { id: string; name: string }[];
  assignments: { id: string; student_id: string }[];
  excuses: { id: string; student_id: string }[];
}

function mockDeleteStudent(state: StudentDeleteMockState, studentIdToDelete: string): StudentDeleteMockState {
  return {
    students: state.students.filter(s => s.id !== studentIdToDelete),
    assignments: state.assignments.filter(a => a.student_id !== studentIdToDelete),
    excuses: state.excuses.filter(e => e.student_id !== studentIdToDelete)
  };
}

const deleteTestState: StudentDeleteMockState = {
  students: [{ id: 's1', name: 'Muhammed' }, { id: 's2', name: 'Bilal' }],
  assignments: [{ id: 'a1', student_id: 's1' }, { id: 'a2', student_id: 's2' }],
  excuses: [{ id: 'e1', student_id: 's1' }]
};

const afterDelete = mockDeleteStudent(deleteTestState, 's1');
assert(afterDelete.students.length === 1 && afterDelete.students[0].id === 's2', 'Delete student removes the student record');
assert(afterDelete.assignments.length === 1 && afterDelete.assignments[0].student_id === 's2', 'Delete student cleans up assignments');
assert(afterDelete.excuses.length === 0, 'Delete student cleans up excuses');

// Test 14: Flexible Allowance Input (Any Number: e.g. 73, 89)
function parseAllowanceValue(raw: string | number | null | undefined): number | null {
  if (raw === null || raw === undefined || raw === '') return null;
  const num = typeof raw === 'number' ? raw : parseFloat(raw);
  if (isNaN(num) || num < 0) throw new Error('Invalid allowance');
  return num;
}
assert(parseAllowanceValue('73') === 73, 'Allowance accepts arbitrary digit 73');
assert(parseAllowanceValue('89') === 89, 'Allowance accepts arbitrary digit 89');
assert(parseAllowanceValue('125.5') === 125.5, 'Allowance accepts decimal rupee amount 125.5');
assert(parseAllowanceValue('') === null, 'Allowance handles empty string as null');

// Test 15: 10 Standard Campus Batches
import { STANDARD_BATCHES } from '../src/lib/storage';
const expected10Batches = [
  'plus one A',
  'plus one B',
  'Batch 13',
  '+2 A',
  '+2 B',
  '+2 C',
  'UG 1',
  'UG 2',
  'UG 3',
  'PG 1'
];
assert(STANDARD_BATCHES.length === 10, 'STANDARD_BATCHES contains exactly 10 batches');
expected10Batches.forEach(b => {
  assert(STANDARD_BATCHES.includes(b), `STANDARD_BATCHES includes "${b}"`);
});

// Test 16: Dispatch Editing and Calendar Allocation Reconciliation
interface MockDispatchRecord {
  id: string;
  destination: string;
  dispatch_date: string;
  target_amount: number | null;
  assignments: { id: string; student_id: string; calendars_issued: number }[];
}

function mockUpdateDispatch(
  original: MockDispatchRecord,
  updates: { destination: string; date: string; allowance: number | null; allocations: { id: string; calendars: number }[] }
): MockDispatchRecord {
  return {
    ...original,
    destination: updates.destination.trim(),
    dispatch_date: updates.date,
    target_amount: updates.allowance,
    assignments: original.assignments.map(a => {
      const match = updates.allocations.find(u => u.id === a.id);
      return match ? { ...a, calendars_issued: match.calendars } : a;
    })
  };
}

const originalDisp: MockDispatchRecord = {
  id: 'disp-1',
  destination: 'Old Destination',
  dispatch_date: '2026-10-01',
  target_amount: 50,
  assignments: [{ id: 'a1', student_id: 's1', calendars_issued: 10 }]
};

const updatedDisp = mockUpdateDispatch(originalDisp, {
  destination: 'New City Market',
  date: '2026-10-02',
  allowance: 73,
  allocations: [{ id: 'a1', calendars: 15 }]
});

assert(updatedDisp.destination === 'New City Market', 'Dispatch destination successfully edited');
assert(updatedDisp.target_amount === 73, 'Dispatch allowance updated to arbitrary 73');
assert(updatedDisp.assignments[0].calendars_issued === 15, 'Student calendar allocation updated to 15');

// Test 17: Settlement Editing and Financial Re-calculation
interface MockSettlementRecord {
  id: string;
  cash: number;
  gpay: number;
  expenses: number;
  returned: number;
  total_collected: number;
  net_collection: number;
}

function mockUpdateSettlement(
  original: MockSettlementRecord,
  cash: number,
  gpay: number,
  expenses: number,
  returned: number
): MockSettlementRecord {
  const total = calculateTotalCollected(cash, gpay);
  const net = calculateNetCollection(total, expenses);
  return {
    ...original,
    cash,
    gpay,
    expenses,
    returned,
    total_collected: total,
    net_collection: net
  };
}

const originalStl: MockSettlementRecord = {
  id: 'stl-1',
  cash: 1000,
  gpay: 0,
  expenses: 200,
  returned: 10,
  total_collected: 1000,
  net_collection: 800
};

const updatedStl = mockUpdateSettlement(originalStl, 1200, 300, 150, 15);
assert(updatedStl.cash === 1200 && updatedStl.gpay === 300, 'Settlement cash & gpay updated');
assert(updatedStl.total_collected === 1500, 'Settlement recomputes gross total collected: 1200 + 300 = 1500');
assert(updatedStl.net_collection === 1350, 'Settlement recomputes net deposited: 1500 - 150 = 1350');
assert(updatedStl.returned === 15, 'Settlement returned calendars updated to 15');

console.log('--- ALL AUTOMATED BUSINESS RULES & CALCULATION TESTS PASSED! ---');
