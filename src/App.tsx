import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { AppProvider } from './context/AppContext';
import { AppLayout } from './components/layout/AppLayout';
import { NavTab } from './components/layout/Sidebar';
import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';
import { StudentsPage } from './pages/StudentsPage';
import { DispatchesPage } from './pages/DispatchesPage';
import { SettlePage } from './pages/SettlePage';
import { ExportsPage } from './pages/ExportsPage';
import { SettingsPage } from './pages/SettingsPage';
import { StudentModal } from './components/students/StudentModal';
import { CreateDispatchModal } from './components/dispatches/CreateDispatchModal';
import { GraduationCap, Loader2 } from 'lucide-react';

const PortalRoot: React.FC = () => {
  const { isAuthenticated, isLoading } = useAuth();
  const [currentTab, setCurrentTab] = useState<NavTab>('dashboard');

  // Global Header Modal Controls
  const [addStudentModalOpen, setAddStudentModalOpen] = useState<boolean>(false);
  const [createDispatchModalOpen, setCreateDispatchModalOpen] = useState<boolean>(false);

  // Loading State
  if (isLoading) {
    return (
      <div className="min-h-screen bg-navy-950 flex flex-col items-center justify-center text-white">
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-skyblue-500 to-skyblue-400 flex items-center justify-center text-white shadow-xl mb-4 animate-pulse">
          <GraduationCap className="w-8 h-8" />
        </div>
        <p className="text-base font-bold tracking-tight">Edupark Field Portal</p>
        <p className="text-xs text-slate-400 mt-1 flex items-center gap-2">
          <Loader2 className="w-3.5 h-3.5 animate-spin text-skyblue-400" />
          <span>Initializing secure environment...</span>
        </p>
      </div>
    );
  }

  // Unauthenticated -> Login Page
  if (!isAuthenticated) {
    return <LoginPage />;
  }

  // Authenticated Admin -> Main Portal Layout
  return (
    <AppLayout
      currentTab={currentTab}
      onSelectTab={setCurrentTab}
      onOpenAddStudent={() => setAddStudentModalOpen(true)}
      onOpenCreateDispatch={() => setCreateDispatchModalOpen(true)}
    >
      {currentTab === 'dashboard' && <DashboardPage onNavigateTab={setCurrentTab} />}
      {currentTab === 'students' && <StudentsPage />}
      {currentTab === 'dispatches' && <DispatchesPage />}
      {currentTab === 'settle' && <SettlePage />}
      {currentTab === 'exports' && <ExportsPage />}
      {currentTab === 'settings' && <SettingsPage />}

      {/* Global Quick Action Modals */}
      <StudentModal
        isOpen={addStudentModalOpen}
        onClose={() => setAddStudentModalOpen(false)}
      />
      <CreateDispatchModal
        isOpen={createDispatchModalOpen}
        onClose={() => setCreateDispatchModalOpen(false)}
      />
    </AppLayout>
  );
};

export function App() {
  return (
    <AuthProvider>
      <AppProvider>
        <PortalRoot />
      </AppProvider>
    </AuthProvider>
  );
}

export default App;
