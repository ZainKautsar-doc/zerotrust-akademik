import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { apiRequest } from '../services/api';
import { BookOpen, Edit3, Send, CheckCircle2, AlertCircle, RefreshCw } from 'lucide-react';

export default function DosenPage() {
  const { authContextHeaders } = useAuth();
  const [classes, setClasses] = useState([]);
  const [grades, setGrades] = useState([]);
  const [loading, setLoading] = useState(false);
  const [alert, setAlert] = useState(null);

  // Form edit modal state
  const [editingGrade, setEditingGrade] = useState(null);
  const [tugas, setTugas] = useState('');
  const [uts, setUts] = useState('');
  const [uas, setUas] = useState('');

  const loadData = async () => {
    setLoading(true);
    setAlert(null);
    try {
      const cls = await apiRequest('/kelas', {}, authContextHeaders);
      setClasses(Array.isArray(cls) ? cls : []);

      const grd = await apiRequest('/nilai', {}, authContextHeaders);
      setGrades(Array.isArray(grd) ? grd : []);
    } catch (err) {
      setAlert({ type: 'error', message: err.message });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [authContextHeaders.deviceId, authContextHeaders.simulatedHour]);

  const handleEditClick = (g) => {
    setEditingGrade(g);
    setTugas(g.nilai_tugas);
    setUts(g.nilai_uts);
    setUas(g.nilai_uas);
  };

  const handleSaveGrade = async (e) => {
    e.preventDefault();
    if (!editingGrade) return;

    try {
      const res = await apiRequest(
        `/nilai/${editingGrade.id}`,
        {
          method: 'PUT',
          body: JSON.stringify({
            nilai_tugas: parseFloat(tugas),
            nilai_uts: parseFloat(uts),
            nilai_uas: parseFloat(uas)
          })
        },
        authContextHeaders
      );

      setAlert({ type: 'success', message: res.message || 'Nilai berhasil disimpan!' });
      setEditingGrade(null);
      loadData();
    } catch (err) {
      setAlert({ type: 'error', message: err.message });
    }
  };

  const handleFinalisasi = async (classId, className) => {
    if (!confirm(`Konfirmasi finalisasi kelas ${className}? Setelah difinalisasi, nilai akan dikunci dan dikirim ke Service Transkrip.`)) {
      return;
    }

    try {
      const res = await apiRequest(
        `/kelas/${classId}/finalisasi`,
        { method: 'POST' },
        authContextHeaders
      );

      setAlert({
        type: 'success',
        message: `${res.message} (Status: Sinkronisasi antar-service berhasil via token gateway)`
      });
      loadData();
    } catch (err) {
      setAlert({ type: 'error', message: err.message });
    }
  };

  const handleUnfinalisasi = async (classId, className) => {
    if (!confirm(`Buka kunci kelas ${className}? Anda akan dapat mengedit nilai mahasiswa kembali.`)) {
      return;
    }

    try {
      const res = await apiRequest(
        `/kelas/${classId}/unfinalisasi`,
        { method: 'POST' },
        authContextHeaders
      );

      setAlert({
        type: 'success',
        message: res.message || 'Kunci kelas berhasil dibuka kembali.'
      });
      loadData();
    } catch (err) {
      setAlert({ type: 'error', message: err.message });
    }
  };

  return (
    <div className="space-y-6">
      {/* Alert Banner */}
      {alert && (
        <div className={`p-4 rounded-card text-xs sm:text-sm border flex items-center justify-between ${
          alert.type === 'error'
            ? 'bg-rose-950/60 border-rose-500/40 text-rose-200'
            : 'bg-emerald-950/60 border-emerald-500/40 text-emerald-200'
        }`}>
          <div className="flex items-center gap-2.5">
            {alert.type === 'error' ? <AlertCircle className="w-5 h-5 text-rose-400 flex-shrink-0" /> : <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />}
            <span>{alert.message}</span>
          </div>
          <button onClick={() => setAlert(null)} className="text-xs underline ml-4 cursor-pointer text-moon-mist hover:text-pure-white">
            Tutup
          </button>
        </div>
      )}

      {/* Header Info Banner */}
      <div className="glass-panel p-5 sm:p-6 flex flex-wrap items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-steel-plate/60 flex items-center justify-center text-frost-glow">
              <BookOpen className="w-4 h-4 text-frost-glow" />
            </div>
            <h2 className="text-lg sm:text-xl font-display font-medium text-pure-white">
              Portal Pengelolaan Nilai Dosen
            </h2>
          </div>
          <p className="text-xs text-moon-mist">
            Dosen hanya memiliki akses ke kelas yang diampu. Perubahan nilai diproteksi PEP pada jam operasional (07:00 - 21:00).
          </p>
        </div>
        <button
          onClick={loadData}
          disabled={loading}
          className="btn-ghost-pill text-xs px-4 py-2 flex items-center gap-2 cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>{loading ? 'Memuat...' : 'Muat Ulang'}</span>
        </button>
      </div>

      {/* Kelas yang Diampu (Glass Cards) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {classes.map(c => (
          <div key={c.id} className="glass-panel p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-mono text-[11px] bg-steel-plate/50 text-frost-glow px-2.5 py-0.5 rounded-full border border-glass-edge font-semibold">
                  {c.kode_mk}
                </span>
                <span className="font-medium text-sm text-pure-white">{c.nama_mk}</span>
              </div>
              <div className="text-xs text-fog-veil font-mono">
                SKS: {c.sks} · Status:{' '}
                <span className={`font-semibold ${c.is_finalized ? 'text-amber-400' : 'text-emerald-400'}`}>
                  {c.is_finalized ? 'FINALISASI (Terkunci)' : 'DRAF (Aktif)'}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 self-end sm:self-center">
              {!c.is_finalized ? (
                <button
                  onClick={() => handleFinalisasi(c.id, c.nama_mk)}
                  className="btn-violet text-xs px-4 py-2 flex items-center gap-1.5 cursor-pointer flex-shrink-0"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Finalisasi</span>
                </button>
              ) : (
                <button
                  onClick={() => handleUnfinalisasi(c.id, c.nama_mk)}
                  className="btn-ghost-pill text-xs px-3.5 py-1.5 flex items-center gap-1.5 cursor-pointer flex-shrink-0 border-amber-500/40 text-amber-300 hover:border-amber-500/70"
                  title="Buka kunci untuk mengizinkan perubahan nilai"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>Buka Kunci Nilai</span>
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Daftar Nilai Mahasiswa Table & Mobile Cards */}
      <div className="glass-panel overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-glass-edge flex justify-between items-center bg-steel-plate/20">
          <span className="font-display font-medium text-sm text-pure-white">Daftar Nilai Mahasiswa</span>
          <span className="text-xs font-mono text-moon-mist">Total: {grades.length} Peserta</span>
        </div>

        {/* Mobile View: Stacked Cards (sm:hidden) */}
        <div className="block sm:hidden divide-y divide-glass-edge">
          {grades.length === 0 ? (
            <div className="p-6 text-center text-xs text-fog-veil font-sans">
              Tidak ada data nilai mahasiswa.
            </div>
          ) : (
            grades.map(g => (
              <div key={g.id} className="p-4 bg-midnight-canvas/70 space-y-3">
                <div className="flex justify-between items-start gap-2">
                  <div>
                    <div className="font-medium text-sm text-pure-white">{g.users?.full_name}</div>
                    <div className="text-xs font-mono text-emerald-300">NIM: {g.users?.nim_or_nip}</div>
                    <div className="text-[11px] text-moon-mist">{g.classes?.nama_mk}</div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <div className="text-lg font-bold text-amber-300 font-mono">{g.nilai_akhir}</div>
                    <span className="inline-block px-2 py-0.5 rounded-full bg-steel-plate/60 text-pure-white text-[10px] font-bold font-mono border border-glass-edge">
                      Grade: {g.grade_letter}
                    </span>
                  </div>
                </div>

                {/* Score Pills */}
                <div className="grid grid-cols-3 gap-2 text-center text-[11px] font-mono bg-steel-plate/30 p-2 rounded-lg border border-glass-edge">
                  <div>
                    <div className="text-[9px] text-moon-mist uppercase">Tugas (30%)</div>
                    <div className="font-semibold text-pure-white">{g.nilai_tugas}</div>
                  </div>
                  <div>
                    <div className="text-[9px] text-moon-mist uppercase">UTS (30%)</div>
                    <div className="font-semibold text-pure-white">{g.nilai_uts}</div>
                  </div>
                  <div>
                    <div className="text-[9px] text-moon-mist uppercase">UAS (40%)</div>
                    <div className="font-semibold text-pure-white">{g.nilai_uas}</div>
                  </div>
                </div>

                {/* Mobile Action Button */}
                <div className="pt-1 flex justify-end">
                  <button
                    onClick={() => handleEditClick(g)}
                    disabled={g.classes?.is_finalized}
                    className={`w-full py-2 rounded-full text-xs transition font-sans flex items-center justify-center gap-1.5 cursor-pointer ${
                      g.classes?.is_finalized
                        ? 'bg-steel-plate/20 text-fog-veil cursor-not-allowed border border-transparent'
                        : 'btn-ghost-pill'
                    }`}
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>{g.classes?.is_finalized ? 'Nilai Terkunci (Final)' : 'Edit Nilai'}</span>
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Desktop View: Full Data Table (hidden sm:block) */}
        <div className="hidden sm:block overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead>
              <tr className="bg-steel-plate/50 text-pure-white border-b border-glass-edge uppercase text-[10px] tracking-wider font-semibold">
                <th className="p-3">Mata Kuliah</th>
                <th className="p-3">NIM</th>
                <th className="p-3 font-sans">Nama Mahasiswa</th>
                <th className="p-3">Tugas (30%)</th>
                <th className="p-3">UTS (30%)</th>
                <th className="p-3">UAS (40%)</th>
                <th className="p-3">Nilai Akhir</th>
                <th className="p-3">Huruf</th>
                <th className="p-3 text-center font-sans">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-glass-edge bg-midnight-canvas/70">
              {grades.map(g => (
                <tr key={g.id} className="hover:bg-steel-plate/20 transition">
                  <td className="p-3 text-pure-white font-medium">{g.classes?.nama_mk}</td>
                  <td className="p-3 text-emerald-300 font-bold">{g.users?.nim_or_nip}</td>
                  <td className="p-3 text-pure-white font-sans font-medium">{g.users?.full_name}</td>
                  <td className="p-3 text-moon-mist font-semibold">{g.nilai_tugas}</td>
                  <td className="p-3 text-moon-mist font-semibold">{g.nilai_uts}</td>
                  <td className="p-3 text-moon-mist font-semibold">{g.nilai_uas}</td>
                  <td className="p-3 font-bold text-amber-300">{g.nilai_akhir}</td>
                  <td className="p-3">
                    <span className="px-2.5 py-0.5 rounded-full bg-steel-plate/60 text-pure-white font-bold border border-glass-edge">
                      {g.grade_letter}
                    </span>
                  </td>
                  <td className="p-3 text-center">
                    <button
                      onClick={() => handleEditClick(g)}
                      disabled={g.classes?.is_finalized}
                      className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-[11px] transition font-sans cursor-pointer ${
                        g.classes?.is_finalized
                          ? 'bg-steel-plate/20 text-fog-veil cursor-not-allowed border border-transparent'
                          : 'btn-ghost-pill'
                      }`}
                    >
                      <Edit3 className="w-3 h-3" />
                      <span>{g.classes?.is_finalized ? 'Terkunci' : 'Edit'}</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Deep Glass Edit Modal */}
      {editingGrade && (
        <div className="fixed inset-0 bg-midnight-canvas/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 z-50">
          <div className="glass-deep max-w-md w-full p-5 sm:p-7 space-y-4 sm:space-y-5 max-h-[92vh] overflow-y-auto custom-scrollbar">
            <div>
              <h3 className="font-display font-medium text-base text-pure-white truncate">
                Edit Nilai: {editingGrade.users?.full_name}
              </h3>
              <p className="text-xs text-moon-mist font-mono mt-1 break-words">
                NIM: {editingGrade.users?.nim_or_nip} · Kelas: {editingGrade.classes?.nama_mk}
              </p>
            </div>

            <form onSubmit={handleSaveGrade} className="space-y-4">
              <div>
                <label className="block text-xs font-mono text-pure-white font-semibold uppercase mb-1">
                  Nilai Tugas (Bobot 30%)
                </label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  max="100"
                  value={tugas}
                  onChange={e => setTugas(e.target.value)}
                  required
                  className="input-frosted w-full p-2.5 text-sm font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-mono text-pure-white font-semibold uppercase mb-1">
                  Nilai UTS (Bobot 30%)
                </label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  max="100"
                  value={uts}
                  onChange={e => setUts(e.target.value)}
                  required
                  className="input-frosted w-full p-2.5 text-sm font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-mono text-pure-white font-semibold uppercase mb-1">
                  Nilai UAS (Bobot 40%)
                </label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  max="100"
                  value={uas}
                  onChange={e => setUas(e.target.value)}
                  required
                  className="input-frosted w-full p-2.5 text-sm font-mono"
                />
              </div>

              <div className="flex gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setEditingGrade(null)}
                  className="btn-ghost-pill w-1/2 py-2.5 text-xs font-medium cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="btn-violet w-1/2 py-2.5 text-xs font-medium cursor-pointer"
                >
                  Simpan Nilai
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
