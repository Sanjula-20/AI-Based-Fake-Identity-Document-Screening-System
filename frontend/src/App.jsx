import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import ScreeningPage from './pages/ScreeningPage';
import ReportPage from './pages/ReportPage';
import HistoryPage from './pages/HistoryPage';
import EvaluationDashboard from './pages/EvaluationDashboard';
import AdminDashboard from './pages/AdminDashboard';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';

export default function App() {
  return (
    <Router>
      <div className="min-h-screen bg-[#f8fafc] text-slate-900 flex flex-col">
        <Navbar />
        <div className="flex flex-1">
          <Sidebar />
          <main className="flex-1 p-8 overflow-y-auto">
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/screen" element={<ScreeningPage />} />
              <Route path="/verification/:id" element={<ReportPage />} />
              <Route path="/history" element={<HistoryPage />} />
              <Route path="/evaluation" element={<EvaluationDashboard />} />
              <Route path="/admin" element={<AdminDashboard />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
            </Routes>
          </main>
        </div>
      </div>
    </Router>
  );
}
