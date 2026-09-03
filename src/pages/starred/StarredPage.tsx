import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Star, StarOff, Download, MoreVertical } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { FileIcon } from '@/components/common/FileIcon';
import { EmptyState } from '@/components/common/EmptyState';
import { FileGridSkeleton } from '@/components/common/Skeletons';
import { ItemMenu } from '@/components/files/ItemMenu';
import { getStarredFiles, getDownloadUrl, trashFile, toggleFileStar } from '@/services/fileService';
import { getStarredFolders, trashFolder, toggleFolderStar } from '@/services/folderService';
import { useToast } from '@/contexts/ToastContext';
import { useNavigate } from 'react-router-dom';
import { formatBytes, formatDate } from '@/utils/format';
import type { FileItem, Folder } from '@/types';

export function StarredPage() {
  const { success, error: showError } = useToast();
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const { data: starredFiles = [], isLoading: filesLoading } = useQuery({
    queryKey: ['starred-files'],
    queryFn: getStarredFiles,
  });

  const { data: starredFolders = [], isLoading: foldersLoading } = useQuery({
    queryKey: ['starred-folders'],
    queryFn: getStarredFolders,
  });

  const loading = filesLoading || foldersLoading;

  const handleDownload = async (file: FileItem) => {
    try {
      const url = await getDownloadUrl(file.storage_path);
      const a = document.createElement('a');
      a.href = url;
      a.download = file.name;
      a.click();
    } catch {
      showError('Failed to download file');
    }
  };

  const handleUnstar = async (item: FileItem | Folder, isFolder: boolean) => {
    try {
      if (isFolder) {
        await toggleFolderStar(item.id, false);
        queryClient.invalidateQueries({ queryKey: ['starred-folders'] });
        queryClient.invalidateQueries({ queryKey: ['folders'] });
      } else {
        await toggleFileStar(item.id, false);
        queryClient.invalidateQueries({ queryKey: ['starred-files'] });
        queryClient.invalidateQueries({ queryKey: ['files'] });
      }
      success('Removed from starred');
    } catch {
      showError('Failed to remove star');
    }
  };

  const handleTrash = async (item: FileItem | Folder, isFolder: boolean) => {
    try {
      if (isFolder) {
        await trashFolder(item.id);
        queryClient.invalidateQueries({ queryKey: ['starred-folders'] });
      } else {
        await trashFile(item.id);
        queryClient.invalidateQueries({ queryKey: ['starred-files'] });
      }
      queryClient.invalidateQueries({ queryKey: ['trash'] });
      success('Moved to trash');
    } catch {
      showError('Failed to move to trash');
    }
  };

  return (
    <AppLayout currentFolderId={null}>
      <div className="mb-6">
        <h1 className="text-xl font-bold text-slate-900">Starred</h1>
        <p className="mt-1 text-sm text-slate-500">Files and folders you've marked as important</p>
      </div>

      {loading ? (
        <FileGridSkeleton />
      ) : starredFolders.length === 0 && starredFiles.length === 0 ? (
        <EmptyState
          icon={<Star className="h-8 w-8" />}
          title="No starred items"
          description="Mark files and folders with a star to quickly find them here."
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
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
          {starredFolders.map((folder) => (
            <div
              key={folder.id}
              onClick={() => navigate(`/drive/folder/${folder.id}`)}
              className="group relative cursor-pointer rounded-xl border border-slate-100 bg-white p-4 transition-all hover:border-slate-200 hover:shadow-md"
            >
              <Star className="absolute right-3 top-3 h-4 w-4 fill-amber-400 text-amber-400" />
              <FileIcon isFolder size="md" />
              <p className="mt-3 truncate text-sm font-medium text-slate-900">{folder.name}</p>
              <p className="mt-0.5 text-xs text-slate-400">{formatDate(folder.updated_at)}</p>
              <div className="absolute bottom-2 right-2 opacity-0 transition-opacity group-hover:opacity-100" onClick={(e) => e.stopPropagation()}>
                <ItemMenu
                  item={folder}
                  isFolder
                  onDownload={() => {}}
                  onRename={() => {}}
                  onMove={() => {}}
                  onShare={() => {}}
                  onToggleStar={() => handleUnstar(folder, true)}
                  onTrash={() => handleTrash(folder, true)}
                  onShowDetails={() => {}}
                />
              </div>
            </div>
          ))}
          {starredFiles.map((file) => (
            <div
              key={file.id}
              className="group relative cursor-pointer rounded-xl border border-slate-100 bg-white p-4 transition-all hover:border-slate-200 hover:shadow-md"
            >
              <Star className="absolute right-3 top-3 h-4 w-4 fill-amber-400 text-amber-400" />
              <FileIcon file={file} size="md" />
              <p className="mt-3 truncate text-sm font-medium text-slate-900">{file.name}</p>
              <p className="mt-0.5 text-xs text-slate-400">{formatBytes(file.size_bytes)} · {formatDate(file.updated_at)}</p>
              <div className="absolute bottom-2 right-2 opacity-0 transition-opacity group-hover:opacity-100">
                <ItemMenu
                  item={file}
                  isFolder={false}
                  onDownload={() => handleDownload(file)}
                  onRename={() => {}}
                  onMove={() => {}}
                  onShare={() => {}}
                  onToggleStar={() => handleUnstar(file, false)}
                  onTrash={() => handleTrash(file, false)}
                  onShowDetails={() => {}}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </AppLayout>
  );
}
