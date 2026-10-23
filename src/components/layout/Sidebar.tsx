import React from 'react';
import {
  LayoutDashboard,
  Users,
  Send,
  CreditCard,
  FileSpreadsheet,
  Settings,
  LogOut,
  GraduationCap,
  ShieldCheck
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export type NavTab = 'dashboard' | 'students' | 'dispatches' | 'settle' | 'exports' | 'settings';

interface SidebarProps {
  currentTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  onCloseMobileDrawer?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onSelectTab,
  onCloseMobileDrawer
}) => {
  const { user, logout } = useAuth();

  const navItems = [
    { id: 'dashboard' as NavTab, label: 'Dashboard', icon: LayoutDashboard },
    { id: 'students' as NavTab, label: 'Students', icon: Users },
    { id: 'dispatches' as NavTab, label: 'Dispatches', icon: Send },
    { id: 'settle' as NavTab, label: 'Settle', icon: CreditCard },
    { id: 'exports' as NavTab, label: 'Export & Reports', icon: FileSpreadsheet },
    { id: 'settings' as NavTab, label: 'Settings', icon: Settings },
  ];

  const handleNavClick = (tab: NavTab) => {
    onSelectTab(tab);
    if (onCloseMobileDrawer) {
      onCloseMobileDrawer();
    }
  };

  const userInitials = (user?.name || user?.username || 'AD')
    .trim()
    .split(/\s+/)
    .map(w => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase() || 'AD';

  return (
    <aside className="w-64 bg-navy-950 text-white flex flex-col h-full border-r border-navy-900 select-none">
      {/* Brand Logo & Title */}
      <div className="p-5 border-b border-navy-800/80 flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-skyblue-400 to-skyblue-600 flex items-center justify-center text-white shadow-md shadow-skyblue-500/20 shrink-0">
          <GraduationCap className="w-6 h-6" />
        </div>
        <div className="min-w-0">
          <h1 className="text-base font-bold text-white tracking-tight truncate leading-tight">
            Edupark Field Portal
          </h1>
          <p className="text-[11px] font-medium text-skyblue-300 truncate">
            Campus Administration
          </p>
        </div>
      </div>


      {/* Navigation Links */}
      <nav className="flex-1 p-3 space-y-1.5 overflow-y-auto">
        <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-3 py-2">
          Management Portal
        </div>
        {navItems.map(item => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => handleNavClick(item.id)}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-medium text-sm transition-all duration-150 ${
                isActive
                  ? 'bg-skyblue-600 text-white shadow-md shadow-skyblue-600/30'
                  : 'text-slate-300 hover:text-white hover:bg-navy-900'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Admin Profile & Actions */}
      <div className="p-4 border-t border-navy-800/80 bg-navy-900/40 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-full bg-navy-800 border border-navy-700 flex items-center justify-center text-xs font-bold text-skyblue-300 shrink-0">
              {userInitials}
            </div>
            <div className="truncate">
              <p className="text-xs font-semibold text-white truncate">{user?.name || 'Admin User'}</p>
              <div className="flex items-center gap-1 text-[10px] text-slate-400">
                <ShieldCheck className="w-3 h-3 text-emerald-400" />
                <span>Super Admin</span>
              </div>
            </div>
          </div>
          <button
            onClick={() => logout()}
            title="Sign out of portal"
            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-navy-800 transition-colors"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>

      </div>
    </aside>
  );
};
