import React, { useState, useEffect } from 'react';
import { RefreshCw, CheckCircle, XCircle, ShieldAlert } from 'lucide-react';
import { GATEWAY_URL } from '../services/api';

export default function AuditLogViewer() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${GATEWAY_URL}/api/audit-logs`);
      const data = await res.json();
      if (Array.isArray(data)) setLogs(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
    const interval = setInterval(fetchLogs, 3000);
    return () => clearInterval(interval);
  }, []);

  const getActionBadge = (method, endpoint) => {
    if (method === 'PUT' && endpoint.startsWith('/nilai')) {
      return { label: 'EDIT NILAI', color: 'bg-amber-500/20 text-amber-300 border-amber-500/40' };
    }
    if (method === 'POST' && endpoint.includes('/finalisasi')) {
      return { label: 'FINALISASI', color: 'bg-void-violet/30 text-frost-glow border-void-violet/50' };
    }
    if (method === 'POST' && endpoint.includes('/unfinalisasi')) {
      return { label: 'BUKA KUNCI', color: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40' };
    }
    if (method === 'POST' && endpoint === '/transkrip/sinkron') {
      return { label: 'SINKRON SERVICE', color: 'bg-purple-500/20 text-purple-300 border-purple-500/40' };
    }
    if (method === 'POST' && endpoint.startsWith('/auth/login')) {
      return { label: 'LOGIN AUTH', color: 'bg-blue-500/20 text-blue-300 border-blue-500/40' };
    }
    if (method === 'POST' && endpoint.startsWith('/auth/logout')) {
      return { label: 'LOGOUT', color: 'bg-rose-500/20 text-rose-300 border-rose-500/40' };
    }
    if (method === 'GET' && endpoint.startsWith('/transkrip/all')) {
      return { label: 'REKAP SEMUA MHS', color: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40' };
    }
    if (method === 'GET' && endpoint.startsWith('/transkrip')) {
      return { label: 'BACA TRANSKRIP', color: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' };
    }
    if (method === 'GET' && endpoint.startsWith('/nilai')) {
      return { label: 'BACA NILAI', color: 'bg-steel-plate/60 text-moon-mist border-glass-edge' };
    }
    if (method === 'GET' && endpoint.startsWith('/kelas')) {
      return { label: 'BACA KELAS', color: 'bg-steel-plate/60 text-moon-mist border-glass-edge' };
    }
    return { label: method, color: 'bg-steel-plate/40 text-pure-white border-glass-edge' };
  };

  return (
    <div className="glass-panel p-4 sm:p-6 space-y-4">
      <div className="flex items-center justify-between border-b border-glass-edge pb-3 gap-2">
        <div className="flex items-center gap-2 sm:gap-2.5 min-w-0">
          <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-steel-plate/60 flex items-center justify-center text-frost-glow flex-shrink-0">
            <ShieldAlert className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-frost-glow" />
          </div>
          <div className="min-w-0">
            <h3 className="font-display font-medium text-pure-white text-sm sm:text-base truncate">Live Gateway Audit Log</h3>
            <p className="text-[10px] sm:text-[11px] text-moon-mist truncate">Evaluasi PDP & Jejak Riwayat Akses Zero Trust</p>
          </div>
        </div>

        <button
          onClick={fetchLogs}
          disabled={loading}
          className="btn-ghost-pill flex items-center gap-1.5 text-xs px-2.5 sm:px-3 py-1.5 cursor-pointer flex-shrink-0"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span className="hidden sm:inline">Refresh</span>
        </button>
      </div>

      {/* Mobile Card View for Audit Logs (sm:hidden) */}
      <div className="block sm:hidden space-y-2.5 max-h-80 overflow-y-auto custom-scrollbar">
        {logs.length === 0 ? (
          <div className="py-6 text-center text-fog-veil font-sans text-xs">
            Belum ada log evaluasi keamanan yang tercatat
          </div>
        ) : (
          logs.map((log) => {
            const isAllow = log.decision === 'ALLOW';
            const actionBadge = getActionBadge(log.method, log.endpoint);
            return (
              <div key={log.id} className="p-3 rounded-card bg-midnight-canvas/80 border border-glass-edge space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                      isAllow
                        ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/40'
                        : 'bg-rose-500/15 text-rose-300 border-rose-500/40'
                    }`}>
                      {isAllow ? <CheckCircle className="w-2.5 h-2.5" /> : <XCircle className="w-2.5 h-2.5" />}
                      {log.decision}
                    </span>
                    <span className="text-[10px] font-mono text-moon-mist">
                      {new Date(log.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                  <span className="text-[10px] font-mono text-amber-300 font-semibold truncate max-w-[120px]">
                    {log.device_id || '-'}
                  </span>
                </div>

                <div className="flex items-center gap-2 flex-wrap font-mono">
                  <span className={`px-2 py-0.5 rounded text-[9px] font-bold font-sans border uppercase whitespace-nowrap ${actionBadge.color}`}>
                    {actionBadge.label}
                  </span>
                  <span className="text-pure-white font-semibold text-[11px] truncate">
                    {log.method} {log.endpoint}
                  </span>
                </div>

                <div className="text-[11px] text-moon-mist flex items-center justify-between pt-1 border-t border-glass-edge">
                  <span>Subjek: <strong className="text-pure-white">{log.subject}</strong> ({log.role || '-'})</span>
                </div>

                {log.reason && (
                  <div className="text-[10px] text-fog-veil bg-steel-plate/30 p-1.5 rounded font-mono break-words">
                    {log.reason}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Desktop Table View (hidden sm:block) */}
      <div className="hidden sm:block overflow-x-auto max-h-80 overflow-y-auto font-mono text-xs rounded-card border border-glass-edge custom-scrollbar">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-steel-plate/50 text-pure-white border-b border-glass-edge uppercase text-[10px] tracking-wider font-semibold">
              <th className="py-2.5 px-3">Waktu</th>
              <th className="py-2.5 px-3">Keputusan</th>
              <th className="py-2.5 px-3">Subjek</th>
              <th className="py-2.5 px-3">Role</th>
              <th className="py-2.5 px-3">Aksi CRUD & Endpoint</th>
              <th className="py-2.5 px-3">Device ID</th>
              <th className="py-2.5 px-3">Evaluasi Policy Engine</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-glass-edge bg-midnight-canvas/70">
            {logs.length === 0 ? (
              <tr>
                <td colSpan="7" className="py-6 text-center text-fog-veil font-sans text-xs">
                  Belum ada log evaluasi keamanan yang tercatat
                </td>
              </tr>
            ) : (
              logs.map((log) => {
                const isAllow = log.decision === 'ALLOW';
                const actionBadge = getActionBadge(log.method, log.endpoint);
                return (
                  <tr key={log.id} className="hover:bg-steel-plate/20 transition">
                    <td className="py-2 px-3 text-moon-mist whitespace-nowrap">
                      {new Date(log.timestamp).toLocaleTimeString()}
                    </td>
                    <td className="py-2 px-3 whitespace-nowrap">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                        isAllow
                          ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/40'
                          : 'bg-rose-500/15 text-rose-300 border-rose-500/40'
                      }`}>
                        {isAllow ? <CheckCircle className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                        {log.decision}
                      </span>
                    </td>
                    <td className="py-2 px-3 font-semibold text-pure-white">{log.subject}</td>
                    <td className="py-2 px-3 text-moon-mist font-medium">{log.role || '-'}</td>
                    <td className="py-2 px-3">
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold font-sans border uppercase whitespace-nowrap ${actionBadge.color}`}>
                          {actionBadge.label}
                        </span>
                        <span className="text-ice-highlight font-semibold">
                          {log.method} {log.endpoint}
                        </span>
                      </div>
                    </td>
                    <td className="py-2 px-3 text-amber-300 font-semibold">{log.device_id || '-'}</td>
                    <td className="py-2 px-3 text-pure-white max-w-xs truncate" title={log.reason}>
                      {log.reason}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
