import React from 'react';
import { Shield, HelpCircle, Bell, User } from 'lucide-react';
import SystemHealthBadge from './SystemHealthBadge';
import { Link } from 'react-router-dom';

export default function Navbar() {
  return (
    <header className="sticky top-0 z-40 w-full bg-white/95 backdrop-blur-md border-b border-slate-200 px-6 py-3.5 flex items-center justify-between shadow-sm">
      <Link to="/" className="flex items-center space-x-3.5 group">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-700 via-blue-600 to-cyan-500 p-0.5 flex items-center justify-center shadow-md group-hover:scale-105 transition duration-300">
          <div className="w-full h-full bg-white rounded-[10px] flex items-center justify-center">
            <Shield className="w-5 h-5 text-blue-600 group-hover:rotate-12 transition duration-300" />
          </div>
        </div>
        <div>
          <div className="flex items-center space-x-2.5">
            <h1 className="font-heading font-extrabold text-lg tracking-tight text-slate-900 group-hover:text-blue-600 transition">
              Shield<span className="text-blue-600">AI</span>
            </h1>
            <span className="px-2.5 py-0.5 text-[10px] uppercase font-bold tracking-wider rounded-full bg-blue-50 text-blue-700 border border-blue-200 flex items-center space-x-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-pulse"></span>
              <span>Enterprise Edition</span>
            </span>
          </div>
          <p className="text-[11px] text-slate-500 font-medium">AI-Based Identity Verification & Document Screening</p>
        </div>
      </Link>

      <div className="flex items-center space-x-5">
        <SystemHealthBadge />

        <div className="flex items-center space-x-2 pl-4 border-l border-slate-200">
          <button className="p-2 text-slate-500 hover:text-blue-600 rounded-xl hover:bg-slate-100 transition">
            <Bell className="w-4 h-4" />
          </button>
          <button className="p-2 text-slate-500 hover:text-blue-600 rounded-xl hover:bg-slate-100 transition">
            <HelpCircle className="w-4 h-4" />
          </button>
          <Link to="/admin" className="p-2 text-slate-500 hover:text-blue-600 rounded-xl hover:bg-slate-100 transition" title="Admin Portal">
            <User className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </header>
  );
}
