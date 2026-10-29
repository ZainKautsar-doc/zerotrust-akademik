import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { apiRequest } from '../services/api';
import { BookOpen, Edit3, Send, CheckCircle2, AlertCircle } from 'lucide-react';

export default function DosenPage() {
  const { authContextHeaders, user } = useAuth();
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
        message: `${res.message} (Status: Sinkronisasi antar-service berhasil via token service)`
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
        <div className={`p-4 rounded-xl text-sm border flex items-center justify-between ${
          alert.type === 'error'
            ? 'bg-rose-950/80 border-rose-800 text-rose-300'
            : 'bg-emerald-950/80 border-emerald-800 text-emerald-300'
        }`}>
          <div className="flex items-center gap-2">
            {alert.type === 'error' ? <AlertCircle className="w-5 h-5" /> : <CheckCircle2 className="w-5 h-5" />}
            <span>{alert.message}</span>
          </div>
          <button onClick={() => setAlert(null)} className="text-xs underline ml-4">Tutup</button>
        </div>
      )}

      {/* Header Info */}
      <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-indigo-400" />
            Portal Pengelolaan Nilai Dosen
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Dosen hanya memiliki akses ke kelas yang diampu. Perubahan nilai dibatasi pada jam operasional (07.00 - 21.00).
          </p>
        </div>
        <button
          onClick={loadData}
          disabled={loading}
          className="bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs px-4 py-2 rounded-lg border border-slate-700 transition"
        >
          {loading ? 'Memuat...' : 'Muat Ulang Data'}
        </button>
      </div>

      {/* Kelas yang Diampu */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {classes.map(c => (
          <div key={c.id} className="bg-slate-900 border border-slate-800 p-5 rounded-xl flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs bg-indigo-950 text-indigo-300 px-2 py-0.5 rounded border border-indigo-800 font-bold">
                  {c.kode_mk}
                </span>
                <span className="font-bold text-slate-100">{c.nama_mk}</span>
              </div>
              <div className="text-xs text-slate-400 mt-1">
                SKS: {c.sks} | Status:{' '}
                <span className={`font-semibold ${c.is_finalized ? 'text-amber-400' : 'text-emerald-400'}`}>
                  {c.is_finalized ? 'SUDAH DIFINALISASI (Terkunci)' : 'DRAF (Bisa Diedit)'}
                </span>
              </div>
            </div>

            {!c.is_finalized && (
              <button
                onClick={() => handleFinalisasi(c.id, c.nama_mk)}
                className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium px-3.5 py-2 rounded-lg transition shadow-md shadow-indigo-600/30"
              >
                <Send className="w-3.5 h-3.5" />
                Finalisasi & Sinkron
              </button>
            )}
          </div>
        ))}
      </div>

      {/* Daftar Nilai Mahasiswa */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-xl">
        <div className="p-4 border-b border-slate-800 font-bold text-sm text-slate-200 flex justify-between items-center">
          <span>Daftar Nilai Mahasiswa</span>
          <span className="text-xs font-normal text-slate-400">Total: {grades.length} Mahasiswa</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead>
              <tr className="bg-slate-950 text-slate-400 border-b border-slate-800">
                <th className="p-3">Mata Kuliah</th>
                <th className="p-3">NIM</th>
                <th className="p-3">Nama Mahasiswa</th>
                <th className="p-3">Tugas (30%)</th>
                <th className="p-3">UTS (30%)</th>
                <th className="p-3">UAS (40%)</th>
                <th className="p-3">Nilai Akhir</th>
                <th className="p-3">Huruf</th>
                <th className="p-3 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {grades.map(g => (
                <tr key={g.id} className="hover:bg-slate-800/40 transition">
                  <td className="p-3 text-slate-300 font-semibold">{g.classes?.nama_mk}</td>
                  <td className="p-3 text-cyan-300 font-bold">{g.users?.nim_or_nip}</td>
                  <td className="p-3 text-slate-200 font-sans">{g.users?.full_name}</td>
                  <td className="p-3">{g.nilai_tugas}</td>
                  <td className="p-3">{g.nilai_uts}</td>
                  <td className="p-3">{g.nilai_uas}</td>
                  <td className="p-3 font-bold text-amber-300">{g.nilai_akhir}</td>
                  <td className="p-3">
                    <span className="px-2 py-0.5 rounded bg-slate-800 text-indigo-300 font-bold">
                      {g.grade_letter}
                    </span>
                  </td>
                  <td className="p-3 text-center">
                    <button
                      onClick={() => handleEditClick(g)}
                      disabled={g.classes?.is_finalized}
                      className={`inline-flex items-center gap-1 px-3 py-1 rounded text-xs transition ${
                        g.classes?.is_finalized
                          ? 'bg-slate-800 text-slate-600 cursor-not-allowed'
                          : 'bg-indigo-600/30 hover:bg-indigo-600/50 text-indigo-300 border border-indigo-500/40'
                      }`}
                    >
                      <Edit3 className="w-3 h-3" />
                      {g.classes?.is_finalized ? 'Terkunci' : 'Edit'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Edit Nilai */}
      {editingGrade && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-md w-full p-6 shadow-2xl">
            <h3 className="font-bold text-base text-slate-100 mb-1">
              Edit Nilai: {editingGrade.users?.full_name}
            </h3>
            <p className="text-xs text-slate-400 font-mono mb-4">
              NIM: {editingGrade.users?.nim_or_nip} | Kelas: {editingGrade.classes?.nama_mk}
            </p>

            <form onSubmit={handleSaveGrade} className="space-y-4">
              <div>
                <label className="block text-xs text-slate-400 mb-1">Nilai Tugas (Bobot 30%)</label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  max="100"
                  value={tugas}
                  onChange={e => setTugas(e.target.value)}
                  required
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-sm font-mono text-slate-100 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-1">Nilai UTS (Bobot 30%)</label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  max="100"
                  value={uts}
                  onChange={e => setUts(e.target.value)}
                  required
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-sm font-mono text-slate-100 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-1">Nilai UAS (Bobot 40%)</label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  max="100"
                  value={uas}
                  onChange={e => setUas(e.target.value)}
                  required
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-sm font-mono text-slate-100 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="flex gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setEditingGrade(null)}
                  className="w-1/2 bg-slate-800 hover:bg-slate-700 text-slate-300 py-2 rounded-lg text-sm transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="w-1/2 bg-indigo-600 hover:bg-indigo-500 text-white font-medium py-2 rounded-lg text-sm transition shadow-lg shadow-indigo-600/30"
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
