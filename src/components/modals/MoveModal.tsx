import { useState } from 'react';
import { FolderClosed, ChevronRight, Loader2, HardDrive } from 'lucide-react';
import { Modal } from '@/components/common/Modal';
import { useToast } from '@/contexts/ToastContext';
import { useQueryClient, useQuery } from '@tanstack/react-query';
import { getAllFolders, moveFolder } from '@/services/folderService';
import { moveFile } from '@/services/fileService';
import { isDescendant, cn } from '@/utils/format';
import type { Folder } from '@/types';

interface MoveModalProps {
  open: boolean;
  onClose: () => void;
  itemId: string;
  isFolder: boolean;
  currentParentId: string | null;
}

export function MoveModal({ open, onClose, itemId, isFolder, currentParentId }: MoveModalProps) {
  const { success, error: showError } = useToast();
  const queryClient = useQueryClient();
  const [selected, setSelected] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const { data: allFolders = [] } = useQuery({
    queryKey: ['all-folders'],
    queryFn: getAllFolders,
  });

  const rootFolders = allFolders.filter((f) => f.parent_id === null);

  const handleMove = async () => {
    setLoading(true);
    try {
      if (isFolder) {
        await moveFolder(itemId, selected);
        queryClient.invalidateQueries({ queryKey: ['folders'] });
        queryClient.invalidateQueries({ queryKey: ['all-folders'] });
      } else {
        await moveFile(itemId, selected);
        queryClient.invalidateQueries({ queryKey: ['files'] });
      }
      success(`Moved successfully`);
      onClose();
    } catch (err) {
      showError(err instanceof Error ? err.message : 'Failed to move');
    } finally {
      setLoading(false);
    }
  };

  const isInvalidDestination = (folderId: string): boolean => {
    if (!isFolder) return false;
    if (folderId === itemId) return true;
    return isDescendant(folderId, itemId, allFolders);
  };

  const renderFolderTree = (folders: Folder[], depth: number = 0): React.ReactNode => {
    return folders.map((folder) => {
      const children = allFolders.filter((f) => f.parent_id === folder.id);
      const invalid = isInvalidDestination(folder.id);
      const isSelected = selected === folder.id;

      return (
        <div key={folder.id}>
          <button
            disabled={invalid}
            onClick={() => setSelected(folder.id)}
            className={cn(
              'flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors text-left',
              isSelected
                ? 'bg-sky-50 text-sky-700 font-medium'
                : invalid
                  ? 'cursor-not-allowed text-slate-300'
                  : 'text-slate-700 hover:bg-slate-50'
            )}
            style={{ paddingLeft: `${depth * 20 + 12}px` }}
          >
            <FolderClosed className={cn('h-4 w-4 shrink-0', isSelected ? 'text-sky-500' : 'text-slate-400')} />
            <span className="truncate">{folder.name}</span>
            {invalid && <span className="ml-auto text-xs text-slate-300">Cannot move here</span>}
          </button>
          {children.length > 0 && (
            <div>{renderFolderTree(children, depth + 1)}</div>
          )}
        </div>
      );
    });
  };

  return (
    <Modal open={open} onClose={onClose} title={`Move ${isFolder ? 'folder' : 'file'}`} maxWidth="max-w-md">
      <div className="mb-4 max-h-64 overflow-y-auto rounded-lg border border-slate-100">
        <button
          onClick={() => setSelected(null)}
          className={cn(
            'flex w-full items-center gap-2 rounded-t-lg px-3 py-2.5 text-sm transition-colors text-left',
            selected === null
              ? 'bg-sky-50 text-sky-700 font-medium'
              : 'text-slate-700 hover:bg-slate-50'
          )}
        >
          <HardDrive className={cn('h-4 w-4 shrink-0', selected === null ? 'text-sky-500' : 'text-slate-400')} />
          My Drive
        </button>
        {rootFolders.length > 0 && (
          <div className="border-t border-slate-100">
            {renderFolderTree(rootFolders)}
          </div>
        )}
      </div>

      <div className="flex justify-end gap-3">
        <button
          onClick={onClose}
          className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={handleMove}
          disabled={loading || selected === currentParentId}
          className="flex items-center gap-2 rounded-lg bg-sky-600 px-4 py-2 text-sm font-semibold text-white hover:bg-sky-700 transition-colors disabled:opacity-50"
        >
          {loading && <Loader2 className="h-4 w-4 animate-spin" />}
          Move here
        </button>
      </div>
    </Modal>
  );
}
