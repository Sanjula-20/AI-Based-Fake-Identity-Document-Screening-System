import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { fetchVerificationHistory } from '../services/api';
import { History, FileText, ArrowRight, ShieldCheck, ShieldAlert, AlertTriangle, Search, Filter } from 'lucide-react';

export default function HistoryPage() {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('ALL');

  useEffect(() => {
    fetchVerificationHistory().then((res) => {
      if (res.success) {
        setHistory(res.verifications || []);
      }
      setLoading(false);
    });
  }, []);

  const filteredItems = history.filter((item) => {
    if (filter === 'ALL') return true;
    return item.riskStatus === filter;
  });

  return (
    <div className="space-y-8 max-w-5xl mx-auto pb-10">
      <div className="bg-white p-7 rounded-3xl border border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm">
        <div className="space-y-1">
          <h1 className="text-2xl md:text-3xl font-heading font-extrabold text-slate-900 tracking-tight flex items-center space-x-2.5">
            <History className="w-7 h-7 text-indigo-600" />
            <span>Verification Audit History</span>
          </h1>
          <p className="text-xs text-slate-500">
            Review past identity document screening records and forensic evidence logs.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <Filter className="w-4 h-4 text-slate-400" />
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="bg-slate-50 border border-slate-300 text-slate-800 text-xs rounded-xl px-3 py-2 font-medium focus:outline-none focus:border-indigo-600"
          >
            <option value="ALL">All Risk Statuses</option>
            <option value="LOW_RISK">Genuine (Low Risk)</option>
            <option value="REVIEW_REQUIRED">Review Required</option>
            <option value="HIGH_RISK">High Fraud Risk</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-16 space-y-3">
          <div className="w-8 h-8 rounded-full border-2 border-indigo-600 border-t-transparent animate-spin mx-auto"></div>
          <p className="text-xs text-slate-500 font-medium">Loading history records...</p>
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="bg-white p-12 rounded-3xl border border-slate-200 text-center space-y-4 shadow-sm">
          <FileText className="w-12 h-12 text-slate-400 mx-auto" />
          <h3 className="text-lg font-heading font-bold text-slate-900">No Verification History Records Found</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Upload identity documents on the Document Screening Workbench to generate explainable fraud reports.
          </p>
          <Link
            to="/screen"
            className="inline-flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-heading font-bold text-xs transition shadow-sm"
          >
            <span>Start New Screening</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredItems.map((item) => {
            const isHigh = item.riskStatus === 'HIGH_RISK';
            const isReview = item.riskStatus === 'REVIEW_REQUIRED';
            return (
              <div
                key={item._id}
                className="bg-white p-5 rounded-2xl border border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:border-indigo-300 transition shadow-sm"
              >
                <div className="flex items-center space-x-4">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                    isHigh ? 'bg-rose-50 text-rose-600 border border-rose-200' :
                    isReview ? 'bg-amber-50 text-amber-600 border border-amber-200' :
                    'bg-emerald-50 text-emerald-600 border border-emerald-200'
                  }`}>
                    {isHigh ? <ShieldAlert className="w-5 h-5" /> : isReview ? <AlertTriangle className="w-5 h-5" /> : <ShieldCheck className="w-5 h-5" />}
                  </div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="font-heading font-bold text-sm text-slate-900">{item.originalFilename}</span>
                      <span className="px-2 py-0.5 text-[10px] font-bold rounded bg-slate-100 text-slate-700 font-mono-code">
                        {item.documentType}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {new Date(item.createdAt).toLocaleString()} • ID: {item.verificationId}
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-4">
                  <div className="text-right">
                    <span className={`text-xs font-heading font-bold block ${
                      isHigh ? 'text-rose-600' : isReview ? 'text-amber-600' : 'text-emerald-600'
                    }`}>
                      {item.riskStatus}
                    </span>
                    <span className="text-[11px] text-slate-400">Risk Score: {item.riskScore}/100</span>
                  </div>

                  <Link
                    to={`/verification/${item.verificationId}`}
                    className="p-2.5 rounded-xl bg-slate-100 hover:bg-indigo-600 hover:text-white text-slate-700 transition"
                  >
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
