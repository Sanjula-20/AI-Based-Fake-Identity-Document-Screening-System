import React from 'react';
import { Shield, HelpCircle, Bell, User, LogOut, LogIn } from 'lucide-react';
import SystemHealthBadge from './SystemHealthBadge';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="sticky top-0 z-40 w-full bg-white/95 backdrop-blur-md border-b border-slate-200 px-6 py-3.5 flex items-center justify-between shadow-sm">
      <Link to="/" className="flex items-center space-x-3.5 group">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-700 via-indigo-600 to-blue-500 p-0.5 flex items-center justify-center shadow-md group-hover:scale-105 transition duration-300">
          <div className="w-full h-full bg-white rounded-[10px] flex items-center justify-center">
            <Shield className="w-5 h-5 text-indigo-600 group-hover:rotate-12 transition duration-300" />
          </div>
        </div>
        <div>
          <div className="flex items-center space-x-2.5">
            <h1 className="font-heading font-extrabold text-lg tracking-tight text-slate-900 group-hover:text-indigo-600 transition">
              Shield<span className="text-indigo-600">AI</span>
            </h1>
            <span className="px-2.5 py-0.5 text-[10px] uppercase font-bold tracking-wider rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200 flex items-center space-x-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-600 animate-pulse"></span>
              <span>PAN Card Verification System</span>
            </span>
          </div>
          <p className="text-[11px] text-slate-500 font-medium">AI-Based Identity & PAN Card Fraud Screening</p>
        </div>
      </Link>

      <div className="flex items-center space-x-5">
        <SystemHealthBadge />

        <div className="flex items-center space-x-3 pl-4 border-l border-slate-200">
          {user ? (
            <div className="flex items-center space-x-3">
              <div className="text-right hidden sm:block">
                <span className="text-xs font-bold text-slate-900 block font-heading">{user.name || 'Screener'}</span>
                <span className="text-[10px] text-slate-500 block font-mono-code">{user.email}</span>
              </div>
              <button
                onClick={handleLogout}
                className="p-2 text-slate-500 hover:text-rose-600 rounded-xl hover:bg-rose-50 border border-slate-200 transition flex items-center space-x-1.5 text-xs font-bold font-heading"
                title="Sign Out"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden md:inline">Sign Out</span>
              </button>
            </div>
          ) : (
            <Link
              to="/login"
              className="px-4 py-2 text-xs font-heading font-bold rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm flex items-center space-x-1.5 transition"
            >
              <LogIn className="w-4 h-4" />
              <span>Sign In</span>
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
