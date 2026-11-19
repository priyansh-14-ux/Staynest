import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { analyticsApi, feesApi } from '../lib/api';
import { DashboardStats, BlockOccupancyData, RoomTypeDistributionData, ActivityItem } from '../types';
import { formatCurrency, formatDateTime } from '../lib/utils';
import {
  Bed,
  Users,
  AlertTriangle,
  Clock,
  Wrench,
  CheckCircle2,
  ArrowUpRight,
  PlusCircle,
  ShieldCheck,
  DoorOpen,
  IndianRupee,
  Building
} from 'lucide-react';
import { StatCard } from '../components/ui/StatCard';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts';

export const Dashboard: React.FC = () => {
  const { user, role } = useAuth();
  const navigate = useNavigate();

  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [blockData, setBlockData] = useState<BlockOccupancyData[]>([]);
  const [roomTypeData, setRoomTypeData] = useState<RoomTypeDistributionData[]>([]);
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      setIsLoading(true);
      try {
        const [statsRes, blockRes, typesRes, actRes] = await Promise.all([
          analyticsApi.getDashboardStats(),
          analyticsApi.getBlockOccupancy(),
          analyticsApi.getRoomTypes(),
          analyticsApi.getRecentActivity()
        ]);
        setStats(statsRes);
        setBlockData(blockRes);
        setRoomTypeData(typesRes);
        setActivities(actRes);
      } catch (err) {
        console.error('Failed to load dashboard metrics', err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchDashboardData();
  }, []);

  const COLORS = ['#0f766e', '#14b8a6', '#0284c7', '#38bdf8', '#64748b'];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-brand-700 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Banner & Quick Actions */}
      <div className="bg-white border border-slate-200/90 rounded-lg p-5 shadow-card flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold tracking-tight text-slate-900">
              Welcome back, {user?.full_name}
            </h1>
            <Badge variant="teal" className="text-[11px]">
              {role?.replace('_', ' ')}
            </Badge>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Academic Session 2026-2027 • Aryabhata & Gargi Hostels • All operations nominal
          </p>
        </div>

        {/* Quick Action Shortcuts */}
        <div className="flex flex-wrap items-center gap-2">
          {['SUPER_ADMIN', 'WARDEN'].includes(role || '') && (
            <>
              <Button size="sm" variant="primary" icon={<PlusCircle className="w-3.5 h-3.5" />} onClick={() => navigate('/students/admit')}>
                Admit Student
              </Button>
              <Button size="sm" variant="outline" icon={<Bed className="w-3.5 h-3.5" />} onClick={() => navigate('/rooms/grid')}>
                Room Grid
              </Button>
            </>
          )}

          {['ACCOUNTANT', 'SUPER_ADMIN', 'WARDEN'].includes(role || '') && (
            <Button size="sm" variant="outline" icon={<IndianRupee className="w-3.5 h-3.5" />} onClick={() => navigate('/fees/invoices')}>
              Fee Invoices
            </Button>
          )}

          {['SECURITY', 'SUPER_ADMIN'].includes(role || '') && (
            <Button size="sm" variant="primary" icon={<ShieldCheck className="w-3.5 h-3.5" />} onClick={() => navigate('/security/terminal')}>
              Gate Terminal
            </Button>
          )}

          {role === 'STUDENT' && (
            <>
              <Button size="sm" variant="primary" icon={<DoorOpen className="w-3.5 h-3.5" />} onClick={() => navigate('/leaves')}>
                Apply Outpass
              </Button>
              <Button size="sm" variant="outline" icon={<Wrench className="w-3.5 h-3.5" />} onClick={() => navigate('/complaints')}>
                Raise Complaint
              </Button>
            </>
          )}
        </div>
      </div>

      {/* KPI Metric Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Hostel Occupancy"
          value={`${stats?.occupancy_rate || 0}%`}
          subtitle={`${stats?.occupied_beds || 0} of ${stats?.total_beds || 0} beds booked`}
          icon={<Bed className="w-4 h-4" />}
          badge={<Badge variant="emerald">{stats?.available_beds || 0} Vacant</Badge>}
        />

        <StatCard
          title="Active Students"
          value={stats?.total_active_students || 0}
          subtitle={`Across ${stats?.total_blocks || 0} hostel blocks`}
          icon={<Users className="w-4 h-4" />}
        />

        <StatCard
          title="Fee Collections"
          value={formatCurrency(stats?.total_fees_collected || 0)}
          change={`Dues: ${formatCurrency(stats?.total_pending_dues || 0)}`}
          isPositive={false}
          icon={<IndianRupee className="w-4 h-4" />}
          badge={stats?.defaulters_count ? <Badge variant="rose">{stats.defaulters_count} Defaulters</Badge> : undefined}
        />

        <StatCard
          title="Pending Actions"
          value={(stats?.pending_leaves_count || 0) + (stats?.open_complaints_count || 0)}
          subtitle={`${stats?.pending_leaves_count || 0} leaves • ${stats?.open_complaints_count || 0} complaints`}
          icon={<Clock className="w-4 h-4" />}
          badge={<Badge variant="amber">Needs Review</Badge>}
        />
      </div>

      {/* Charts & Visual Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Block-wise Occupancy */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <div>
              <CardTitle>Block-wise Bed Occupancy</CardTitle>
              <span className="text-xs text-slate-500">Live allocated vs available beds</span>
            </div>
            <Button size="sm" variant="outline" onClick={() => navigate('/rooms/grid')}>
              View Matrix
            </Button>
          </CardHeader>
          <CardContent className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={blockData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <XAxis dataKey="block_name" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#fff', borderRadius: '6px', border: '1px solid #e2e8f0', fontSize: '12px' }}
                />
                <Bar dataKey="occupied_beds" name="Occupied Beds" fill="#0f766e" radius={[4, 4, 0, 0]} />
                <Bar dataKey="available_beds" name="Available Beds" fill="#ccfbf1" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Room Type Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Room Inventory</CardTitle>
            <span className="text-xs text-slate-500">By room category</span>
          </CardHeader>
          <CardContent className="h-72 flex flex-col items-center justify-center">
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={roomTypeData}
                  dataKey="count"
                  nameKey="room_type"
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={75}
                  paddingAngle={4}
                >
                  {roomTypeData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ backgroundColor: '#fff', borderRadius: '6px', border: '1px solid #e2e8f0', fontSize: '11px' }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="w-full grid grid-cols-2 gap-x-2 gap-y-1 text-[11px] text-slate-600 mt-2">
              {roomTypeData.map((item, idx) => (
                <div key={item.room_type} className="flex items-center gap-1.5 truncate">
                  <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: COLORS[idx % COLORS.length] }} />
                  <span className="truncate">{item.room_type}: {item.count}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Operational Streams: Recent Activity */}
      <Card>
        <CardHeader>
          <div>
            <CardTitle>Real-Time Hostel Operational Stream</CardTitle>
            <span className="text-xs text-slate-500">Live feed of payments, admissions, gate timestamps, and tickets</span>
          </div>
          <span className="text-[11px] text-slate-400">Auto-refreshed</span>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y divide-slate-100 max-h-96 overflow-y-auto">
            {activities.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-400">No activity recorded yet</div>
            ) : (
              activities.map((act) => (
                <div key={act.id} className="p-4 hover:bg-slate-50/80 transition-colors flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 shrink-0">
                      {act.type === 'PAYMENT' && <IndianRupee className="w-4 h-4 text-emerald-600" />}
                      {act.type === 'COMPLAINT' && <Wrench className="w-4 h-4 text-amber-600" />}
                      {act.type === 'GATE_LOG' && <ShieldCheck className="w-4 h-4 text-sky-600" />}
                      {act.type === 'ALLOCATION' && <Bed className="w-4 h-4 text-brand-700" />}
                    </div>
                    <div>
                      <div className="text-xs font-semibold text-slate-900">{act.title}</div>
                      <div className="text-[11px] text-slate-500">{act.description}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <Badge variant="auto" statusText={act.status_tag || 'NORMAL'}>
                      {act.status_tag}
                    </Badge>
                    <div className="text-[10px] text-slate-400 mt-1">{formatDateTime(act.timestamp)}</div>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
