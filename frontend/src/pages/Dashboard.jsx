import React, { useEffect, useState } from 'react';
import { ShieldCheck, FileText, Cpu, CheckCircle2, ArrowRight, Zap, Sparkles, Lock } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { fetchSupportedDocumentTypes } from '../services/api';

export default function Dashboard() {
  const [docTypes, setDocTypes] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    fetchSupportedDocumentTypes().then((res) => {
      if (res.success) setDocTypes(res.supportedTypes);
    });
  }, []);

  const handleQuickScreen = (code) => {
    navigate('/screen', { state: { selectedType: code } });
  };

  return (
    <div className="space-y-8 pb-8">
      {/* Hero Banner */}
      <div className="relative p-8 md:p-10 rounded-3xl bg-white border border-slate-200 shadow-sm overflow-hidden">
        <div className="absolute top-0 right-0 -mt-12 -mr-12 w-96 h-96 bg-gradient-to-br from-blue-50 to-cyan-50 rounded-full blur-3xl pointer-events-none"></div>

        <div className="max-w-3xl space-y-4 relative z-10">
          <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-blue-50 border border-blue-200 text-xs text-blue-700 font-semibold shadow-xs">
            <Sparkles className="w-3.5 h-3.5 text-blue-600 animate-pulse" />
            <span>AI Multi-Model Real Screening Active</span>
          </div>

          <h1 className="text-3xl md:text-5xl font-heading font-black tracking-tight text-slate-900 leading-tight">
            Enterprise Identity Verification <br />
            <span className="text-blue-600">& Document Fraud Screening</span>
          </h1>

          <p className="text-slate-600 text-sm md:text-base leading-relaxed max-w-2xl font-normal">
            Multi-stage identity verification engine featuring PaddleOCR field extraction, PyTorch ResNet tampering detection, OpenCV forensic ELA noise analysis, MRZ/QR validation, and XGBoost risk decision scoring.
          </p>

          <div className="pt-3 flex flex-wrap items-center gap-4">
            <Link
              to="/screen"
              className="inline-flex items-center space-x-2 px-6 py-3.5 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-heading font-bold text-sm transition-all duration-200 shadow-md shadow-blue-600/20 hover:scale-[1.01]"
            >
              <span>Launch Screening Pipeline</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              to="/evaluation"
              className="inline-flex items-center space-x-2 px-6 py-3.5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-heading font-semibold text-sm border border-slate-300 transition-all duration-200"
            >
              <Zap className="w-4 h-4 text-blue-600" />
              <span>View Benchmark Suite</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
        <div className="glass-card p-6 rounded-2xl border border-slate-200 space-y-3 shadow-xs">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold uppercase tracking-wider font-heading">Supported Specs</span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center border border-blue-100">
              <FileText className="w-4 h-4 text-blue-600" />
            </div>
          </div>
          <div className="text-3xl font-heading font-extrabold text-slate-900">6 Document Types</div>
          <p className="text-xs text-slate-500 leading-normal">PAN, Passport, DL, Aadhaar, Student & Employee ID</p>
        </div>

        <div className="glass-card p-6 rounded-2xl border border-slate-200 space-y-3 shadow-xs">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold uppercase tracking-wider font-heading">Detection Pipeline</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center border border-emerald-100">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
            </div>
          </div>
          <div className="text-3xl font-heading font-extrabold text-slate-900">12 Pipeline Stages</div>
          <p className="text-xs text-slate-500 leading-normal">Quality, OCR, Forensics, MRZ, Tampering, Face & Risk Engine</p>
        </div>

        <div className="glass-card p-6 rounded-2xl border border-slate-200 space-y-3 shadow-xs">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold uppercase tracking-wider font-heading">Tampering AI</span>
            <div className="w-8 h-8 rounded-lg bg-cyan-50 flex items-center justify-center border border-cyan-100">
              <Cpu className="w-4 h-4 text-cyan-600" />
            </div>
          </div>
          <div className="text-3xl font-heading font-extrabold text-slate-900">ResNet / EfficientNet</div>
          <p className="text-xs text-slate-500 leading-normal">Binary Probabilistic Genuine vs Manipulated Classifier</p>
        </div>

        <div className="glass-card p-6 rounded-2xl border border-slate-200 space-y-3 shadow-xs">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold uppercase tracking-wider font-heading">Explainability</span>
            <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center border border-indigo-100">
              <CheckCircle2 className="w-4 h-4 text-indigo-600" />
            </div>
          </div>
          <div className="text-3xl font-heading font-extrabold text-slate-900">100% Evidence-Based</div>
          <p className="text-xs text-slate-500 leading-normal">Individual forensic signals & breakdown report cards</p>
        </div>
      </div>

      {/* Configured Document Validators */}
      <div className="bg-white p-7 rounded-3xl border border-slate-200 space-y-6 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-heading font-extrabold text-slate-900 flex items-center space-x-2.5">
              <FileText className="w-5 h-5 text-blue-600" />
              <span>Configured Document Screening Suites</span>
            </h2>
            <p className="text-xs text-slate-500 mt-1">Select a document type to launch instant screening validation</p>
          </div>
          <span className="px-3 py-1 text-xs font-bold rounded-full bg-blue-50 text-blue-700 border border-blue-200">
            6 Active Models
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {docTypes.map((doc) => (
            <div
              key={doc.code}
              className="p-5 rounded-2xl bg-slate-50/70 border border-slate-200 space-y-3 hover:border-blue-500 transition group flex flex-col justify-between"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-heading font-bold text-base text-slate-900 group-hover:text-blue-600 transition">
                    {doc.name}
                  </span>
                  <span className="px-2.5 py-0.5 text-[10px] font-bold rounded-md bg-blue-100 text-blue-800 font-mono-code">
                    {doc.code}
                  </span>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">{doc.description}</p>
              </div>

              <button
                onClick={() => handleQuickScreen(doc.code)}
                className="w-full mt-3 py-2.5 px-4 rounded-xl bg-white hover:bg-blue-600 hover:text-white text-slate-800 text-xs font-heading font-semibold border border-slate-300 hover:border-blue-600 transition flex items-center justify-center space-x-2 shadow-xs"
              >
                <span>Screen {doc.code}</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition" />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
