import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, FileScan, BarChart3, Settings, ShieldAlert, Cpu } from 'lucide-react';

export default function Sidebar() {
  const navItems = [
    { path: '/', label: 'Overview Dashboard', icon: LayoutDashboard },
    { path: '/screen', label: 'Document Screening', icon: FileScan },
    { path: '/evaluation', label: 'ML Test & Evaluation', icon: BarChart3 },
  ];

  return (
    <aside className="w-64 glass-panel border-r border-slate-800/80 min-h-[calc(100vh-65px)] p-4 flex flex-col justify-between">
      <div className="space-y-6">
        <div>
          <p className="px-3 text-[11px] font-semibold tracking-wider text-slate-400 uppercase mb-2">
            Main Navigation
          </p>
          <nav className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className={({ isActive }) =>
                    `flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                      isActive
                        ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30 shadow-sm'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-850'
                    }`
                  }
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </NavLink>
              );
            })}
          </nav>
        </div>

        <div>
          <p className="px-3 text-[11px] font-semibold tracking-wider text-slate-400 uppercase mb-2">
            Supported Documents
          </p>
          <div className="px-3 space-y-2 text-xs text-slate-400">
            <div className="flex items-center justify-between py-1 border-b border-slate-800/60">
              <span>PAN Card</span>
              <span className="text-emerald-400 font-medium">Ready</span>
            </div>
            <div className="flex items-center justify-between py-1 border-b border-slate-800/60">
              <span>Passport</span>
              <span className="text-emerald-400 font-medium">Ready</span>
            </div>
            <div className="flex items-center justify-between py-1 border-b border-slate-800/60">
              <span>Driving Licence</span>
              <span className="text-emerald-400 font-medium">Ready</span>
            </div>
            <div className="flex items-center justify-between py-1 border-b border-slate-800/60">
              <span>Aadhaar Test Doc</span>
              <span className="text-emerald-400 font-medium">Ready</span>
            </div>
            <div className="flex items-center justify-between py-1 border-b border-slate-800/60">
              <span>College & Employee ID</span>
              <span className="text-emerald-400 font-medium">Ready</span>
            </div>
          </div>
        </div>
      </div>

      <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 space-y-2">
        <div className="flex items-center space-x-2 text-xs font-semibold text-slate-300">
          <Cpu className="w-4 h-4 text-blue-400" />
          <span>Real Detection Engine</span>
        </div>
        <p className="text-[11px] text-slate-400 leading-relaxed">
          No mock fraud scores. Verification evidence derived directly from PaddleOCR, PyTorch, OpenCV & XGBoost pipeline.
        </p>
      </div>
    </aside>
  );
}
