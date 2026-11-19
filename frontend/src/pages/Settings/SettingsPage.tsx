import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { Settings, Shield, Server, Database, KeyRound, Building, CheckCircle2, Users } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';

export const SettingsPage: React.FC = () => {
  const { user, role } = useAuth();

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
          <Settings className="w-5 h-5 text-brand-700" />
          System Settings & Environment Configuration
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Hostel establishment properties, academic session parameters, and security policies
        </p>
      </div>

      {/* Institutional Details */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2">
            <Building className="w-4 h-4 text-brand-700" />
            Institutional Accommodation Details
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-xs">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <span className="text-slate-400">Current Academic Year:</span>
              <div className="font-bold text-slate-900 text-sm mt-0.5">2026-2027 (Odd / Fall Semester)</div>
            </div>
            <div>
              <span className="text-slate-400">Hostel Complexes:</span>
              <div className="font-bold text-slate-900 text-sm mt-0.5">Aryabhata Complex & Gargi Hall</div>
            </div>
            <div>
              <span className="text-slate-400">Night Gate Curfew:</span>
              <div className="font-semibold text-slate-800 mt-0.5">10:00 PM (Weekdays) • 10:30 PM (Weekends)</div>
            </div>
            <div>
              <span className="text-slate-400">Mess Operating Standard:</span>
              <div className="font-semibold text-slate-800 mt-0.5">4 Meals / Day (FSSAI Certified Kitchen)</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Security & System Diagnostics */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2">
            <Server className="w-4 h-4 text-brand-700" />
            Security & Cryptographic Architecture
          </CardTitle>
          <Badge variant="emerald">Compliant with IEEE SRS v1.0</Badge>
        </CardHeader>
        <CardContent className="space-y-3 text-xs text-slate-700">
          <div className="flex items-center justify-between p-3 bg-slate-50 rounded-md border border-slate-200">
            <div>
              <div className="font-bold text-slate-900">Authentication Scheme</div>
              <div className="text-[11px] text-slate-500">Stateless JWT Access (24h) + Refresh Token (7d)</div>
            </div>
            <Badge variant="teal">HS256 Verified</Badge>
          </div>

          <div className="flex items-center justify-between p-3 bg-slate-50 rounded-md border border-slate-200">
            <div>
              <div className="font-bold text-slate-900">Credential Storage</div>
              <div className="text-[11px] text-slate-500">Bcrypt Salt Rounds 12 (Zero plaintext passwords)</div>
            </div>
            <Badge variant="teal">Bcrypt Hash</Badge>
          </div>

          <div className="flex items-center justify-between p-3 bg-slate-50 rounded-md border border-slate-200">
            <div>
              <div className="font-bold text-slate-900">Database Layer</div>
              <div className="text-[11px] text-slate-500">SQLAlchemy 2.0 ORM with Foreign Key Cascade Constraints</div>
            </div>
            <Badge variant="teal">SQLite / PostgreSQL Ready</Badge>
          </div>
        </CardContent>
      </Card>

      {/* Project Engineering Team (SRS Documented) */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2">
            <Users className="w-4 h-4 text-brand-700" />
            Staynest Engineering Team & SRS Work Division
          </CardTitle>
          <Badge variant="teal">IEEE SRS v1.0 Section 6</Badge>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-lg flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold text-slate-900 text-sm">Priyansh Keshwani</span>
                </div>
                <Badge variant="sky" className="mb-2">Backend & Project Manager</Badge>
                <p className="text-[11px] text-slate-600 leading-relaxed">
                  Implements business logic, databases, APIs, tracks project timeline, and coordinates development. Delivered FastAPI backend, JWT RBAC security, allocation business rules, and Docker containerization.
                </p>
              </div>
              <div className="mt-2.5 pt-2 border-t border-slate-200/80 text-[10px] text-slate-500 font-mono">
                SRS Phase: Backend APIs & Deployment
              </div>
            </div>

            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-lg flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold text-slate-900 text-sm">Samriddhi Shrivastava</span>
                </div>
                <Badge variant="teal" className="mb-2">Frontend & UI/UX Designer</Badge>
                <p className="text-[11px] text-slate-600 leading-relaxed">
                  Designs user workflows, responsive interfaces, and implements client-side architecture. Designed signature visual room/bed matrix, 360° resident profiles, admissions wizard, and QR Gate Pass modals.
                </p>
              </div>
              <div className="mt-2.5 pt-2 border-t border-slate-200/80 text-[10px] text-slate-500 font-mono">
                SRS Phase: UI/UX & Client Architecture
              </div>
            </div>

            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-lg flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold text-slate-900 text-sm">Soumya Rathore</span>
                </div>
                <Badge variant="slate" className="mb-2">Database & QA Engineer</Badge>
                <p className="text-[11px] text-slate-600 leading-relaxed">
                  Designs database schemas, writes queries, creates test cases, and ensures system quality. Architected SQLAlchemy 2.0 relational schema (18 models), integrity constraints, and automated Pytest test suite.
                </p>
              </div>
              <div className="mt-2.5 pt-2 border-t border-slate-200/80 text-[10px] text-slate-500 font-mono">
                SRS Phase: DB Schema & System Testing
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Pre-configured Demo Accounts Guide */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2">
            <KeyRound className="w-4 h-4 text-brand-700" />
            Pre-configured Demonstration Roles
          </CardTitle>
          <span className="text-xs text-slate-400">Available for evaluation</span>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-md">
              <span className="font-bold text-slate-900">Super Admin:</span> <code>admin</code> / <code>admin123</code>
              <div className="text-[10px] text-slate-500 mt-0.5">Dr. Vikramaditya Sen (Full system oversight)</div>
            </div>
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-md">
              <span className="font-bold text-slate-900">Hostel Warden:</span> <code>warden</code> / <code>warden123</code>
              <div className="text-[10px] text-slate-500 mt-0.5">Prof. Rajesh K. Sharma (Admissions, room allocations, leaves)</div>
            </div>
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-md">
              <span className="font-bold text-slate-900">Accountant:</span> <code>accountant</code> / <code>accountant123</code>
              <div className="text-[10px] text-slate-500 mt-0.5">Sanjay Singhal (Fee heads, invoices, payment receipts)</div>
            </div>
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-md">
              <span className="font-bold text-slate-900">Gate Security:</span> <code>security</code> / <code>security123</code>
              <div className="text-[10px] text-slate-500 mt-0.5">Subedar Ramesh Singh (Gate pass scan, visitor registry)</div>
            </div>
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-md">
              <span className="font-bold text-slate-900">Maintenance:</span> <code>maintenance</code> / <code>tech123</code>
              <div className="text-[10px] text-slate-500 mt-0.5">Manoj Mistri (Electrical, plumbing & ticket repair queue)</div>
            </div>
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-md">
              <span className="font-bold text-slate-900">Student (Resident):</span> <code>aarav</code> / <code>student123</code>
              <div className="text-[10px] text-slate-500 mt-0.5">Aarav Sharma (Room A-101, fee payments, outpass request)</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
