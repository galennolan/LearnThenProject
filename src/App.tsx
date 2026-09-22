import { Suspense, lazy } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './hooks/useToast';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import { Loading } from './components/ui';
import { LoginPage, RegisterPage } from './pages/Auth';

const BelajarPage = lazy(() => import('./pages/Belajar'));
const HasilPage = lazy(() => import('./pages/Hasil'));
const JejakPage = lazy(() => import('./pages/Jejak'));
const LearningDetailPage = lazy(() =>
  import('./pages/Learning').then((m) => ({ default: m.LearningDetailPage })),
);
const LearningFormPage = lazy(() =>
  import('./pages/Learning').then((m) => ({ default: m.LearningFormPage })),
);

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
          <Suspense fallback={<Loading text="Memuat halaman..." />}>
            <Routes>
              <Route path="/masuk" element={<LoginPage />} />
              <Route path="/daftar" element={<RegisterPage />} />
              <Route path="/" element={<Protected><BelajarPage /></Protected>} />
              <Route path="/materi/baru" element={<Protected><LearningFormPage /></Protected>} />
              <Route path="/materi/:id" element={<Protected><LearningDetailPage /></Protected>} />
              <Route path="/materi/:id/ubah" element={<Protected><LearningFormPage /></Protected>} />
              <Route path="/hasil" element={<Protected><HasilPage /></Protected>} />
              <Route path="/jejak" element={<Protected><JejakPage /></Protected>} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Suspense>
        </BrowserRouter>
      </ToastProvider>
    </AuthProvider>
  );
}
