import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { UserRole } from '../types';
import { Building2, Shield, User, Lock, ArrowRight, CheckCircle2 } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';

export const Login: React.FC = () => {
  const { login, quickSwitchDemoUser } = useAuth();
  const navigate = useNavigate();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);
    try {
      await login(username, password);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Authentication failed. Please check credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDemoLogin = async (role: UserRole) => {
    setIsLoading(true);
    setError(null);
    try {
      await quickSwitchDemoUser(role);
      navigate('/dashboard');
    } catch (err: any) {
      setError('Demo login failed. Make sure the backend server is running.');
    } finally {
      setIsLoading(false);
    }
  };

  const demoAccounts: { role: UserRole; name: string; username: string; label: string; desc: string }[] = [
    { role: 'SUPER_ADMIN', name: 'Dr. Sen', username: 'admin', label: 'Super Admin', desc: 'Hostels, blocks, all permissions' },
    { role: 'WARDEN', name: 'Prof. Sharma', username: 'warden', label: 'Hostel Warden', desc: 'Admissions, allocations, leaves' },
    { role: 'ACCOUNTANT', name: 'Sanjay S.', username: 'accountant', label: 'Accountant', desc: 'Fee structures, invoices, payments' },
    { role: 'SECURITY', name: 'Sub. Ramesh', username: 'security', label: 'Gate Security', desc: 'Digital outpasses, visitor entries' },
    { role: 'MAINTENANCE', name: 'Manoj M.', username: 'maintenance', label: 'Maintenance Staff', desc: 'Repairs, tickets resolution' },
    { role: 'STUDENT', name: 'Aarav Sharma', username: 'aarav', label: 'Resident Student', desc: 'Self-service room, fees, outpass' },
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8 font-sans">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-brand-700 text-white shadow-md mb-3">
          <Building2 className="w-6 h-6" />
        </div>
        <h2 className="text-2xl font-bold tracking-tight text-slate-900">
          Staynest
        </h2>
        <p className="mt-1 text-xs text-slate-500">
          Institutional Hostel & Residence Management Platform
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-xl">
        <div className="bg-white py-8 px-6 shadow-card sm:rounded-lg sm:px-10 border border-slate-200">
          {error && (
            <div className="mb-5 p-3 rounded-md bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-center gap-2">
              <span className="font-semibold">Error:</span> {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Username or Email"
              type="text"
              placeholder="e.g. admin or aarav"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              icon={<User className="w-4 h-4" />}
            />

            <Input
              label="Password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              icon={<Lock className="w-4 h-4" />}
            />

            <div className="flex items-center justify-between text-xs pt-1">
              <label className="flex items-center gap-1.5 text-slate-600">
                <input type="checkbox" defaultChecked className="rounded border-slate-300 text-brand-600 focus:ring-brand-500" />
                Remember session
              </label>
              <a href="#demo" className="text-brand-700 hover:text-brand-800 font-medium">Demo accounts below</a>
            </div>

            <Button type="submit" variant="primary" className="w-full mt-2" isLoading={isLoading}>
              Sign In to HMS
            </Button>
          </form>

          {/* Quick Demo Switcher */}
          <div className="mt-8 pt-6 border-t border-slate-100" id="demo">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5 text-brand-700" />
                Instant Role Quick-Login (Evaluation)
              </span>
              <span className="text-[11px] text-slate-400">Click to test role</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              {demoAccounts.map((acc) => (
                <button
                  key={acc.role}
                  type="button"
                  onClick={() => handleDemoLogin(acc.role)}
                  disabled={isLoading}
                  className="flex flex-col text-left p-2.5 rounded-md border border-slate-200 hover:border-brand-500 hover:bg-teal-50/50 transition-all group"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-900 group-hover:text-brand-800">{acc.label}</span>
                    <ArrowRight className="w-3 h-3 text-slate-400 group-hover:text-brand-700 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                  <span className="text-[11px] text-slate-500 mt-0.5 truncate">{acc.name}</span>
                  <span className="text-[10px] text-slate-400 mt-1">{acc.desc}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Team Credits */}
        <div className="mt-4 text-center">
          <p className="text-[11px] text-slate-400">
            Staynest HMS • Project Team: <span className="font-semibold text-slate-600">Priyansh Keshwani</span>, <span className="font-semibold text-slate-600">Samriddhi Shrivastava</span> & <span className="font-semibold text-slate-600">Soumya Rathore</span>
          </p>
        </div>
      </div>
    </div>
  );
};
