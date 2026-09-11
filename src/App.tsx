import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './hooks/useToast';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import { LoginPage, RegisterPage } from './pages/Auth';
import BelajarPage from './pages/Belajar';
import HasilPage from './pages/Hasil';
import { LearningDetailPage, LearningFormPage } from './pages/Learning';

function Protected({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute>
      <Layout>{children}</Layout>
    </ProtectedRoute>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/masuk" element={<LoginPage />} />
            <Route path="/daftar" element={<RegisterPage />} />
            <Route path="/" element={<Protected><BelajarPage /></Protected>} />
            <Route path="/materi/baru" element={<Protected><LearningFormPage /></Protected>} />
            <Route path="/materi/:id" element={<Protected><LearningDetailPage /></Protected>} />
            <Route path="/materi/:id/ubah" element={<Protected><LearningFormPage /></Protected>} />
            <Route path="/hasil" element={<Protected><HasilPage /></Protected>} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </ToastProvider>
    </AuthProvider>
  );
}
