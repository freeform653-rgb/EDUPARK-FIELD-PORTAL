import React, { useState } from 'react';
import { Sidebar, NavTab } from './Sidebar';
import { Header } from './Header';
import { ToastContainer } from '../ui/Toast';
import { X } from 'lucide-react';

interface AppLayoutProps {
  currentTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  onOpenAddStudent: () => void;
  onOpenCreateDispatch: () => void;
  children: React.ReactNode;
}

export const AppLayout: React.FC<AppLayoutProps> = ({
  currentTab,
  onSelectTab,
  onOpenAddStudent,
  onOpenCreateDispatch,
  children,
}) => {
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState<boolean>(false);

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden font-sans">
      {/* Desktop Fixed Left Sidebar */}
      <div className="hidden md:flex shrink-0 no-print">
        <Sidebar
          currentTab={currentTab}
          onSelectTab={onSelectTab}
        />
      </div>

      {/* Mobile Slide-Out Drawer Navigation */}
      {mobileDrawerOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex no-print">
          <div
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity"
            onClick={() => setMobileDrawerOpen(false)}
          />
          <div className="relative flex flex-col w-72 max-w-[80vw] bg-navy-950 h-full shadow-2xl z-10 animate-in slide-in-from-left duration-200">
            <button
              onClick={() => setMobileDrawerOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg"
              aria-label="Close navigation"
            >
              <X className="w-5 h-5" />
            </button>
            <Sidebar
              currentTab={currentTab}
              onSelectTab={onSelectTab}
              onCloseMobileDrawer={() => setMobileDrawerOpen(false)}
            />
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Header */}
        <Header
          currentTab={currentTab}
          onOpenMobileDrawer={() => setMobileDrawerOpen(true)}
          onOpenAddStudent={onOpenAddStudent}
          onOpenCreateDispatch={onOpenCreateDispatch}
          onSelectTab={onSelectTab}
        />

        {/* Scrollable Page Body */}
        <main className="flex-1 overflow-y-auto custom-scrollbar p-4 sm:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto space-y-6">
            {children}
          </div>
        </main>
      </div>

      {/* Global Toast Notifications */}
      <ToastContainer />
    </div>
  );
};
