import React, { useState } from 'react';
import {
  X,
  Lock,
  Mail,
  Shield,
  UserCheck,
  ArrowRight,
  Boxes,
  CheckCircle2,
} from 'lucide-react';
import { useInventory } from '../context/InventoryContext';

export const LoginModal: React.FC = () => {
  const { isLoginModalOpen, setIsLoginModalOpen, login, setActiveView, theme } = useInventory();
  const [role, setRole] = useState<'admin' | 'warehouse_manager'>('admin');
  const [email, setEmail] = useState('admin@netsolusions.id');
  const [password, setPassword] = useState('admin123');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  if (!isLoginModalOpen) return null;

  // Seamlessly switch preset role credentials while keeping form editable
  const handleSelectRole = (newRole: 'admin' | 'warehouse_manager') => {
    setRole(newRole);
    if (newRole === 'admin') {
      setEmail('admin@netsolusions.id');
      setPassword('admin123');
    } else {
      setEmail('gudang@netsolusions.id');
      setPassword('gudang123');
    }
    setError(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email || !password) {
      setError('Harap isi alamat email dan kata sandi');
      return;
    }

    setIsLoading(true);
    setTimeout(() => {
      login(email, role);
      setIsLoading(false);
      setActiveView('admin');
      setIsLoginModalOpen(false);
    }, 350);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-sm animate-fadeIn"
      role="dialog"
      aria-modal="true"
      aria-labelledby="login-card-title"
    >
      {/* Compact, Consistent Card Login */}
      <div className="relative w-full max-w-[400px] bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl shadow-slate-950/60 overflow-hidden transition-colors">
        {/* Top Accent Strip */}
        <div className="h-1 w-full bg-gradient-to-r from-emerald-500 via-indigo-500 to-cyan-500" />

        {/* Close Button */}
        <button
          onClick={() => setIsLoginModalOpen(false)}
          className="absolute top-3.5 right-3.5 text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 transition cursor-pointer"
          aria-label="Tutup modal login"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="p-5 sm:p-6">
          {/* Header - Compact & Focused */}
          <div className="flex items-center gap-3 mb-5">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 via-teal-500 to-indigo-600 flex items-center justify-center shadow-md text-white shrink-0">
              <Boxes className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 id="login-card-title" className="text-base font-bold text-white tracking-tight">
                  Card Login NetSolusions
                </h3>
              </div>
              <p className="text-xs text-slate-400">
                Akses Dashboard Stok &amp; Rekomendasi TSB
              </p>
            </div>
          </div>

          {/* Consistent Role Selector Tabs (Auto-fills Demo Credentials) */}
          <div className="mb-4">
            <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5 flex items-center justify-between">
              <span>Pilih Akun Demo:</span>
              <span className="text-emerald-400 font-normal lowercase">1-klik terisi</span>
            </div>
            <div className="grid grid-cols-2 p-1 rounded-xl bg-slate-800/90 border border-slate-700/80 gap-1">
              <button
                type="button"
                onClick={() => handleSelectRole('admin')}
                className={`flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg text-xs font-semibold transition cursor-pointer ${
                  role === 'admin'
                    ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/40'
                    : 'text-slate-400 hover:text-white hover:bg-slate-700/40'
                }`}
              >
                <Shield className="w-3.5 h-3.5" />
                <span>Admin Utama</span>
              </button>

              <button
                type="button"
                onClick={() => handleSelectRole('warehouse_manager')}
                className={`flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg text-xs font-semibold transition cursor-pointer ${
                  role === 'warehouse_manager'
                    ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-600/40'
                    : 'text-slate-400 hover:text-white hover:bg-slate-700/40'
                }`}
              >
                <UserCheck className="w-3.5 h-3.5" />
                <span>Staff Gudang</span>
              </button>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-3">
            {error && (
              <div className="p-2.5 text-xs bg-rose-950/60 border border-rose-800/80 text-rose-300 rounded-lg">
                {error}
              </div>
            )}

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Email Pengguna
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@netsolusions.id"
                  className="w-full bg-slate-800/90 border border-slate-700 rounded-xl pl-9 pr-3 py-2 text-xs sm:text-sm text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition placeholder:text-slate-500"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Kata Sandi
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-slate-800/90 border border-slate-700 rounded-xl pl-9 pr-3 py-2 text-xs sm:text-sm text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition placeholder:text-slate-500"
                  required
                />
              </div>
            </div>

            {/* Action Button */}
            <button
              type="submit"
              disabled={isLoading}
              className={`w-full mt-1 py-2.5 px-4 rounded-xl font-semibold text-xs sm:text-sm text-white shadow-lg transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 ${
                role === 'admin'
                  ? 'bg-indigo-600 hover:bg-indigo-500 shadow-indigo-600/30'
                  : 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-600/30'
              }`}
            >
              {isLoading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <span>
                    Masuk sebagai {role === 'admin' ? 'Admin Utama' : 'Staff Gudang'}
                  </span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Compact Footer */}
          <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
            <span className="flex items-center gap-1 text-emerald-400 font-medium">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Sesi Aman &amp; Terenkripsi
            </span>
            <span className="text-slate-500">v2.4 TSB Engine</span>
          </div>
        </div>
      </div>
    </div>
  );
};
