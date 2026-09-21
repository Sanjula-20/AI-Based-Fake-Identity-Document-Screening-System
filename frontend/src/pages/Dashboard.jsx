import React, { useEffect, useState } from 'react';
import { ShieldCheck, FileText, AlertTriangle, Cpu, CheckCircle2, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { fetchSupportedDocumentTypes } from '../services/api';

export default function Dashboard() {
  const [docTypes, setDocTypes] = useState([]);

  useEffect(() => {
    fetchSupportedDocumentTypes().then((res) => {
      if (res.success) setDocTypes(res.supportedTypes);
    });
  }, []);

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="p-8 rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border border-indigo-500/20 glow-blue relative overflow-hidden">
        <div className="absolute -right-10 -bottom-10 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="max-w-3xl space-y-3 relative z-10">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/30 text-xs text-blue-400 font-medium">
            <Cpu className="w-3.5 h-3.5" />
            <span>Phase 1 Architecture Active</span>
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white">
            AI-Based Document Fraud Detection Platform
          </h1>
          <p className="text-slate-300 text-sm leading-relaxed">
            Multi-stage identity verification pipeline featuring PaddleOCR field extraction, PyTorch transfer-learning tampering detection, OpenCV forensic noise analysis, MRZ/QR consistency validation, and XGBoost risk decision engine.
          </p>
          <div className="pt-2 flex items-center space-x-4">
            <Link
              to="/screen"
              className="inline-flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-sm transition shadow-lg shadow-blue-600/30"
            >
              <span>Launch Screening Pipeline</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              to="/evaluation"
              className="inline-flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium text-sm border border-slate-700 transition"
            >
              <span>View Test & Benchmark Suite</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="glass-card p-5 rounded-xl border border-slate-800 space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Supported Specs</span>
            <FileText className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-2xl font-bold text-white">6 Document Types</div>
          <p className="text-xs text-slate-400">PAN, Passport, DL, Aadhaar, Student/Employee ID</p>
        </div>

        <div className="glass-card p-5 rounded-xl border border-slate-800 space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Detection Pipeline</span>
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold text-white">12 Pipeline Stages</div>
          <p className="text-xs text-slate-400">Quality, OCR, Forensics, MRZ, Tampering, Face, Liveness, Risk Engine</p>
        </div>

        <div className="glass-card p-5 rounded-xl border border-slate-800 space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Tampering AI</span>
            <Cpu className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="text-2xl font-bold text-white">ResNet / EfficientNet</div>
          <p className="text-xs text-slate-400">Binary Probabilistic Genuine vs Manipulated Classifier</p>
        </div>

        <div className="glass-card p-5 rounded-xl border border-slate-800 space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Explainability</span>
            <CheckCircle2 className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-2xl font-bold text-white">100% Evidence-Based</div>
          <p className="text-xs text-slate-400">Individual forensic signals & breakdown reports</p>
        </div>
      </div>

      {/* Supported Documents Grid */}
      <div className="glass-panel p-6 rounded-xl border border-slate-800/80 space-y-4">
        <h2 className="text-lg font-bold text-white flex items-center space-x-2">
          <FileText className="w-5 h-5 text-blue-400" />
          <span>Configured Document Validators</span>
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {docTypes.map((doc) => (
            <div key={doc.code} className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-sm text-slate-200">{doc.name}</span>
                <span className="px-2 py-0.5 text-[10px] font-bold rounded bg-blue-500/10 text-blue-400 border border-blue-500/20">
                  {doc.code}
                </span>
              </div>
              <p className="text-xs text-slate-400">{doc.description}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
