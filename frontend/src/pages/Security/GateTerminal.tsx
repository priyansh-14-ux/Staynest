import React, { useEffect, useState } from 'react';
import { leavesApi } from '../../lib/api';
import { GatePass, GatePassVerification } from '../../types';
import { formatDateTime } from '../../lib/utils';
import { useAuth } from '../../context/AuthContext';
import {
  ShieldCheck, Search, QrCode, LogOut, LogIn,
  CheckCircle2, XCircle, Clock, AlertTriangle, User, Phone
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Input } from '../../components/ui/Input';

export const GateTerminal: React.FC = () => {
  const { user } = useAuth();
  const [passQuery, setPassQuery] = useState('GP-2026-4012'); // pre-fill demo
  const [verification, setVerification] = useState<GatePassVerification | null>(null);
  const [activePasses, setActivePasses] = useState<GatePass[]>([]);
  const [isVerifying, setIsVerifying] = useState(false);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  const fetchActivePasses = async () => {
    try {
      const data = await leavesApi.getActiveGatePasses();
      setActivePasses(data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchActivePasses();
  }, []);

  const handleVerify = async (codeToVerify?: string) => {
    const code = codeToVerify || passQuery.trim();
    if (!code) return;
    setIsVerifying(true);
    setActionSuccess(null);
    try {
      const res = await leavesApi.verifyGatePass(code);
      setVerification(res);
    } catch (err) {
      console.error(err);
    } finally {
      setIsVerifying(false);
    }
  };

  const handleGateAction = async (gatePassId: number, action: 'EXIT' | 'ENTRY') => {
    try {
      await leavesApi.logGateAction(gatePassId, {
        action,
        remarks: `Normal gate timestamp logged at Main Gate by ${user?.full_name}`
      });
      setActionSuccess(`Successfully recorded gate ${action} timestamp!`);
      await fetchActivePasses();
      // re-verify to update display
      if (verification?.gate_pass) {
        handleVerify(verification.gate_pass.pass_number);
      }
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Gate logging failed');
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-brand-700" />
          Security Gate Terminal & Outpass Verifier
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          High-speed gate verification, digital QR pass scanning, and student entry/exit movement logging
        </p>
      </div>

      {actionSuccess && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-md text-xs font-semibold flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4" /> {actionSuccess}
        </div>
      )}

      {/* Quick Lookup Bar */}
      <Card>
        <CardContent className="p-5">
          <div className="flex flex-col sm:flex-row items-center gap-3">
            <div className="flex-1 w-full">
              <Input
                placeholder="Enter Gate Pass Number (e.g. GP-2026-4012) or scan QR code..."
                value={passQuery}
                onChange={(e) => setPassQuery(e.target.value)}
                icon={<QrCode className="w-4 h-4" />}
              />
            </div>
            <Button
              variant="primary"
              onClick={() => handleVerify()}
              isLoading={isVerifying}
              icon={<Search className="w-4 h-4" />}
            >
              Verify Gate Pass
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Verification Result Card */}
      {verification && (
        <Card className={`border-2 ${verification.is_valid ? 'border-brand-600' : 'border-rose-400'}`}>
          <CardHeader className="bg-slate-50/60">
            <div className="flex items-center gap-2">
              {verification.is_valid ? (
                <CheckCircle2 className="w-5 h-5 text-brand-700" />
              ) : (
                <XCircle className="w-5 h-5 text-rose-600" />
              )}
              <CardTitle className="text-base">
                {verification.is_valid ? 'Valid Gate Pass Verified' : 'Pass Lookup Failed'}
              </CardTitle>
            </div>
            <Badge variant={verification.is_valid ? 'emerald' : 'rose'}>
              {verification.is_valid ? 'AUTHENTIC' : 'INVALID'}
            </Badge>
          </CardHeader>
          <CardContent className="space-y-4">
            {verification.is_valid && verification.gate_pass && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
                {/* Student Details */}
                <div className="space-y-3 bg-slate-50 p-4 rounded-lg border border-slate-200">
                  <div className="font-bold text-slate-800 text-sm flex items-center gap-2">
                    <User className="w-4 h-4 text-brand-700" />
                    {verification.gate_pass.resident_name}
                  </div>
                  <div className="space-y-1.5 text-slate-600">
                    <div>Roll No: <strong>{verification.gate_pass.registration_number}</strong></div>
                    <div>Room: <strong>Room {verification.gate_pass.room_number || 'N/A'}</strong></div>
                    <div>Destination: <strong>{verification.gate_pass.destination}</strong></div>
                    <div>Reason: <em>{verification.gate_pass.reason}</em></div>
                  </div>
                </div>

                {/* Timing & Gate Actions */}
                <div className="space-y-3 bg-slate-50 p-4 rounded-lg border border-slate-200 flex flex-col justify-between">
                  <div className="space-y-1.5 text-slate-600">
                    <div className="font-bold text-slate-900 font-mono text-sm">
                      {verification.gate_pass.pass_number}
                    </div>
                    <div>Valid From: <strong>{formatDateTime(verification.gate_pass.valid_from)}</strong></div>
                    <div>Valid Until: <strong className="text-rose-600">{formatDateTime(verification.gate_pass.valid_until)}</strong></div>
                    <div>Current Status: <Badge variant="auto" statusText={verification.gate_pass.status}>{verification.gate_pass.status}</Badge></div>
                  </div>

                  {/* Log Action Buttons */}
                  <div className="pt-3 border-t border-slate-200 flex items-center gap-3">
                    <Button
                      variant="primary"
                      size="sm"
                      className="flex-1 bg-amber-600 hover:bg-amber-700"
                      icon={<LogOut className="w-3.5 h-3.5" />}
                      onClick={() => handleGateAction(verification.gate_pass!.id, 'EXIT')}
                    >
                      Log Gate EXIT
                    </Button>
                    <Button
                      variant="primary"
                      size="sm"
                      className="flex-1 bg-emerald-600 hover:bg-emerald-700"
                      icon={<LogIn className="w-3.5 h-3.5" />}
                      onClick={() => handleGateAction(verification.gate_pass!.id, 'ENTRY')}
                    >
                      Log Gate ENTRY
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Active Passes Board */}
      <Card>
        <CardHeader>
          <div>
            <CardTitle>Currently Checked-Out Residents (Outside Hostel)</CardTitle>
            <span className="text-xs text-slate-500">Real-time gate security muster roll</span>
          </div>
          <span className="text-xs font-semibold text-slate-700">{activePasses.length} Active Passes</span>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto text-xs">
            <table className="w-full text-left">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase">
                <tr>
                  <th className="py-2.5 px-4">Pass #</th>
                  <th className="py-2.5 px-4">Resident</th>
                  <th className="py-2.5 px-4">Room</th>
                  <th className="py-2.5 px-4">Destination</th>
                  <th className="py-2.5 px-4">Exit Timestamp</th>
                  <th className="py-2.5 px-4">Must Return Before</th>
                  <th className="py-2.5 px-4 text-center">Status</th>
                  <th className="py-2.5 px-4 text-right">Gate Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {activePasses.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="text-center py-6 text-slate-400">All residents currently present in hostel</td>
                  </tr>
                ) : (
                  activePasses.map((p) => (
                    <tr key={p.id} className="hover:bg-slate-50/70">
                      <td className="py-2.5 px-4 font-mono font-bold text-slate-900">{p.pass_number}</td>
                      <td className="py-2.5 px-4 font-semibold text-slate-900">{p.resident_name}</td>
                      <td className="py-2.5 px-4 text-slate-600">Room {p.room_number || 'N/A'}</td>
                      <td className="py-2.5 px-4 text-slate-700">{p.destination}</td>
                      <td className="py-2.5 px-4 text-slate-500">
                        {p.actual_out_time ? formatDateTime(p.actual_out_time) : 'Not exited yet'}
                      </td>
                      <td className="py-2.5 px-4 text-rose-600 font-semibold">{formatDateTime(p.valid_until)}</td>
                      <td className="py-2.5 px-4 text-center">
                        <Badge variant="auto" statusText={p.status}>{p.status}</Badge>
                      </td>
                      <td className="py-2.5 px-4 text-right">
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-6 px-2 text-[10px]"
                          onClick={() => {
                            setPassQuery(p.pass_number);
                            handleVerify(p.pass_number);
                          }}
                        >
                          Select
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
