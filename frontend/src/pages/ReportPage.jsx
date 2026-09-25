import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { fetchVerificationReport } from '../services/api';
import { ShieldAlert, ShieldCheck, AlertTriangle, FileText, Cpu, CheckCircle2, XCircle, ArrowLeft, AlertCircle } from 'lucide-react';

export default function ReportPage() {
  const { id } = useParams();
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchVerificationReport(id).then((res) => {
      if (res.success) {
        setReport(res.verification);
      } else {
        setError(res.message || 'Report not found');
      }
      setLoading(false);
    });
  }, [id]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <div className="w-14 h-14 rounded-2xl bg-indigo-50 border border-indigo-200 flex items-center justify-center shadow-sm">
          <Cpu className="w-7 h-7 text-indigo-600 animate-spin" />
        </div>
        <p className="text-sm font-heading font-bold text-slate-700">Generating Explainable Forensic Report...</p>
      </div>
    );
  }

  if (error || !report) {
    return (
      <div className="max-w-xl mx-auto bg-white p-8 rounded-3xl border border-rose-200 text-center space-y-5 shadow-sm">
        <AlertTriangle className="w-12 h-12 text-rose-600 mx-auto" />
        <h2 className="text-2xl font-heading font-extrabold text-slate-900">Report Access Error</h2>
        <p className="text-xs text-slate-600 leading-relaxed">{error || 'Verification report could not be loaded.'}</p>
        <Link to="/" className="inline-flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-indigo-600 text-white text-xs font-heading font-bold transition">
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Overview Dashboard</span>
        </Link>
      </div>
    );
  }

  const {
    verificationId,
    documentType,
    riskScore,
    riskStatus,
    reasons,
    individualChecks,
    ocrResult,
    tampering,
    createdAt
  } = report;

  const isHighRisk = riskStatus === 'HIGH_RISK' || riskStatus === 'TAMPERED';
  const isReviewRequired = riskStatus === 'REVIEW_REQUIRED';

  const statusTheme = isHighRisk
    ? {
        bg: 'bg-rose-50/80',
        border: 'border-rose-200',
        text: 'text-rose-700',
        badgeBg: 'bg-rose-100 text-rose-800 border-rose-300',
        icon: ShieldAlert,
        title: 'HIGH FRAUD RISK / TAMPERED'
      }
    : isReviewRequired
    ? {
        bg: 'bg-amber-50/80',
        border: 'border-amber-200',
        text: 'text-amber-700',
        badgeBg: 'bg-amber-100 text-amber-800 border-amber-300',
        icon: AlertTriangle,
        title: 'SUSPICIOUS — MANUAL REVIEW REQUIRED'
      }
    : {
        bg: 'bg-emerald-50/80',
        border: 'border-emerald-200',
        text: 'text-emerald-700',
        badgeBg: 'bg-emerald-100 text-emerald-800 border-emerald-300',
        icon: ShieldCheck,
        title: 'GENUINE DOCUMENT — PASSED VERIFICATION'
      };

  const StatusIcon = statusTheme.icon;

  return (
    <div className="space-y-8 max-w-5xl mx-auto pb-10">
      {/* Navigation Header */}
      <div className="flex items-center justify-between">
        <Link to="/" className="inline-flex items-center space-x-2 text-xs font-heading font-bold text-slate-600 hover:text-indigo-600 transition">
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Dashboard</span>
        </Link>
        <span className="text-xs font-mono-code text-slate-500">DOSSIER ID: {verificationId}</span>
      </div>

      {/* Main Banner Report Card */}
      <div className={`p-8 md:p-10 rounded-3xl ${statusTheme.bg} border ${statusTheme.border} shadow-sm relative overflow-hidden`}>
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2">
            <div className="flex items-center space-x-2.5">
              <span className="px-3 py-1 rounded-full bg-white text-[10px] font-bold uppercase tracking-widest text-slate-700 border border-slate-200 shadow-xs">
                AI Fraud Forensic Dossier
              </span>
              <span className="text-slate-400">•</span>
              <span className="text-xs font-bold text-slate-900 font-mono-code">{documentType}</span>
            </div>

            <h1 className="text-2xl md:text-3xl font-heading font-black tracking-tight text-slate-900 flex items-center space-x-3">
              <StatusIcon className={`w-8 h-8 md:w-9 md:h-9 ${statusTheme.text}`} />
              <span>{statusTheme.title}</span>
            </h1>

            <p className="text-xs text-slate-500 font-medium">
              Screened on {new Date(createdAt).toLocaleString()} • Engine Version 2.0
            </p>
          </div>

          {/* Risk Score Gauge */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center space-x-5">
            <div className="text-center">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block font-heading">
                Fraud Risk Score
              </span>
              <div className={`text-4xl font-heading font-black mt-1 ${statusTheme.text}`}>
                {riskScore}<span className="text-sm font-normal text-slate-400">/100</span>
              </div>
            </div>

            <div className="pl-4 border-l border-slate-200">
              <span className={`px-3 py-1.5 rounded-xl text-xs font-heading font-bold border block text-center ${statusTheme.badgeBg}`}>
                {riskStatus}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 12-Stage Verification Checklist Grid */}
      <div className="bg-white p-7 rounded-3xl border border-slate-200 space-y-5 shadow-sm">
        <h2 className="text-lg font-heading font-extrabold text-slate-900 flex items-center space-x-2.5">
          <FileText className="w-5 h-5 text-indigo-600" />
          <span>12-Stage Verification Checklist Matrix</span>
        </h2>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Image Quality', status: individualChecks?.quality || 'PASS' },
            { label: 'OCR Field Extraction', status: individualChecks?.ocr || 'PASS' },
            { label: 'Format Validation', status: individualChecks?.formatValidation || 'PASS' },
            { label: 'ResNet Tampering AI', status: individualChecks?.tampering || 'PASS' },
            { label: 'QR / Barcode', status: individualChecks?.qr || 'NOT_AVAILABLE' },
            { label: 'Passport MRZ', status: individualChecks?.mrz || 'NOT_AVAILABLE' },
            { label: 'Face Verification', status: individualChecks?.face || 'NOT_AVAILABLE' },
            { label: 'Liveness Detector', status: individualChecks?.liveness || 'NOT_AVAILABLE' }
          ].map((check) => {
            const isPass = check.status === 'PASS' || check.status === 'VALID' || check.status === 'MATCH' || check.status === 'DECODED' || check.status === 'HIGH' || check.status === 'CONSISTENT';
            const isFail = check.status === 'FAIL' || check.status === 'MISMATCH' || check.status === 'TAMPERED';
            return (
              <div key={check.label} className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                <span className="text-xs text-slate-800 font-semibold">{check.label}</span>
                <span className={`px-2.5 py-1 text-[10px] font-bold rounded-lg ${
                  isPass ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                  isFail ? 'bg-rose-50 text-rose-700 border border-rose-200' :
                  'bg-slate-100 text-slate-600 border border-slate-200'
                }`}>
                  {check.status}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Detailed Forensic Evidence Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* PyTorch ResNet & ELA Forensics */}
        <div className="bg-white p-7 rounded-3xl border border-slate-200 space-y-5 shadow-sm">
          <h3 className="font-heading font-extrabold text-base text-slate-900 flex items-center space-x-2.5">
            <Cpu className="w-5 h-5 text-indigo-600" />
            <span>PyTorch ResNet & ELA Forensic Model</span>
          </h3>

          <div className="space-y-3.5 text-xs font-medium">
            <div className="flex justify-between items-center py-2 border-b border-slate-100">
              <span className="text-slate-500">Prediction Result</span>
              <span className={`font-bold font-heading text-sm ${tampering?.prediction === 'TAMPERED' ? 'text-rose-600' : 'text-emerald-600'}`}>
                {tampering?.prediction || 'UNABLE_TO_DETERMINE'}
              </span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-slate-100">
              <span className="text-slate-500">Tampered Probability</span>
              <span className="font-bold text-rose-600 font-mono-code text-sm">
                {tampering?.tamperedProbability !== undefined ? `${intPercent(tampering.tamperedProbability)}%` : 'N/A'}
              </span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-slate-100">
              <span className="text-slate-500">Genuine Probability</span>
              <span className="font-bold text-emerald-600 font-mono-code text-sm">
                {tampering?.genuineProbability !== undefined ? `${intPercent(tampering.genuineProbability)}%` : 'N/A'}
              </span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-slate-100">
              <span className="text-slate-500">OpenCV ELA Noise Anomaly</span>
              <span className="font-semibold text-slate-900">
                {tampering?.forensicSignals?.elaCompressionScore ?? 'N/A'}
              </span>
            </div>
          </div>
        </div>

        {/* OCR Extracted Data */}
        <div className="bg-white p-7 rounded-3xl border border-slate-200 space-y-5 shadow-sm">
          <h3 className="font-heading font-extrabold text-base text-slate-900 flex items-center space-x-2.5">
            <FileText className="w-5 h-5 text-indigo-600" />
            <span>PaddleOCR Extracted Fields</span>
          </h3>

          {ocrResult?.extractedFields && Object.keys(ocrResult.extractedFields).length > 0 ? (
            <div className="space-y-2.5 text-xs">
              {Object.entries(ocrResult.extractedFields).map(([key, item]) => (
                <div key={key} className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex justify-between items-center">
                  <div>
                    <span className="text-slate-500 font-semibold uppercase text-[10px] block">{key}</span>
                    <span className="font-bold text-slate-900 font-mono-code text-xs mt-0.5 block">{item.value}</span>
                  </div>
                  <span className="text-[11px] text-indigo-700 font-mono-code font-bold bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
                    {intPercent(item.confidence)}% conf
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-slate-500 italic">No structured fields extracted by OCR.</p>
          )}
        </div>
      </div>

      {/* Screening Findings & Reasons */}
      <div className="bg-white p-7 rounded-3xl border border-slate-200 space-y-4 shadow-sm">
        <h3 className="font-heading font-extrabold text-base text-slate-900 flex items-center space-x-2.5">
          <AlertCircle className="w-5 h-5 text-amber-600" />
          <span>Screening Findings & Forensic Evidence</span>
        </h3>

        <ul className="space-y-2.5 text-xs text-slate-700">
          {reasons && reasons.map((reason, idx) => (
            <li key={idx} className="flex items-start space-x-2.5 p-3 rounded-xl bg-slate-50 border border-slate-200">
              <span className="text-amber-600 font-bold">•</span>
              <span className="leading-relaxed">{reason}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function intPercent(val) {
  if (val === undefined || val === null) return 0;
  return Math.round(val * 100);
}
