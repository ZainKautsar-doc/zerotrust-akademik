import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { apiRequest } from '../services/api';
import { GraduationCap, Award, FileText, AlertCircle, RefreshCw } from 'lucide-react';

export default function MhsPage() {
  const { authContextHeaders, user } = useAuth();
  const [grades, setGrades] = useState([]);
  const [transcript, setTranscript] = useState(null);
  const [loading, setLoading] = useState(false);
  const [alert, setAlert] = useState(null);

  const loadData = async () => {
    setLoading(true);
    setAlert(null);
    try {
      // 1. GET /nilai (Mahasiswa hanya melihat nilainya sendiri)
      const g = await apiRequest('/nilai', {}, authContextHeaders);
      setGrades(Array.isArray(g) ? g : []);

      // 2. GET /transkrip/:nim (Hanya NIM milik sendiri)
      if (user?.nim_or_nip) {
        const t = await apiRequest(`/transkrip/${user.nim_or_nip}`, {}, authContextHeaders);
        setTranscript(t);
      }
    } catch (err) {
      setAlert(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [authContextHeaders.deviceId]);

  return (
    <div className="space-y-6">
      {alert && (
        <div className="p-4 rounded-card text-xs sm:text-sm border bg-rose-950/60 border-rose-500/40 text-rose-200 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <AlertCircle className="w-5 h-5 text-rose-400 flex-shrink-0" />
            <span>{alert}</span>
          </div>
          <button onClick={() => setAlert(null)} className="text-xs underline ml-4 cursor-pointer text-moon-mist hover:text-pure-white">
            Tutup
          </button>
        </div>
      )}

      {/* Profil Mahasiswa Banner (Frosted Glass Card) */}
      <div className="glass-panel p-6 sm:p-7 flex flex-wrap items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-steel-plate/60 border border-glass-edge flex items-center justify-center text-frost-glow shadow-sm">
            <GraduationCap className="w-7 h-7 text-frost-glow" />
          </div>
          <div className="space-y-1">
            <h2 className="text-xl sm:text-2xl font-display font-medium text-pure-white">{user?.fullName}</h2>
            <p className="text-xs text-fog-veil font-mono">
              NIM: <span className="text-emerald-300 font-bold">{user?.nim_or_nip}</span> · Perangkat Terverifikasi:{' '}
              <span className="text-pure-white">{authContextHeaders.deviceId}</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {transcript && (
            <div className="flex items-center gap-5 bg-midnight-canvas/90 px-6 py-3 rounded-card border border-glass-edge">
              <div>
                <div className="text-[10px] text-moon-mist uppercase tracking-wider font-mono font-semibold">Total SKS</div>
                <div className="text-xl font-bold text-pure-white">{transcript.totalSks} SKS</div>
              </div>
              <div className="w-px h-8 bg-glass-edge" />
              <div>
                <div className="text-[10px] text-moon-mist uppercase tracking-wider font-mono font-semibold">IPK Kumulatif</div>
                <div className="text-xl font-bold text-emerald-400">{transcript.ipk}</div>
              </div>
            </div>
          )}

          <button
            onClick={loadData}
            disabled={loading}
            className="btn-ghost-pill p-2.5 text-xs cursor-pointer"
            title="Muat ulang data"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Nilai Kelas Berjalan (Service Nilai) */}
        <div className="glass-panel overflow-hidden">
          <div className="p-4 sm:p-5 border-b border-glass-edge font-display font-medium text-sm text-pure-white flex items-center gap-2 bg-steel-plate/20">
            <FileText className="w-4 h-4 text-frost-glow" />
            <span>Nilai Kelas Berjalan (GET /nilai)</span>
          </div>

          <div className="p-4 space-y-3">
            {grades.length === 0 ? (
              <div className="text-xs text-fog-veil text-center py-8">Tidak ada data nilai kelas berjalan</div>
            ) : (
              grades.map(g => (
                <div key={g.id} className="p-4 rounded-card bg-midnight-canvas/70 border border-glass-edge flex justify-between items-center">
                  <div className="space-y-1">
                    <div className="font-medium text-sm text-pure-white">{g.classes?.nama_mk}</div>
                    <div className="text-xs text-moon-mist font-mono">
                      Tugas: {g.nilai_tugas} · UTS: {g.nilai_uts} · UAS: {g.nilai_uas}
                    </div>
                    <div className="text-[11px] font-mono">
                      Status:{' '}
                      <span className={g.classes?.is_finalized ? 'text-amber-400 font-semibold' : 'text-emerald-400'}>
                        {g.classes?.is_finalized ? 'TERFINALISASI (Terkunci)' : 'BERJALAN (Draf)'}
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xl font-bold text-amber-300 font-mono">{g.nilai_akhir}</div>
                    <span className="px-2.5 py-0.5 rounded-full bg-steel-plate/50 text-frost-glow text-xs font-bold font-mono border border-glass-edge">
                      {g.grade_letter}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Transkrip Akademik Resmi (Service Transkrip) */}
        <div className="glass-panel overflow-hidden">
          <div className="p-4 sm:p-5 border-b border-glass-edge font-display font-medium text-sm text-pure-white flex items-center gap-2 bg-steel-plate/20">
            <Award className="w-4 h-4 text-emerald-400" />
            <span>Transkrip Resmi (GET /transkrip/{user?.nim_or_nip})</span>
          </div>

          <div className="p-4 space-y-3">
            {!transcript || !transcript.items || transcript.items.length === 0 ? (
              <div className="text-xs text-fog-veil text-center py-8">
                Belum ada nilai yang difinalisasi dan masuk transkrip resmi
              </div>
            ) : (
              <div className="overflow-x-auto rounded-card border border-glass-edge">
                <table className="w-full text-left text-xs font-mono">
                  <thead>
                    <tr className="bg-steel-plate/50 text-pure-white border-b border-glass-edge uppercase text-[10px] tracking-wider font-semibold">
                      <th className="p-3">Kode MK</th>
                      <th className="p-3 font-sans">Mata Kuliah</th>
                      <th className="p-3">SKS</th>
                      <th className="p-3">Nilai</th>
                      <th className="p-3">Huruf</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-glass-edge bg-midnight-canvas/70">
                    {transcript.items.map((it, idx) => (
                      <tr key={idx} className="hover:bg-steel-plate/20 transition">
                        <td className="p-3 text-pure-white font-medium">{it.kode_mk}</td>
                        <td className="p-3 text-pure-white font-sans font-medium">{it.nama_mk}</td>
                        <td className="p-3 text-moon-mist font-semibold">{it.sks}</td>
                        <td className="p-3 font-bold text-amber-300">{it.nilai_akhir}</td>
                        <td className="p-3">
                          <span className="px-2.5 py-0.5 rounded-full bg-steel-plate/60 text-emerald-300 font-bold border border-glass-edge">
                            {it.grade_letter}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
