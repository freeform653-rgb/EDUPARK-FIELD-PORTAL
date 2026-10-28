import React from 'react';
import {
  LayoutDashboard,
  Users,
  Send,
  CreditCard,
  Menu
} from 'lucide-react';
import { NavTab } from './Sidebar';

interface MobileBottomNavProps {
  currentTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  onOpenMobileDrawer: () => void;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  currentTab,
  onSelectTab,
  onOpenMobileDrawer,
}) => {
  const primaryNavItems: { id: NavTab; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'students', label: 'Students', icon: Users },
    { id: 'dispatches', label: 'Dispatches', icon: Send },
    { id: 'settle', label: 'Settle', icon: CreditCard },
  ];

  return (
    <nav
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200/90 shadow-[0_-4px_20px_rgba(0,0,0,0.06)] px-2 py-1.5 no-print"
      aria-label="Mobile navigation"
    >
      <div className="flex items-center justify-around max-w-lg mx-auto">
        {primaryNavItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onSelectTab(item.id)}
              className={`flex flex-col items-center justify-center flex-1 py-1.5 px-1 rounded-xl transition-all duration-150 relative ${
                isActive
                  ? 'text-skyblue-600 font-bold'
                  : 'text-slate-500 hover:text-slate-800 font-medium'
              }`}
            >
              <div
                className={`p-1.5 rounded-xl transition-all ${
                  isActive ? 'bg-skyblue-50 text-skyblue-600 scale-105' : 'text-slate-500'
                }`}
              >
                <Icon className="w-5 h-5" />
              </div>
              <span className="text-[10px] tracking-tight mt-0.5 leading-none">{item.label}</span>
              {isActive && (
                <span className="absolute bottom-0.5 w-1 h-1 rounded-full bg-skyblue-600" />
              )}
            </button>
          );
        })}

        {/* More Options / Drawer Toggle */}
        <button
          onClick={onOpenMobileDrawer}
          className={`flex flex-col items-center justify-center flex-1 py-1.5 px-1 rounded-xl transition-all duration-150 relative ${
            currentTab === 'exports' || currentTab === 'settings'
              ? 'text-skyblue-600 font-bold'
              : 'text-slate-500 hover:text-slate-800 font-medium'
          }`}
          aria-label="More options"
        >
          <div
            className={`p-1.5 rounded-xl transition-all ${
              currentTab === 'exports' || currentTab === 'settings'
                ? 'bg-skyblue-50 text-skyblue-600 scale-105'
                : 'text-slate-500'
            }`}
          >
            <Menu className="w-5 h-5" />
          </div>
          <span className="text-[10px] tracking-tight mt-0.5 leading-none">
            {currentTab === 'exports' ? 'Reports' : currentTab === 'settings' ? 'Settings' : 'More'}
          </span>
          {(currentTab === 'exports' || currentTab === 'settings') && (
            <span className="absolute bottom-0.5 w-1 h-1 rounded-full bg-skyblue-600" />
          )}
        </button>
      </div>
    </nav>
  );
};
