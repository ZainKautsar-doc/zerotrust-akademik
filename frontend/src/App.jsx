import React, { useState } from 'react';
import { useAuth } from './context/AuthContext';
import ZeroTrustBar from './components/ZeroTrustBar';
import LoginPage from './pages/LoginPage';
import DosenPage from './pages/DosenPage';
import MhsPage from './pages/MhsPage';
import AdminPage from './pages/AdminPage';
import AboutPage from './pages/AboutPage';
import AuditLogViewer from './components/AuditLogViewer';
import { LogOut, Info, Shield, ArrowRight } from 'lucide-react';

export default function App() {
  const { user, logoutUser } = useAuth();
  const [currentPage, setCurrentPage] = useState('app'); // 'app' | 'about'

  return (
    <div className="min-h-screen bg-midnight-canvas bg-blueprint-grid text-frost-glow flex flex-col font-sans relative selection:bg-void-violet selection:text-white">
      {/* Top Conic Glow Spotlight Effect */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-4xl h-80 hero-spotlight pointer-events-none opacity-60"></div>

      {/* Zero Trust Status HUD di Bagian Paling Atas */}
      <ZeroTrustBar />

      {/* Main Navbar */}
      <header className="relative z-20 border-b border-glass-edge bg-midnight-canvas/80 backdrop-blur-xl px-6 py-3.5 flex items-center justify-between">
        <div 
          onClick={() => setCurrentPage('app')}
          className="flex items-center gap-3 cursor-pointer group"
          title="Ke Beranda"
        >
          <div className="w-9 h-9 rounded-full bg-steel-plate/60 border border-glass-edge flex items-center justify-center font-bold text-white shadow-sm transition-transform group-hover:scale-105">
            <Shield className="w-4 h-4 text-frost-glow" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-display font-medium text-sm tracking-wide text-pure-white group-hover:text-ice-highlight transition">
                SIAKAD ZERO TRUST
              </h1>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-steel-plate/40 text-moon-mist border border-glass-edge">
                NIST SP 800-207
              </span>
            </div>
            <p className="text-[11px] text-fog-veil font-mono">Academic Trust Boundary Enforcement</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Tombol Halaman Tentang Sistem */}
          <button
            onClick={() => setCurrentPage(currentPage === 'about' ? 'app' : 'about')}
            className={`flex items-center gap-2 text-xs px-4 py-2 rounded-full transition font-medium cursor-pointer ${
              currentPage === 'about'
                ? 'bg-frost-glow/15 text-pure-white border border-frost-glow/30'
                : 'btn-ghost-pill'
            }`}
            title="Penjelasan Lengkap Sistem dan Arsitektur Keamanan"
          >
            <Info className="w-3.5 h-3.5 text-frost-glow" />
            <span>{currentPage === 'about' ? 'Tutup & Kembali' : 'Tentang Sistem'}</span>
          </button>

          {user && (
            <div className="flex items-center gap-3 pl-3 border-l border-glass-edge">
              <div className="text-right hidden sm:block">
                <div className="text-xs font-medium text-pure-white">{user.fullName}</div>
                <div className="text-[10px] font-mono text-moon-mist uppercase">
                  {user.role} <span className="text-fog-veil">({user.username})</span>
                </div>
              </div>
              <button
                onClick={logoutUser}
                className="flex items-center gap-1.5 text-xs bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 px-3.5 py-1.5 rounded-full transition cursor-pointer"
                title="Keluar dari sesi"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Logout</span>
              </button>
            </div>
          )}
        </div>
      </header>

      {/* Main Content Area */}
      <main className="relative z-10 flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6">
        {currentPage === 'about' ? (
          <AboutPage onBack={() => setCurrentPage('app')} />
        ) : !user ? (
          <LoginPage onNavigateAbout={() => setCurrentPage('about')} />
        ) : (
          <div className="space-y-8">
            {user.role === 'dosen' && <DosenPage />}
            {user.role === 'mahasiswa' && <MhsPage />}
            {user.role === 'admin' && <AdminPage />}

            {/* Jika login sebagai Dosen atau Mahasiswa, tampilkan ringkasan Audit Log di bawah */}
            {user.role !== 'admin' && (
              <div className="pt-6 border-t border-glass-edge">
                <AuditLogViewer />
              </div>
            )}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="relative z-10 border-t border-glass-edge py-6 text-center text-xs text-fog-veil bg-midnight-canvas/60 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>SIAKAD Zero Trust Architecture — Express Gateway PEP & Supabase Database</span>
          <span className="font-mono text-[11px] text-moon-mist">Compliance: NIST SP 800-207</span>
        </div>
      </footer>
    </div>
  );
}
