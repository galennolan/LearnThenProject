import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Loading } from './ui';

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return <Loading text="Memeriksa sesi..." />;
  if (!user) return <Navigate to="/masuk" replace />;
  return <>{children}</>;
}
