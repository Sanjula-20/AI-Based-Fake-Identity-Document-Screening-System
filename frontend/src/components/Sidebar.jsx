import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, FileScan, BarChart3, UserCheck, Zap, History } from 'lucide-react';

export default function Sidebar() {
  const navItems = [
    { path: '/', label: 'Overview Dashboard', icon: LayoutDashboard },
    { path: '/screen', label: 'Document Screening', icon: FileScan },
    { path: '/history', label: 'Verification History', icon: History },
    { path: '/evaluation', label: 'ML Test & Evaluation', icon: BarChart3 },
    { path: '/admin', label: 'Admin Portal', icon: UserCheck },
  ];

  return (
    <aside className="w-64 bg-white border-r border-slate-200 min-h-[calc(100vh-65px)] p-4 flex flex-col justify-between shadow-sm">
      <div className="space-y-6">
        <div>
          <p className="px-3 text-[10px] font-bold tracking-widest text-slate-400 uppercase mb-3 font-heading">
            Main Navigation
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
                        ? 'bg-blue-50 text-blue-700 border border-blue-200 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                    }`
                  }
                >
                  {({ isActive }) => (
                    <>
                      {isActive && (
                        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1.5 h-6 bg-blue-600 rounded-r-full shadow-sm"></div>
                      )}
                      <Icon className={`w-4 h-4 transition-transform group-hover:scale-110 ${isActive ? 'text-blue-600' : 'text-slate-400 group-hover:text-slate-600'}`} />
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
            Supported Documents
          </p>
          <div className="px-3 space-y-2 text-xs">
            {[
              { name: 'PAN Card', code: 'PAN' },
              { name: 'Passport', code: 'PASSPORT' },
              { name: 'Driving Licence', code: 'DL' },
              { name: 'Aadhaar Card', code: 'AADHAAR' },
              { name: 'College / Employee ID', code: 'ID_CARD' }
            ].map((doc) => (
              <div key={doc.code} className="flex items-center justify-between py-1.5 px-2.5 rounded-lg bg-slate-50 border border-slate-200/70 hover:border-blue-300 transition">
                <span className="text-slate-700 font-medium">{doc.name}</span>
                <span className="px-1.5 py-0.5 text-[9px] font-bold rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                  READY
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2 shadow-inner">
        <div className="flex items-center space-x-2 text-xs font-bold text-slate-900 font-heading">
          <Zap className="w-4 h-4 text-blue-600 animate-pulse" />
          <span>Real Multi-Model Engine</span>
        </div>
        <p className="text-[11px] text-slate-500 leading-relaxed">
          Features PaddleOCR, PyTorch ResNet, OpenCV ELA noise analysis & XGBoost risk decision engine.
        </p>
      </div>
    </aside>
  );
}
