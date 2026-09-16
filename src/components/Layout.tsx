import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const linkCls = ({ isActive }: { isActive: boolean }) =>
  `rounded-lg px-3 py-2 text-sm font-medium ${isActive ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'}`;

export default function Layout({ children }: { children: React.ReactNode }) {
  const { signOut, user } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await signOut();
    navigate('/masuk');
  };

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-2 px-4 py-3">
          <Link to="/" className="text-base font-bold tracking-tight text-slate-900">
            OutputLab
          </Link>
          <nav className="flex items-center gap-1 overflow-x-auto">
            <NavLink to="/" className={linkCls}>
              Belajar
            </NavLink>
            <NavLink to="/hasil" className={linkCls}>
              Hasil
            </NavLink>
            <NavLink to="/jejak" className={linkCls}>
              Jejak
            </NavLink>
          </nav>
          <div className="flex items-center gap-2">
            <span className="hidden max-w-40 truncate text-xs text-slate-500 sm:block">{user?.email}</span>
            <button
              onClick={handleLogout}
              className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Keluar
            </button>
          </div>
        </div>
      </header>
      <main className="mx-auto w-full max-w-5xl px-4 py-6">{children}</main>
    </div>
  );
}
