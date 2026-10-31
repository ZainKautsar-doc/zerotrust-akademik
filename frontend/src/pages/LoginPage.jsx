import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { GATEWAY_URL } from '../services/api';
import { Lock, UserCheck, ShieldAlert, KeyRound, ArrowRight, ShieldCheck, CheckCircle2, Laptop } from 'lucide-react';

export default function LoginPage({ onNavigateAbout }) {
  const { loginUser, activeDeviceId, setDevice } = useAuth();
  const [username, setUsername] = useState('dosen_budi');
  const [password, setPassword] = useState('password123');
  const [seedUsers, setSeedUsers] = useState([]);
  const [errorMsg, setErrorMsg] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch(`${GATEWAY_URL}/api/users/seed-accounts`)
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
      const res = await fetch(`${GATEWAY_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Device-ID': activeDeviceId
        },
        body: JSON.stringify({ username, password })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Login gagal diverifikasi oleh Gateway');
      }

      loginUser(data.user, data.accessToken, data.refreshToken, activeDeviceId);
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto py-3 sm:py-8 space-y-5 sm:space-y-8 px-1 sm:px-0">
      {/* AuthKit Section Eyebrow + Header Banner */}
      <div className="glass-panel p-4 sm:p-8 space-y-4 sm:space-y-6 relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 sm:gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1 rounded-full text-[10px] sm:text-xs font-mono tracking-wider text-moon-mist bg-steel-plate/30 border border-glass-edge">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
              <span>NIST SP 800-207 ZERO TRUST</span>
            </div>
            <h1 className="text-xl sm:text-3xl font-display font-medium text-skywash tracking-tight">
              Sistem Informasi Akademik Zero Trust
            </h1>
            <p className="text-moon-mist text-xs sm:text-sm leading-relaxed">
              Menerapkan kebijakan <span className="text-pure-white font-medium">Never Trust, Always Verify</span>: setiap interaksi divalidasi identitasnya, keabsahan perangkatnya (<code className="text-emerald-300 font-mono">X-Device-ID</code>), serta dipagari batasan jam operasional.
            </p>
          </div>

          <button
            onClick={onNavigateAbout}
            className="btn-ghost-pill flex-shrink-0 inline-flex items-center justify-center gap-2 px-4 sm:px-5 py-2.5 text-xs sm:text-sm font-medium cursor-pointer w-full sm:w-auto"
          >
            <span>Pelajari Arsitektur Sistem</span>
            <ArrowRight className="w-4 h-4 text-frost-glow" />
          </button>
        </div>

        {/* Feature Highlights Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 pt-4 sm:pt-5 border-t border-glass-edge text-xs">
          <div className="flex items-start gap-2.5 text-moon-mist">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold text-pure-white">Dosen:</span> Kelola nilai kelas ampuannya pada jam operasional (07:00 - 21:00) dan finalisasi data ke transkrip.
            </div>
          </div>
          <div className="flex items-start gap-2.5 text-moon-mist">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold text-pure-white">Mahasiswa:</span> Akses transkrip resmi dan pantau kalkulasi SKS serta IPK miliknya secara terisolasi.
            </div>
          </div>
          <div className="flex items-start gap-2.5 text-moon-mist">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold text-pure-white">Admin & Auditor:</span> Monitoring riwayat evaluasi PEP secara live untuk status ALLOW dan DENY.
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-8">
        {/* Form Login (AuthKit Auth Modal Card) */}
        <div className="glass-deep p-4 sm:p-8 space-y-5">
          <div className="flex items-center gap-3 pb-2 border-b border-glass-edge">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-steel-plate/60 flex items-center justify-center text-frost-glow flex-shrink-0">
              <Lock className="w-4 h-4 sm:w-5 sm:h-5 text-void-violet" />
            </div>
            <div>
              <h2 className="font-display font-medium text-pure-white text-base sm:text-lg">Autentikasi Gateway PEP</h2>
              <p className="text-xs text-moon-mist">Verifikasi kredensial dan validasi perangkat</p>
            </div>
          </div>

          {errorMsg && (
            <div className="bg-rose-950/60 border border-rose-500/40 text-rose-200 p-3.5 rounded-input text-xs flex items-start gap-2.5">
              <ShieldAlert className="w-4 h-4 text-rose-400 flex-shrink-0 mt-0.5" />
              <span className="break-words">{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-mono text-pure-white font-semibold uppercase tracking-wider mb-1.5">
                  Username
                </label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  placeholder="misal: dosen_budi"
                  className="input-frosted w-full px-3.5 py-2.5 text-sm font-mono placeholder:text-fog-veil"
                />
              </div>

              <div>
                <label className="block text-xs font-mono text-pure-white font-semibold uppercase tracking-wider mb-1.5">
                  Password
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="••••••••••••"
                  className="input-frosted w-full px-3.5 py-2.5 text-sm font-mono placeholder:text-fog-veil"
                />
              </div>

              <div className="p-3.5 rounded-card bg-midnight-canvas/90 border border-glass-edge text-xs space-y-1.5">
                <div className="flex items-center justify-between flex-wrap gap-1">
                  <span className="text-pure-white font-medium flex items-center gap-1.5">
                    <Laptop className="w-3.5 h-3.5 text-frost-glow" />
                    Perangkat Terkirim:
                  </span>
                  <span className="font-mono text-emerald-300 font-bold break-all">{activeDeviceId}</span>
                </div>
                <p className="text-[11px] text-moon-mist leading-relaxed">
                  *Request menyertakan header <code className="text-pure-white font-mono bg-steel-plate/60 px-1 py-0.5 rounded">X-Device-ID</code>. Jika tidak terdaftar untuk akun ini, Gateway akan memblokir request.
                </p>
              </div>

            {/* Void Violet Submit CTA Button */}
            <button
              type="submit"
              disabled={loading}
              className="btn-violet w-full py-3 text-sm flex items-center justify-center gap-2 cursor-pointer mt-2"
            >
              {loading ? (
                <span>Memverifikasi Context PEP...</span>
              ) : (
                <>
                  <span className="truncate">Autentikasi & Verifikasi Perangkat</span>
                  <ArrowRight className="w-4 h-4 flex-shrink-0" />
                </>
              )}
            </button>
          </form>
        </div>

        {/* Quick User Selector (Preset Demo Cards) */}
        <div className="glass-panel p-4 sm:p-8 space-y-4">
          <div className="flex items-center gap-3 pb-2 border-b border-glass-edge">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-steel-plate/60 flex items-center justify-center text-emerald-400 flex-shrink-0">
              <UserCheck className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div>
              <h2 className="font-display font-medium text-pure-white text-base sm:text-lg">Pilih Akun Demo</h2>
              <p className="text-xs text-moon-mist">Pilih akun demo cepat untuk pengujian verifikasi Zero Trust</p>
            </div>
          </div>

          <div className="space-y-2.5 max-h-[380px] sm:max-h-[360px] overflow-y-auto pr-1 sm:pr-2 custom-scrollbar">
            {seedUsers
              .filter(u => {
                if (u.role === 'admin' || u.role === 'dosen') return true;
                if (u.role === 'mahasiswa') return ['mhs_andi', 'mhs_bima'].includes(u.username);
                return false;
              })
              .map((u) => {
              const dev = u.devices?.[0]?.device_id || 'NONE';
              const isSelected = username === u.username;
              return (
                <button
                  key={u.id}
                  onClick={() => handleQuickSelect(u)}
                  className={`w-full text-left p-3 sm:p-3.5 rounded-card transition flex items-center justify-between gap-2 group cursor-pointer border ${
                    isSelected
                      ? 'bg-steel-plate/50 border-void-violet shadow-sm'
                      : 'bg-midnight-canvas/60 hover:bg-steel-plate/30 border-glass-edge'
                  }`}
                >
                  <div className="space-y-1 min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium text-sm text-pure-white group-hover:text-ice-highlight truncate">
                        {u.full_name}
                      </span>
                      <span className={`text-[10px] px-2 py-0.2 rounded-full font-mono uppercase font-semibold border ${
                        u.role === 'admin'
                          ? 'bg-purple-500/10 text-purple-300 border-purple-500/30'
                          : u.role === 'dosen'
                          ? 'bg-blue-500/10 text-blue-300 border-blue-500/30'
                          : 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
                      }`}>
                        {u.role}
                      </span>
                    </div>
                    <div className="text-[11px] sm:text-xs text-moon-mist font-mono break-all leading-tight">
                      user: <span className="text-pure-white font-semibold">{u.username}</span> | device: <span className="text-emerald-300 font-semibold">{dev}</span>
                    </div>
                  </div>
                  <KeyRound className="w-4 h-4 text-fog-veil group-hover:text-frost-glow transition flex-shrink-0" />
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
