import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './hooks/useToast';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import { LoginPage, RegisterPage } from './pages/Auth';
import DashboardPage from './pages/Dashboard';
import { LearningDetailPage, LearningFormPage, LearningListPage } from './pages/Learning';
import { ProjectDetailPage, ProjectFormPage, ProjectListPage } from './pages/Projects';
import PortfolioPage from './pages/Portfolio';

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
            <Route path="/" element={<Protected><DashboardPage /></Protected>} />
            <Route path="/materi" element={<Protected><LearningListPage /></Protected>} />
            <Route path="/materi/baru" element={<Protected><LearningFormPage /></Protected>} />
            <Route path="/materi/:id" element={<Protected><LearningDetailPage /></Protected>} />
            <Route path="/materi/:id/ubah" element={<Protected><LearningFormPage /></Protected>} />
            <Route path="/project" element={<Protected><ProjectListPage /></Protected>} />
            <Route path="/project/baru" element={<Protected><ProjectFormPage /></Protected>} />
            <Route path="/project/:id" element={<Protected><ProjectDetailPage /></Protected>} />
            <Route path="/project/:id/ubah" element={<Protected><ProjectFormPage /></Protected>} />
            <Route path="/portofolio" element={<Protected><PortfolioPage /></Protected>} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </ToastProvider>
    </AuthProvider>
  );
}
