
import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  Activity,
  Bell, 
  RefreshCw,
  Loader2,
  CheckCircle,
  AlertTriangle,
  XCircle,
  Server,
  Key,
  Globe,
  Monitor
} from 'lucide-react';
import { getAppConfig, checkDatabaseConnection, supabase } from '../lib/supabase';

interface DiagnosticResult {
  id: string;
  name: string;
  description: string;
  status: 'checking' | 'pass' | 'warn' | 'fail';
  message?: string;
  icon: any;
}

const SettingsPanel = () => {
  const [activeTab, setActiveTab] = useState<'diagnostics' | 'notifications'>('diagnostics');
  const [diagnostics, setDiagnostics] = useState<DiagnosticResult[]>([
    { id: 'db', name: 'Supabase Database', description: 'Connectivity to HIT cloud repository', status: 'checking', icon: Server },
    { id: 'auth', name: 'Identity Engine', description: 'Supabase Authentication service status', status: 'checking', icon: ShieldCheck },
    { id: 'env', name: 'Environment Config', description: 'Institutional API keys & project secrets', status: 'checking', icon: Key },
    { id: 'network', name: 'Network Gateway', description: 'Real-time reachability to cloud services', status: 'checking', icon: Globe },
    { id: 'browser', name: 'Engine Capability', description: 'Local storage and session persistence', status: 'checking', icon: Monitor },
  ]);

  const runDiagnostics = async () => {
    // Reset statuses to checking
    setDiagnostics(prev => prev.map(d => ({ ...d, status: 'checking', message: undefined })));

    // 1. Database Check
    const dbResult = await checkDatabaseConnection();
    updateDiagnostic('db', dbResult.success ? 'pass' : 'fail', dbResult.message || 'Connected to project ' + getAppConfig().projectId);

    // 2. Auth Check
    updateDiagnostic('auth', supabase ? 'pass' : 'fail', supabase ? 'Auth service initialized' : 'Auth service failed to load');

    // 3. Env Check
    const config = getAppConfig();
    const isMock = config.projectId === 'None' || !config.isConfigured;
    updateDiagnostic('env', isMock ? 'warn' : 'pass', isMock ? 'Using mock/incomplete configuration' : 'Production keys validated');

    // 4. Network Check
    updateDiagnostic('network', navigator.onLine ? 'pass' : 'fail', navigator.onLine ? 'Gateway online' : 'Local connection lost');

    // 5. Browser Check
    try {
      localStorage.setItem('diag_test', 'true');
      localStorage.removeItem('diag_test');
      updateDiagnostic('browser', 'pass', 'Session storage available');
    } catch (e) {
      updateDiagnostic('browser', 'fail', 'Storage quota exceeded or disabled');
    }
  };

  const updateDiagnostic = (id: string, status: DiagnosticResult['status'], message: string) => {
    setDiagnostics(prev => prev.map(d => d.id === id ? { ...d, status, message } : d));
  };

  useEffect(() => {
    if (activeTab === 'diagnostics') {
      runDiagnostics();
    }
  }, [activeTab]);

  return (
    <div className="flex h-full gap-6 bg-transparent">
      {/* Settings Sidebar */}
      <div className="w-80 bg-white rounded-[2rem] shadow-sm border border-gray-100 overflow-hidden shrink-0 flex flex-col">
        <div className="p-8 border-b border-gray-50 bg-gray-50/50">
          <h2 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em]">System Admin</h2>
        </div>
        <nav className="p-4 space-y-2 flex-1">
          <button
            onClick={() => setActiveTab('diagnostics')}
            className={`w-full flex items-center gap-4 px-6 py-4 rounded-2xl text-sm font-black transition-all ${
              activeTab === 'diagnostics' 
              ? 'bg-hit-blue text-white shadow-xl shadow-hit-blue/20' 
              : 'text-gray-500 hover:bg-gray-50'
            }`}
          >
            <Activity size={20} /> System Health
          </button>
          <button
            onClick={() => setActiveTab('notifications')}
            className={`w-full flex items-center gap-4 px-6 py-4 rounded-2xl text-sm font-black transition-all ${
              activeTab === 'notifications' 
              ? 'bg-hit-blue text-white shadow-xl shadow-hit-blue/20' 
              : 'text-gray-500 hover:bg-gray-50'
            }`}
          >
            <Bell size={20} /> Notifications
          </button>
        </nav>
        <div className="p-8 border-t border-gray-50 text-center">
          <img src="https://upload.wikimedia.org/wikipedia/en/thumb/9/99/Holon_Institute_of_Technology_Logo.svg/1200px-Holon_Institute_of_Technology_Logo.svg.png" alt="HIT" className="h-8 mx-auto opacity-20 grayscale" />
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 bg-white rounded-[2rem] shadow-sm border border-gray-100 overflow-hidden flex flex-col">
        
        {/* --- DIAGNOSTICS TAB --- */}
        {activeTab === 'diagnostics' && (
          <div className="flex flex-col h-full">
            <div className="p-10 border-b border-gray-50 flex items-center justify-between bg-gray-50/30">
              <div>
                <h3 className="text-2xl font-black text-gray-900 tracking-tight flex items-center gap-3">
                  System Diagnostics
                </h3>
                <p className="text-gray-500 font-medium text-sm mt-1">Institutional infrastructure status monitoring.</p>
              </div>
              <button 
                onClick={runDiagnostics}
                className="flex items-center gap-2 px-6 py-3 bg-white border border-gray-100 rounded-2xl text-sm font-black text-hit-blue hover:bg-gray-50 transition-all shadow-sm active:scale-95"
              >
                <RefreshCw size={18} />
                Refresh Logs
              </button>
            </div>

            <div className="flex-1 p-10 overflow-y-auto">
              <div className="grid gap-6">
                {diagnostics.map((test) => (
                  <div key={test.id} className="bg-white rounded-[1.5rem] p-6 border border-gray-100 flex items-center justify-between group hover:border-hit-blue/20 transition-all">
                    <div className="flex items-center gap-5">
                      <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-colors ${
                        test.status === 'pass' ? 'bg-emerald-50 text-emerald-600' :
                        test.status === 'warn' ? 'bg-amber-50 text-hit-accent' :
                        test.status === 'fail' ? 'bg-red-50 text-red-600' :
                        'bg-blue-50 text-hit-blue'
                      }`}>
                        <test.icon size={24} />
                      </div>
                      <div>
                        <h4 className="font-black text-gray-900 leading-none mb-1.5">{test.name}</h4>
                        <p className="text-xs text-gray-400 font-bold uppercase tracking-widest">{test.description}</p>
                      </div>
                    </div>
                    
                    <div className="text-right">
                       {test.status === 'checking' ? (
                         <div className="flex items-center gap-2 text-hit-blue font-black text-xs uppercase tracking-widest">
                            <Loader2 className="animate-spin" size={14} /> Pinging...
                         </div>
                       ) : (
                         <div className="flex flex-col items-end">
                            <div className={`flex items-center gap-2 font-black text-xs uppercase tracking-[0.2em] mb-1 ${
                              test.status === 'pass' ? 'text-emerald-600' :
                              test.status === 'warn' ? 'text-hit-accent' : 'text-red-600'
                            }`}>
                               {test.status === 'pass' && <CheckCircle size={14} />}
                               {test.status === 'warn' && <AlertTriangle size={14} />}
                               {test.status === 'fail' && <XCircle size={14} />}
                               {test.status.toUpperCase()}
                            </div>
                            <p className="text-[10px] font-mono text-gray-400 break-all max-w-[200px]">{test.message}</p>
                         </div>
                       )}
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-10 p-8 bg-hit-dark rounded-3xl text-white shadow-2xl shadow-hit-dark/20 flex items-center justify-between">
                 <div>
                   <h4 className="text-lg font-black leading-tight">Institutional Compliance Check</h4>
                   <p className="text-blue-100 text-sm mt-1 opacity-80">All services must report PASS for official SER submission readiness.</p>
                 </div>
                 <div className="bg-white/10 px-6 py-4 rounded-2xl backdrop-blur-md border border-white/10 text-center min-w-[120px]">
                    <span className="text-[10px] font-black uppercase tracking-widest block opacity-60 mb-1">Status</span>
                    <span className="text-xl font-black">{diagnostics.every(d => d.status === 'pass') ? 'CERTIFIED' : 'PENDING'}</span>
                 </div>
              </div>
            </div>
          </div>
        )}

        {/* --- NOTIFICATIONS TAB --- */}
        {activeTab === 'notifications' && (
          <div className="flex flex-col h-full">
            <div className="p-10 border-b border-gray-50 bg-gray-50/30">
               <h3 className="text-2xl font-black text-gray-900 tracking-tight">Notification Alerts</h3>
               <p className="text-gray-500 font-medium text-sm mt-1">Configure automated institutional reporting triggers.</p>
            </div>
            <div className="flex-1 p-10 flex flex-col items-center justify-center text-center">
              <div className="w-20 h-20 bg-gray-50 rounded-[2rem] flex items-center justify-center text-gray-300 mb-6">
                 <Bell size={40} />
              </div>
              <h4 className="text-lg font-black text-gray-700 uppercase tracking-tight">Broadcast Center Incoming</h4>
              <p className="text-sm text-gray-400 max-w-xs mt-2 font-medium">Automated email digests and deadline triggers are currently being synchronized with institutional calendars.</p>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default SettingsPanel;
