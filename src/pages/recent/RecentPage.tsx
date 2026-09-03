import { useQuery } from '@tanstack/react-query';
import { Clock, Download } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { FileIcon } from '@/components/common/FileIcon';
import { EmptyState } from '@/components/common/EmptyState';
import { FileGridSkeleton } from '@/components/common/Skeletons';
import { getRecentFiles, getDownloadUrl } from '@/services/fileService';
import { getRecentFolders } from '@/services/folderService';
import { useToast } from '@/contexts/ToastContext';
import { useNavigate } from 'react-router-dom';
import { formatBytes, formatDate } from '@/utils/format';

export function RecentPage() {
  const { error: showError } = useToast();
  const navigate = useNavigate();

  const { data: recentFiles = [], isLoading: filesLoading } = useQuery({
    queryKey: ['recent-files'],
    queryFn: () => getRecentFiles(20),
  });

  const { data: recentFolders = [], isLoading: foldersLoading } = useQuery({
    queryKey: ['recent-folders'],
    queryFn: () => getRecentFolders(10),
  });

  const loading = filesLoading || foldersLoading;

  const handleDownload = async (storagePath: string, name: string) => {
    try {
      const url = await getDownloadUrl(storagePath);
      const a = document.createElement('a');
      a.href = url;
      a.download = name;
      a.click();
    } catch {
      showError('Failed to download file');
    }
  };

  return (
    <AppLayout currentFolderId={null}>
      <div className="mb-6">
        <h1 className="text-xl font-bold text-slate-900">Recent</h1>
        <p className="mt-1 text-sm text-slate-500">Files and folders you've recently accessed or modified</p>
      </div>

      {loading ? (
        <FileGridSkeleton />
      ) : recentFiles.length === 0 && recentFolders.length === 0 ? (
        <EmptyState
          icon={<Clock className="h-8 w-8" />}
          title="No recent activity"
          description="Files and folders you've recently worked with will appear here."
          action={
            <button
              onClick={() => navigate('/drive')}
              className="rounded-lg bg-sky-600 px-4 py-2 text-sm font-semibold text-white hover:bg-sky-700 transition-colors"
            >
              Go to My Drive
            </button>
          }
        />
      ) : (
        <div className="overflow-hidden rounded-xl border border-slate-100">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50 text-left text-xs font-semibold uppercase tracking-wider text-slate-400">
                <th className="px-4 py-3">Name</th>
                <th className="hidden px-4 py-3 md:table-cell">Modified</th>
                <th className="hidden px-4 py-3 sm:table-cell">Size</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {recentFolders.map((folder) => (
                <tr
                  key={folder.id}
                  onClick={() => navigate(`/drive/folder/${folder.id}`)}
                  className="group cursor-pointer transition-colors hover:bg-slate-50"
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <FileIcon isFolder size="sm" />
                      <span className="truncate text-sm font-medium text-slate-900">{folder.name}</span>
                    </div>
                  </td>
                  <td className="hidden px-4 py-3 text-sm text-slate-500 md:table-cell">{formatDate(folder.updated_at)}</td>
                  <td className="hidden px-4 py-3 text-sm text-slate-500 sm:table-cell">—</td>
                  <td className="px-4 py-3 text-right text-xs text-slate-400">Folder</td>
                </tr>
              ))}
              {recentFiles.map((file) => (
                <tr
                  key={file.id}
                  className="group cursor-pointer transition-colors hover:bg-slate-50"
                  onClick={() => handleDownload(file.storage_path, file.name)}
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <FileIcon file={file} size="sm" />
                      <span className="truncate text-sm font-medium text-slate-900">{file.name}</span>
                    </div>
                  </td>
                  <td className="hidden px-4 py-3 text-sm text-slate-500 md:table-cell">{formatDate(file.updated_at)}</td>
                  <td className="hidden px-4 py-3 text-sm text-slate-500 sm:table-cell">{formatBytes(file.size_bytes)}</td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={(e) => { e.stopPropagation(); handleDownload(file.storage_path, file.name); }}
                      className="rounded-lg p-1.5 text-slate-400 opacity-0 transition-opacity hover:bg-slate-100 hover:text-slate-600 group-hover:opacity-100"
                      aria-label="Download"
                    >
                      <Download className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </AppLayout>
  );
}
