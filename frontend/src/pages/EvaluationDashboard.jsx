import React from 'react';
import { BarChart3, Database, ShieldAlert, CheckCircle, RefreshCw, Cpu } from 'lucide-react';

export default function EvaluationDashboard() {
  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div>
        <h1 className="text-2xl font-extrabold text-white tracking-tight">
          Model Evaluation & Benchmark Dashboard
        </h1>
        <p className="text-sm text-slate-400">
          Measure detection performance across labelled Genuine vs Manipulated dataset splits.
        </p>
      </div>

      <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Database className="w-5 h-5 text-blue-400" />
            <h2 className="font-bold text-base text-slate-200">Test Dataset Configuration</h2>
          </div>
          <span className="px-3 py-1 rounded-full text-xs font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/30">
            Evaluation Engine Ready
          </span>
        </div>

        <p className="text-xs text-slate-400 leading-relaxed">
          The test suite supports evaluating model performance on structured datasets with genuine/ and manipulated/ folders. Metrics (Accuracy, Precision, Recall, F1 Score, Confusion Matrix, FPR, FNR) are calculated dynamically upon execution.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="glass-card p-4 rounded-xl border border-slate-800 text-center space-y-1">
          <span className="text-xs text-slate-400 font-medium">Accuracy</span>
          <div className="text-xl font-extrabold text-slate-400">--</div>
        </div>
        <div className="glass-card p-4 rounded-xl border border-slate-800 text-center space-y-1">
          <span className="text-xs text-slate-400 font-medium">Precision</span>
          <div className="text-xl font-extrabold text-slate-400">--</div>
        </div>
        <div className="glass-card p-4 rounded-xl border border-slate-800 text-center space-y-1">
          <span className="text-xs text-slate-400 font-medium">Recall</span>
          <div className="text-xl font-extrabold text-slate-400">--</div>
        </div>
        <div className="glass-card p-4 rounded-xl border border-slate-800 text-center space-y-1">
          <span className="text-xs text-slate-400 font-medium">F1-Score</span>
          <div className="text-xl font-extrabold text-slate-400">--</div>
        </div>
      </div>
    </div>
  );
}
