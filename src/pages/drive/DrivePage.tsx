import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { ChevronRight, FolderPlus, LayoutGrid, List, Star, Home, MoreVertical } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { FileIcon } from '@/components/common/FileIcon';
import { EmptyState } from '@/components/common/EmptyState';
import { FileGridSkeleton, FileListSkeleton } from '@/components/common/Skeletons';
import { ItemMenu } from '@/components/files/ItemMenu';
import { DetailsPanel } from '@/components/files/DetailsPanel';
import { NewFolderModal } from '@/components/modals/NewFolderModal';
import { RenameModal } from '@/components/modals/RenameModal';
import { MoveModal } from '@/components/modals/MoveModal';
import { ShareModal } from '@/components/modals/ShareModal';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { PreviewModal } from '@/components/files/PreviewModal';
import { useToast } from '@/contexts/ToastContext';
import { getFolders, getAllFolders, trashFolder, toggleFolderStar } from '@/services/folderService';
import { getFiles, trashFile, toggleFileStar, getDownloadUrl } from '@/services/fileService';
import { buildFolderPath, formatBytes, formatDate, cn } from '@/utils/format';
import type { FileItem, Folder, ItemType } from '@/types';

export function DrivePage() {
  const { folderId } = useParams<{ folderId?: string }>();
  const currentFolderId = folderId || null;
  const navigate = useNavigate();
  const { success, error: showError } = useToast();
  const queryClient = useQueryClient();

  const [viewMode, setViewMode] = useState<'grid' | 'list'>(() => {
    return (localStorage.getItem('viewMode') as 'grid' | 'list') || 'grid';
  });
  const [showNewFolder, setShowNewFolder] = useState(false);
  const [renameTarget, setRenameTarget] = useState<{ id: string; name: string; isFolder: boolean } | null>(null);
  const [moveTarget, setMoveTarget] = useState<{ id: string; isFolder: boolean; parentId: string | null } | null>(null);
  const [shareTarget, setShareTarget] = useState<{ id: string; name: string; type: ItemType } | null>(null);
  const [trashTarget, setTrashTarget] = useState<{ id: string; isFolder: boolean } | null>(null);
  const [detailsTarget, setDetailsTarget] = useState<{ item: FileItem | Folder; isFolder: boolean } | null>(null);
  const [previewId, setPreviewId] = useState<string | null>(null);

  const { data: allFolders = [], isLoading: foldersLoading } = useQuery({
    queryKey: ['folders'],
    queryFn: () => getFolders(currentFolderId),
  });

  const { data: allFoldersFlat = [] } = useQuery({
    queryKey: ['all-folders'],
    queryFn: getAllFolders,
  });

  const { data: files = [], isLoading: filesLoading } = useQuery({
    queryKey: ['files', currentFolderId],
    queryFn: () => getFiles(currentFolderId),
  });

  const breadcrumbs = buildFolderPath(currentFolderId, allFoldersFlat);
  const loading = foldersLoading || filesLoading;

  const toggleView = (mode: 'grid' | 'list') => {
    setViewMode(mode);
    localStorage.setItem('viewMode', mode);
  };

  const handleOpenFolder = (folder: Folder) => {
    navigate(`/drive/folder/${folder.id}`);
  };

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

  const handleToggleStar = async (item: FileItem | Folder, isFolder: boolean) => {
    try {
      if (isFolder) {
        await toggleFolderStar(item.id, !item.starred);
        queryClient.invalidateQueries({ queryKey: ['folders'] });
        queryClient.invalidateQueries({ queryKey: ['starred-folders'] });
      } else {
        await toggleFileStar(item.id, !item.starred);
        queryClient.invalidateQueries({ queryKey: ['files'] });
        queryClient.invalidateQueries({ queryKey: ['starred-files'] });
      }
      success(item.starred ? 'Removed from starred' : 'Added to starred');
    } catch {
      showError('Failed to update star');
    }
  };

  const handleTrash = async () => {
    if (!trashTarget) return;
    try {
      if (trashTarget.isFolder) {
        await trashFolder(trashTarget.id);
        queryClient.invalidateQueries({ queryKey: ['folders'] });
      } else {
        await trashFile(trashTarget.id);
        queryClient.invalidateQueries({ queryKey: ['files'] });
      }
      queryClient.invalidateQueries({ queryKey: ['trash'] });
      queryClient.invalidateQueries({ queryKey: ['storage'] });
      success('Moved to trash');
    } catch {
      showError('Failed to move to trash');
    } finally {
      setTrashTarget(null);
    }
  };

  return (
    <AppLayout currentFolderId={currentFolderId}>
      <div className="mb-6">
        <nav className="flex items-center gap-1.5 text-sm">
          {breadcrumbs.map((crumb, i) => (
            <div key={i} className="flex items-center gap-1.5">
              {i > 0 && <ChevronRight className="h-4 w-4 text-slate-300" />}
              <button
                onClick={() => navigate(crumb.id ? `/drive/folder/${crumb.id}` : '/drive')}
                className={cn(
                  'rounded-md px-2 py-1 font-medium transition-colors hover:bg-slate-100',
                  i === breadcrumbs.length - 1 ? 'text-slate-900' : 'text-slate-500'
                )}
              >
                {i === 0 && <Home className="mr-1 inline h-3.5 w-3.5" />}
                {crumb.name}
              </button>
            </div>
          ))}
        </nav>
      </div>

      <div className="mb-5 flex items-center justify-between">
        <h1 className="text-xl font-bold text-slate-900">
          {breadcrumbs.length > 1 ? breadcrumbs[breadcrumbs.length - 1].name : 'My Drive'}
        </h1>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowNewFolder(true)}
            className="flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
          >
            <FolderPlus className="h-4 w-4" />
            <span className="hidden sm:inline">New Folder</span>
          </button>
          <div className="flex items-center rounded-lg border border-slate-200 p-0.5">
            <button
              onClick={() => toggleView('grid')}
              className={cn('rounded-md p-1.5 transition-colors', viewMode === 'grid' ? 'bg-slate-100 text-slate-900' : 'text-slate-400 hover:text-slate-600')}
              aria-label="Grid view"
            >
              <LayoutGrid className="h-4 w-4" />
            </button>
            <button
              onClick={() => toggleView('list')}
              className={cn('rounded-md p-1.5 transition-colors', viewMode === 'list' ? 'bg-slate-100 text-slate-900' : 'text-slate-400 hover:text-slate-600')}
              aria-label="List view"
            >
              <List className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {loading ? (
        viewMode === 'grid' ? <FileGridSkeleton /> : <FileListSkeleton />
      ) : allFolders.length === 0 && files.length === 0 ? (
        <EmptyState
          icon={<FolderPlus className="h-8 w-8" />}
          title="My Drive is empty"
          description="Upload files or create folders to get started with your cloud storage."
          action={
            <button
              onClick={() => setShowNewFolder(true)}
              className="rounded-lg bg-sky-600 px-4 py-2 text-sm font-semibold text-white hover:bg-sky-700 transition-colors"
            >
              Create folder
            </button>
          }
        />
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
          {allFolders.map((folder) => (
            <FolderGridCard
              key={folder.id}
              folder={folder}
              onOpen={() => handleOpenFolder(folder)}
              onMenu={(fn) => fn(folder, true)}
              onToggleStar={() => handleToggleStar(folder, true)}
              onRename={() => setRenameTarget({ id: folder.id, name: folder.name, isFolder: true })}
              onMove={() => setMoveTarget({ id: folder.id, isFolder: true, parentId: folder.parent_id })}
              onShare={() => setShareTarget({ id: folder.id, name: folder.name, type: 'folder' })}
              onTrash={() => setTrashTarget({ id: folder.id, isFolder: true })}
              onDetails={() => setDetailsTarget({ item: folder, isFolder: true })}
            />
          ))}
          {files.map((file) => (
            <FileGridCard
              key={file.id}
              file={file}
              onMenu={(fn) => fn(file, false)}
              onPreview={() => setPreviewId(file.id)}
              onDownload={() => handleDownload(file)}
              onRename={() => setRenameTarget({ id: file.id, name: file.name, isFolder: false })}
              onMove={() => setMoveTarget({ id: file.id, isFolder: false, parentId: file.folder_id })}
              onShare={() => setShareTarget({ id: file.id, name: file.name, type: 'file' })}
              onToggleStar={() => handleToggleStar(file, false)}
              onTrash={() => setTrashTarget({ id: file.id, isFolder: false })}
              onDetails={() => setDetailsTarget({ item: file, isFolder: false })}
            />
          ))}
        </div>
      ) : (
        <ListView
          folders={allFolders}
          files={files}
          onOpenFolder={handleOpenFolder}
          onPreview={(f) => setPreviewId(f.id)}
          onDownload={handleDownload}
          onRename={(id, name, isFolder) => setRenameTarget({ id, name, isFolder })}
          onMove={(id, isFolder, parentId) => setMoveTarget({ id, isFolder, parentId })}
          onShare={(id, name, type) => setShareTarget({ id, name, type })}
          onToggleStar={handleToggleStar}
          onTrash={(id, isFolder) => setTrashTarget({ id, isFolder })}
          onDetails={(item, isFolder) => setDetailsTarget({ item, isFolder })}
        />
      )}

      <NewFolderModal open={showNewFolder} onClose={() => setShowNewFolder(false)} parentId={currentFolderId} />
      {renameTarget && (
        <RenameModal
          open={!!renameTarget}
          onClose={() => setRenameTarget(null)}
          itemId={renameTarget.id}
          currentName={renameTarget.name}
          isFolder={renameTarget.isFolder}
        />
      )}
      {moveTarget && (
        <MoveModal
          open={!!moveTarget}
          onClose={() => setMoveTarget(null)}
          itemId={moveTarget.id}
          isFolder={moveTarget.isFolder}
          currentParentId={moveTarget.parentId}
        />
      )}
      {shareTarget && (
        <ShareModal
          open={!!shareTarget}
          onClose={() => setShareTarget(null)}
          itemId={shareTarget.id}
          itemName={shareTarget.name}
          itemType={shareTarget.type}
        />
      )}
      <ConfirmDialog
        open={!!trashTarget}
        title="Move to trash?"
        message={`This item will be moved to trash. You can restore it later from the Trash page.`}
        confirmLabel="Move to trash"
        onConfirm={handleTrash}
        onCancel={() => setTrashTarget(null)}
      />
      {detailsTarget && (
        <div className="lg:pr-96">
          <DetailsPanel
            item={detailsTarget.item}
            isFolder={detailsTarget.isFolder}
            onClose={() => setDetailsTarget(null)}
            onDownload={!detailsTarget.isFolder ? () => handleDownload(detailsTarget.item as FileItem) : undefined}
          />
        </div>
      )}
      <PreviewModal open={!!previewId} onClose={() => setPreviewId(null)} fileId={previewId} />
    </AppLayout>
  );
}

function FolderGridCard({
  folder,
  onOpen,
  onMenu,
  onRename,
  onMove,
  onShare,
  onToggleStar,
  onTrash,
  onDetails,
}: {
  folder: Folder;
  onOpen: () => void;
  onMenu: (fn: (item: Folder, isFolder: boolean) => void) => void;
  onRename: () => void;
  onMove: () => void;
  onShare: () => void;
  onToggleStar: () => void;
  onTrash: () => void;
  onDetails: () => void;
}) {
  return (
    <div
      onClick={onOpen}
      className="group relative cursor-pointer rounded-xl border border-slate-100 bg-white p-4 transition-all hover:border-slate-200 hover:shadow-md"
    >
      {folder.starred && (
        <Star className="absolute right-3 top-3 h-4 w-4 fill-amber-400 text-amber-400" />
      )}
      <FileIcon isFolder size="md" />
      <p className="mt-3 truncate text-sm font-medium text-slate-900">{folder.name}</p>
      <p className="mt-0.5 text-xs text-slate-400">{formatDate(folder.updated_at)}</p>
      <div className="absolute bottom-2 right-2 opacity-0 transition-opacity group-hover:opacity-100" onClick={(e) => e.stopPropagation()}>
        <ItemMenu
          item={folder}
          isFolder
          onDownload={() => {}}
          onRename={onRename}
          onMove={onMove}
          onShare={onShare}
          onToggleStar={onToggleStar}
          onTrash={onTrash}
          onShowDetails={onDetails}
        />
      </div>
    </div>
  );
}

function FileGridCard({
  file,
  onMenu,
  onPreview,
  onDownload,
  onRename,
  onMove,
  onShare,
  onToggleStar,
  onTrash,
  onDetails,
}: {
  file: FileItem;
  onMenu: (fn: (item: FileItem, isFolder: boolean) => void) => void;
  onPreview: () => void;
  onDownload: () => void;
  onRename: () => void;
  onMove: () => void;
  onShare: () => void;
  onToggleStar: () => void;
  onTrash: () => void;
  onDetails: () => void;
}) {
  return (
    <div
      onClick={onPreview}
      className="group relative cursor-pointer rounded-xl border border-slate-100 bg-white p-4 transition-all hover:border-slate-200 hover:shadow-md"
    >
      {file.starred && (
        <Star className="absolute right-3 top-3 h-4 w-4 fill-amber-400 text-amber-400" />
      )}
      <FileIcon file={file} size="md" />
      <p className="mt-3 truncate text-sm font-medium text-slate-900">{file.name}</p>
      <p className="mt-0.5 text-xs text-slate-400">{formatBytes(file.size_bytes)} · {formatDate(file.updated_at)}</p>
      <div className="absolute bottom-2 right-2 opacity-0 transition-opacity group-hover:opacity-100" onClick={(e) => e.stopPropagation()}>
        <ItemMenu
          item={file}
          isFolder={false}
          onDownload={onDownload}
          onRename={onRename}
          onMove={onMove}
          onShare={onShare}
          onToggleStar={onToggleStar}
          onTrash={onTrash}
          onShowDetails={onDetails}
          onPreview={onPreview}
        />
      </div>
    </div>
  );
}

function ListView({
  folders,
  files,
  onOpenFolder,
  onPreview,
  onDownload,
  onRename,
  onMove,
  onShare,
  onToggleStar,
  onTrash,
  onDetails,
}: {
  folders: Folder[];
  files: FileItem[];
  onOpenFolder: (f: Folder) => void;
  onPreview: (f: FileItem) => void;
  onDownload: (f: FileItem) => void;
  onRename: (id: string, name: string, isFolder: boolean) => void;
  onMove: (id: string, isFolder: boolean, parentId: string | null) => void;
  onShare: (id: string, name: string, type: ItemType) => void;
  onToggleStar: (item: FileItem | Folder, isFolder: boolean) => void;
  onTrash: (id: string, isFolder: boolean) => void;
  onDetails: (item: FileItem | Folder, isFolder: boolean) => void;
}) {
  return (
    <div className="overflow-hidden rounded-xl border border-slate-100">
      <table className="w-full">
        <thead>
          <tr className="border-b border-slate-100 bg-slate-50 text-left text-xs font-semibold uppercase tracking-wider text-slate-400">
            <th className="px-4 py-3">Name</th>
            <th className="hidden px-4 py-3 md:table-cell">Modified</th>
            <th className="hidden px-4 py-3 sm:table-cell">Size</th>
            <th className="hidden px-4 py-3 lg:table-cell">Type</th>
            <th className="px-4 py-3 text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-50">
          {folders.map((folder) => (
            <tr
              key={folder.id}
              onClick={() => onOpenFolder(folder)}
              className="group cursor-pointer transition-colors hover:bg-slate-50"
            >
              <td className="px-4 py-3">
                <div className="flex items-center gap-3">
                  <FileIcon isFolder size="sm" />
                  <span className="truncate text-sm font-medium text-slate-900">{folder.name}</span>
                  {folder.starred && <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />}
                </div>
              </td>
              <td className="hidden px-4 py-3 text-sm text-slate-500 md:table-cell">{formatDate(folder.updated_at)}</td>
              <td className="hidden px-4 py-3 text-sm text-slate-500 sm:table-cell">—</td>
              <td className="hidden px-4 py-3 text-sm text-slate-500 lg:table-cell">Folder</td>
              <td className="px-4 py-3 text-right" onClick={(e) => e.stopPropagation()}>
                <ItemMenu
                  item={folder}
                  isFolder
                  onDownload={() => {}}
                  onRename={() => onRename(folder.id, folder.name, true)}
                  onMove={() => onMove(folder.id, true, folder.parent_id)}
                  onShare={() => onShare(folder.id, folder.name, 'folder')}
                  onToggleStar={() => onToggleStar(folder, true)}
                  onTrash={() => onTrash(folder.id, true)}
                  onShowDetails={() => onDetails(folder, true)}
                />
              </td>
            </tr>
          ))}
          {files.map((file) => (
            <tr
              key={file.id}
              onClick={() => onPreview(file)}
              className="group cursor-pointer transition-colors hover:bg-slate-50"
            >
              <td className="px-4 py-3">
                <div className="flex items-center gap-3">
                  <FileIcon file={file} size="sm" />
                  <span className="truncate text-sm font-medium text-slate-900">{file.name}</span>
                  {file.starred && <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />}
                </div>
              </td>
              <td className="hidden px-4 py-3 text-sm text-slate-500 md:table-cell">{formatDate(file.updated_at)}</td>
              <td className="hidden px-4 py-3 text-sm text-slate-500 sm:table-cell">{formatBytes(file.size_bytes)}</td>
              <td className="hidden px-4 py-3 text-sm text-slate-500 lg:table-cell">{file.mime_type.split('/')[1] || 'file'}</td>
              <td className="px-4 py-3 text-right" onClick={(e) => e.stopPropagation()}>
                <ItemMenu
                  item={file}
                  isFolder={false}
                  onDownload={() => onDownload(file)}
                  onRename={() => onRename(file.id, file.name, false)}
                  onMove={() => onMove(file.id, false, file.folder_id)}
                  onShare={() => onShare(file.id, file.name, 'file')}
                  onToggleStar={() => onToggleStar(file, false)}
                  onTrash={() => onTrash(file.id, false)}
                  onShowDetails={() => onDetails(file, false)}
                  onPreview={() => onPreview(file)}
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
