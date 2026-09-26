import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, FileScan, BarChart3, UserCheck, Zap, History, ShieldCheck } from 'lucide-react';

export default function Sidebar() {
  const navItems = [
    { path: '/screen', label: 'PAN Card Screening', icon: FileScan },
    { path: '/', label: 'Overview Dashboard', icon: LayoutDashboard },
    { path: '/history', label: 'Verification History', icon: History },
    { path: '/evaluation', label: 'ML Model Benchmark', icon: BarChart3 },
    { path: '/admin', label: 'Admin Portal', icon: UserCheck },
  ];

  return (
    <aside className="w-64 bg-white border-r border-slate-200 min-h-[calc(100vh-65px)] p-4 flex flex-col justify-between shadow-sm">
      <div className="space-y-6">
        <div>
          <p className="px-3 text-[10px] font-bold tracking-widest text-slate-400 uppercase mb-3 font-heading">
            Navigation
          </p>
          <nav className="space-y-1.5">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className={({ isActive }) =>
                    `flex items-center space-x-3 px-3.5 py-3 rounded-xl text-sm font-semibold transition-all duration-200 relative group ${
                      isActive
                        ? 'bg-indigo-50 text-indigo-700 border border-indigo-200 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                    }`
                  }
                >
                  {({ isActive }) => (
                    <>
                      {isActive && (
                        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1.5 h-6 bg-indigo-600 rounded-r-full shadow-sm"></div>
                      )}
                      <Icon className={`w-4 h-4 transition-transform group-hover:scale-110 ${isActive ? 'text-indigo-600' : 'text-slate-400 group-hover:text-slate-600'}`} />
                      <span>{item.label}</span>
                    </>
                  )}
                </NavLink>
              );
            })}
          </nav>
        </div>

        <div>
          <p className="px-3 text-[10px] font-bold tracking-widest text-slate-400 uppercase mb-3 font-heading">
            Primary Target Document
          </p>
          <div className="px-3 space-y-2 text-xs">
            <div className="flex items-center justify-between py-2 px-3 rounded-xl bg-indigo-50/70 border border-indigo-200 text-indigo-900 font-bold">
              <div className="flex items-center space-x-2">
                <ShieldCheck className="w-4 h-4 text-indigo-600" />
                <span>PAN Card (India)</span>
              </div>
              <span className="px-2 py-0.5 text-[9px] font-extrabold rounded bg-emerald-100 text-emerald-800">
                ACTIVE
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2 shadow-inner">
        <div className="flex items-center space-x-2 text-xs font-bold text-slate-900 font-heading">
          <Zap className="w-4 h-4 text-indigo-600 animate-pulse" />
          <span>Multi-Model AI Active</span>
        </div>
        <p className="text-[11px] text-slate-500 leading-relaxed">
          PaddleOCR field parsing, PyTorch ResNet tampering detection & OpenCV ELA noise analysis.
        </p>
      </div>
    </aside>
  );
}
