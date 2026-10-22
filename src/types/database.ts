// Database and Domain Types for Edupark Field Portal

export type StudentStatus = 'Available' | 'Dispatched' | 'Settlement Pending' | 'Excused' | 'Inactive';

export interface Student {
  id: string;
  full_name: string;
  batch: string;
  phone_number: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  // Computed virtual property
  current_status?: StudentStatus;
}

export type DispatchType = 'Individual' | 'Team';
export type DispatchStatus = 'Dispatched' | 'Settlement Pending' | 'Settled' | 'Cancelled';

export interface Dispatch {
  id: string;
  destination: string;
  dispatch_date: string;
  target_amount: number | null;
  dispatch_type: DispatchType;
  status: DispatchStatus;
  notes: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export type AssignmentStatus = 'Dispatched' | 'Settled';

export interface DispatchAssignment {
  id: string;
  dispatch_id: string;
  student_id: string;
  calendars_issued: number;
  assignment_status: AssignmentStatus;
  created_at: string;
}

export interface Settlement {
  id: string;
  dispatch_assignment_id: string;
  cash_amount: number;
  gpay_amount: number;
  calendars_returned: number;
  expenses: number;
  total_collected: number;
  net_collection: number;
  settlement_date: string;
  notes: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface Excuse {
  id: string;
  student_id: string;
  excuse_date: string;
  reason: string;
  notes: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface AuditLog {
  id: string;
  admin_id: string;
  action: string;
  entity_type: string;
  entity_id: string;
  details: Record<string, any> | null;
  created_at: string;
}

// Populated / Joined structures for frontend representation
export interface PopulatedAssignment extends DispatchAssignment {
  student: Student;
  settlement?: Settlement | null;
}

export interface PopulatedDispatch extends Dispatch {
  assignments: PopulatedAssignment[];
  total_students: number;
  settled_students: number;
  total_calendars_issued: number;
  total_calendars_returned: number;
  total_collected: number;
  net_collection: number;
}

export interface PopulatedSettlement extends Settlement {
  assignment: DispatchAssignment;
  student: Student;
  dispatch: Dispatch;
}

export interface PopulatedExcuse extends Excuse {
  student: Student;
}

// Financial and Inventory Summary
export interface FinancialSummary {
  totalCash: number;
  totalGPay: number;
  totalCollected: number;
  totalExpenses: number;
  netCollection: number;
  calendarsIssued: number;
  calendarsReturned: number;
  outstandingCalendars: number;
}

// Dashboard Metrics
export interface DashboardMetrics {
  dispatchedStudentsCount: number;
  totalAmountCollected: number;
  pendingAmountTarget: number;
  excusedStudentsCount: number;
  totalActiveStudents: number;
  totalActiveDispatches: number;
  completedSettlementsCount: number;
  pendingSettlementsCount: number;
  calendarsIssued: number;
  calendarsReturned: number;
  calendarsOutstanding: number;
  totalExpenses: number;
  netCollection: number;
}

export type DateFilterType = 'today' | 'week' | 'month' | 'custom' | 'all';
