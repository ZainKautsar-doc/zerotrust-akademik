import React, { useState } from 'react';
import { useAuth } from './context/AuthContext';
import ZeroTrustBar from './components/ZeroTrustBar';
import LoginPage from './pages/LoginPage';
import DosenPage from './pages/DosenPage';
import MhsPage from './pages/MhsPage';
import AdminPage from './pages/AdminPage';
import AuditLogViewer from './components/AuditLogViewer';
import AboutModal from './components/AboutModal';
import { LogOut, Info } from 'lucide-react';

export default function App() {
  const { user, logoutUser } = useAuth();
  const [isAboutOpen, setIsAboutOpen] = useState(false);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {/* Zero Trust Status Bar di Bagian Paling Atas */}
      <ZeroTrustBar />

      {/* Main Navbar */}
      <header className="border-b border-slate-800 bg-slate-900/60 backdrop-blur-md px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center font-bold text-white shadow-md shadow-indigo-600/40">
            ZT
          </div>
          <div>
            <h1 className="font-extrabold text-sm tracking-wide text-white">SIAKAD ZERO TRUST</h1>
            <p className="text-[10px] text-slate-400 font-mono">Zero Trust Architecture (NIST SP 800-207)</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Tombol Tentang Sistem */}
          <button
            onClick={() => setIsAboutOpen(true)}
            className="flex items-center gap-1.5 text-xs bg-slate-800/90 hover:bg-slate-700 text-slate-200 border border-slate-700 px-3 py-1.5 rounded-lg transition"
            title="Penjelasan Sistem dan Arsitektur Keamanan"
          >
            <Info className="w-3.5 h-3.5 text-indigo-400" />
            Tentang Sistem
          </button>

          {user && (
            <div className="flex items-center gap-3 pl-2 border-l border-slate-800">
              <div className="text-right">
                <div className="text-xs font-bold text-slate-200">{user.fullName}</div>
                <div className="text-[10px] font-mono text-indigo-400 uppercase font-semibold">
                  Role: {user.role} ({user.username})
                </div>
              </div>
              <button
                onClick={logoutUser}
                className="flex items-center gap-1.5 text-xs bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 border border-rose-500/40 px-3 py-1.5 rounded-lg transition"
              >
                <LogOut className="w-3.5 h-3.5" />
                Logout
              </button>
            </div>
          )}
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-6">
        {!user ? (
          <LoginPage onOpenAbout={() => setIsAboutOpen(true)} />
        ) : (
          <div className="space-y-8">
            {user.role === 'dosen' && <DosenPage />}
            {user.role === 'mahasiswa' && <MhsPage />}
            {user.role === 'admin' && <AdminPage />}

            {/* Jika login sebagai Dosen atau Mahasiswa, tetap tampilkan ringkasan Audit Log di bawah untuk bukti demo */}
            {user.role !== 'admin' && (
              <div className="pt-6 border-t border-slate-800/80">
                <AuditLogViewer />
              </div>
            )}
          </div>
        )}
      </main>

      {/* Modal Penjelasan Sistem & Arsitektur Zero Trust */}
      <AboutModal isOpen={isAboutOpen} onClose={() => setIsAboutOpen(false)} />

      {/* Footer */}
      <footer className="border-t border-slate-900 py-4 text-center text-xs text-slate-600">
        Implementasi Arsitektur Keamanan Zero Trust (NIST SP 800-207) - Express Gateway PEP & Supabase Database
      </footer>
    </div>
  );
}
