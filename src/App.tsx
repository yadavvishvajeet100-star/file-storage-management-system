import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from '@/contexts/AuthContext';
import { ToastProvider } from '@/contexts/ToastContext';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { LoginPage } from '@/pages/auth/LoginPage';
import { RegisterPage } from '@/pages/auth/RegisterPage';
import { DrivePage } from '@/pages/drive/DrivePage';
import { StarredPage } from '@/pages/starred/StarredPage';
import { RecentPage } from '@/pages/recent/RecentPage';
import { SharedPage } from '@/pages/shared/SharedPage';
import { SharedLinkPage } from '@/pages/shared/SharedLinkPage';
import { TrashPage } from '@/pages/trash/TrashPage';
import { ProfileSettingsPage } from '@/pages/settings/ProfileSettingsPage';
import { SecuritySettingsPage } from '@/pages/settings/SecuritySettingsPage';
import { HelpPage } from '@/pages/settings/HelpPage';
import { SearchPage } from '@/pages/search/SearchPage';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 30 * 1000,
    },
  },
});

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ToastProvider>
        <AuthProvider>
          <BrowserRouter>
            <Routes>
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route path="/shared-link/:token" element={<SharedLinkPage />} />

              <Route path="/drive" element={<ProtectedRoute><DrivePage /></ProtectedRoute>} />
              <Route path="/drive/folder/:folderId" element={<ProtectedRoute><DrivePage /></ProtectedRoute>} />
              <Route path="/starred" element={<ProtectedRoute><StarredPage /></ProtectedRoute>} />
              <Route path="/recent" element={<ProtectedRoute><RecentPage /></ProtectedRoute>} />
              <Route path="/shared" element={<ProtectedRoute><SharedPage /></ProtectedRoute>} />
              <Route path="/trash" element={<ProtectedRoute><TrashPage /></ProtectedRoute>} />
              <Route path="/search" element={<ProtectedRoute><SearchPage /></ProtectedRoute>} />
              <Route path="/settings/profile" element={<ProtectedRoute><ProfileSettingsPage /></ProtectedRoute>} />
              <Route path="/settings/security" element={<ProtectedRoute><SecuritySettingsPage /></ProtectedRoute>} />
              <Route path="/settings/help" element={<ProtectedRoute><HelpPage /></ProtectedRoute>} />

              <Route path="/" element={<Navigate to="/drive" replace />} />
              <Route path="*" element={<Navigate to="/drive" replace />} />
            </Routes>
          </BrowserRouter>
        </AuthProvider>
      </ToastProvider>
    </QueryClientProvider>
  );
}
