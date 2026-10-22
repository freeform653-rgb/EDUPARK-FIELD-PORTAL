// Dual-Mode Storage & Data Access Layer for Edupark Field Portal
import { supabase, isSupabaseConfigured } from './supabase';
import {
  Student,
  Dispatch,
  DispatchAssignment,
  Settlement,
  Excuse,
  AuditLog,
  PopulatedDispatch,
  PopulatedSettlement,
  PopulatedExcuse,
  StudentStatus,
  FinancialSummary,
  DashboardMetrics,
  DateFilterType
} from '../types/database';
import {
  calculateTotalCollected,
  calculateNetCollection,
  calculateOutstandingCalendars,
  matchesDateFilter,
  getLocalDateString
} from './calculations';

// LocalStorage Keys
const KEYS = {
  STUDENTS: 'edupark_students_v1',
  DISPATCHES: 'edupark_dispatches_v1',
  ASSIGNMENTS: 'edupark_assignments_v1',
  SETTLEMENTS: 'edupark_settlements_v1',
  EXCUSES: 'edupark_excuses_v1',
  AUDIT_LOGS: 'edupark_audit_logs_v1',
};

// Default Initial Seed Data for Local Mode
const INITIAL_STUDENTS: Student[] = [
  { id: 'std-001', full_name: 'Aisha Rahman', batch: 'Batch 2025-A', phone_number: '+91 98765 43210', is_active: true, created_at: '2026-10-18T09:00:00Z', updated_at: '2026-10-18T09:00:00Z' },
  { id: 'std-002', full_name: 'Bilal Ahmed Khan', batch: 'Batch 2025-A', phone_number: '+91 98765 43211', is_active: true, created_at: '2026-10-18T09:00:00Z', updated_at: '2026-10-18T09:00:00Z' },
  { id: 'std-003', full_name: 'Fathima Zahra', batch: 'Batch 2025-A', phone_number: '+91 98765 43212', is_active: true, created_at: '2026-10-18T09:00:00Z', updated_at: '2026-10-18T09:00:00Z' },
  { id: 'std-004', full_name: 'Zayd Hassan', batch: 'Batch 2025-B', phone_number: '+91 98765 43213', is_active: true, created_at: '2026-10-19T09:00:00Z', updated_at: '2026-10-19T09:00:00Z' },
  { id: 'std-005', full_name: 'Mariam Tariq', batch: 'Batch 2025-B', phone_number: '+91 98765 43214', is_active: true, created_at: '2026-10-19T09:00:00Z', updated_at: '2026-10-19T09:00:00Z' },
  { id: 'std-006', full_name: 'Omar Farooq', batch: 'Batch 2025-B', phone_number: '+91 98765 43215', is_active: true, created_at: '2026-10-19T09:00:00Z', updated_at: '2026-10-19T09:00:00Z' },
  { id: 'std-007', full_name: 'Yusuf Ali', batch: 'Batch 2026-A', phone_number: '+91 98765 43216', is_active: true, created_at: '2026-10-20T09:00:00Z', updated_at: '2026-10-20T09:00:00Z' },
  { id: 'std-008', full_name: 'Hiba Nour', batch: 'Batch 2026-A', phone_number: '+91 98765 43217', is_active: true, created_at: '2026-10-20T09:00:00Z', updated_at: '2026-10-20T09:00:00Z' },
  { id: 'std-009', full_name: 'Salman Qureshi', batch: 'Batch 2026-A', phone_number: '+91 98765 43218', is_active: true, created_at: '2026-10-20T09:00:00Z', updated_at: '2026-10-20T09:00:00Z' },
  { id: 'std-010', full_name: 'Khadija Sayeed', batch: 'Batch 2026-B', phone_number: '+91 98765 43219', is_active: true, created_at: '2026-10-21T09:00:00Z', updated_at: '2026-10-21T09:00:00Z' },
  { id: 'std-011', full_name: 'Hamza Idris', batch: 'Batch 2026-B', phone_number: '+91 98765 43220', is_active: true, created_at: '2026-10-21T09:00:00Z', updated_at: '2026-10-21T09:00:00Z' },
  { id: 'std-012', full_name: 'Zainab Mustafa', batch: 'Batch 2026-B', phone_number: '+91 98765 43221', is_active: true, created_at: '2026-10-21T09:00:00Z', updated_at: '2026-10-21T09:00:00Z' }
];

const today = getLocalDateString();
const yesterday = getLocalDateString(new Date(Date.now() - 86400000));
const threeDaysAgo = getLocalDateString(new Date(Date.now() - 86400000 * 3));

const INITIAL_DISPATCHES: Dispatch[] = [
  {
    id: 'disp-001',
    destination: 'Green Valley Residency, Sector 4',
    dispatch_date: threeDaysAgo,
    target_amount: 5000,
    dispatch_type: 'Individual',
    status: 'Settled',
    notes: 'Door-to-door residential visit in Phase 1',
    created_by: 'admin',
    created_at: `${threeDaysAgo}T09:30:00Z`,
    updated_at: `${threeDaysAgo}T17:00:00Z`
  },
  {
    id: 'disp-002',
    destination: 'Metro Commercial Complex & Market',
    dispatch_date: yesterday,
    target_amount: 12000,
    dispatch_type: 'Team',
    status: 'Settlement Pending',
    notes: 'Commercial shops and wholesale market drive',
    created_by: 'admin',
    created_at: `${yesterday}T09:15:00Z`,
    updated_at: `${yesterday}T18:00:00Z`
  },
  {
    id: 'disp-003',
    destination: 'Sunrise Palm Meadows & Orchid Villas',
    dispatch_date: today,
    target_amount: 15000,
    dispatch_type: 'Team',
    status: 'Dispatched',
    notes: 'Full day field visit to gated township',
    created_by: 'admin',
    created_at: `${today}T08:45:00Z`,
    updated_at: `${today}T08:45:00Z`
  }
];

const INITIAL_ASSIGNMENTS: DispatchAssignment[] = [
  {
    id: 'asgn-001',
    dispatch_id: 'disp-001',
    student_id: 'std-001',
    calendars_issued: 15,
    assignment_status: 'Settled',
    created_at: `${threeDaysAgo}T09:30:00Z`
  },
  {
    id: 'asgn-002',
    dispatch_id: 'disp-002',
    student_id: 'std-002',
    calendars_issued: 20,
    assignment_status: 'Settled',
    created_at: `${yesterday}T09:15:00Z`
  },
  {
    id: 'asgn-003',
    dispatch_id: 'disp-002',
    student_id: 'std-003',
    calendars_issued: 20,
    assignment_status: 'Dispatched',
    created_at: `${yesterday}T09:15:00Z`
  },
  {
    id: 'asgn-004',
    dispatch_id: 'disp-003',
    student_id: 'std-004',
    calendars_issued: 25,
    assignment_status: 'Dispatched',
    created_at: `${today}T08:45:00Z`
  },
  {
    id: 'asgn-005',
    dispatch_id: 'disp-003',
    student_id: 'std-005',
    calendars_issued: 25,
    assignment_status: 'Dispatched',
    created_at: `${today}T08:45:00Z`
  },
  {
    id: 'asgn-006',
    dispatch_id: 'disp-003',
    student_id: 'std-006',
    calendars_issued: 25,
    assignment_status: 'Dispatched',
    created_at: `${today}T08:45:00Z`
  }
];

const INITIAL_SETTLEMENTS: Settlement[] = [
  {
    id: 'stl-001',
    dispatch_assignment_id: 'asgn-001',
    cash_amount: 3200,
    gpay_amount: 2400,
    calendars_returned: 15,
    expenses: 150,
    total_collected: 5600,
    net_collection: 5450,
    settlement_date: threeDaysAgo,
    notes: 'All 15 calendars distributed or returned; auto fare deducted',
    created_by: 'admin',
    created_at: `${threeDaysAgo}T17:00:00Z`,
    updated_at: `${threeDaysAgo}T17:00:00Z`
  },
  {
    id: 'stl-002',
    dispatch_assignment_id: 'asgn-002',
    cash_amount: 4500,
    gpay_amount: 3000,
    calendars_returned: 18,
    expenses: 200,
    total_collected: 7500,
    net_collection: 7300,
    settlement_date: yesterday,
    notes: '2 calendars provided to merchant sponsors; verified by coordinator',
    created_by: 'admin',
    created_at: `${yesterday}T18:00:00Z`,
    updated_at: `${yesterday}T18:00:00Z`
  }
];

const INITIAL_EXCUSES: Excuse[] = [
  {
    id: 'exc-001',
    student_id: 'std-007',
    excuse_date: today,
    reason: 'University Semester Examination',
    notes: 'Official leave application signed by academic dean',
    created_by: 'admin',
    created_at: `${today}T08:00:00Z`,
    updated_at: `${today}T08:00:00Z`
  },
  {
    id: 'exc-002',
    student_id: 'std-008',
    excuse_date: today,
    reason: 'Medical Leave - High Fever',
    notes: 'Prescription slip submitted to administrative desk',
    created_by: 'admin',
    created_at: `${today}T08:15:00Z`,
    updated_at: `${today}T08:15:00Z`
  }
];

const INITIAL_AUDIT_LOGS: AuditLog[] = [
  {
    id: 'aud-001',
    admin_id: 'admin',
    action: 'CREATE_DISPATCH',
    entity_type: 'dispatch',
    entity_id: 'disp-001',
    details: { destination: 'Green Valley Residency, Sector 4', type: 'Individual', students: 1 },
    created_at: `${threeDaysAgo}T09:30:00Z`
  },
  {
    id: 'aud-002',
    admin_id: 'admin',
    action: 'SETTLE_ASSIGNMENT',
    entity_type: 'settlement',
    entity_id: 'stl-001',
    details: { cash: 3200, gpay: 2400, total: 5600, net: 5450, student: 'Aisha Rahman' },
    created_at: `${threeDaysAgo}T17:00:00Z`
  },
  {
    id: 'aud-003',
    admin_id: 'admin',
    action: 'CREATE_DISPATCH',
    entity_type: 'dispatch',
    entity_id: 'disp-003',
    details: { destination: 'Sunrise Palm Meadows & Orchid Villas', type: 'Team', students: 3 },
    created_at: `${today}T08:45:00Z`
  }
];

// Helper to load or initialize from localStorage
function getLocalItem<T>(key: string, defaultValue: T): T {
  try {
    const stored = localStorage.getItem(key);
    if (!stored) {
      localStorage.setItem(key, JSON.stringify(defaultValue));
      return defaultValue;
    }
    return JSON.parse(stored) as T;
  } catch (err) {
    console.error(`Error reading ${key} from localStorage`, err);
    return defaultValue;
  }
}

function setLocalItem<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (err) {
    console.error(`Error writing ${key} to localStorage`, err);
  }
}

/**
 * Repository Engine with transparent Supabase or LocalStorage switching
 */
export const StorageService = {
  // Check whether we are using live Supabase or Local Mode
  isLiveSupabase(): boolean {
    return isSupabaseConfigured();
  },

  // Reset local database to default seed state
  resetToSeed(): void {
    setLocalItem(KEYS.STUDENTS, INITIAL_STUDENTS);
    setLocalItem(KEYS.DISPATCHES, INITIAL_DISPATCHES);
    setLocalItem(KEYS.ASSIGNMENTS, INITIAL_ASSIGNMENTS);
    setLocalItem(KEYS.SETTLEMENTS, INITIAL_SETTLEMENTS);
    setLocalItem(KEYS.EXCUSES, INITIAL_EXCUSES);
    setLocalItem(KEYS.AUDIT_LOGS, INITIAL_AUDIT_LOGS);
  },

  // --------------------------------------------------------------------------
  // STUDENTS CRUD
  // --------------------------------------------------------------------------
  async getStudents(): Promise<Student[]> {
    if (this.isLiveSupabase() && supabase) {
      const { data, error } = await supabase
        .from('students')
        .select('*')
        .order('full_name', { ascending: true });
      if (error) throw error;
      return data || [];
    }
    return getLocalItem<Student[]>(KEYS.STUDENTS, INITIAL_STUDENTS);
  },

  async addStudent(name: string, batch: string, phone?: string): Promise<Student> {
    const trimmedName = name.trim();
    const trimmedBatch = batch.trim();
    if (!trimmedName) throw new Error('Student name is required');
    if (!trimmedBatch) throw new Error('Batch is required');

    const newStudent: Student = {
      id: `std-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      full_name: trimmedName,
      batch: trimmedBatch,
      phone_number: phone?.trim() || null,
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    if (this.isLiveSupabase() && supabase) {
      const { data, error } = await supabase
        .from('students')
        .insert([{
          full_name: newStudent.full_name,
          batch: newStudent.batch,
          phone_number: newStudent.phone_number,
          is_active: true
        }])
        .select()
        .single();
      if (error) throw error;
      await this.logAudit('CREATE_STUDENT', 'students', data.id, { name: trimmedName, batch: trimmedBatch });
      return data;
    }

    const students = await this.getStudents();
    students.push(newStudent);
    setLocalItem(KEYS.STUDENTS, students);
    await this.logAudit('CREATE_STUDENT', 'students', newStudent.id, { name: trimmedName, batch: trimmedBatch });
    return newStudent;
  },

  async updateStudent(id: string, name: string, batch: string, phone?: string): Promise<Student> {
    const trimmedName = name.trim();
    const trimmedBatch = batch.trim();
    if (!trimmedName) throw new Error('Student name is required');
    if (!trimmedBatch) throw new Error('Batch is required');

    if (this.isLiveSupabase() && supabase) {
      const { data, error } = await supabase
        .from('students')
        .update({
          full_name: trimmedName,
          batch: trimmedBatch,
          phone_number: phone?.trim() || null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      await this.logAudit('UPDATE_STUDENT', 'students', id, { name: trimmedName, batch: trimmedBatch });
      return data;
    }

    const students = await this.getStudents();
    const index = students.findIndex(s => s.id === id);
    if (index === -1) throw new Error('Student not found');
    students[index] = {
      ...students[index],
      full_name: trimmedName,
      batch: trimmedBatch,
      phone_number: phone?.trim() || null,
      updated_at: new Date().toISOString(),
    };
    setLocalItem(KEYS.STUDENTS, students);
    await this.logAudit('UPDATE_STUDENT', 'students', id, { name: trimmedName, batch: trimmedBatch });
    return students[index];
  },

  async deactivateStudent(id: string, reason?: string): Promise<void> {
    if (this.isLiveSupabase() && supabase) {
      const { error } = await supabase
        .from('students')
        .update({ is_active: false, updated_at: new Date().toISOString() })
        .eq('id', id);
      if (error) throw error;
      await this.logAudit('DEACTIVATE_STUDENT', 'students', id, { reason });
      return;
    }

    const students = await this.getStudents();
    const index = students.findIndex(s => s.id === id);
    if (index === -1) throw new Error('Student not found');
    students[index].is_active = false;
    students[index].updated_at = new Date().toISOString();
    setLocalItem(KEYS.STUDENTS, students);
    await this.logAudit('DEACTIVATE_STUDENT', 'students', id, { reason });
  },

  async activateStudent(id: string): Promise<void> {
    if (this.isLiveSupabase() && supabase) {
      const { error } = await supabase
        .from('students')
        .update({ is_active: true, updated_at: new Date().toISOString() })
        .eq('id', id);
      if (error) throw error;
      await this.logAudit('ACTIVATE_STUDENT', 'students', id, {});
      return;
    }

    const students = await this.getStudents();
    const index = students.findIndex(s => s.id === id);
    if (index === -1) throw new Error('Student not found');
    students[index].is_active = true;
    students[index].updated_at = new Date().toISOString();
    setLocalItem(KEYS.STUDENTS, students);
    await this.logAudit('ACTIVATE_STUDENT', 'students', id, {});
  },

  // --------------------------------------------------------------------------
  // DISPATCHES & ASSIGNMENTS
  // --------------------------------------------------------------------------
  async getDispatches(): Promise<Dispatch[]> {
    if (this.isLiveSupabase() && supabase) {
      const { data, error } = await supabase
        .from('dispatches')
        .select('*')
        .order('dispatch_date', { ascending: false });
      if (error) throw error;
      return data || [];
    }
    return getLocalItem<Dispatch[]>(KEYS.DISPATCHES, INITIAL_DISPATCHES);
  },

  async getAssignments(): Promise<DispatchAssignment[]> {
    if (this.isLiveSupabase() && supabase) {
      const { data, error } = await supabase
        .from('dispatch_assignments')
        .select('*');
      if (error) throw error;
      return data || [];
    }
    return getLocalItem<DispatchAssignment[]>(KEYS.ASSIGNMENTS, INITIAL_ASSIGNMENTS);
  },

  async createDispatch(
    destination: string,
    dispatchDate: string,
    targetAmount: number | null,
    studentAllocations: { studentId: string; calendarsIssued: number }[],
    notes?: string,
    excusesToRecord?: { studentId: string; reason: string }[]
  ): Promise<Dispatch> {
    const trimmedDest = destination.trim();
    if (!trimmedDest) throw new Error('Destination is required');
    if (!dispatchDate) throw new Error('Dispatch date is required');
    if (!studentAllocations || studentAllocations.length === 0) {
      throw new Error('At least one student must be selected for dispatch');
    }

    // Validate calendars
    for (const alloc of studentAllocations) {
      if (alloc.calendarsIssued < 0 || !Number.isInteger(alloc.calendarsIssued)) {
        throw new Error('Calendars issued must be a non-negative integer');
      }
    }

    // Check for duplicate students in this single dispatch
    const studentIds = studentAllocations.map(a => a.studentId);
    if (new Set(studentIds).size !== studentIds.length) {
      throw new Error('Duplicate student assignments within the same dispatch are not allowed');
    }

    // Conflict Check: Is any student already assigned to an active dispatch on this date, or excused?
    const existingAssignments = await this.getAssignments();
    const dispatches = await this.getDispatches();
    const excuses = await this.getExcuses();

    for (const studentId of studentIds) {
      // Check excuse on this date
      const hasExcuse = excuses.some(
        e => e.student_id === studentId && e.excuse_date === dispatchDate
      );
      if (hasExcuse) {
        const student = (await this.getStudents()).find(s => s.id === studentId);
        throw new Error(
          `Conflict: Student "${student?.full_name || studentId}" is already registered as EXCUSED on ${dispatchDate}.`
        );
      }

      // Check active dispatch on this date
      const activeAssignmentOnDate = existingAssignments.find(a => {
        if (a.student_id !== studentId) return false;
        const parentDispatch = dispatches.find(d => d.id === a.dispatch_id);
        return parentDispatch && parentDispatch.dispatch_date === dispatchDate && parentDispatch.status !== 'Cancelled';
      });

      if (activeAssignmentOnDate) {
        const student = (await this.getStudents()).find(s => s.id === studentId);
        throw new Error(
          `Conflict: Student "${student?.full_name || studentId}" already has a dispatch on ${dispatchDate}.`
        );
      }
    }

    // Determine type: 1 = Individual, >=2 = Team
    const dispatchType = studentAllocations.length === 1 ? 'Individual' : 'Team';
    const dispatchId = `disp-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const nowIso = new Date().toISOString();

    const newDispatch: Dispatch = {
      id: dispatchId,
      destination: trimmedDest,
      dispatch_date: dispatchDate,
      target_amount: targetAmount !== null && targetAmount !== undefined ? Number(targetAmount) : null,
      dispatch_type: dispatchType,
      status: 'Dispatched',
      notes: notes?.trim() || null,
      created_by: 'admin',
      created_at: nowIso,
      updated_at: nowIso,
    };

    const newAssignments: DispatchAssignment[] = studentAllocations.map((alloc, idx) => ({
      id: `asgn-${Date.now()}-${idx}-${Math.random().toString(36).substring(2, 6)}`,
      dispatch_id: dispatchId,
      student_id: alloc.studentId,
      calendars_issued: alloc.calendarsIssued,
      assignment_status: 'Dispatched',
      created_at: nowIso,
    }));

    if (this.isLiveSupabase() && supabase) {
      // Create dispatch in Supabase
      const { data: createdDispatch, error: dispError } = await supabase
        .from('dispatches')
        .insert([{
          destination: newDispatch.destination,
          dispatch_date: newDispatch.dispatch_date,
          target_amount: newDispatch.target_amount,
          dispatch_type: newDispatch.dispatch_type,
          status: newDispatch.status,
          notes: newDispatch.notes
        }])
        .select()
        .single();
      if (dispError) throw dispError;

      // Create assignments
      const assignmentsPayload = studentAllocations.map(alloc => ({
        dispatch_id: createdDispatch.id,
        student_id: alloc.studentId,
        calendars_issued: alloc.calendarsIssued,
        assignment_status: 'Dispatched'
      }));

      const { error: asgnError } = await supabase
        .from('dispatch_assignments')
        .insert(assignmentsPayload);
      if (asgnError) throw asgnError;

      // Handle optional excuses in the form
      if (excusesToRecord && excusesToRecord.length > 0) {
        for (const exc of excusesToRecord) {
          if (exc.studentId && exc.reason) {
            await this.recordExcuse(exc.studentId, dispatchDate, exc.reason);
          }
        }
      }

      await this.logAudit('CREATE_DISPATCH', 'dispatches', createdDispatch.id, {
        destination: trimmedDest,
        type: dispatchType,
        studentCount: studentAllocations.length,
        totalCalendars: studentAllocations.reduce((sum, a) => sum + a.calendarsIssued, 0)
      });

      return createdDispatch;
    }

    // Local Mode
    const dispatchesList = await this.getDispatches();
    const assignmentsList = await this.getAssignments();

    dispatchesList.unshift(newDispatch);
    assignmentsList.push(...newAssignments);

    setLocalItem(KEYS.DISPATCHES, dispatchesList);
    setLocalItem(KEYS.ASSIGNMENTS, assignmentsList);

    // Record any excuses included
    if (excusesToRecord && excusesToRecord.length > 0) {
      for (const exc of excusesToRecord) {
        if (exc.studentId && exc.reason) {
          await this.recordExcuse(exc.studentId, dispatchDate, exc.reason);
        }
      }
    }

    await this.logAudit('CREATE_DISPATCH', 'dispatches', newDispatch.id, {
      destination: trimmedDest,
      type: dispatchType,
      studentCount: studentAllocations.length,
      totalCalendars: studentAllocations.reduce((sum, a) => sum + a.calendarsIssued, 0)
    });

    return newDispatch;
  },

  // --------------------------------------------------------------------------
  // SETTLEMENTS CRUD
  // --------------------------------------------------------------------------
  async getSettlements(): Promise<Settlement[]> {
    if (this.isLiveSupabase() && supabase) {
      const { data, error } = await supabase
        .from('settlements')
        .select('*')
        .order('settlement_date', { ascending: false });
      if (error) throw error;
      return data || [];
    }
    return getLocalItem<Settlement[]>(KEYS.SETTLEMENTS, INITIAL_SETTLEMENTS);
  },

  async createSettlement(
    assignmentId: string,
    cashAmount: number,
    gpayAmount: number,
    calendarsReturned: number,
    expenses: number,
    settlementDate: string,
    notes?: string
  ): Promise<Settlement> {
    // Basic validation
    const cash = Math.max(0, isNaN(cashAmount) ? 0 : cashAmount);
    const gpay = Math.max(0, isNaN(gpayAmount) ? 0 : gpayAmount);
    const exp = Math.max(0, isNaN(expenses) ? 0 : expenses);
    const returned = Math.max(0, isNaN(calendarsReturned) ? 0 : calendarsReturned);

    if (returned < 0 || !Number.isInteger(returned)) {
      throw new Error('Calendars returned must be a non-negative integer');
    }

    // Verify assignment exists and is not already settled
    const assignments = await this.getAssignments();
    const assignment = assignments.find(a => a.id === assignmentId);
    if (!assignment) throw new Error('Dispatch assignment not found');

    if (assignment.assignment_status === 'Settled') {
      throw new Error('This student assignment has already been settled');
    }

    // Check calendars returned cannot exceed issued
    if (returned > assignment.calendars_issued) {
      throw new Error(
        `Returned calendars (${returned}) cannot exceed issued quantity (${assignment.calendars_issued}) for this student.`
      );
    }

    const totalCollected = calculateTotalCollected(cash, gpay);
    const netCollection = calculateNetCollection(totalCollected, exp);
    const nowIso = new Date().toISOString();

    const newSettlement: Settlement = {
      id: `stl-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      dispatch_assignment_id: assignmentId,
      cash_amount: cash,
      gpay_amount: gpay,
      calendars_returned: returned,
      expenses: exp,
      total_collected: totalCollected,
      net_collection: netCollection,
      settlement_date: settlementDate || getLocalDateString(),
      notes: notes?.trim() || null,
      created_by: 'admin',
      created_at: nowIso,
      updated_at: nowIso,
    };

    if (this.isLiveSupabase() && supabase) {
      const { data, error } = await supabase
        .from('settlements')
        .insert([{
          dispatch_assignment_id: assignmentId,
          cash_amount: cash,
          gpay_amount: gpay,
          calendars_returned: returned,
          expenses: exp,
          settlement_date: newSettlement.settlement_date,
          notes: newSettlement.notes
        }])
        .select()
        .single();
      if (error) throw error;

      await this.logAudit('SETTLE_ASSIGNMENT', 'settlements', data.id, {
        assignmentId,
        cash,
        gpay,
        total: totalCollected,
        expenses: exp,
        net: netCollection
      });

      return data;
    }

    // Local Mode
    const settlements = await this.getSettlements();
    settlements.unshift(newSettlement);
    setLocalItem(KEYS.SETTLEMENTS, settlements);

    // Update assignment status to Settled
    const asgnIndex = assignments.findIndex(a => a.id === assignmentId);
    if (asgnIndex !== -1) {
      assignments[asgnIndex].assignment_status = 'Settled';
      setLocalItem(KEYS.ASSIGNMENTS, assignments);

      // Re-evaluate parent dispatch status
      const dispatchId = assignments[asgnIndex].dispatch_id;
      const allDispatchAssignments = assignments.filter(a => a.dispatch_id === dispatchId);
      const allSettled = allDispatchAssignments.every(a => a.assignment_status === 'Settled');
      const anySettled = allDispatchAssignments.some(a => a.assignment_status === 'Settled');

      const dispatches = await this.getDispatches();
      const dispIndex = dispatches.findIndex(d => d.id === dispatchId);
      if (dispIndex !== -1) {
        if (allSettled) {
          dispatches[dispIndex].status = 'Settled';
        } else if (anySettled) {
          dispatches[dispIndex].status = 'Settlement Pending';
        }
        dispatches[dispIndex].updated_at = nowIso;
        setLocalItem(KEYS.DISPATCHES, dispatches);
      }
    }

    await this.logAudit('SETTLE_ASSIGNMENT', 'settlements', newSettlement.id, {
      assignmentId,
      cash,
      gpay,
      total: totalCollected,
      expenses: exp,
      net: netCollection
    });

    return newSettlement;
  },

  // --------------------------------------------------------------------------
  // EXCUSES CRUD
  // --------------------------------------------------------------------------
  async getExcuses(): Promise<Excuse[]> {
    if (this.isLiveSupabase() && supabase) {
      const { data, error } = await supabase
        .from('excuses')
        .select('*')
        .order('excuse_date', { ascending: false });
      if (error) throw error;
      return data || [];
    }
    return getLocalItem<Excuse[]>(KEYS.EXCUSES, INITIAL_EXCUSES);
  },

  async recordExcuse(studentId: string, excuseDate: string, reason: string, notes?: string): Promise<Excuse> {
    const trimmedReason = reason.trim();
    if (!studentId) throw new Error('Student is required');
    if (!excuseDate) throw new Error('Excuse date is required');
    if (!trimmedReason) throw new Error('Excuse reason is required');

    // Conflict Check: Check if student has an active dispatch on this date
    const assignments = await this.getAssignments();
    const dispatches = await this.getDispatches();
    const activeDispatchOnDate = assignments.find(a => {
      if (a.student_id !== studentId) return false;
      const d = dispatches.find(disp => disp.id === a.dispatch_id);
      return d && d.dispatch_date === excuseDate && d.status !== 'Cancelled';
    });

    if (activeDispatchOnDate) {
      throw new Error('Conflict: Cannot excuse a student who already has an active dispatch on this date.');
    }

    // Check duplicate excuse
    const excuses = await this.getExcuses();
    const existingExcuse = excuses.find(e => e.student_id === studentId && e.excuse_date === excuseDate);
    if (existingExcuse) {
      throw new Error('This student is already marked as excused for this date.');
    }

    const nowIso = new Date().toISOString();
    const newExcuse: Excuse = {
      id: `exc-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      student_id: studentId,
      excuse_date: excuseDate,
      reason: trimmedReason,
      notes: notes?.trim() || null,
      created_by: 'admin',
      created_at: nowIso,
      updated_at: nowIso,
    };

    if (this.isLiveSupabase() && supabase) {
      const { data, error } = await supabase
        .from('excuses')
        .insert([{
          student_id: studentId,
          excuse_date: excuseDate,
          reason: trimmedReason,
          notes: newExcuse.notes
        }])
        .select()
        .single();
      if (error) throw error;
      await this.logAudit('RECORD_EXCUSE', 'excuses', data.id, { studentId, date: excuseDate, reason });
      return data;
    }

    excuses.unshift(newExcuse);
    setLocalItem(KEYS.EXCUSES, excuses);
    await this.logAudit('RECORD_EXCUSE', 'excuses', newExcuse.id, { studentId, date: excuseDate, reason });
    return newExcuse;
  },

  async deleteExcuse(id: string): Promise<void> {
    if (this.isLiveSupabase() && supabase) {
      const { error } = await supabase.from('excuses').delete().eq('id', id);
      if (error) throw error;
      await this.logAudit('DELETE_EXCUSE', 'excuses', id, {});
      return;
    }

    const excuses = await this.getExcuses();
    const filtered = excuses.filter(e => e.id !== id);
    setLocalItem(KEYS.EXCUSES, filtered);
    await this.logAudit('DELETE_EXCUSE', 'excuses', id, {});
  },

  // --------------------------------------------------------------------------
  // AUDIT LOGS
  // --------------------------------------------------------------------------
  async getAuditLogs(): Promise<AuditLog[]> {
    if (this.isLiveSupabase() && supabase) {
      const { data, error } = await supabase
        .from('audit_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);
      if (error) throw error;
      return data || [];
    }
    return getLocalItem<AuditLog[]>(KEYS.AUDIT_LOGS, INITIAL_AUDIT_LOGS);
  },

  async logAudit(action: string, entityType: string, entityId: string, details: Record<string, any>): Promise<void> {
    const entry: AuditLog = {
      id: `aud-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      admin_id: 'admin@edupark.edu',
      action,
      entity_type: entityType,
      entity_id: entityId,
      details,
      created_at: new Date().toISOString()
    };

    if (this.isLiveSupabase() && supabase) {
      await supabase.from('audit_logs').insert([entry]);
      return;
    }

    const logs = getLocalItem<AuditLog[]>(KEYS.AUDIT_LOGS, INITIAL_AUDIT_LOGS);
    logs.unshift(entry);
    setLocalItem(KEYS.AUDIT_LOGS, logs.slice(0, 200));
  },

  // --------------------------------------------------------------------------
  // POPULATED & AGGREGATED QUERIES
  // --------------------------------------------------------------------------
  async getPopulatedDispatches(): Promise<PopulatedDispatch[]> {
    const [dispatches, assignments, students, settlements] = await Promise.all([
      this.getDispatches(),
      this.getAssignments(),
      this.getStudents(),
      this.getSettlements(),
    ]);

    const studentMap = new Map<string, Student>(students.map(s => [s.id, s]));
    const settlementMap = new Map<string, Settlement>(
      settlements.map(stl => [stl.dispatch_assignment_id, stl])
    );

    return dispatches.map(dispatch => {
      const dispatchAssignments = assignments.filter(a => a.dispatch_id === dispatch.id);

      const populatedAssignments = dispatchAssignments.map(a => ({
        ...a,
        student: studentMap.get(a.student_id) || {
          id: a.student_id,
          full_name: 'Unknown Student',
          batch: 'N/A',
          phone_number: null,
          is_active: true,
          created_at: '',
          updated_at: '',
        },
        settlement: settlementMap.get(a.id) || null,
      }));

      const settledStudents = populatedAssignments.filter(a => a.assignment_status === 'Settled').length;
      const totalIssued = populatedAssignments.reduce((sum, a) => sum + (a.calendars_issued || 0), 0);
      const totalReturned = populatedAssignments.reduce(
        (sum, a) => sum + (a.settlement?.calendars_returned || 0),
        0
      );
      const totalCollected = populatedAssignments.reduce(
        (sum, a) => sum + (a.settlement?.total_collected || 0),
        0
      );
      const netCollection = populatedAssignments.reduce(
        (sum, a) => sum + (a.settlement?.net_collection || 0),
        0
      );

      return {
        ...dispatch,
        assignments: populatedAssignments,
        total_students: populatedAssignments.length,
        settled_students: settledStudents,
        total_calendars_issued: totalIssued,
        total_calendars_returned: totalReturned,
        total_collected: totalCollected,
        net_collection: netCollection,
      };
    });
  },

  async getPopulatedSettlements(): Promise<PopulatedSettlement[]> {
    const [settlements, assignments, students, dispatches] = await Promise.all([
      this.getSettlements(),
      this.getAssignments(),
      this.getStudents(),
      this.getDispatches(),
    ]);

    const assignmentMap = new Map<string, DispatchAssignment>(assignments.map(a => [a.id, a]));
    const studentMap = new Map<string, Student>(students.map(s => [s.id, s]));
    const dispatchMap = new Map<string, Dispatch>(dispatches.map(d => [d.id, d]));

    return settlements.map(settlement => {
      const assignment = assignmentMap.get(settlement.dispatch_assignment_id);
      const student = assignment
        ? studentMap.get(assignment.student_id)
        : undefined;
      const dispatch = assignment
        ? dispatchMap.get(assignment.dispatch_id)
        : undefined;

      return {
        ...settlement,
        assignment: assignment || {
          id: settlement.dispatch_assignment_id,
          dispatch_id: '',
          student_id: '',
          calendars_issued: 0,
          assignment_status: 'Settled',
          created_at: settlement.created_at,
        },
        student: student || {
          id: 'unknown',
          full_name: 'Unknown Student',
          batch: 'N/A',
          phone_number: null,
          is_active: true,
          created_at: '',
          updated_at: '',
        },
        dispatch: dispatch || {
          id: 'unknown',
          destination: 'Unknown Destination',
          dispatch_date: settlement.settlement_date,
          target_amount: 0,
          dispatch_type: 'Individual',
          status: 'Settled',
          notes: null,
          created_by: 'admin',
          created_at: '',
          updated_at: '',
        },
      };
    });
  },

  async getPopulatedExcuses(): Promise<PopulatedExcuse[]> {
    const [excuses, students] = await Promise.all([this.getExcuses(), this.getStudents()]);
    const studentMap = new Map<string, Student>(students.map(s => [s.id, s]));

    return excuses.map(excuse => ({
      ...excuse,
      student: studentMap.get(excuse.student_id) || {
        id: excuse.student_id,
        full_name: 'Unknown Student',
        batch: 'N/A',
        phone_number: null,
        is_active: true,
        created_at: '',
        updated_at: '',
      },
    }));
  },

  /**
   * Derive dynamic student status:
   * Available | Dispatched | Settlement Pending | Excused | Inactive
   */
  async getStudentsWithComputedStatus(selectedDate?: string): Promise<Student[]> {
    const dateToCheck = selectedDate || getLocalDateString();
    const [students, assignments, dispatches, excuses] = await Promise.all([
      this.getStudents(),
      this.getAssignments(),
      this.getDispatches(),
      this.getExcuses(),
    ]);

    const dispatchMap = new Map<string, Dispatch>(dispatches.map(d => [d.id, d]));

    return students.map(student => {
      let status: StudentStatus = 'Available';

      if (!student.is_active) {
        status = 'Inactive';
        return { ...student, current_status: status };
      }

      // Check if excused on target date
      const isExcused = excuses.some(
        e => e.student_id === student.id && e.excuse_date === dateToCheck
      );
      if (isExcused) {
        status = 'Excused';
        return { ...student, current_status: status };
      }

      // Find student assignments
      const studentAssignments = assignments.filter(a => a.student_id === student.id);

      // Check if student is actively dispatched on selected date
      const onDateDispatch = studentAssignments.find(a => {
        const d = dispatchMap.get(a.dispatch_id);
        return d && d.dispatch_date === dateToCheck && d.status !== 'Cancelled';
      });

      if (onDateDispatch) {
        status = onDateDispatch.assignment_status === 'Settled' ? 'Available' : 'Dispatched';
      } else {
        // Check if student has pending settlement from earlier
        const hasPendingSettlement = studentAssignments.some(a => {
          const d = dispatchMap.get(a.dispatch_id);
          return d && d.status !== 'Cancelled' && a.assignment_status === 'Dispatched';
        });

        if (hasPendingSettlement) {
          status = 'Settlement Pending';
        }
      }

      return {
        ...student,
        current_status: status,
      };
    });
  },

  /**
   * Calculate aggregated dashboard metrics with date filtering
   */
  async getDashboardMetrics(
    dateFilter: DateFilterType = 'all',
    customStart?: string,
    customEnd?: string
  ): Promise<DashboardMetrics> {
    const [students, dispatches, assignments, settlements, excuses] = await Promise.all([
      this.getStudents(),
      this.getDispatches(),
      this.getAssignments(),
      this.getSettlements(),
      this.getExcuses(),
    ]);

    const activeStudents = students.filter(s => s.is_active);
    const totalActiveStudents = activeStudents.length;

    // Filter dispatches by date
    const filteredDispatches = dispatches.filter(d =>
      matchesDateFilter(d.dispatch_date, dateFilter, customStart, customEnd)
    );
    const filteredDispatchIds = new Set(filteredDispatches.map(d => d.id));

    // Filter assignments that belong to the filtered dispatches
    const relevantAssignments = assignments.filter(a => filteredDispatchIds.has(a.dispatch_id));

    // Filter settlements by settlement_date
    const filteredSettlements = settlements.filter(s =>
      matchesDateFilter(s.settlement_date, dateFilter, customStart, customEnd)
    );

    // Filter excuses by excuse_date
    const filteredExcuses = excuses.filter(e =>
      matchesDateFilter(e.excuse_date, dateFilter, customStart, customEnd)
    );

    // 1. Unique students currently assigned to active unsettled field dispatches
    const dispatchedStudentIds = new Set<string>();
    relevantAssignments.forEach(a => {
      if (a.assignment_status === 'Dispatched') {
        const parent = dispatches.find(d => d.id === a.dispatch_id);
        if (parent && parent.status !== 'Cancelled') {
          dispatchedStudentIds.add(a.student_id);
        }
      }
    });

    // 2. Financial totals from confirmed settlements
    const totalCash = filteredSettlements.reduce((sum, s) => sum + s.cash_amount, 0);
    const totalGPay = filteredSettlements.reduce((sum, s) => sum + s.gpay_amount, 0);
    const totalExpenses = filteredSettlements.reduce((sum, s) => sum + s.expenses, 0);
    const totalCollected = calculateTotalCollected(totalCash, totalGPay);
    const netCollection = calculateNetCollection(totalCollected, totalExpenses);

    // Target amount of pending dispatches
    const pendingTarget = filteredDispatches
      .filter(d => d.status === 'Dispatched' || d.status === 'Settlement Pending')
      .reduce((sum, d) => sum + (d.target_amount || 0), 0);

    // 3. Unique excused students
    const uniqueExcusedStudentIds = new Set(filteredExcuses.map(e => e.student_id));

    // 4. Physical Calendars
    const calendarsIssued = relevantAssignments.reduce((sum, a) => sum + (a.calendars_issued || 0), 0);
    const relevantAssignmentIds = new Set(relevantAssignments.map(a => a.id));
    const settlementsForRelevant = settlements.filter(s => relevantAssignmentIds.has(s.dispatch_assignment_id));
    const calendarsReturned = settlementsForRelevant.reduce((sum, s) => sum + (s.calendars_returned || 0), 0);
    const calendarsOutstanding = calculateOutstandingCalendars(calendarsIssued, calendarsReturned);

    // Counts
    const activeDispatchesCount = filteredDispatches.filter(
      d => d.status === 'Dispatched' || d.status === 'Settlement Pending'
    ).length;
    const completedSettlementsCount = filteredSettlements.length;
    const pendingSettlementsCount = relevantAssignments.filter(a => a.assignment_status === 'Dispatched').length;

    return {
      dispatchedStudentsCount: dispatchedStudentIds.size,
      totalAmountCollected: totalCollected,
      pendingAmountTarget: pendingTarget,
      excusedStudentsCount: uniqueExcusedStudentIds.size,
      totalActiveStudents,
      totalActiveDispatches: activeDispatchesCount,
      completedSettlementsCount,
      pendingSettlementsCount,
      calendarsIssued,
      calendarsReturned,
      calendarsOutstanding,
      totalExpenses,
      netCollection,
    };
  },

  /**
   * Filtered Financial and Calendar Summary
   */
  async getFilteredFinancialSummary(
    dateFilter: DateFilterType = 'all',
    customStart?: string,
    customEnd?: string,
    batchFilter?: string,
    destinationFilter?: string
  ): Promise<FinancialSummary> {
    const populatedSettlements = await this.getPopulatedSettlements();

    const filtered = populatedSettlements.filter(item => {
      if (!matchesDateFilter(item.settlement_date, dateFilter, customStart, customEnd)) return false;
      if (batchFilter && item.student.batch !== batchFilter) return false;
      if (destinationFilter && !item.dispatch.destination.toLowerCase().includes(destinationFilter.toLowerCase())) return false;
      return true;
    });

    const totalCash = filtered.reduce((sum, s) => sum + s.cash_amount, 0);
    const totalGPay = filtered.reduce((sum, s) => sum + s.gpay_amount, 0);
    const totalExpenses = filtered.reduce((sum, s) => sum + s.expenses, 0);
    const totalCollected = calculateTotalCollected(totalCash, totalGPay);
    const netCollection = calculateNetCollection(totalCollected, totalExpenses);

    const calendarsIssued = filtered.reduce((sum, s) => sum + (s.assignment.calendars_issued || 0), 0);
    const calendarsReturned = filtered.reduce((sum, s) => sum + (s.calendars_returned || 0), 0);
    const outstandingCalendars = calculateOutstandingCalendars(calendarsIssued, calendarsReturned);

    return {
      totalCash,
      totalGPay,
      totalCollected,
      totalExpenses,
      netCollection,
      calendarsIssued,
      calendarsReturned,
      outstandingCalendars,
    };
  }
};
