import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import ScreeningPage from './pages/ScreeningPage';
import EvaluationDashboard from './pages/EvaluationDashboard';

export default function App() {
  return (
    <Router>
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
        <Navbar />
        <div className="flex flex-1">
          <Sidebar />
          <main className="flex-1 p-8 overflow-y-auto">
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/screen" element={<ScreeningPage />} />
              <Route path="/evaluation" element={<EvaluationDashboard />} />
            </Routes>
          </main>
        </div>
      </div>
    </Router>
  );
}
