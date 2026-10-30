import React, { useState, useEffect } from 'react';
import { RefreshCw, CheckCircle, XCircle, ShieldAlert } from 'lucide-react';

export default function AuditLogViewer() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const res = await fetch('http://127.0.0.1:3000/api/audit-logs');
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

  return (
    <div className="glass-panel p-5 sm:p-6 space-y-4">
      <div className="flex items-center justify-between border-b border-glass-edge pb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-steel-plate/60 flex items-center justify-center text-frost-glow">
            <ShieldAlert className="w-4 h-4 text-frost-glow" />
          </div>
          <div>
            <h3 className="font-display font-medium text-pure-white text-base">Live Gateway Audit Log</h3>
            <p className="text-[11px] text-moon-mist">Rekaman evaluasi Policy Decision Point (PDP) secara real-time</p>
          </div>
        </div>

        <button
          onClick={fetchLogs}
          disabled={loading}
          className="btn-ghost-pill flex items-center gap-1.5 text-xs px-3 py-1.5 cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      <div className="overflow-x-auto max-h-80 overflow-y-auto font-mono text-xs rounded-card border border-glass-edge">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-steel-plate/40 text-moon-mist border-b border-glass-edge uppercase text-[10px] tracking-wider">
              <th className="py-2.5 px-3">Waktu</th>
              <th className="py-2.5 px-3">Keputusan</th>
              <th className="py-2.5 px-3">Subjek</th>
              <th className="py-2.5 px-3">Role</th>
              <th className="py-2.5 px-3">Method & Endpoint</th>
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
                return (
                  <tr key={log.id} className="hover:bg-steel-plate/20 transition">
                    <td className="py-2 px-3 text-fog-veil whitespace-nowrap">
                      {new Date(log.timestamp).toLocaleTimeString()}
                    </td>
                    <td className="py-2 px-3 whitespace-nowrap">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                        isAllow
                          ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
                          : 'bg-rose-500/10 text-rose-300 border-rose-500/30'
                      }`}>
                        {isAllow ? <CheckCircle className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                        {log.decision}
                      </span>
                    </td>
                    <td className="py-2 px-3 font-semibold text-pure-white">{log.subject}</td>
                    <td className="py-2 px-3 text-moon-mist">{log.role || '-'}</td>
                    <td className="py-2 px-3 text-frost-glow font-medium">
                      {log.method} {log.endpoint}
                    </td>
                    <td className="py-2 px-3 text-amber-300/90">{log.device_id || '-'}</td>
                    <td className="py-2 px-3 text-moon-mist max-w-xs truncate" title={log.reason}>
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
