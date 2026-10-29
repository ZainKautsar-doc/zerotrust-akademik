import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Lock, UserCheck, ShieldAlert, KeyRound, Info, ShieldCheck, CheckCircle2 } from 'lucide-react';

export default function LoginPage({ onOpenAbout }) {
  const { loginUser, activeDeviceId, setDevice } = useAuth();
  const [username, setUsername] = useState('dosen_budi');
  const [password, setPassword] = useState('password123');
  const [seedUsers, setSeedUsers] = useState([]);
  const [errorMsg, setErrorMsg] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch('http://127.0.0.1:3000/api/users/seed-accounts')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) setSeedUsers(data);
      })
      .catch(() => {});
  }, []);

  const handleQuickSelect = (u) => {
    setUsername(u.username);
    setPassword('password123');
    if (u.devices && u.devices.length > 0) {
      setDevice(u.devices[0].device_id);
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setErrorMsg(null);
    setLoading(true);

    try {
      const res = await fetch('http://127.0.0.1:3000/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Device-ID': activeDeviceId
        },
        body: JSON.stringify({ username, password })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Login gagal');
      }

      loginUser(data.user, data.accessToken, data.refreshToken, activeDeviceId);
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 space-y-8">
      {/* Banner Penjelasan Sistem */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-500/10 text-indigo-300 border border-indigo-500/30">
              <ShieldCheck className="w-3.5 h-3.5" />
              Arsitektur Keamanan Zero Trust (NIST SP 800-207)
            </div>
            <h1 className="text-2xl font-extrabold text-white tracking-tight">
              Sistem Pengelolaan Nilai & Transkrip Akademik
            </h1>
            <p className="text-slate-400 text-xs sm:text-sm leading-relaxed">
              Sistem ini menerapkan validasi identitas, verifikasi perangkat pengirim (<code className="text-emerald-400">X-Device-ID</code>), pembatasan jam operasional, serta isolasi backend service secara ketat.
            </p>
          </div>

          <button
            onClick={onOpenAbout}
            className="flex-shrink-0 inline-flex items-center gap-2 bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/40 px-4 py-2.5 rounded-xl text-xs font-semibold transition"
          >
            <Info className="w-4 h-4" />
            Penjelasan Lengkap Sistem
          </button>
        </div>

        {/* Ringkasan Kemampuan Sistem */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-5 pt-5 border-t border-slate-800/80 text-xs">
          <div className="flex items-start gap-2 text-slate-300">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold text-slate-100">Dosen:</span> Kelola nilai kelas diampu, edit pada jam operasional, dan finalisasi sinkron ke transkrip.
            </div>
          </div>
          <div className="flex items-start gap-2 text-slate-300">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold text-slate-100">Mahasiswa:</span> Pantau nilai kelas berjalan & transkrip resmi miliknya sendiri secara privat.
            </div>
          </div>
          <div className="flex items-start gap-2 text-slate-300">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold text-slate-100">Admin & Auditor:</span> Periksa transkrip semua mahasiswa & monitor live audit log keputusan Policy Engine.
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Form Login */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
          <div className="flex items-center gap-2 mb-6 text-indigo-400">
            <Lock className="w-5 h-5" />
            <h2 className="font-bold text-slate-100 text-lg">Autentikasi Gateway</h2>
          </div>

          {errorMsg && (
            <div className="mb-4 bg-rose-950/80 border border-rose-800 text-rose-300 p-3 rounded-lg text-xs flex items-start gap-2">
              <ShieldAlert className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Username</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-indigo-500 font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-indigo-500 font-mono"
              />
            </div>

            <div className="pt-2">
              <div className="text-[11px] text-slate-400 mb-1 flex items-center justify-between">
                <span>Perangkat Pengirim (Header X-Device-ID):</span>
                <span className="font-mono text-emerald-400 font-bold">{activeDeviceId}</span>
              </div>
              <p className="text-[10px] text-slate-500 italic">
                *Jika Device ID ini tidak cocok dengan user, Gateway PEP akan menolak dengan error 403 Forbidden.
              </p>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-medium py-2.5 rounded-lg text-sm transition shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2"
            >
              {loading ? 'Memverifikasi PEP...' : 'Login ke Gateway (PEP)'}
            </button>
          </form>
        </div>

        {/* Quick User Selector */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
          <div className="flex items-center gap-2 mb-4 text-emerald-400">
            <UserCheck className="w-5 h-5" />
            <h2 className="font-bold text-slate-100 text-lg">Pilih Akun Demo (Preset)</h2>
          </div>
          <p className="text-xs text-slate-400 mb-4">
            Klik salah satu akun di bawah ini untuk mengisi username dan mencocokkan Device ID otomatis:
          </p>

          <div className="space-y-2.5 max-h-96 overflow-y-auto pr-1">
            {seedUsers.map((u) => {
              const dev = u.devices?.[0]?.device_id || 'NONE';
              return (
                <button
                  key={u.id}
                  onClick={() => handleQuickSelect(u)}
                  className="w-full text-left p-3 rounded-xl bg-slate-950 hover:bg-slate-800/80 border border-slate-800 transition flex items-center justify-between group"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-slate-200 group-hover:text-indigo-400">
                        {u.full_name}
                      </span>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded font-mono uppercase font-bold ${
                        u.role === 'admin'
                          ? 'bg-purple-950 text-purple-300 border border-purple-800'
                          : u.role === 'dosen'
                          ? 'bg-blue-950 text-blue-300 border border-blue-800'
                          : 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                      }`}>
                        {u.role}
                      </span>
                    </div>
                    <div className="text-xs text-slate-400 font-mono mt-0.5">
                      user: <span className="text-slate-300 font-semibold">{u.username}</span> | device: <span className="text-emerald-400">{dev}</span>
                    </div>
                  </div>
                  <KeyRound className="w-4 h-4 text-slate-600 group-hover:text-indigo-400 transition" />
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
