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
    const interval = setInterval(checkHealth, 10000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="flex items-center space-x-2 text-xs text-slate-400 animate-pulse">
        <Activity className="w-3.5 h-3.5" />
        <span>Checking services...</span>
      </div>
    );
  }

  const isBackendOk = health?.services?.backend?.status === 'online';
  const isMongoOk = health?.services?.mongodb?.status === 'connected';
  const isAiOk = health?.services?.aiService?.status === 'connected';

  return (
    <div className="flex items-center space-x-3 text-xs">
      {/* Express Backend */}
      <div className="flex items-center space-x-1.5 px-2.5 py-1 rounded-full bg-slate-850 border border-slate-800">
        <Server className={`w-3.5 h-3.5 ${isBackendOk ? 'text-emerald-400' : 'text-rose-400'}`} />
        <span className="text-slate-300">Backend:</span>
        <span className={isBackendOk ? 'text-emerald-400 font-medium' : 'text-rose-400 font-medium'}>
          {isBackendOk ? 'Online' : 'Offline'}
        </span>
      </div>

      {/* MongoDB */}
      <div className="flex items-center space-x-1.5 px-2.5 py-1 rounded-full bg-slate-850 border border-slate-800">
        <Database className={`w-3.5 h-3.5 ${isMongoOk ? 'text-emerald-400' : 'text-amber-400'}`} />
        <span className="text-slate-300">Mongo:</span>
        <span className={isMongoOk ? 'text-emerald-400 font-medium' : 'text-amber-400 font-medium'}>
          {isMongoOk ? 'Connected' : 'Disconnected'}
        </span>
      </div>

      {/* FastAPI AI Service */}
      <div className="flex items-center space-x-1.5 px-2.5 py-1 rounded-full bg-slate-850 border border-slate-800">
        <Cpu className={`w-3.5 h-3.5 ${isAiOk ? 'text-blue-400' : 'text-rose-400'}`} />
        <span className="text-slate-300">AI Engine:</span>
        <span className={isAiOk ? 'text-blue-400 font-medium' : 'text-rose-400 font-medium'}>
          {isAiOk ? 'Active' : 'Unreachable'}
        </span>
      </div>
    </div>
  );
}
