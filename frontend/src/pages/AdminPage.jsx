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
      {/* Admin Portal Header Banner */}
      <div className="glass-panel p-6 sm:p-7 flex flex-wrap items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-steel-plate/60 flex items-center justify-center text-frost-glow">
              <Shield className="w-4 h-4 text-purple-400" />
            </div>
            <h2 className="text-lg sm:text-xl font-display font-medium text-pure-white">
              Portal Administrator Akademik
            </h2>
          </div>
          <p className="text-xs text-moon-mist">
            Admin memiliki otorisasi penuh untuk audit sistem dan verifikasi transkrip seluruh mahasiswa.
          </p>
        </div>
      </div>

      {/* Form Pencarian Transkrip Mahasiswa */}
      <div className="glass-panel p-6 sm:p-7 space-y-4">
        <div className="flex items-center gap-2 pb-2 border-b border-glass-edge">
          <Search className="w-4 h-4 text-frost-glow" />
          <h3 className="font-display font-medium text-sm text-pure-white">
            Pencarian Transkrip Mahasiswa (NIM Lookup)
          </h3>
        </div>

        <form onSubmit={handleSearchTranscript} className="flex flex-col sm:flex-row gap-3 max-w-md">
          <input
            type="text"
            placeholder="Masukkan NIM (cth: 2207001, 2207002, 2207003)"
            value={nimInput}
            onChange={(e) => setNimInput(e.target.value)}
            className="input-frosted flex-1 px-3.5 py-2 text-sm font-mono placeholder:text-fog-veil"
          />
          <button
            type="submit"
            disabled={loading}
            className="btn-violet px-5 py-2 text-xs font-medium cursor-pointer"
          >
            {loading ? 'Memeriksa...' : 'Periksa NIM'}
          </button>
        </form>

        {errorMsg && (
          <div className="bg-rose-950/60 border border-rose-500/40 text-rose-200 p-3 rounded-card text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-400" />
            <span>{errorMsg}</span>
          </div>
        )}

        {transcriptData && (
          <div className="mt-4 p-5 rounded-card bg-midnight-canvas/80 border border-glass-edge space-y-4">
            <div className="flex flex-wrap justify-between items-center border-b border-glass-edge pb-3 gap-2">
              <div>
                <span className="text-base font-medium text-pure-white">{transcriptData.mahasiswa?.full_name}</span>
                <span className="text-xs text-emerald-300 font-mono ml-2">({transcriptData.mahasiswa?.nim_or_nip})</span>
              </div>
              <div className="text-xs font-mono text-moon-mist">
                Total SKS: <span className="font-bold text-pure-white">{transcriptData.totalSks}</span> · IPK:{' '}
                <span className="font-bold text-emerald-400">{transcriptData.ipk}</span>
              </div>
            </div>

            <div className="space-y-2">
              {transcriptData.mataKuliah?.length === 0 ? (
                <div className="text-xs text-fog-veil py-2">Belum ada transkrip nilai resmi yang tersinkron.</div>
              ) : (
                transcriptData.mataKuliah.map(m => (
                  <div key={m.id} className="flex justify-between items-center text-xs py-1.5 border-b border-glass-edge/40 last:border-0">
                    <span className="text-moon-mist">{m.kode_mk} - {m.nama_mk} ({m.sks} SKS)</span>
                    <span className="font-bold font-mono text-emerald-300">{m.grade_letter}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>

      {/* Audit Log Terintegrasi untuk Admin */}
      <AuditLogViewer />
    </div>
  );
}
