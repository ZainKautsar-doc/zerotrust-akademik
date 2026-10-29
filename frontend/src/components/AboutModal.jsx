import React from 'react';
import { Shield, CheckCircle2, Lock, Clock, Laptop, Layers, Users, FileText, Database, X } from 'lucide-react';

export default function AboutModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl max-w-4xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="p-6 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-indigo-600/20 border border-indigo-500/40 text-indigo-400">
              <Shield className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-100">Tentang Sistem & Arsitektur Zero Trust</h2>
              <p className="text-xs text-slate-400">
                Penerapan Standar NIST SP 800-207 pada Sistem Pengelolaan Nilai Akademik
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-100 p-2 rounded-lg hover:bg-slate-800 transition"
            aria-label="Tutup"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 text-sm text-slate-300">
          {/* Bagian 1: Untuk Apa Web Ini & Tujuannya */}
          <section className="space-y-3">
            <div className="flex items-center gap-2 text-indigo-400 font-bold text-sm tracking-wide uppercase">
              <Layers className="w-4 h-4" />
              <span>Untuk Apa Website Ini & Tujuannya</span>
            </div>
            <p className="text-slate-300 leading-relaxed text-xs sm:text-sm">
              Website ini adalah <strong>Sistem Pengelolaan Nilai dan Transkrip Akademik</strong> yang dirancang dengan pendekatan <strong>Zero Trust Architecture (NIST SP 800-207)</strong>. Berbeda dengan sistem konvensional yang mempercayai request di dalam jaringan internal, sistem ini beroperasi dengan filosofi:
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1">
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
                <div className="font-bold text-indigo-300 text-xs mb-1 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-indigo-400" /> Never Trust, Always Verify
                </div>
                <p className="text-xs text-slate-400">
                  Setiap request wajib diverifikasi token identitasnya, keabsahan perangkatnya (<code className="text-emerald-400">X-Device-ID</code>), serta waktu operasinya secara terus-menerus.
                </p>
              </div>

              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
                <div className="font-bold text-indigo-300 text-xs mb-1 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-indigo-400" /> Least Privilege
                </div>
                <p className="text-xs text-slate-400">
                  Setiap role (Dosen, Mahasiswa, Admin) hanya diberikan izin terkecil yang dibutuhkan. Dosen hanya melihat kelas sendiri, dan mahasiswa hanya melihat transkrip miliknya.
                </p>
              </div>

              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
                <div className="font-bold text-indigo-300 text-xs mb-1 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-indigo-400" /> Assume Breach & Service Isolation
                </div>
                <p className="text-xs text-slate-400">
                  Layanan backend terisolasi di belakang API Gateway. Akses antar-service (sinkronisasi transkrip) wajib memakai token khusus dengan role service dan rahasia gateway.
                </p>
              </div>
            </div>
          </section>

          {/* Bagian 2: Apa Saja yang Bisa Dilakukan di Dalam Website */}
          <section className="space-y-3 pt-2">
            <div className="flex items-center gap-2 text-indigo-400 font-bold text-sm tracking-wide uppercase">
              <Users className="w-4 h-4" />
              <span>Fitur & Aktivitas Berdasarkan Hak Akses (Role)</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Dosen */}
              <div className="bg-slate-950/80 p-4 rounded-xl border border-slate-800 space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-blue-950 text-blue-300 border border-blue-800 font-mono">
                    Dosen
                  </span>
                  <span className="font-bold text-slate-200 text-xs">Pengelolaan Nilai</span>
                </div>
                <ul className="text-xs text-slate-400 space-y-1.5 list-disc list-inside">
                  <li>Melihat daftar kelas dan mata kuliah yang diampunya saja.</li>
                  <li>Mengisi dan mengubah nilai komponen (Tugas, UTS, UAS).</li>
                  <li>Pengubahan nilai dibatasi hanya pada jam kerja operasional (07.00 - 21.00).</li>
                  <li>Memfinalisasi kelas agar nilai terkunci dan otomatis disinkronkan ke Service Transkrip via Gateway.</li>
                </ul>
              </div>

              {/* Mahasiswa */}
              <div className="bg-slate-950/80 p-4 rounded-xl border border-slate-800 space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800 font-mono">
                    Mahasiswa
                  </span>
                  <span className="font-bold text-slate-200 text-xs">Pengecekan Nilai</span>
                </div>
                <ul className="text-xs text-slate-400 space-y-1.5 list-disc list-inside">
                  <li>Melihat perolehan nilai kelas berjalan yang diikutinya.</li>
                  <li>Melihat dokumen transkrip resmi beserta perhitungan SKS dan IPK.</li>
                  <li>Kebijakan ketat: tidak diizinkan membuka atau memodifikasi data milik mahasiswa lain.</li>
                </ul>
              </div>

              {/* Admin */}
              <div className="bg-slate-950/80 p-4 rounded-xl border border-slate-800 space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-purple-950 text-purple-300 border border-purple-800 font-mono">
                    Admin
                  </span>
                  <span className="font-bold text-slate-200 text-xs">Audit & Monitoring</span>
                </div>
                <ul className="text-xs text-slate-400 space-y-1.5 list-disc list-inside">
                  <li>Melihat transkrip akademik seluruh mahasiswa berdasarkan NIM.</li>
                  <li>Memonitor rekaman evaluasi akses (Audit Log) dari Policy Engine secara real-time.</li>
                  <li>Mengawasi riwayat keputusan <span className="text-emerald-400 font-mono font-bold">ALLOW</span> dan <span className="text-rose-400 font-mono font-bold">DENY</span>.</li>
                </ul>
              </div>
            </div>
          </section>

          {/* Bagian 3: Simulasi Zero Trust Terintegrasi */}
          <section className="bg-gradient-to-r from-slate-950 to-indigo-950/30 p-4 rounded-xl border border-indigo-900/50 space-y-2.5">
            <div className="flex items-center gap-2 text-indigo-300 font-bold text-xs uppercase tracking-wider">
              <Laptop className="w-4 h-4 text-emerald-400" />
              <span>Simulasi Kontrol Keamanan (Control Bar di Bagian Atas)</span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Anda dapat langsung menguji ketahanan mekanisme keamanan Zero Trust melalui panel atas:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="bg-slate-900/80 p-3 rounded-lg border border-slate-800">
                <span className="font-semibold text-slate-200 block mb-1">Simulasi Perangkat (Header X-Device-ID):</span>
                Pilih perangkat terdaftar atau perangkat ilegal (misal: <code>DEV-HACKER-UNREGISTERED</code>) untuk melihat Gateway PEP menolak akses dengan status <strong>403 Forbidden</strong>.
              </div>
              <div className="bg-slate-900/80 p-3 rounded-lg border border-slate-800">
                <span className="font-semibold text-slate-200 block mb-1">Simulasi Jam Operasional:</span>
                Ganti jam menjadi di luar jam kerja (misal: pukul 23.00 atau 03.00). Gateway PEP akan menolak aksi pengubahan nilai atau finalisasi oleh Dosen secara otomatis.
              </div>
            </div>
          </section>
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/80 flex items-center justify-between text-xs text-slate-400">
          <span>Arsitektur NIST SP 800-207: Gateway PEP, Policy Engine & Supabase</span>
          <button
            onClick={onClose}
            className="bg-indigo-600 hover:bg-indigo-500 text-white font-medium px-4 py-2 rounded-lg transition"
          >
            Mengerti & Tutup
          </button>
        </div>
      </div>
    </div>
  );
}
