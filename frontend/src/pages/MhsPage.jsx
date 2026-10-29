import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { apiRequest } from '../services/api';
import { GraduationCap, Award, FileText, AlertCircle } from 'lucide-react';

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
        <div className="p-4 rounded-xl text-sm border bg-rose-950/80 border-rose-800 text-rose-300 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5" />
            <span>{alert}</span>
          </div>
          <button onClick={() => setAlert(null)} className="text-xs underline ml-4">Tutup</button>
        </div>
      )}

      {/* Profil Mahasiswa Banner */}
      <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-emerald-600/20 border border-emerald-500/40 rounded-2xl flex items-center justify-center text-emerald-400">
            <GraduationCap className="w-8 h-8" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-100">{user?.fullName}</h2>
            <p className="text-xs text-slate-400 font-mono mt-0.5">
              NIM: <span className="text-cyan-400 font-bold">{user?.nim_or_nip}</span> | Perangkat:{' '}
              <span className="text-emerald-400">{authContextHeaders.deviceId}</span>
            </p>
          </div>
        </div>

        {transcript && (
          <div className="flex items-center gap-4 bg-slate-950 px-5 py-3 rounded-xl border border-slate-800">
            <div>
              <div className="text-[10px] text-slate-500 uppercase tracking-wider font-bold">Total SKS</div>
              <div className="text-xl font-extrabold text-slate-200">{transcript.totalSks} SKS</div>
            </div>
            <div className="w-px h-8 bg-slate-800" />
            <div>
              <div className="text-[10px] text-slate-500 uppercase tracking-wider font-bold">IPK Kumulatif</div>
              <div className="text-xl font-extrabold text-emerald-400">{transcript.ipk}</div>
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Nilai Kelas Berjalan (Service Nilai) */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-xl">
          <div className="p-4 border-b border-slate-800 font-bold text-sm text-slate-200 flex items-center gap-2">
            <FileText className="w-4 h-4 text-indigo-400" />
            <span>Nilai Kelas Berjalan (GET /nilai)</span>
          </div>

          <div className="p-4 space-y-3">
            {grades.length === 0 ? (
              <div className="text-xs text-slate-500 text-center py-6">Tidak ada data nilai kelas berjalan</div>
            ) : (
              grades.map(g => (
                <div key={g.id} className="bg-slate-950 p-4 rounded-lg border border-slate-800 flex justify-between items-center">
                  <div>
                    <div className="font-bold text-sm text-slate-200">{g.classes?.nama_mk}</div>
                    <div className="text-xs text-slate-400 mt-1 font-mono">
                      Tugas: {g.nilai_tugas} | UTS: {g.nilai_uts} | UAS: {g.nilai_uas}
                    </div>
                    <div className="text-[10px] text-slate-500 mt-1">
                      Status:{' '}
                      <span className={g.classes?.is_finalized ? 'text-amber-400 font-bold' : 'text-emerald-400'}>
                        {g.classes?.is_finalized ? 'Final (Tersinkron ke Transkrip)' : 'Draf Sementara'}
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-black text-indigo-400">{g.grade_letter}</div>
                    <div className="text-xs text-slate-400 font-mono">Score: {g.nilai_akhir}</div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Transkrip Akademik Resmi (Service Transkrip) */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-xl">
          <div className="p-4 border-b border-slate-800 font-bold text-sm text-slate-200 flex items-center gap-2">
            <Award className="w-4 h-4 text-emerald-400" />
            <span>Transkrip Resmi (GET /transkrip/:nim)</span>
          </div>

          <div className="p-4 space-y-3">
            {!transcript?.mataKuliah || transcript.mataKuliah.length === 0 ? (
              <div className="text-xs text-slate-500 text-center py-6">
                Belum ada mata kuliah yang difinalisasi oleh dosen ke transkrip.
              </div>
            ) : (
              transcript.mataKuliah.map(m => (
                <div key={m.id} className="bg-slate-950 p-4 rounded-lg border border-slate-800 flex justify-between items-center">
                  <div>
                    <span className="text-[10px] font-mono bg-slate-800 text-slate-300 px-1.5 py-0.5 rounded font-bold">
                      {m.kode_mk}
                    </span>
                    <div className="font-bold text-sm text-slate-200 mt-1">{m.nama_mk}</div>
                    <div className="text-xs text-slate-400 font-mono mt-0.5">{m.sks} SKS</div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-black text-emerald-400">{m.grade_letter}</div>
                    <div className="text-[10px] text-slate-500">RESMI</div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
