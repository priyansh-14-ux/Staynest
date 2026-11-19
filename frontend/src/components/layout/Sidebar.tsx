import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { cn } from '../../lib/utils';
import {
  LayoutDashboard,
  Building2,
  Grid3X3,
  Users,
  UserPlus,
  Receipt,
  AlertCircle,
  CalendarCheck2,
  DoorOpen,
  Wrench,
  ShieldCheck,
  BookOpen,
  UtensilsCrossed,
  Bell,
  FileBarChart2,
  Settings,
  BedDouble
} from 'lucide-react';

interface NavItem {
  title: string;
  path: string;
  icon: React.ReactNode;
  roles?: string[];
}

interface NavGroup {
  label: string;
  items: NavItem[];
}

export const Sidebar: React.FC = () => {
  const { user, role } = useAuth();

  const navGroups: NavGroup[] = [
    {
      label: 'Main',
      items: [
        { title: 'Dashboard', path: '/dashboard', icon: <LayoutDashboard className="w-4 h-4" /> },
      ]
    },
    {
      label: 'Accommodation',
      items: [
        { title: 'Room & Bed Grid', path: '/rooms/grid', icon: <Grid3X3 className="w-4 h-4" /> },
        { title: 'Room Directory', path: '/rooms/list', icon: <Building2 className="w-4 h-4" /> },
        { title: 'Bed Allocations', path: '/allocations', icon: <BedDouble className="w-4 h-4" />, roles: ['SUPER_ADMIN', 'WARDEN'] },
      ]
    },
    {
      label: 'Students',
      items: [
        { title: 'Student Directory', path: '/students', icon: <Users className="w-4 h-4" /> },
        { title: 'New Admission', path: '/students/admit', icon: <UserPlus className="w-4 h-4" />, roles: ['SUPER_ADMIN', 'WARDEN'] },
      ]
    },
    {
      label: 'Finance',
      items: [
        { title: 'Fee Invoices', path: '/fees/invoices', icon: <Receipt className="w-4 h-4" /> },
        { title: 'Fee Defaulters', path: '/fees/defaulters', icon: <AlertCircle className="w-4 h-4" />, roles: ['SUPER_ADMIN', 'WARDEN', 'ACCOUNTANT'] },
      ]
    },
    {
      label: 'Hostel Operations',
      items: [
        { title: 'Night Attendance', path: '/attendance', icon: <CalendarCheck2 className="w-4 h-4" />, roles: ['SUPER_ADMIN', 'WARDEN', 'SECURITY'] },
        { title: 'Leaves & Outpasses', path: '/leaves', icon: <DoorOpen className="w-4 h-4" /> },
        { title: 'Maintenance Desk', path: '/complaints', icon: <Wrench className="w-4 h-4" /> },
        { title: 'Gate Security', path: '/security/terminal', icon: <ShieldCheck className="w-4 h-4" />, roles: ['SUPER_ADMIN', 'WARDEN', 'SECURITY'] },
        { title: 'Visitor Register', path: '/security/visitors', icon: <BookOpen className="w-4 h-4" /> },
      ]
    },
    {
      label: 'Campus Life',
      items: [
        { title: 'Mess Menu', path: '/mess', icon: <UtensilsCrossed className="w-4 h-4" /> },
        { title: 'Notice Board', path: '/notices', icon: <Bell className="w-4 h-4" /> },
      ]
    },
    {
      label: 'Management',
      items: [
        { title: 'Reports & Export', path: '/reports', icon: <FileBarChart2 className="w-4 h-4" />, roles: ['SUPER_ADMIN', 'WARDEN', 'ACCOUNTANT'] },
        { title: 'System Settings', path: '/settings', icon: <Settings className="w-4 h-4" />, roles: ['SUPER_ADMIN', 'WARDEN'] },
      ]
    }
  ];

  return (
    <aside className="w-60 bg-white border-r border-slate-200/90 flex flex-col shrink-0 h-screen sticky top-0 select-none z-20">
      {/* Brand Header */}
      <div className="h-14 px-5 border-b border-slate-100 flex items-center gap-2.5">
        <div className="w-7 h-7 rounded-md bg-brand-700 flex items-center justify-center text-white shadow-xs">
          <Building2 className="w-4 h-4" />
        </div>
        <div className="flex flex-col">
          <span className="text-sm font-bold tracking-tight text-slate-900 leading-tight">Staynest</span>
          <span className="text-[10px] font-medium text-brand-700 uppercase tracking-wider">Campus Living HMS</span>
        </div>
      </div>

      {/* Navigation Links */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-5">
        {navGroups.map((group) => {
          const visibleItems = group.items.filter(
            item => !item.roles || (role && item.roles.includes(role))
          );
          if (visibleItems.length === 0) return null;

          return (
            <div key={group.label}>
              <div className="px-2 mb-1.5 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                {group.label}
              </div>
              <div className="space-y-0.5">
                {visibleItems.map((item) => (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    className={({ isActive }) =>
                      cn(
                        "flex items-center gap-2.5 px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors",
                        isActive
                          ? "bg-brand-50 text-brand-800 font-semibold border-l-2 border-brand-700 rounded-l-none"
                          : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                      )
                    }
                  >
                    <span className="shrink-0">{item.icon}</span>
                    <span className="truncate">{item.title}</span>
                  </NavLink>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* User Footer Profile */}
      <div className="p-3 border-t border-slate-100 bg-slate-50/50">
        <div className="flex items-center gap-2.5 px-2 py-1.5 rounded-md">
          <div className="w-7 h-7 rounded-full bg-brand-100 text-brand-800 border border-brand-200 font-bold text-xs flex items-center justify-center shrink-0">
            {user?.full_name?.charAt(0) || 'U'}
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-xs font-semibold text-slate-900 truncate">{user?.full_name}</span>
            <span className="text-[10px] text-slate-500 font-medium capitalize">{user?.role?.replace('_', ' ').toLowerCase()}</span>
          </div>
        </div>
      </div>
    </aside>
  );
};
