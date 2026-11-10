import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const linkCls = ({ isActive }: { isActive: boolean }) =>
  `rounded-lg px-3.5 py-2 text-sm font-medium transition ${
    isActive ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
  }`;

export default function Layout({ children }: { children: React.ReactNode }) {
  const { signOut, user } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await signOut();
    navigate('/masuk');
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50/40">
      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-center px-4 py-2.5">
          <nav className="flex items-center gap-1.5 overflow-x-auto py-0.5">
            <NavLink to="/" className={linkCls}>
              Belajar
            </NavLink>
            <NavLink to="/diary" className={linkCls}>
              Diary
            </NavLink>
            <NavLink to="/keuangan" className={linkCls}>
              Keuangan
            </NavLink>
            <NavLink to="/hasil" className={linkCls}>
              Hasil
            </NavLink>
            <NavLink to="/jejak" className={linkCls}>
              Jejak
            </NavLink>
          </nav>
        </div>
      </header>

      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-6">{children}</main>

      <footer className="mt-auto border-t border-slate-200 bg-white py-4">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-4">
          <div className="flex items-center gap-2 min-w-0">
            <span className="h-2 w-2 shrink-0 rounded-full bg-emerald-500" />
            <span className="truncate text-xs text-slate-500">{user?.email}</span>
          </div>
          <button
            onClick={handleLogout}
            className="shrink-0 rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 transition hover:bg-slate-100"
          >
            Keluar
          </button>
        </div>
      </footer>
    </div>
  );
}
