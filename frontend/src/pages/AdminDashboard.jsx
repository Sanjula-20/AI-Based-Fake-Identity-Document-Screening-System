import React, { useEffect, useState } from 'react';
import { UserCheck, Shield, FileText, Users, AlertTriangle, CheckCircle, Database, Lock } from 'lucide-react';
import { fetchAdminDashboardStats } from '../services/api';

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAdminDashboardStats().then((res) => {
      if (res.success) {
        setStats(res);
      }
      setLoading(false);
    });
  }, []);

  return (
    <div className="space-y-8 max-w-5xl mx-auto pb-10">
      <div className="bg-white p-7 rounded-3xl border border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm">
        <div className="space-y-1">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-200 text-xs text-indigo-700 font-semibold">
            <Lock className="w-3.5 h-3.5 text-indigo-600" />
            <span>Admin Control Portal</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-heading font-extrabold text-slate-900 tracking-tight">
            System Administration & Fraud Metrics
          </h1>
          <p className="text-xs text-slate-500">
            System-wide verification statistics, user access logs, and detection model breakdown.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
        <div className="bg-white p-6 rounded-2xl border border-slate-200 space-y-2 shadow-sm">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold uppercase tracking-wider font-heading">Total Screenings</span>
            <FileText className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="text-3xl font-heading font-extrabold text-slate-900">
            {stats?.stats?.totalVerifications ?? 0}
          </div>
          <p className="text-[11px] text-slate-500">System Lifetime Verifications</p>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 space-y-2 shadow-sm">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold uppercase tracking-wider font-heading">Low Risk (Genuine)</span>
            <CheckCircle className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-3xl font-heading font-extrabold text-emerald-700">
            {stats?.stats?.lowRisk ?? 0}
          </div>
          <p className="text-[11px] text-slate-500">Passed Screenings</p>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 space-y-2 shadow-sm">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold uppercase tracking-wider font-heading">Review Required</span>
            <AlertTriangle className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-3xl font-heading font-extrabold text-amber-700">
            {stats?.stats?.reviewRequired ?? 0}
          </div>
          <p className="text-[11px] text-slate-500">Suspicious Flagged Items</p>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 space-y-2 shadow-sm">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold uppercase tracking-wider font-heading">High Fraud Risk</span>
            <Shield className="w-4 h-4 text-rose-600" />
          </div>
          <div className="text-3xl font-heading font-extrabold text-rose-700">
            {stats?.stats?.highRisk ?? 0}
          </div>
          <p className="text-[11px] text-slate-500">Confirmed Tampered Documents</p>
        </div>
      </div>
    </div>
  );
}
