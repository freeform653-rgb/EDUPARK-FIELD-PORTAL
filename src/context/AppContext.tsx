// Global Application Context for Edupark Field Portal
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { StorageService } from '../lib/storage';
import {
  Student,
  PopulatedDispatch,
  PopulatedSettlement,
  PopulatedExcuse,
  AuditLog,
  DashboardMetrics,
  DateFilterType
} from '../types/database';
import { getLocalDateString } from '../lib/calculations';

export interface ToastMessage {
  id: string;
  message: string;
  type: 'success' | 'error' | 'warning' | 'info';
  duration?: number;
}

interface AppContextType {
  students: Student[];
  dispatches: PopulatedDispatch[];
  settlements: PopulatedSettlement[];
  excuses: PopulatedExcuse[];
  auditLogs: AuditLog[];
  metrics: DashboardMetrics | null;
  dateFilter: DateFilterType;
  setDateFilter: (filter: DateFilterType) => void;
  customStartDate: string;
  setCustomStartDate: (date: string) => void;
  customEndDate: string;
  setCustomEndDate: (date: string) => void;
  isLoading: boolean;
  refreshData: () => Promise<void>;
  showToast: (message: string, type?: 'success' | 'error' | 'warning' | 'info', duration?: number) => void;
  toasts: ToastMessage[];
  removeToast: (id: string) => void;
  isLiveSupabase: boolean;
  clearDispatchesAndSettlements: () => Promise<void>;
  clearAllData: () => Promise<void>;
  resetDatabase: () => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [students, setStudents] = useState<Student[]>([]);
  const [dispatches, setDispatches] = useState<PopulatedDispatch[]>([]);
  const [settlements, setSettlements] = useState<PopulatedSettlement[]>([]);
  const [excuses, setExcuses] = useState<PopulatedExcuse[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);

  const [dateFilter, setDateFilter] = useState<DateFilterType>('all');
  const [customStartDate, setCustomStartDate] = useState<string>(getLocalDateString(new Date(Date.now() - 86400000 * 7)));
  const [customEndDate, setCustomEndDate] = useState<string>(getLocalDateString());

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const isLiveSupabase = StorageService.isLiveSupabase();

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const showToast = useCallback((
    message: string,
    type: 'success' | 'error' | 'warning' | 'info' = 'info',
    duration = 4500
  ) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const newToast: ToastMessage = { id, message, type, duration };
    setToasts(prev => [...prev, newToast]);

    if (duration > 0) {
      setTimeout(() => {
        removeToast(id);
      }, duration);
    }
  }, [removeToast]);

  const refreshData = useCallback(async () => {
    try {
      setIsLoading(true);
      const [
        studentsData,
        dispatchesData,
        settlementsData,
        excusesData,
        auditLogsData,
        metricsData
      ] = await Promise.all([
        StorageService.getStudentsWithComputedStatus(),
        StorageService.getPopulatedDispatches(),
        StorageService.getPopulatedSettlements(),
        StorageService.getPopulatedExcuses(),
        StorageService.getAuditLogs(),
        StorageService.getDashboardMetrics(dateFilter, customStartDate, customEndDate)
      ]);

      setStudents(studentsData);
      setDispatches(dispatchesData);
      setSettlements(settlementsData);
      setExcuses(excusesData);
      setAuditLogs(auditLogsData);
      setMetrics(metricsData);
    } catch (err: any) {
      console.error('Error refreshing portal data', err);
      showToast(err.message || 'Failed to refresh data from server', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [dateFilter, customStartDate, customEndDate, showToast]);

  // Initial load and filter change trigger
  useEffect(() => {
    refreshData();
  }, [refreshData]);

  const clearDispatchesAndSettlements = async () => {
    setIsLoading(true);
    try {
      await StorageService.clearDispatchesAndSettlements();
      await refreshData();
      showToast('Dispatches and settlements cleared. Student records are preserved.', 'success');
    } catch (err: any) {
      showToast(err.message || 'Failed to clear dispatches and settlements.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const clearAllData = async () => {
    setIsLoading(true);
    try {
      await StorageService.clearAllData();
      await refreshData();
      showToast('All system data, students, and operational records have been cleared.', 'success');
    } catch (err: any) {
      showToast(err.message || 'Failed to clear all data.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const resetDatabase = async () => {
    await clearAllData();
  };

  return (
    <AppContext.Provider
      value={{
        students,
        dispatches,
        settlements,
        excuses,
        auditLogs,
        metrics,
        dateFilter,
        setDateFilter,
        customStartDate,
        setCustomStartDate,
        customEndDate,
        setCustomEndDate,
        isLoading,
        refreshData,
        showToast,
        toasts,
        removeToast,
        isLiveSupabase,
        clearDispatchesAndSettlements,
        clearAllData,
        resetDatabase
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = (): AppContextType => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
