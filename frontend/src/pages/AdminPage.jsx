import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { apiRequest } from '../services/api';
import { Shield, Search, FileSpreadsheet, AlertCircle } from 'lucide-react';
import AuditLogViewer from '../components/AuditLogViewer';

export default function AdminPage() {
  const { authContextHeaders } = useAuth();
  const [nimInput, setNimInput] = useState('2207001');
  const [transcriptData, setTranscriptData] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSearchTranscript = async (e) => {
    e.preventDefault();
    if (!nimInput) return;
    setErrorMsg(null);
    setLoading(true);

    try {
      // Admin diizinkan melihat transkrip seluruh NIM mahasiswa
      const data = await apiRequest(`/transkrip/${nimInput}`, {}, authContextHeaders);
      setTranscriptData(data);
    } catch (err) {
      setErrorMsg(err.message);
      setTranscriptData(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            <Shield className="w-5 h-5 text-purple-400" />
            Portal Administrator Akademik
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Admin memiliki otorisasi penuh untuk mengaudit sistem dan melihat transkrip seluruh mahasiswa.
          </p>
        </div>
      </div>

      {/* Form Pencarian Transkrip Mahasiswa */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-xl">
        <h3 className="font-bold text-sm text-slate-200 mb-3 flex items-center gap-2">
          <Search className="w-4 h-4 text-cyan-400" />
          <span>Lihat Transkrip Mahasiswa (Berdasarkan NIM)</span>
        </h3>

        <form onSubmit={handleSearchTranscript} className="flex gap-3 max-w-md">
          <input
            type="text"
            placeholder="Masukkan NIM (cth: 2207001, 2207002, 2207003)"
            value={nimInput}
            onChange={(e) => setNimInput(e.target.value)}
            className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200 font-mono focus:outline-none focus:border-indigo-500"
          />
          <button
            type="submit"
            disabled={loading}
            className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold px-4 py-2 rounded-lg transition"
          >
            {loading ? 'Mencari...' : 'Periksa'}
          </button>
        </form>

        {errorMsg && (
          <div className="mt-3 bg-rose-950/80 border border-rose-800 text-rose-300 p-3 rounded-lg text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4" />
            <span>{errorMsg}</span>
          </div>
        )}

        {transcriptData && (
          <div className="mt-4 bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3">
            <div className="flex justify-between items-center border-b border-slate-800/80 pb-2">
              <div>
                <span className="text-base font-bold text-slate-100">{transcriptData.mahasiswa?.full_name}</span>
                <span className="text-xs text-cyan-400 font-mono ml-2">({transcriptData.mahasiswa?.nim_or_nip})</span>
              </div>
              <div className="text-xs font-mono">
                Total SKS: <span className="font-bold text-slate-200">{transcriptData.totalSks}</span> | IPK:{' '}
                <span className="font-bold text-emerald-400">{transcriptData.ipk}</span>
              </div>
            </div>

            <div className="space-y-2">
              {transcriptData.mataKuliah?.length === 0 ? (
                <div className="text-xs text-slate-500">Belum ada transkrip nilai resmi yang tersinkron.</div>
              ) : (
                transcriptData.mataKuliah.map(m => (
                  <div key={m.id} className="flex justify-between items-center text-xs py-1">
                    <span className="text-slate-300">{m.kode_mk} - {m.nama_mk} ({m.sks} SKS)</span>
                    <span className="font-bold font-mono text-emerald-400">{m.grade_letter}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>

      {/* Live Audit Log Viewer */}
      <AuditLogViewer />
    </div>
  );
}
