import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { fetchVerificationHistory, deleteVerificationRecord } from '../services/api';
import { downloadVerificationPDFReport } from '../utils/pdfExporter';
import { History, FileText, ArrowRight, ShieldCheck, ShieldAlert, AlertTriangle, Search, Filter, Download, Trash2, CheckCircle2, XCircle, Info } from 'lucide-react';

export default function HistoryPage() {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('ALL'); // ALL | CORRECT | INCORRECT
  const [basisFilter, setBasisFilter] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = () => {
    setLoading(true);
    fetchVerificationHistory().then((res) => {
      if (res.success) {
        setHistory(res.verifications || []);
      }
      setLoading(false);
    });
  };

  const handleDelete = async (id, e) => {
    e.preventDefault();
    e.stopPropagation();
    if (window.confirm('Are you sure you want to delete this verification record?')) {
      const res = await deleteVerificationRecord(id);
      if (res.success) {
        setHistory(prev => prev.filter(item => item.verificationId !== id && item._id !== id));
      } else {
        alert(res.message || 'Failed to delete record.');
      }
    }
  };

  const filteredItems = history.filter((item) => {
    const isGenuine = item.isCorrect || item.classification === 'CORRECT' || item.riskStatus === 'LOW_RISK';
    
    // Status Filter (All vs Correct vs Incorrect)
    if (statusFilter === 'CORRECT' && !isGenuine) return false;
    if (statusFilter === 'INCORRECT' && isGenuine) return false;

    // Failure Basis Filter
    if (basisFilter !== 'ALL') {
      const failedReasons = item.basisOfClassification?.failedReasons || [];
      const hasCategoryMatch = failedReasons.some(r => r.category === basisFilter || r.rule?.includes(basisFilter));
      const hasTextMatch = (item.reasons || []).some(r => r.toLowerCase().includes(basisFilter.toLowerCase()));
      if (!hasCategoryMatch && !hasTextMatch) return false;
    }

    // Search Term
    if (searchTerm.trim() !== '') {
      const term = searchTerm.toLowerCase();
      const filenameMatch = item.originalFilename?.toLowerCase().includes(term);
      const idMatch = item.verificationId?.toLowerCase().includes(term);
      const panMatch = item.ocrResult?.extractedFields?.documentNumber?.value?.toLowerCase().includes(term);
      const basisMatch = item.basisOfClassification?.primaryBasis?.toLowerCase().includes(term);
      return filenameMatch || idMatch || panMatch || basisMatch;
    }

    return true;
  });

  const correctCount = history.filter(item => item.isCorrect || item.classification === 'CORRECT' || item.riskStatus === 'LOW_RISK').length;
  const incorrectCount = history.length - correctCount;

  return (
    <div className="space-y-8 max-w-5xl mx-auto pb-10">
      {/* Title Header */}
      <div className="bg-white p-7 rounded-3xl border border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm">
        <div className="space-y-1">
          <h1 className="text-2xl md:text-3xl font-heading font-extrabold text-slate-900 tracking-tight flex items-center space-x-2.5">
            <History className="w-7 h-7 text-indigo-600" />
            <span>Verification Screening Audit Log</span>
          </h1>
          <p className="text-xs text-slate-500">
            Review history, filter by Correct vs Incorrect documents, and analyze explicit failure reasons.
          </p>
        </div>

        {/* Quick Statistics Summary */}
        <div className="flex items-center space-x-3">
          <div className="px-3.5 py-2 rounded-2xl bg-emerald-50 border border-emerald-200 text-center">
            <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider block font-heading">Correct Docs</span>
            <span className="text-lg font-heading font-extrabold text-emerald-800">{correctCount}</span>
          </div>
          <div className="px-3.5 py-2 rounded-2xl bg-rose-50 border border-rose-200 text-center">
            <span className="text-[10px] font-bold text-rose-700 uppercase tracking-wider block font-heading">Incorrect Docs</span>
            <span className="text-lg font-heading font-extrabold text-rose-800">{incorrectCount}</span>
          </div>
        </div>
      </div>

      {/* Filter Controls Toolbar */}
      <div className="bg-white p-5 rounded-3xl border border-slate-200 space-y-4 shadow-sm">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
          {/* Status Tabs: ALL | CORRECT | INCORRECT */}
          <div className="flex items-center p-1 rounded-2xl bg-slate-100 border border-slate-200 text-xs font-heading font-bold">
            <button
              onClick={() => setStatusFilter('ALL')}
              className={`px-4 py-2 rounded-xl transition ${
                statusFilter === 'ALL'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All Uploads ({history.length})
            </button>
            <button
              onClick={() => setStatusFilter('CORRECT')}
              className={`px-4 py-2 rounded-xl transition flex items-center space-x-1.5 ${
                statusFilter === 'CORRECT'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-emerald-700 hover:bg-emerald-50'
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Correct / Genuine ({correctCount})</span>
            </button>
            <button
              onClick={() => setStatusFilter('INCORRECT')}
              className={`px-4 py-2 rounded-xl transition flex items-center space-x-1.5 ${
                statusFilter === 'INCORRECT'
                  ? 'bg-rose-600 text-white shadow-xs'
                  : 'text-rose-700 hover:bg-rose-50'
              }`}
            >
              <XCircle className="w-3.5 h-3.5" />
              <span>Incorrect / Flagged ({incorrectCount})</span>
            </button>
          </div>

          {/* Search Box */}
          <div className="relative flex-1 max-w-xs">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              placeholder="Search by file, PAN, or reason..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-indigo-600 font-medium"
            />
          </div>
        </div>

        {/* Detailed Basis Filter Row */}
        <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center space-x-2 text-slate-600">
            <Filter className="w-4 h-4 text-slate-400" />
            <span className="font-bold font-heading">Filter by Specific Failure Basis:</span>
          </div>

          <select
            value={basisFilter}
            onChange={(e) => setBasisFilter(e.target.value)}
            className="bg-slate-50 border border-slate-300 text-slate-800 text-xs rounded-xl px-3 py-1.5 font-medium focus:outline-none focus:border-indigo-600 w-full sm:w-auto"
          >
            <option value="ALL">All Failure Criteria</option>
            <option value="Format Validation">Format & Entity Code Failure</option>
            <option value="Forensic Analysis">ELA Compression & Splicing Anomaly</option>
            <option value="AI Classifier">Synthetic Image / AI Artifacts</option>
            <option value="Image Quality">Image Blur / Low Quality</option>
            <option value="Biometric Verification">Biometric Face Mismatch</option>
          </select>
        </div>
      </div>

      {/* Audit Log List */}
      {loading ? (
        <div className="text-center py-16 space-y-3 bg-white rounded-3xl border border-slate-200">
          <div className="w-8 h-8 rounded-full border-2 border-indigo-600 border-t-transparent animate-spin mx-auto"></div>
          <p className="text-xs text-slate-500 font-medium">Loading audit history logs...</p>
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="bg-white p-12 rounded-3xl border border-slate-200 text-center space-y-4 shadow-sm">
          <FileText className="w-12 h-12 text-slate-400 mx-auto" />
          <h3 className="text-lg font-heading font-bold text-slate-900">No Matching Verification Records Found</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Try resetting your status or search filters to view past document screening reports.
          </p>
          <button
            onClick={() => { setStatusFilter('ALL'); setBasisFilter('ALL'); setSearchTerm(''); }}
            className="inline-flex items-center space-x-2 px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-heading font-bold text-xs transition"
          >
            <span>Reset All Filters</span>
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredItems.map((item) => {
            const isGenuine = item.isCorrect || item.classification === 'CORRECT' || item.riskStatus === 'LOW_RISK';
            const isHigh = item.riskStatus === 'HIGH_RISK' || !isGenuine;
            const isReview = item.riskStatus === 'REVIEW_REQUIRED' && !isGenuine;
            const failedReasons = item.basisOfClassification?.failedReasons || [];
            const primaryBasis = item.basisOfClassification?.primaryBasis || (item.reasons && item.reasons.length ? item.reasons.join('; ') : 'Screened document audit record');

            return (
              <div
                key={item._id || item.verificationId}
                className="bg-white p-6 rounded-3xl border border-slate-200 space-y-4 hover:border-indigo-300 transition shadow-sm"
              >
                {/* Header Row */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                  <div className="flex items-center space-x-3">
                    <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 ${
                      isGenuine ? 'bg-emerald-50 text-emerald-600 border border-emerald-200' :
                      isHigh ? 'bg-rose-50 text-rose-600 border border-rose-200' :
                      'bg-amber-50 text-amber-600 border border-amber-200'
                    }`}>
                      {isGenuine ? <ShieldCheck className="w-5 h-5" /> : isHigh ? <ShieldAlert className="w-5 h-5" /> : <AlertTriangle className="w-5 h-5" />}
                    </div>

                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="font-heading font-extrabold text-sm text-slate-900">{item.originalFilename}</span>
                        <span className="px-2 py-0.5 text-[10px] font-bold rounded bg-slate-100 text-slate-700 font-mono-code">
                          {item.documentType}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Uploaded on {new Date(item.createdAt).toLocaleString()} • ID: {item.verificationId}
                      </p>
                    </div>
                  </div>

                  {/* Status & Risk Pill */}
                  <div className="flex items-center space-x-3">
                    <div className="text-right">
                      <span className={`text-xs font-heading font-black block px-3 py-1 rounded-full border ${
                        isGenuine ? 'bg-emerald-50 text-emerald-800 border-emerald-300' :
                        isHigh ? 'bg-rose-50 text-rose-800 border-rose-300' :
                        'bg-amber-50 text-amber-800 border-amber-300'
                      }`}>
                        {isGenuine ? '✅ CORRECT' : '❌ INCORRECT / FLAG'}
                      </span>
                      <span className="text-[10px] text-slate-400 mt-0.5 block">Risk Score: {item.riskScore}/100</span>
                    </div>

                    {/* PDF Export Button */}
                    <button
                      onClick={() => downloadVerificationPDFReport(item)}
                      title="Download PDF Report"
                      className="p-2.5 rounded-xl bg-slate-100 hover:bg-indigo-50 text-slate-600 hover:text-indigo-600 border border-slate-200 transition"
                    >
                      <Download className="w-4 h-4" />
                    </button>

                    {/* View Report Link */}
                    <Link
                      to={`/verification/${item.verificationId}`}
                      title="View Full Report"
                      className="p-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white transition shadow-xs"
                    >
                      <ArrowRight className="w-4 h-4" />
                    </Link>

                    {/* Delete button */}
                    <button
                      onClick={(e) => handleDelete(item.verificationId || item._id, e)}
                      title="Delete Record"
                      className="p-2.5 rounded-xl bg-slate-50 hover:bg-rose-50 text-slate-400 hover:text-rose-600 border border-slate-200 transition"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Explicit Basis of Classification Box */}
                <div className={`p-4 rounded-2xl border text-xs space-y-2 ${
                  isGenuine ? 'bg-emerald-50/50 border-emerald-200 text-emerald-950' : 'bg-rose-50/50 border-rose-200 text-rose-950'
                }`}>
                  <div className="flex items-center justify-between font-heading font-bold text-[11px]">
                    <span className="flex items-center space-x-1.5 uppercase tracking-wider">
                      <Info className="w-3.5 h-3.5" />
                      <span>Basis of Verdict ({isGenuine ? 'Why Correct' : 'Why Incorrect'}):</span>
                    </span>
                    <span className="font-mono-code text-[10px] text-slate-500">Rule Engine Verdict</span>
                  </div>

                  <p className="text-slate-800 font-medium leading-relaxed">{primaryBasis}</p>

                  {/* Bulleted Failure Details for Incorrect Docs */}
                  {failedReasons.length > 0 && (
                    <div className="pt-2 border-t border-rose-200/60 space-y-1">
                      <span className="text-[10px] font-bold text-rose-800 uppercase tracking-wider block">
                        Triggered Failure Rules:
                      </span>
                      {failedReasons.map((r, idx) => (
                        <div key={idx} className="flex items-start space-x-1.5 text-[11px] text-rose-900 font-medium">
                          <span className="text-rose-600 font-bold">•</span>
                          <span><strong>[{r.category || 'Rule'}]:</strong> {r.detail}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
