import React, { useEffect, useState } from 'react';
import { fetchSystemHealth } from '../services/api';
import { Activity, Database, Cpu, Server } from 'lucide-react';

export default function SystemHealthBadge() {
  const [health, setHealth] = useState(null);
  const [loading, setLoading] = useState(true);

  const checkHealth = async () => {
    const data = await fetchSystemHealth();
    setHealth(data);
    setLoading(false);
  };

  useEffect(() => {
    checkHealth();
    const interval = setInterval(checkHealth, 8000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="flex items-center space-x-2 text-xs text-slate-500 animate-pulse">
        <Activity className="w-3.5 h-3.5 text-blue-600" />
        <span>Syncing telemetry...</span>
      </div>
    );
  }

  const isBackendOk = health?.services?.backend?.status === 'online';
  const isMongoOk = health?.services?.mongodb?.status === 'connected';
  const isAiOk = health?.services?.aiService?.status === 'connected';

  return (
    <div className="flex items-center space-x-2.5 text-xs">
      {/* Express Backend */}
      <div className="flex items-center space-x-1.5 px-3 py-1 rounded-full bg-slate-50 border border-slate-200 shadow-xs">
        <Server className={`w-3.5 h-3.5 ${isBackendOk ? 'text-emerald-600' : 'text-rose-600'}`} />
        <span className="text-slate-600 font-medium">Backend:</span>
        <span className={`font-semibold flex items-center space-x-1 ${isBackendOk ? 'text-emerald-700' : 'text-rose-700'}`}>
          <span className={`w-1.5 h-1.5 rounded-full ${isBackendOk ? 'bg-emerald-500 animate-ping' : 'bg-rose-500'}`}></span>
          <span>{isBackendOk ? 'Online' : 'Offline'}</span>
        </span>
      </div>

      {/* MongoDB */}
      <div className="flex items-center space-x-1.5 px-3 py-1 rounded-full bg-slate-50 border border-slate-200 shadow-xs">
        <Database className={`w-3.5 h-3.5 ${isMongoOk ? 'text-emerald-600' : 'text-amber-600'}`} />
        <span className="text-slate-600 font-medium">Database:</span>
        <span className={`font-semibold flex items-center space-x-1 ${isMongoOk ? 'text-emerald-700' : 'text-amber-700'}`}>
          <span className={`w-1.5 h-1.5 rounded-full ${isMongoOk ? 'bg-emerald-500' : 'bg-amber-500'}`}></span>
          <span>{isMongoOk ? 'Connected' : 'Disconnected'}</span>
        </span>
      </div>

      {/* FastAPI AI Service */}
      <div className="flex items-center space-x-1.5 px-3 py-1 rounded-full bg-slate-50 border border-slate-200 shadow-xs">
        <Cpu className={`w-3.5 h-3.5 ${isAiOk ? 'text-blue-600' : 'text-rose-600'}`} />
        <span className="text-slate-600 font-medium">AI Engine:</span>
        <span className={`font-semibold flex items-center space-x-1 ${isAiOk ? 'text-blue-700' : 'text-rose-700'}`}>
          <span className={`w-1.5 h-1.5 rounded-full ${isAiOk ? 'bg-blue-600 animate-pulse' : 'bg-rose-500'}`}></span>
          <span>{isAiOk ? 'Active' : 'Offline'}</span>
        </span>
      </div>
    </div>
  );
}
