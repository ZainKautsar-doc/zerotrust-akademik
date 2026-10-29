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
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-xl">
      <div className="flex items-center justify-between mb-4 border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <ShieldAlert className="w-5 h-5 text-indigo-400" />
          <h3 className="font-bold text-slate-100 text-base">Live Gateway Audit Log (PE Decisions)</h3>
        </div>
        <button
          onClick={fetchLogs}
          disabled={loading}
          className="flex items-center gap-1.5 text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 px-3 py-1.5 rounded-lg border border-slate-700 transition"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      <div className="overflow-x-auto max-h-80 overflow-y-auto font-mono text-xs">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-950 text-slate-400 border-b border-slate-800">
              <th className="py-2.5 px-3">Waktu</th>
              <th className="py-2.5 px-3">Keputusan</th>
              <th className="py-2.5 px-3">Subjek</th>
              <th className="py-2.5 px-3">Role</th>
              <th className="py-2.5 px-3">Endpoint</th>
              <th className="py-2.5 px-3">Device ID</th>
              <th className="py-2.5 px-3">Alasan (Zero Trust Evaluation)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {logs.length === 0 ? (
              <tr>
                <td colSpan="7" className="py-4 text-center text-slate-500">Belum ada audit log tercatat</td>
              </tr>
            ) : (
              logs.map((log) => {
                const isAllow = log.decision === 'ALLOW';
                return (
                  <tr key={log.id} className="hover:bg-slate-800/40 transition">
                    <td className="py-2 px-3 text-slate-400 whitespace-nowrap">
                      {new Date(log.timestamp).toLocaleTimeString()}
                    </td>
                    <td className="py-2 px-3 whitespace-nowrap">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold ${
                        isAllow
                          ? 'bg-emerald-950 text-emerald-400 border border-emerald-800/60'
                          : 'bg-rose-950 text-rose-400 border border-rose-800/60'
                      }`}>
                        {isAllow ? <CheckCircle className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                        {log.decision}
                      </span>
                    </td>
                    <td className="py-2 px-3 font-semibold text-slate-200">{log.subject}</td>
                    <td className="py-2 px-3 text-slate-400">{log.role || '-'}</td>
                    <td className="py-2 px-3 text-cyan-300 font-semibold">
                      {log.method} {log.endpoint}
                    </td>
                    <td className="py-2 px-3 text-amber-300">{log.device_id || '-'}</td>
                    <td className="py-2 px-3 text-slate-300 max-w-xs truncate" title={log.reason}>
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
