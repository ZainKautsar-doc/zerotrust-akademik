import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { apiRequest } from '../services/api';
import { Shield, Search, FileSpreadsheet, AlertCircle, RefreshCw, Users, Award } from 'lucide-react';
import AuditLogViewer from '../components/AuditLogViewer';

export default function AdminPage() {
  const { authContextHeaders } = useAuth();
  const [allStudents, setAllStudents] = useState([]);
  const [searchFilter, setSearchFilter] = useState('');
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);

  const fetchAllStudents = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const data = await apiRequest('/transkrip/all', {}, authContextHeaders);
      if (Array.isArray(data)) {
        setAllStudents(data);
      }
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllStudents();
  }, [authContextHeaders.deviceId]);

  const filteredStudents = allStudents.filter(s => {
    const query = searchFilter.toLowerCase();
    return (
      s.full_name?.toLowerCase().includes(query) ||
      s.nim_or_nip?.toLowerCase().includes(query) ||
      s.username?.toLowerCase().includes(query)
    );
  });

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
            Admin memiliki otorisasi penuh untuk audit sistem dan verifikasi transkrip seluruh mahasiswa secara langsung tanpa perlu input NIM manual.
          </p>
        </div>

        <button
          onClick={fetchAllStudents}
          disabled={loading}
          className="btn-ghost-pill text-xs px-4 py-2 flex items-center gap-2 cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>{loading ? 'Memuat Data...' : 'Segarkan Data'}</span>
        </button>
      </div>

      {errorMsg && (
        <div className="bg-rose-950/60 border border-rose-500/40 text-rose-200 p-3.5 rounded-card text-xs flex items-center gap-2.5">
          <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Rekap Seluruh Data Mahasiswa & Transkrip Otomatis */}
      <div className="glass-panel p-6 sm:p-7 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-glass-edge pb-4">
          <div className="flex items-center gap-2.5">
            <Users className="w-5 h-5 text-emerald-400" />
            <div>
              <h3 className="font-display font-medium text-base text-pure-white">
                Daftar Seluruh Mahasiswa & Transkrip
              </h3>
              <p className="text-xs text-moon-mist">
                Total: <span className="text-pure-white font-semibold">{allStudents.length} Mahasiswa Terdaftar</span> (Semua ditampilkan langsung)
              </p>
            </div>
          </div>

          {/* Live Search Filter */}
          <div className="relative max-w-xs w-full">
            <Search className="w-3.5 h-3.5 text-fog-veil absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Cari Nama / NIM..."
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              className="input-frosted w-full pl-9 pr-3.5 py-1.5 text-xs font-mono placeholder:text-fog-veil"
            />
          </div>
        </div>

        {/* Tabel Rekap Mahasiswa */}
        <div className="overflow-x-auto rounded-card border border-glass-edge custom-scrollbar max-h-96 overflow-y-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead>
              <tr className="bg-steel-plate/50 text-pure-white border-b border-glass-edge uppercase text-[10px] tracking-wider font-semibold sticky top-0 backdrop-blur-md">
                <th className="p-3">NIM</th>
                <th className="p-3 font-sans">Nama Mahasiswa</th>
                <th className="p-3">Username</th>
                <th className="p-3">Total SKS</th>
                <th className="p-3">IPK Kumulatif</th>
                <th className="p-3">Mata Kuliah Masuk</th>
                <th className="p-3 text-center font-sans">Detail</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-glass-edge bg-midnight-canvas/70">
              {filteredStudents.length === 0 ? (
                <tr>
                  <td colSpan="7" className="p-6 text-center text-fog-veil font-sans">
                    {loading ? 'Memuat rekap mahasiswa...' : 'Tidak ada data mahasiswa yang cocok dengan pencarian.'}
                  </td>
                </tr>
              ) : (
                filteredStudents.map((st) => (
                  <tr key={st.id} className="hover:bg-steel-plate/20 transition">
                    <td className="p-3 text-emerald-300 font-bold">{st.nim_or_nip}</td>
                    <td className="p-3 text-pure-white font-sans font-medium">{st.full_name}</td>
                    <td className="p-3 text-moon-mist font-mono">{st.username}</td>
                    <td className="p-3 text-pure-white font-semibold">{st.totalSks} SKS</td>
                    <td className="p-3">
                      <span className={`px-2.5 py-0.5 rounded-full font-bold border text-[11px] ${
                        parseFloat(st.ipk) >= 3.5 
                          ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/40' 
                          : parseFloat(st.ipk) > 0
                          ? 'bg-blue-500/15 text-blue-300 border-blue-500/40'
                          : 'bg-steel-plate/40 text-fog-veil border-glass-edge'
                      }`}>
                        {st.ipk}
                      </span>
                    </td>
                    <td className="p-3 text-moon-mist">
                      {st.transcripts?.length || 0} Mata Kuliah
                    </td>
                    <td className="p-3 text-center">
                      <button
                        onClick={() => setSelectedStudent(st)}
                        className="btn-ghost-pill px-3 py-1 text-[11px] font-sans cursor-pointer hover:border-void-violet"
                      >
                        Lihat Nilai
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Detail Transkrip Mahasiswa */}
      {selectedStudent && (
        <div className="fixed inset-0 bg-midnight-canvas/80 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <div className="glass-deep max-w-lg w-full p-6 sm:p-7 space-y-4">
            <div className="flex items-center justify-between border-b border-glass-edge pb-3">
              <div>
                <h3 className="font-display font-medium text-base text-pure-white">
                  Transkrip: {selectedStudent.full_name}
                </h3>
                <p className="text-xs text-emerald-300 font-mono mt-0.5">
                  NIM: {selectedStudent.nim_or_nip} · Username: {selectedStudent.username}
                </p>
              </div>
              <div className="text-right">
                <div className="text-xs text-moon-mist">IPK: <span className="text-emerald-400 font-bold">{selectedStudent.ipk}</span></div>
                <div className="text-xs text-moon-mist">SKS: <span className="text-pure-white font-bold">{selectedStudent.totalSks}</span></div>
              </div>
            </div>

            <div className="space-y-2 max-h-60 overflow-y-auto pr-1 custom-scrollbar">
              {!selectedStudent.transcripts || selectedStudent.transcripts.length === 0 ? (
                <div className="text-xs text-fog-veil text-center py-6">
                  Belum ada mata kuliah yang disinkronkan ke transkrip mahasiswa ini.
                </div>
              ) : (
                selectedStudent.transcripts.map((t, idx) => (
                  <div key={idx} className="flex justify-between items-center text-xs p-2.5 rounded-card bg-midnight-canvas/90 border border-glass-edge">
                    <div>
                      <span className="font-mono text-emerald-300 font-semibold">{t.kode_mk}</span>
                      <span className="text-pure-white ml-2">{t.nama_mk} ({t.sks} SKS)</span>
                    </div>
                    <span className="px-2 py-0.5 rounded-full bg-steel-plate/60 text-amber-300 font-bold border border-glass-edge font-mono">
                      {t.grade_letter}
                    </span>
                  </div>
                ))
              )}
            </div>

            <div className="pt-2 text-right">
              <button
                onClick={() => setSelectedStudent(null)}
                className="btn-ghost-pill px-5 py-2 text-xs font-medium cursor-pointer"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Audit Log Terintegrasi untuk Admin */}
      <AuditLogViewer />
    </div>
  );
}
