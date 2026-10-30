import React from 'react';
import { 
  Shield, CheckCircle2, Lock, Clock, Laptop, Layers, Users, 
  ArrowLeft, Server, Key, Eye, ShieldCheck, Database, GitBranch
} from 'lucide-react';

export default function AboutPage({ onBack }) {
  return (
    <div className="relative min-h-[calc(100vh-140px)] py-8 px-4 sm:px-6 max-w-6xl mx-auto space-y-12">
      {/* Top Navigation & Back Action */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="btn-ghost-pill px-4 py-2 text-xs sm:text-sm font-medium flex items-center gap-2 group cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4 text-frost-glow group-hover:-translate-x-1 transition-transform" />
          <span>Kembali ke Aplikasi</span>
        </button>

        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-mono tracking-wider text-moon-mist bg-steel-plate/30 border border-glass-edge">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          NIST SP 800-207 COMPLIANT
        </div>
      </div>

      {/* Hero Section with Eyebrow & Skywash Heading */}
      <div className="text-center space-y-4 max-w-3xl mx-auto pt-4">
        <div className="flex items-center justify-center gap-3">
          <div className="h-[1px] w-12 bg-gradient-to-r from-transparent to-glass-edge"></div>
          <span className="font-mono text-xs sm:text-sm tracking-[0.15em] uppercase text-moon-mist">
            Zero Trust Architecture Reference
          </span>
          <div className="h-[1px] w-12 bg-gradient-to-l from-transparent to-glass-edge"></div>
        </div>

        <h1 className="text-3xl sm:text-5xl font-display font-medium text-skywash tracking-tight">
          Tentang Sistem & Arsitektur
        </h1>

        <p className="text-moon-mist text-sm sm:text-base leading-relaxed">
          Penerapan standar keamanan modern Zero Trust Architecture pada Sistem Pengelolaan Nilai dan Transkrip Akademik untuk menjamin integritas dan kerahasiaan data mahasiswa.
        </p>
      </div>

      {/* 3 Core Principles Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="glass-panel p-6 space-y-3 relative overflow-hidden group">
          <div className="w-12 h-12 rounded-full bg-steel-plate/60 border border-glass-edge flex items-center justify-center text-frost-glow mb-4">
            <Lock className="w-5 h-5" />
          </div>
          <h2 className="text-lg font-display font-medium text-pure-white">
            Never Trust, Always Verify
          </h2>
          <p className="text-xs sm:text-sm text-moon-mist leading-relaxed">
            Tidak ada asumsi trust berdasarkan lokasi jaringan (perimeter). Setiap panggilan API wajib memverifikasi token identitas (JWT), keabsahan ID perangkat pengirim (<code className="text-emerald-300 font-mono font-semibold">X-Device-ID</code>), serta parameter waktu secara berkelanjutan.
          </p>
        </div>

        <div className="glass-panel p-6 space-y-3 relative overflow-hidden group">
          <div className="w-12 h-12 rounded-full bg-steel-plate/60 border border-glass-edge flex items-center justify-center text-frost-glow mb-4">
            <Users className="w-5 h-5" />
          </div>
          <h2 className="text-lg font-display font-medium text-pure-white">
            Least Privilege Principle
          </h2>
          <p className="text-xs sm:text-sm text-moon-mist leading-relaxed">
            Setiap subjek (Dosen, Mahasiswa, Admin) hanya diberikan hak akses minimum untuk menyelesaikan tugasnya. Dosen hanya melihat kelas ampuannya, mahasiswa hanya melihat transkrip miliknya, dan admin tidak dapat mengubah nilai langsung.
          </p>
        </div>

        <div className="glass-panel p-6 space-y-3 relative overflow-hidden group">
          <div className="w-12 h-12 rounded-full bg-steel-plate/60 border border-glass-edge flex items-center justify-center text-frost-glow mb-4">
            <Server className="w-5 h-5" />
          </div>
          <h2 className="text-lg font-display font-medium text-pure-white">
            Assume Breach & Isolation
          </h2>
          <p className="text-xs sm:text-sm text-moon-mist leading-relaxed">
            Layanan microservices (Nilai & Transkrip) terisolasi sepenuhnya di belakang Express Gateway (PEP). Sinkronisasi data antar-service hanya diizinkan melalui saluran terautentikasi internal dengan gateway secret.
          </p>
        </div>
      </div>

      {/* Architecture Layout & Flow */}
      <div className="glass-panel p-6 sm:p-8 space-y-6">
        <div className="flex items-center gap-3 border-b border-glass-edge pb-4">
          <Layers className="w-5 h-5 text-frost-glow" />
          <div>
            <h2 className="text-lg font-display font-medium text-pure-white">Komponen Arsitektur Sistem</h2>
            <p className="text-xs text-moon-mist">Pemetaan komponen NIST SP 800-207 dalam sistem ini</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
          <div className="p-4 rounded-card bg-midnight-canvas/90 border border-glass-edge space-y-2">
            <div className="font-mono text-emerald-400 font-semibold uppercase">PEP (Policy Enforcement Point)</div>
            <div className="font-bold text-pure-white text-sm">Express API Gateway</div>
            <p className="text-moon-mist leading-relaxed">
              Titik gerbang tunggal (port 3000) yang mencegat seluruh request sebelum diteruskan ke service internal.
            </p>
          </div>

          <div className="p-4 rounded-card bg-midnight-canvas/90 border border-glass-edge space-y-2">
            <div className="font-mono text-indigo-400 font-semibold uppercase">PDP (Policy Decision Point)</div>
            <div className="font-bold text-pure-white text-sm">Policy Engine Middleware</div>
            <p className="text-moon-mist leading-relaxed">
              Mesin penilai kebijakan yang mengevaluasi role, jam operasional, dan kepemilikan data sebelum menerbitkan keputusan ALLOW atau DENY.
            </p>
          </div>

          <div className="p-4 rounded-card bg-midnight-canvas/90 border border-glass-edge space-y-2">
            <div className="font-mono text-purple-400 font-semibold uppercase">Microservices</div>
            <div className="font-bold text-pure-white text-sm">Service Nilai & Transkrip</div>
            <p className="text-moon-mist leading-relaxed">
              Dua service independen (port 3001 & 3002) yang hanya merespons request terverifikasi dari Gateway PEP.
            </p>
          </div>

          <div className="p-4 rounded-card bg-midnight-canvas/90 border border-glass-edge space-y-2">
            <div className="font-mono text-cyan-400 font-semibold uppercase">Audit Logging</div>
            <div className="font-bold text-pure-white text-sm">Realtime Security Logger</div>
            <p className="text-moon-mist leading-relaxed">
              Mencatat seluruh percobaan akses (berhasil maupun ditolak) beserta atribut IP, Device ID, dan timestamp ke Supabase.
            </p>
          </div>
        </div>
      </div>

      {/* Role Capabilities Breakdown */}
      <div className="space-y-4">
        <div className="text-center space-y-1">
          <h2 className="text-xl sm:text-2xl font-display font-medium text-pure-white">
            Hak Akses & Batasan Peran (RBAC Matrix)
          </h2>
          <p className="text-xs sm:text-sm text-moon-mist">
            Pemisahan wewenang ketat untuk mencegah eskalasi hak istimewa
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Dosen Card */}
          <div className="glass-panel p-6 space-y-4">
            <div className="flex items-center justify-between">
              <span className="font-mono text-xs font-semibold px-2.5 py-1 rounded-full bg-blue-500/10 text-blue-300 border border-blue-500/30 uppercase">
                Role Dosen
              </span>
              <span className="text-xs text-fog-veil">service-nilai</span>
            </div>
            <h3 className="font-bold text-base text-frost-glow">Pengelolaan Nilai Akademik</h3>
            <ul className="text-xs text-moon-mist space-y-2 list-disc list-inside">
              <li>Mengakses daftar kelas matakuliah yang diampu secara spesifik.</li>
              <li>Input dan update nilai komponen (Tugas, UTS, UAS).</li>
              <li>Operasi ubah nilai dibatasi hanya pada jam operasional (07:00 - 21:00 WIB).</li>
              <li>Finalisasi nilai kelas yang memicu sinkronisasi otomatis ke Service Transkrip.</li>
            </ul>
          </div>

          {/* Mahasiswa Card */}
          <div className="glass-panel p-6 space-y-4">
            <div className="flex items-center justify-between">
              <span className="font-mono text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-300 border border-emerald-500/30 uppercase">
                Role Mahasiswa
              </span>
              <span className="text-xs text-fog-veil">service-transkrip</span>
            </div>
            <h3 className="font-bold text-base text-frost-glow">Transkrip & Riwayat Nilai</h3>
            <ul className="text-xs text-moon-mist space-y-2 list-disc list-inside">
              <li>Melihat nilai kelas semester berjalan yang diambil.</li>
              <li>Mengakses transkrip resmi, kalkulasi SKS, dan indeks prestasi kumulatif (IPK).</li>
              <li>Hanya berhak membaca data miliknya sendiri (terisolasi via filter NIM & JWT).</li>
              <li>Tidak memiliki wewenang manipulasi data nilai pada sistem.</li>
            </ul>
          </div>

          {/* Admin Card */}
          <div className="glass-panel p-6 space-y-4">
            <div className="flex items-center justify-between">
              <span className="font-mono text-xs font-semibold px-2.5 py-1 rounded-full bg-purple-500/10 text-purple-300 border border-purple-500/30 uppercase">
                Role Admin
              </span>
              <span className="text-xs text-fog-veil">monitoring & audit</span>
            </div>
            <h3 className="font-bold text-base text-frost-glow">Audit & Pengawasan Keamanan</h3>
            <ul className="text-xs text-moon-mist space-y-2 list-disc list-inside">
              <li>Pencarian transkrip akademik seluruh mahasiswa untuk keperluan verifikasi.</li>
              <li>Monitoring jejak audit (Audit Trail) dari Policy Engine secara real-time.</li>
              <li>Analisis anomali akses dengan filter status keputusan ALLOW dan DENY.</li>
              <li>Verifikasi status perangkat terdaftar (Whitelist Device ID).</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Interactive Security Demonstration Guide */}
      <div className="glass-deep p-6 sm:p-8 space-y-4 border border-glass-edge">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-steel-plate/60 flex items-center justify-center text-frost-glow">
            <Laptop className="w-5 h-5 text-emerald-400" />
          </div>
          <div>
            <h3 className="font-display font-medium text-pure-white text-base">Panduan Pengujian Zero Trust</h3>
            <p className="text-xs text-moon-mist">Uji coba skenario keamanan menggunakan HUD di bagian atas sistem</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 text-xs">
          <div className="p-4 rounded-card bg-steel-plate/20 border border-glass-edge space-y-2">
            <div className="font-semibold text-pure-white flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
              Skenario 1: Verifikasi Device ID
            </div>
            <p className="text-fog-veil leading-relaxed">
              Ganti perangkat aktif pada bar atas ke perangkat yang tidak terdaftar (contoh: <code className="text-rose-400 font-mono">DEV-UNKNOWN-HACKER</code>). Lakukan aksi apa pun, Gateway PEP akan menolak dengan status <span className="text-rose-400 font-mono font-bold">403 Device Untrusted</span>.
            </p>
          </div>

          <div className="p-4 rounded-card bg-steel-plate/20 border border-glass-edge space-y-2">
            <div className="font-semibold text-pure-white flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-amber-400"></span>
              Skenario 2: Pembatasan Jam Operasional
            </div>
            <p className="text-fog-veil leading-relaxed">
              Simulasikan jam di luar operasional (misal: pukul 23:00 malam). Login sebagai Dosen dan coba lakukan simpan nilai. Policy Engine akan menolak aksi dengan respon <span className="text-amber-400 font-mono font-bold">403 Outside Working Hours</span>.
            </p>
          </div>
        </div>
      </div>

      {/* Bottom Back Button */}
      <div className="text-center pt-4">
        <button
          onClick={onBack}
          className="btn-violet px-8 py-3 text-sm font-medium inline-flex items-center gap-2 cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Kembali ke Halaman Utama</span>
        </button>
      </div>
    </div>
  );
}
