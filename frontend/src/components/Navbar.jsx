import React from 'react';
import { Shield, Sparkles, HelpCircle, Bell } from 'lucide-react';
import SystemHealthBadge from './SystemHealthBadge';

export default function Navbar() {
  return (
    <header className="sticky top-0 z-40 w-full glass-panel border-b border-slate-800/80 px-6 py-3 flex items-center justify-between">
      <div className="flex items-center space-x-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-500 to-cyan-400 p-0.5 flex items-center justify-center glow-blue shadow-lg">
          <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
            <Shield className="w-5 h-5 text-blue-400" />
          </div>
        </div>
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="font-bold text-base tracking-tight text-white">ShieldAI</h1>
            <span className="px-2 py-0.5 text-[10px] uppercase font-bold tracking-wider rounded-md bg-blue-500/10 text-blue-400 border border-blue-500/20">
              v1.0 Real Screening
            </span>
          </div>
          <p className="text-xs text-slate-400">AI-Based Fake Identity & Document Analysis System</p>
        </div>
      </div>

      <div className="flex items-center space-x-6">
        <SystemHealthBadge />

        <div className="flex items-center space-x-3 pl-4 border-l border-slate-800">
          <button className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-850 transition">
            <Bell className="w-4 h-4" />
          </button>
          <button className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-850 transition">
            <HelpCircle className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
}
