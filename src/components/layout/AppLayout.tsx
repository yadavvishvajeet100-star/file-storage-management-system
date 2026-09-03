import { useState, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header } from './Header';
import { Sidebar } from './Sidebar';
import { UploadModal } from '@/components/upload/UploadModal';
import { useAuth } from '@/contexts/AuthContext';

interface AppLayoutProps {
  children: ReactNode;
  currentFolderId: string | null;
}

export function AppLayout({ children, currentFolderId }: AppLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();
  const { user } = useAuth();

  const handleSearchChange = (q: string) => {
    setSearchQuery(q);
    if (q.trim()) {
      navigate(`/search?q=${encodeURIComponent(q)}`);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="lg:pl-64">
        <Header
          onMenuClick={() => setSidebarOpen(true)}
          onUploadClick={() => setUploadOpen(true)}
          searchQuery={searchQuery}
          onSearchChange={handleSearchChange}
        />

        <main className="px-4 py-6 lg:px-8">
          {children}
        </main>
      </div>

      {user && (
        <UploadModal
          open={uploadOpen}
          onClose={() => setUploadOpen(false)}
          folderId={currentFolderId}
        />
      )}
    </div>
  );
}
