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

// Standard Campus Batches requested by administration
export const STANDARD_BATCHES = ['plus one A', 'plus one B', 'Batch 13'];

// LocalStorage Keys - Clean V2 (Empty initial state)
const KEYS = {
  STUDENTS: 'edupark_students_v2_clean',
  DISPATCHES: 'edupark_dispatches_v2_clean',
  ASSIGNMENTS: 'edupark_assignments_v2_clean',
  SETTLEMENTS: 'edupark_settlements_v2_clean',
  EXCUSES: 'edupark_excuses_v2_clean',
  AUDIT_LOGS: 'edupark_audit_logs_v2_clean',
};

// Clean up old demo keys if present
if (typeof window !== 'undefined') {
  try {
    localStorage.removeItem('edupark_students_v1');
    localStorage.removeItem('edupark_dispatches_v1');
    localStorage.removeItem('edupark_assignments_v1');
    localStorage.removeItem('edupark_settlements_v1');
    localStorage.removeItem('edupark_excuses_v1');
    localStorage.removeItem('edupark_audit_logs_v1');
  } catch {
    // Ignore in non-browser environments
  }
}

// Default Clean Empty Seed State (Zero Demo Data)
const INITIAL_STUDENTS: Student[] = [];
const INITIAL_DISPATCHES: Dispatch[] = [];
const INITIAL_ASSIGNMENTS: DispatchAssignment[] = [];
const INITIAL_SETTLEMENTS: Settlement[] = [];
const INITIAL_EXCUSES: Excuse[] = [];
const INITIAL_AUDIT_LOGS: AuditLog[] = [];

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

export function isTableMissingError(error: any): boolean {
  return Boolean(error && (error.code === 'PGRST205' || error.message?.includes('schema cache')));
}

/**
 * Repository Engine with transparent Supabase or LocalStorage switching
 */
export const StorageService = {
  isLiveSupabase(): boolean {
    return isSupabaseConfigured();
  },

  // Completely wipe all local data to start fresh
  clearAllData(): void {
    setLocalItem(KEYS.STUDENTS, []);
    setLocalItem(KEYS.DISPATCHES, []);
    setLocalItem(KEYS.ASSIGNMENTS, []);
    setLocalItem(KEYS.SETTLEMENTS, []);
    setLocalItem(KEYS.EXCUSES, []);
    setLocalItem(KEYS.AUDIT_LOGS, []);
  },

  // Alias for backward compatibility
  resetToSeed(): void {
    this.clearAllData();
  },

  // --------------------------------------------------------------------------
  // STUDENTS CRUD
  // --------------------------------------------------------------------------
  async getStudents(): Promise<Student[]> {
    if (this.isLiveSupabase() && supabase) {
      try {
        const { data, error } = await supabase
          .from('students')
          .select('*')
          .order('full_name', { ascending: true });
        if (error) {
          if (isTableMissingError(error)) {
            console.warn('[Edupark] Supabase table "students" not found. Falling back to local store.');
            return getLocalItem<Student[]>(KEYS.STUDENTS, INITIAL_STUDENTS);
          }
          throw error;
        }
        return data || [];
      } catch (err: any) {
        if (isTableMissingError(err)) return getLocalItem<Student[]>(KEYS.STUDENTS, INITIAL_STUDENTS);
        throw err;
      }
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
      if (error) {
        if (isTableMissingError(error)) {
          throw new Error('Supabase tables have not been created yet. Please execute the SQL from supabase/schema.sql in your Supabase SQL Editor.');
        }
        throw error;
      }
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
      try {
        const { data, error } = await supabase
          .from('dispatches')
          .select('*')
          .order('dispatch_date', { ascending: false });
        if (error) {
          if (isTableMissingError(error)) return getLocalItem<Dispatch[]>(KEYS.DISPATCHES, INITIAL_DISPATCHES);
          throw error;
        }
        return data || [];
      } catch (err: any) {
        if (isTableMissingError(err)) return getLocalItem<Dispatch[]>(KEYS.DISPATCHES, INITIAL_DISPATCHES);
        throw err;
      }
    }
    return getLocalItem<Dispatch[]>(KEYS.DISPATCHES, INITIAL_DISPATCHES);
  },

  async getAssignments(): Promise<DispatchAssignment[]> {
    if (this.isLiveSupabase() && supabase) {
      try {
        const { data, error } = await supabase
          .from('dispatch_assignments')
          .select('*');
        if (error) {
          if (isTableMissingError(error)) return getLocalItem<DispatchAssignment[]>(KEYS.ASSIGNMENTS, INITIAL_ASSIGNMENTS);
          throw error;
        }
        return data || [];
      } catch (err: any) {
        if (isTableMissingError(err)) return getLocalItem<DispatchAssignment[]>(KEYS.ASSIGNMENTS, INITIAL_ASSIGNMENTS);
        throw err;
      }
    }
    return getLocalItem<DispatchAssignment[]>(KEYS.ASSIGNMENTS, INITIAL_ASSIGNMENTS);
  },

  async createDispatch(
    destination: string,
    dispatchDate: string,
    travelAdvance: number | null, // Campus Allowance for Travel & Food
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

    const advanceValue = travelAdvance !== null && travelAdvance !== undefined ? Number(travelAdvance) : null;

    const newDispatch: Dispatch = {
      id: dispatchId,
      destination: trimmedDest,
      dispatch_date: dispatchDate,
      target_amount: advanceValue, // Campus Allowance for Travel & Food
      advance_amount: advanceValue,
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
        travelAdvance: advanceValue,
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
      travelAdvance: advanceValue,
      totalCalendars: studentAllocations.reduce((sum, a) => sum + a.calendarsIssued, 0)
    });

    return newDispatch;
  },

  // --------------------------------------------------------------------------
  // SETTLEMENTS CRUD
  // --------------------------------------------------------------------------
  async getSettlements(): Promise<Settlement[]> {
    if (this.isLiveSupabase() && supabase) {
      try {
        const { data, error } = await supabase
          .from('settlements')
          .select('*')
          .order('settlement_date', { ascending: false });
        if (error) {
          if (isTableMissingError(error)) return getLocalItem<Settlement[]>(KEYS.SETTLEMENTS, INITIAL_SETTLEMENTS);
          throw error;
        }
        return data || [];
      } catch (err: any) {
        if (isTableMissingError(err)) return getLocalItem<Settlement[]>(KEYS.SETTLEMENTS, INITIAL_SETTLEMENTS);
        throw err;
      }
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
    const cash = Math.max(0, isNaN(cashAmount) ? 0 : cashAmount);
    const gpay = Math.max(0, isNaN(gpayAmount) ? 0 : gpayAmount);
    const exp = Math.max(0, isNaN(expenses) ? 0 : expenses);
    const returned = Math.max(0, isNaN(calendarsReturned) ? 0 : calendarsReturned);

    if (returned < 0 || !Number.isInteger(returned)) {
      throw new Error('Calendars returned must be a non-negative integer');
    }

    const assignments = await this.getAssignments();
    const assignment = assignments.find(a => a.id === assignmentId);
    if (!assignment) throw new Error('Dispatch assignment not found');

    if (assignment.assignment_status === 'Settled') {
      throw new Error('This student assignment has already been settled');
    }

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

    const asgnIndex = assignments.findIndex(a => a.id === assignmentId);
    if (asgnIndex !== -1) {
      assignments[asgnIndex].assignment_status = 'Settled';
      setLocalItem(KEYS.ASSIGNMENTS, assignments);

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
      try {
        const { data, error } = await supabase
          .from('excuses')
          .select('*')
          .order('excuse_date', { ascending: false });
        if (error) {
          if (isTableMissingError(error)) return getLocalItem<Excuse[]>(KEYS.EXCUSES, INITIAL_EXCUSES);
          throw error;
        }
        return data || [];
      } catch (err: any) {
        if (isTableMissingError(err)) return getLocalItem<Excuse[]>(KEYS.EXCUSES, INITIAL_EXCUSES);
        throw err;
      }
    }
    return getLocalItem<Excuse[]>(KEYS.EXCUSES, INITIAL_EXCUSES);
  },

  async recordExcuse(studentId: string, excuseDate: string, reason: string, notes?: string): Promise<Excuse> {
    const trimmedReason = reason.trim();
    if (!studentId) throw new Error('Student is required');
    if (!excuseDate) throw new Error('Excuse date is required');
    if (!trimmedReason) throw new Error('Excuse reason is required');

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
      try {
        const { data, error } = await supabase
          .from('audit_logs')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(100);
        if (error) {
          if (isTableMissingError(error)) return getLocalItem<AuditLog[]>(KEYS.AUDIT_LOGS, INITIAL_AUDIT_LOGS);
          throw error;
        }
        return data || [];
      } catch (err: any) {
        if (isTableMissingError(err)) return getLocalItem<AuditLog[]>(KEYS.AUDIT_LOGS, INITIAL_AUDIT_LOGS);
        throw err;
      }
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
        total_advance: dispatch.target_amount || 0,
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
      let excuseReason: string | undefined = undefined;

      if (!student.is_active) {
        status = 'Inactive';
        return { ...student, current_status: status };
      }

      // Check if excused on target date
      const activeExcuse = excuses.find(
        e => e.student_id === student.id && e.excuse_date === dateToCheck
      );
      if (activeExcuse) {
        status = 'Excused';
        excuseReason = activeExcuse.reason;
        return { ...student, current_status: status, excuse_reason: excuseReason };
      }

      const studentAssignments = assignments.filter(a => a.student_id === student.id);

      const onDateDispatch = studentAssignments.find(a => {
        const d = dispatchMap.get(a.dispatch_id);
        return d && d.dispatch_date === dateToCheck && d.status !== 'Cancelled';
      });

      if (onDateDispatch) {
        status = onDateDispatch.assignment_status === 'Settled' ? 'Available' : 'Dispatched';
      } else {
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

    const filteredDispatches = dispatches.filter(d =>
      matchesDateFilter(d.dispatch_date, dateFilter, customStart, customEnd)
    );
    const filteredDispatchIds = new Set(filteredDispatches.map(d => d.id));

    const relevantAssignments = assignments.filter(a => filteredDispatchIds.has(a.dispatch_id));

    const filteredSettlements = settlements.filter(s =>
      matchesDateFilter(s.settlement_date, dateFilter, customStart, customEnd)
    );

    const filteredExcuses = excuses.filter(e =>
      matchesDateFilter(e.excuse_date, dateFilter, customStart, customEnd)
    );

    const dispatchedStudentIds = new Set<string>();
    relevantAssignments.forEach(a => {
      if (a.assignment_status === 'Dispatched') {
        const parent = dispatches.find(d => d.id === a.dispatch_id);
        if (parent && parent.status !== 'Cancelled') {
          dispatchedStudentIds.add(a.student_id);
        }
      }
    });

    const totalCash = filteredSettlements.reduce((sum, s) => sum + s.cash_amount, 0);
    const totalGPay = filteredSettlements.reduce((sum, s) => sum + s.gpay_amount, 0);
    const totalExpenses = filteredSettlements.reduce((sum, s) => sum + s.expenses, 0);
    const totalCollected = calculateTotalCollected(totalCash, totalGPay);
    const netCollection = calculateNetCollection(totalCollected, totalExpenses);

    // Total Allowance given by the campus for dispatches in this period
    const totalAdvancesGiven = filteredDispatches
      .reduce((sum, d) => sum + (d.target_amount || 0), 0);

    const uniqueExcusedStudentIds = new Set(filteredExcuses.map(e => e.student_id));

    const calendarsIssued = relevantAssignments.reduce((sum, a) => sum + (a.calendars_issued || 0), 0);
    const relevantAssignmentIds = new Set(relevantAssignments.map(a => a.id));
    const settlementsForRelevant = settlements.filter(s => relevantAssignmentIds.has(s.dispatch_assignment_id));
    const calendarsReturned = settlementsForRelevant.reduce((sum, s) => sum + (s.calendars_returned || 0), 0);
    const calendarsOutstanding = calculateOutstandingCalendars(calendarsIssued, calendarsReturned);

    const activeDispatchesCount = filteredDispatches.filter(
      d => d.status === 'Dispatched' || d.status === 'Settlement Pending'
    ).length;
    const completedSettlementsCount = filteredSettlements.length;
    const pendingSettlementsCount = relevantAssignments.filter(a => a.assignment_status === 'Dispatched').length;

    return {
      dispatchedStudentsCount: dispatchedStudentIds.size,
      totalAmountCollected: totalCollected,
      totalAdvancesGiven: totalAdvancesGiven,
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

    const totalAdvances = filtered.reduce((sum, s) => sum + (s.dispatch.target_amount || 0), 0);

    const calendarsIssued = filtered.reduce((sum, s) => sum + (s.assignment.calendars_issued || 0), 0);
    const calendarsReturned = filtered.reduce((sum, s) => sum + (s.calendars_returned || 0), 0);
    const outstandingCalendars = calculateOutstandingCalendars(calendarsIssued, calendarsReturned);

    return {
      totalCash,
      totalGPay,
      totalCollected,
      totalExpenses,
      netCollection,
      totalAdvances,
      calendarsIssued,
      calendarsReturned,
      outstandingCalendars,
    };
  }
};
