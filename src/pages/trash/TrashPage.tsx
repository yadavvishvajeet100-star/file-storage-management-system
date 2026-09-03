import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Trash2, RotateCcw, XCircle, Loader2 } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { FileIcon } from '@/components/common/FileIcon';
import { EmptyState } from '@/components/common/EmptyState';
import { FileListSkeleton } from '@/components/common/Skeletons';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { useToast } from '@/contexts/ToastContext';
import { getTrashedFiles, restoreFile, deleteFilePermanently } from '@/services/fileService';
import { getTrashedFolders, restoreFolder, deleteFolder } from '@/services/folderService';
import { formatBytes, formatDate } from '@/utils/format';
import type { FileItem, Folder } from '@/types';

export function TrashPage() {
  const { success, error: showError } = useToast();
  const queryClient = useQueryClient();
  const [restoreTarget, setRestoreTarget] = useState<{ id: string; isFolder: boolean } | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; isFolder: boolean; storagePath?: string } | null>(null);
  const [emptyConfirm, setEmptyConfirm] = useState(false);
  const [emptyLoading, setEmptyLoading] = useState(false);

  const { data: trashedFiles = [], isLoading: filesLoading } = useQuery({
    queryKey: ['trash-files'],
    queryFn: getTrashedFiles,
  });

  const { data: trashedFolders = [], isLoading: foldersLoading } = useQuery({
    queryKey: ['trash-folders'],
    queryFn: getTrashedFolders,
  });

  const loading = filesLoading || foldersLoading;
  const hasItems = trashedFiles.length > 0 || trashedFolders.length > 0;

  const handleRestore = async () => {
    if (!restoreTarget) return;
    try {
      if (restoreTarget.isFolder) {
        await restoreFolder(restoreTarget.id);
        queryClient.invalidateQueries({ queryKey: ['trash-folders'] });
        queryClient.invalidateQueries({ queryKey: ['folders'] });
      } else {
        await restoreFile(restoreTarget.id);
        queryClient.invalidateQueries({ queryKey: ['trash-files'] });
        queryClient.invalidateQueries({ queryKey: ['files'] });
      }
      queryClient.invalidateQueries({ queryKey: ['storage'] });
      success('Restored successfully');
    } catch {
      showError('Failed to restore');
    } finally {
      setRestoreTarget(null);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      if (deleteTarget.isFolder) {
        await deleteFolder(deleteTarget.id);
        queryClient.invalidateQueries({ queryKey: ['trash-folders'] });
      } else {
        await deleteFilePermanently(deleteTarget.id, deleteTarget.storagePath!);
        queryClient.invalidateQueries({ queryKey: ['trash-files'] });
      }
      queryClient.invalidateQueries({ queryKey: ['storage'] });
      success('Permanently deleted');
    } catch {
      showError('Failed to delete permanently');
    } finally {
      setDeleteTarget(null);
    }
  };

  const handleEmptyTrash = async () => {
    setEmptyLoading(true);
    try {
      for (const file of trashedFiles) {
        await deleteFilePermanently(file.id, file.storage_path);
      }
      for (const folder of trashedFolders) {
        await deleteFolder(folder.id);
      }
      queryClient.invalidateQueries({ queryKey: ['trash-files'] });
      queryClient.invalidateQueries({ queryKey: ['trash-folders'] });
      queryClient.invalidateQueries({ queryKey: ['storage'] });
      success('Trash emptied');
    } catch {
      showError('Failed to empty trash');
    } finally {
      setEmptyLoading(false);
      setEmptyConfirm(false);
    }
  };

  return (
    <AppLayout currentFolderId={null}>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Trash</h1>
          <p className="mt-1 text-sm text-slate-500">Items will be permanently deleted after 30 days</p>
        </div>
        {hasItems && (
          <button
            onClick={() => setEmptyConfirm(true)}
            className="flex items-center gap-2 rounded-lg border border-red-200 px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
          >
            <Trash2 className="h-4 w-4" />
            <span className="hidden sm:inline">Empty Trash</span>
          </button>
        )}
      </div>

      {loading ? (
        <FileListSkeleton />
      ) : !hasItems ? (
        <EmptyState
          icon={<Trash2 className="h-8 w-8" />}
          title="Trash is empty"
          description="Items you delete will appear here. You can restore them or delete them permanently."
        />
      ) : (
        <div className="overflow-hidden rounded-xl border border-slate-100">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50 text-left text-xs font-semibold uppercase tracking-wider text-slate-400">
                <th className="px-4 py-3">Name</th>
                <th className="hidden px-4 py-3 md:table-cell">Deleted</th>
                <th className="hidden px-4 py-3 sm:table-cell">Size</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {trashedFolders.map((folder: Folder) => (
                <tr key={folder.id} className="transition-colors hover:bg-slate-50">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <FileIcon isFolder size="sm" />
                      <span className="truncate text-sm font-medium text-slate-700">{folder.name}</span>
                    </div>
                  </td>
                  <td className="hidden px-4 py-3 text-sm text-slate-500 md:table-cell">{formatDate(folder.trashed_at || folder.updated_at)}</td>
                  <td className="hidden px-4 py-3 text-sm text-slate-500 sm:table-cell">—</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => setRestoreTarget({ id: folder.id, isFolder: true })}
                        className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-100 transition-colors"
                      >
                        <RotateCcw className="h-3.5 w-3.5" />
                        Restore
                      </button>
                      <button
                        onClick={() => setDeleteTarget({ id: folder.id, isFolder: true })}
                        className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 transition-colors"
                      >
                        <XCircle className="h-3.5 w-3.5" />
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {trashedFiles.map((file: FileItem) => (
                <tr key={file.id} className="transition-colors hover:bg-slate-50">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <FileIcon file={file} size="sm" />
                      <span className="truncate text-sm font-medium text-slate-700">{file.name}</span>
                    </div>
                  </td>
                  <td className="hidden px-4 py-3 text-sm text-slate-500 md:table-cell">{formatDate(file.trashed_at || file.updated_at)}</td>
                  <td className="hidden px-4 py-3 text-sm text-slate-500 sm:table-cell">{formatBytes(file.size_bytes)}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => setRestoreTarget({ id: file.id, isFolder: false })}
                        className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-100 transition-colors"
                      >
                        <RotateCcw className="h-3.5 w-3.5" />
                        Restore
                      </button>
                      <button
                        onClick={() => setDeleteTarget({ id: file.id, isFolder: false, storagePath: file.storage_path })}
                        className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 transition-colors"
                      >
                        <XCircle className="h-3.5 w-3.5" />
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <ConfirmDialog
        open={!!restoreTarget}
        title="Restore item?"
        message="This item will be restored to its original location."
        confirmLabel="Restore"
        variant="warning"
        onConfirm={handleRestore}
        onCancel={() => setRestoreTarget(null)}
      />
      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete permanently?"
        message="This action cannot be undone. The item will be permanently deleted and cannot be recovered."
        confirmLabel="Delete forever"
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
      <ConfirmDialog
        open={emptyConfirm}
        title="Empty Trash?"
        message="This will permanently delete all items in Trash. This action cannot be undone."
        confirmLabel={emptyLoading ? 'Deleting...' : 'Empty Trash'}
        onConfirm={handleEmptyTrash}
        onCancel={() => !emptyLoading && setEmptyConfirm(false)}
        loading={emptyLoading}
      />
    </AppLayout>
  );
}
