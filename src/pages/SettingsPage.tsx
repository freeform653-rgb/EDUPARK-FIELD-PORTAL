import React, { useState, useEffect } from 'react';
import { useAuth, getActiveCredentials } from '../context/AuthContext';
import { useApp } from '../context/AppContext';
import { Modal } from '../components/ui/Modal';
import {
  User,
  Lock,
  KeyRound,
  ShieldCheck,
  Eye,
  EyeOff,
  Save,
  CheckCircle2,
  AlertTriangle,
  LogOut,
  RefreshCw,
  Info,
  RotateCcw,
  Trash2,
  AlertOctagon,
  Users,
  Send,
  CreditCard
} from 'lucide-react';

export const SettingsPage: React.FC = () => {
  const { user, updateCredentials, logout } = useAuth();
  const {
    showToast,
    students,
    dispatches,
    settlements,
    clearDispatchesAndSettlements,
    clearAllData
  } = useApp();

  // Profile / Username form states
  const [displayName, setDisplayName] = useState<string>('');
  const [username, setUsername] = useState<string>('');
  const [isUpdatingProfile, setIsUpdatingProfile] = useState<boolean>(false);
  const [profileSuccessMsg, setProfileSuccessMsg] = useState<string | null>(null);
  const [profileErrorMsg, setProfileErrorMsg] = useState<string | null>(null);

  // Password form states
  const [currentPassword, setCurrentPassword] = useState<string>('');
  const [newPassword, setNewPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');
  const [showCurrentPassword, setShowCurrentPassword] = useState<boolean>(false);
  const [showNewPassword, setShowNewPassword] = useState<boolean>(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState<boolean>(false);
  const [isUpdatingPassword, setIsUpdatingPassword] = useState<boolean>(false);
  const [passwordSuccessMsg, setPasswordSuccessMsg] = useState<string | null>(null);
  const [passwordErrorMsg, setPasswordErrorMsg] = useState<string | null>(null);

  // Reset Modal states
  const [clearDispatchesModalOpen, setClearDispatchesModalOpen] = useState<boolean>(false);
  const [clearAllModalOpen, setClearAllModalOpen] = useState<boolean>(false);
  const [confirmWipeText, setConfirmWipeText] = useState<string>('');
  const [isResettingDispatches, setIsResettingDispatches] = useState<boolean>(false);
  const [isResettingAll, setIsResettingAll] = useState<boolean>(false);

  // Initialize fields with current active values
  useEffect(() => {
    const creds = getActiveCredentials();
    setUsername(creds.username || user?.username || 'admin');
    setDisplayName(creds.name || user?.name || 'Campus Administrator');
  }, [user]);

  // Handle Username & Display Name Update
  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileSuccessMsg(null);
    setProfileErrorMsg(null);

    const cleanUsername = username.trim();
    if (!cleanUsername) {
      setProfileErrorMsg('Username cannot be blank.');
      return;
    }
    if (cleanUsername.length < 3) {
      setProfileErrorMsg('Username must be at least 3 characters long.');
      return;
    }

    setIsUpdatingProfile(true);
    try {
      const result = await updateCredentials({
        newUsername: cleanUsername,
        newName: displayName.trim() || undefined,
      });

      if (result.success) {
        setProfileSuccessMsg('Administrator username and profile updated successfully.');
        showToast('Username and profile saved successfully!', 'success');
      } else {
        setProfileErrorMsg(result.error || 'Failed to update username.');
        showToast(result.error || 'Failed to update username.', 'error');
      }
    } catch (err: any) {
      setProfileErrorMsg(err.message || 'An unexpected error occurred.');
      showToast('Error updating username.', 'error');
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  // Handle Password Update
  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordSuccessMsg(null);
    setPasswordErrorMsg(null);

    if (!currentPassword) {
      setPasswordErrorMsg('Please enter your current password.');
      return;
    }
    if (!newPassword) {
      setPasswordErrorMsg('Please enter a new password.');
      return;
    }
    if (newPassword.length < 6) {
      setPasswordErrorMsg('New password must be at least 6 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordErrorMsg('New passwords do not match. Please verify.');
      return;
    }

    setIsUpdatingPassword(true);
    try {
      const activeCreds = getActiveCredentials();
      const result = await updateCredentials({
        newUsername: activeCreds.username || username,
        newName: activeCreds.name || displayName,
        currentPassword,
        newPassword,
      });

      if (result.success) {
        setPasswordSuccessMsg('Password changed successfully! Keep your new credentials safe.');
        showToast('Password updated successfully!', 'success');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      } else {
        setPasswordErrorMsg(result.error || 'Failed to update password. Please check your current password.');
        showToast(result.error || 'Failed to update password.', 'error');
      }
    } catch (err: any) {
      setPasswordErrorMsg(err.message || 'An unexpected error occurred.');
      showToast('Error changing password.', 'error');
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  // Execute Reset Option 1: Clear Dispatches & Settlements (Keep Students)
  const handleClearDispatches = async () => {
    setIsResettingDispatches(true);
    try {
      await clearDispatchesAndSettlements();
      setClearDispatchesModalOpen(false);
    } catch (err: any) {
      showToast(err.message || 'Failed to clear dispatches.', 'error');
    } finally {
      setIsResettingDispatches(false);
    }
  };

  // Execute Reset Option 2: Clear All Data (Students & Everything)
  const handleClearAll = async () => {
    if (confirmWipeText.trim().toUpperCase() !== 'RESET') {
      showToast('Please type RESET to confirm.', 'warning');
      return;
    }
    setIsResettingAll(true);
    try {
      await clearAllData();
      setClearAllModalOpen(false);
      setConfirmWipeText('');
    } catch (err: any) {
      showToast(err.message || 'Failed to clear all data.', 'error');
    } finally {
      setIsResettingAll(false);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      {/* Overview Banner Card */}
      <div className="bg-gradient-to-r from-navy-950 via-slate-900 to-navy-900 text-white rounded-2xl p-6 sm:p-8 shadow-sm border border-slate-800 relative overflow-hidden">
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-skyblue-400 to-skyblue-600 flex items-center justify-center text-white shadow-lg shadow-skyblue-500/25 shrink-0">
              <ShieldCheck className="w-9 h-9" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-bold tracking-tight">Admin Settings & Security</h1>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  Active
                </span>
              </div>
              <p className="text-slate-300 text-sm mt-1">
                Manage administrative login credentials, user handle, password, and database operations.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => logout()}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 border border-rose-500/30 transition-colors"
            >
              <LogOut className="w-4 h-4" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      </div>

      {/* Grid: Credentials & Password */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Card 1: Change Username & Admin Profile */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-6">
          <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
            <div className="w-10 h-10 rounded-xl bg-skyblue-50 flex items-center justify-center text-skyblue-600 shrink-0">
              <User className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">Change Admin Username</h2>
              <p className="text-xs text-slate-500">Update your administrator display name and login username</p>
            </div>
          </div>

          {profileSuccessMsg && (
            <div className="flex items-start gap-2.5 p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <span>{profileSuccessMsg}</span>
            </div>
          )}

          {profileErrorMsg && (
            <div className="flex items-start gap-2.5 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <span>{profileErrorMsg}</span>
            </div>
          )}

          <form onSubmit={handleProfileSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Administrator Display Name
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="e.g. Campus Administrator"
                  className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-300 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-skyblue-500/20 focus:border-skyblue-500 transition-colors"
                />
              </div>
              <p className="text-[11px] text-slate-400 mt-1">Displayed in the header and sidebar navigation.</p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Admin Username <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <User className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  placeholder="e.g. admin"
                  className="w-full pl-10 pr-3.5 py-2.5 text-sm bg-slate-50 border border-slate-300 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-skyblue-500/20 focus:border-skyblue-500 transition-colors font-mono"
                />
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                You will use this username to sign into the Edupark Admin Portal.
              </p>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={isUpdatingProfile}
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold bg-skyblue-600 hover:bg-skyblue-700 text-white shadow-xs transition-colors disabled:opacity-50"
              >
                {isUpdatingProfile ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Saving Changes...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    <span>Save Username & Profile</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Card 2: Change Password */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-6">
          <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
            <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600 shrink-0">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">Change Security Password</h2>
              <p className="text-xs text-slate-500">Update your access password to protect portal access</p>
            </div>
          </div>

          {passwordSuccessMsg && (
            <div className="flex items-start gap-2.5 p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <span>{passwordSuccessMsg}</span>
            </div>
          )}

          {passwordErrorMsg && (
            <div className="flex items-start gap-2.5 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <span>{passwordErrorMsg}</span>
            </div>
          )}

          <form onSubmit={handlePasswordSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Current Password <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <KeyRound className="w-4 h-4" />
                </div>
                <input
                  type={showCurrentPassword ? 'text' : 'password'}
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  required
                  placeholder="Enter current password"
                  className="w-full pl-10 pr-10 py-2.5 text-sm bg-slate-50 border border-slate-300 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-skyblue-500/20 focus:border-skyblue-500 transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600"
                >
                  {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                New Password <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type={showNewPassword ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  minLength={6}
                  placeholder="At least 6 characters"
                  className="w-full pl-10 pr-10 py-2.5 text-sm bg-slate-50 border border-slate-300 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-skyblue-500/20 focus:border-skyblue-500 transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600"
                >
                  {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Confirm New Password <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  placeholder="Re-type new password"
                  className="w-full pl-10 pr-10 py-2.5 text-sm bg-slate-50 border border-slate-300 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-skyblue-500/20 focus:border-skyblue-500 transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600"
                >
                  {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={isUpdatingPassword}
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold bg-navy-800 hover:bg-navy-900 text-white shadow-xs transition-colors disabled:opacity-50"
              >
                {isUpdatingPassword ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Updating Password...</span>
                  </>
                ) : (
                  <>
                    <KeyRound className="w-4 h-4" />
                    <span>Update Password</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* TWO RESET OPTIONS SECTION (Clear Dispatches/Settled vs Clear All)          */}
      {/* ========================================================================= */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-6">
        <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
          <div className="w-10 h-10 rounded-xl bg-rose-50 flex items-center justify-center text-rose-600 shrink-0">
            <AlertOctagon className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900">Database & Operation Reset Options</h2>
            <p className="text-xs text-slate-500">
              Selectively clear field mission records while keeping students, or perform a complete factory wipe.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* RESET OPTION 1: Clear Dispatches & Settlements (Keep Students) */}
          <div className="rounded-2xl border border-amber-200 bg-amber-50/40 p-5 flex flex-col justify-between space-y-4">
            <div className="space-y-3">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
                    <RotateCcw className="w-4 h-4" />
                  </div>
                  <h3 className="text-sm font-bold text-slate-900">Clear Dispatches & Settlements</h3>
                </div>
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
                  <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                  <span>Keeps Students</span>
                </span>
              </div>

              <p className="text-xs text-slate-600 leading-relaxed">
                Clears all active & past field dispatches, student duty assignments, and completed settlements.
                <strong> All student records and batch assignments are preserved</strong> and their duty status is reset to Available.
              </p>

              <div className="bg-white/80 rounded-xl p-3 border border-amber-200/60 space-y-1.5 text-xs">
                <div className="flex items-center justify-between text-slate-700">
                  <span className="flex items-center gap-1.5 text-slate-500">
                    <Users className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Registered Students:</span>
                  </span>
                  <span className="font-semibold text-emerald-700">{students.length} preserved</span>
                </div>
                <div className="flex items-center justify-between text-slate-700">
                  <span className="flex items-center gap-1.5 text-slate-500">
                    <Send className="w-3.5 h-3.5 text-amber-600" />
                    <span>Field Dispatches:</span>
                  </span>
                  <span className="font-semibold text-slate-800">{dispatches.length} to clear</span>
                </div>
                <div className="flex items-center justify-between text-slate-700">
                  <span className="flex items-center gap-1.5 text-slate-500">
                    <CreditCard className="w-3.5 h-3.5 text-amber-600" />
                    <span>Settled Ledgers:</span>
                  </span>
                  <span className="font-semibold text-slate-800">{settlements.length} to clear</span>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setClearDispatchesModalOpen(true)}
              className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold bg-amber-600 hover:bg-amber-700 text-white shadow-xs transition-colors"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Clear Dispatches & Settlements</span>
            </button>
          </div>

          {/* RESET OPTION 2: Clear All Data (Students & Everything) */}
          <div className="rounded-2xl border border-rose-200 bg-rose-50/40 p-5 flex flex-col justify-between space-y-4">
            <div className="space-y-3">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-rose-100 text-rose-700 flex items-center justify-center shrink-0">
                    <Trash2 className="w-4 h-4" />
                  </div>
                  <h3 className="text-sm font-bold text-slate-900">Clear All Data (Factory Wipe)</h3>
                </div>
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-rose-100 text-rose-800 border border-rose-200">
                  <AlertTriangle className="w-3 h-3 text-rose-600" />
                  <span>Permanent Wipe</span>
                </span>
              </div>

              <p className="text-xs text-slate-600 leading-relaxed">
                Permanently wipes <strong>everything</strong> in the system: all student records, cohorts, dispatches, settlements, collection ledgers, duty excuses, and audit history. Resets to a clean zero state.
              </p>

              <div className="bg-white/80 rounded-xl p-3 border border-rose-200/60 space-y-1.5 text-xs">
                <div className="flex items-center justify-between text-slate-700">
                  <span className="flex items-center gap-1.5 text-slate-500">
                    <Users className="w-3.5 h-3.5 text-rose-600" />
                    <span>All Student Records:</span>
                  </span>
                  <span className="font-semibold text-rose-700">{students.length} deleted</span>
                </div>
                <div className="flex items-center justify-between text-slate-700">
                  <span className="flex items-center gap-1.5 text-slate-500">
                    <Send className="w-3.5 h-3.5 text-rose-600" />
                    <span>All Dispatches:</span>
                  </span>
                  <span className="font-semibold text-rose-700">{dispatches.length} deleted</span>
                </div>
                <div className="flex items-center justify-between text-slate-700">
                  <span className="flex items-center gap-1.5 text-slate-500">
                    <CreditCard className="w-3.5 h-3.5 text-rose-600" />
                    <span>All Settlements:</span>
                  </span>
                  <span className="font-semibold text-rose-700">{settlements.length} deleted</span>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                setConfirmWipeText('');
                setClearAllModalOpen(true);
              }}
              className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold bg-rose-600 hover:bg-rose-700 text-white shadow-xs transition-colors"
            >
              <Trash2 className="w-4 h-4" />
              <span>Clear All Data (Students & Other)</span>
            </button>
          </div>
        </div>
      </div>

      {/* Security & Access Information */}
      <div className="bg-slate-50 rounded-2xl border border-slate-200 p-6 space-y-4">
        <div className="flex items-center gap-2 font-semibold text-slate-900 text-sm">
          <Info className="w-4 h-4 text-skyblue-600" />
          <span>Security & Credential Guidelines</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs text-slate-600">
          <div className="bg-white p-4 rounded-xl border border-slate-200/80 space-y-1">
            <p className="font-semibold text-slate-800">Single Admin Portal</p>
            <p className="text-slate-500 leading-relaxed">
              Edupark Field Portal is exclusively operated by authorized campus administrators. There is no student or teacher registration.
            </p>
          </div>
          <div className="bg-white p-4 rounded-xl border border-slate-200/80 space-y-1">
            <p className="font-semibold text-slate-800">Instant Persistence</p>
            <p className="text-slate-500 leading-relaxed">
              Any username or password change is immediately saved and applied. You can test your updated credentials right away by signing out.
            </p>
          </div>
          <div className="bg-white p-4 rounded-xl border border-slate-200/80 space-y-1">
            <p className="font-semibold text-slate-800">Credential Backup</p>
            <p className="text-slate-500 leading-relaxed">
              Keep your administrative credentials in a secure place. If you ever forget your custom password, the initial system fallback remains available.
            </p>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* CONFIRMATION MODALS                                                       */}
      {/* ========================================================================= */}

      {/* Modal 1: Confirmation for Clearing Dispatches & Settlements (Keep Students) */}
      <Modal
        isOpen={clearDispatchesModalOpen}
        onClose={() => setClearDispatchesModalOpen(false)}
        title="Clear Dispatches & Settlements"
        subtitle="Reset active and past field duty operations"
        maxWidth="md"
      >
        <div className="p-6 space-y-5">
          <div className="flex items-start gap-3 p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs">
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="font-bold text-amber-900">Are you sure you want to clear dispatches and settlements?</p>
              <p className="leading-relaxed">
                This will delete all {dispatches.length} field dispatches and {settlements.length} settlement collection records.
              </p>
              <p className="font-semibold text-emerald-800 pt-1">
                ✓ All {students.length} registered students and their batches will be KEPT and reset to Available.
              </p>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setClearDispatchesModalOpen(false)}
              disabled={isResettingDispatches}
              className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleClearDispatches}
              disabled={isResettingDispatches}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-semibold bg-amber-600 hover:bg-amber-700 text-white shadow-xs transition-colors disabled:opacity-50"
            >
              {isResettingDispatches ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Clearing Operations...</span>
                </>
              ) : (
                <>
                  <RotateCcw className="w-4 h-4" />
                  <span>Yes, Clear Dispatches & Settlements</span>
                </>
              )}
            </button>
          </div>
        </div>
      </Modal>

      {/* Modal 2: Confirmation for Clearing All Data (Factory Wipe) */}
      <Modal
        isOpen={clearAllModalOpen}
        onClose={() => {
          setClearAllModalOpen(false);
          setConfirmWipeText('');
        }}
        title="Factory Reset — Clear All Data"
        subtitle="Permanently erase all students and operational records"
        maxWidth="md"
      >
        <div className="p-6 space-y-5">
          <div className="flex items-start gap-3 p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs">
            <AlertOctagon className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="font-bold text-rose-900">EXTREME WARNING: Permanent Factory Wipe</p>
              <p className="leading-relaxed">
                This action will permanently delete <strong>{students.length} students</strong>, <strong>{dispatches.length} dispatches</strong>, <strong>{settlements.length} settlement records</strong>, duty excuses, and audit history.
              </p>
              <p className="text-rose-700 font-semibold">
                This action CANNOT be undone.
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <label className="block text-xs font-semibold text-slate-700">
              Type <strong className="font-mono text-rose-600 font-bold">RESET</strong> below to confirm deletion:
            </label>
            <input
              type="text"
              value={confirmWipeText}
              onChange={(e) => setConfirmWipeText(e.target.value)}
              placeholder="Type RESET"
              className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-300 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 font-mono"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => {
                setClearAllModalOpen(false);
                setConfirmWipeText('');
              }}
              disabled={isResettingAll}
              className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleClearAll}
              disabled={confirmWipeText.trim().toUpperCase() !== 'RESET' || isResettingAll}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-semibold bg-rose-600 hover:bg-rose-700 text-white shadow-xs transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {isResettingAll ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Clearing All Data...</span>
                </>
              ) : (
                <>
                  <Trash2 className="w-4 h-4" />
                  <span>Permanently Clear All Data</span>
                </>
              )}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default SettingsPage;
