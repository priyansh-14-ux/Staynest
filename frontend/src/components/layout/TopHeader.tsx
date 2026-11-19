import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { UserRole } from '../../types';
import { Search, LogOut, ArrowRightLeft, Bell, Shield, Sparkles } from 'lucide-react';

export const TopHeader: React.FC = () => {
  const { user, role, logout, quickSwitchDemoUser } = useAuth();
  const [isSwitching, setIsSwitching] = useState(false);

  const rolesList: { id: UserRole; label: string; desc: string }[] = [
    { id: 'SUPER_ADMIN', label: 'Super Admin', desc: 'System setup & all privileges' },
    { id: 'WARDEN', label: 'Warden', desc: 'Admissions, allocations, leaves' },
    { id: 'ACCOUNTANT', label: 'Accountant', desc: 'Fees, payments, invoices, dues' },
    { id: 'SECURITY', label: 'Security Guard', desc: 'Gate terminal, outpasses, visitors' },
    { id: 'MAINTENANCE', label: 'Maintenance Staff', desc: 'Tickets & repairs' },
    { id: 'STUDENT', label: 'Student (Aarav)', desc: 'Self-service resident portal' },
  ];

  const handleRoleChange = async (newRole: UserRole) => {
    setIsSwitching(true);
    try {
      await quickSwitchDemoUser(newRole);
    } finally {
      setIsSwitching(false);
    }
  };

  return (
    <header className="h-14 bg-white border-b border-slate-200/90 px-6 flex items-center justify-between sticky top-0 z-10 select-none">
      {/* Search Input */}
      <div className="flex items-center gap-3 w-80">
        <div className="relative w-full">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search students, rooms, invoices (Ctrl + K)..."
            className="w-full bg-slate-50 border border-slate-200 rounded-md pl-9 pr-3 py-1.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-brand-600 focus:bg-white transition-all shadow-2xs"
          />
        </div>
      </div>

      {/* Header Actions */}
      <div className="flex items-center gap-4">
        {/* Instant Role-Switcher for Demonstration */}
        <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-md px-2 py-1 shadow-2xs">
          <ArrowRightLeft className="w-3.5 h-3.5 text-slate-500" />
          <span className="text-[11px] font-semibold text-slate-600 uppercase tracking-wider">Role Demo:</span>
          <select
            value={role || ''}
            onChange={(e) => handleRoleChange(e.target.value as UserRole)}
            disabled={isSwitching}
            className="bg-transparent text-xs font-semibold text-brand-800 focus:outline-none cursor-pointer"
          >
            {rolesList.map((r) => (
              <option key={r.id} value={r.id}>
                {r.label}
              </option>
            ))}
          </select>
        </div>

        {/* Notifications */}
        <button
          className="relative p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-md transition-colors"
          title="Notifications"
        >
          <Bell className="w-4 h-4" />
          <span className="absolute top-1 right-1 w-2 h-2 bg-brand-600 rounded-full ring-2 ring-white"></span>
        </button>

        {/* User Identity & Logout */}
        <div className="flex items-center gap-3 pl-3 border-l border-slate-200">
          <div className="text-right hidden sm:block">
            <div className="text-xs font-semibold text-slate-900 leading-tight">{user?.full_name}</div>
            <div className="text-[10px] text-brand-700 font-medium capitalize">
              {user?.role?.replace('_', ' ').toLowerCase()}
            </div>
          </div>
          <button
            onClick={logout}
            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors"
            title="Log Out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};
