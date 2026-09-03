import { useState, useRef, useEffect } from 'react';
import { MoreVertical, Download, Pencil, FolderInput, Share2, Star, StarOff, Trash2, Info, Eye } from 'lucide-react';
import type { FileItem, Folder } from '@/types';

interface ItemMenuProps {
  item: FileItem | Folder;
  isFolder: boolean;
  onDownload: () => void;
  onRename: () => void;
  onMove: () => void;
  onShare: () => void;
  onToggleStar: () => void;
  onTrash: () => void;
  onShowDetails: () => void;
  onPreview?: () => void;
}

export function ItemMenu({
  item,
  isFolder,
  onDownload,
  onRename,
  onMove,
  onShare,
  onToggleStar,
  onTrash,
  onShowDetails,
  onPreview,
}: ItemMenuProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const starred = 'starred' in item ? item.starred : false;

  const handleAction = (action: () => void) => {
    setOpen(false);
    action();
  };

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={(e) => {
          e.stopPropagation();
          setOpen(!open);
        }}
        className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
        aria-label="More actions"
      >
        <MoreVertical className="h-4 w-4" />
      </button>

      {open && (
        <div
          className="absolute right-0 top-8 z-10 w-48 rounded-xl border border-slate-100 bg-white py-1.5 shadow-xl animate-in fade-in slide-in-from-top-2 duration-150"
          onClick={(e) => e.stopPropagation()}
        >
          {!isFolder && onPreview && (
            <MenuItem icon={Eye} label="Preview" onClick={() => handleAction(onPreview)} />
          )}
          {!isFolder && (
            <MenuItem icon={Download} label="Download" onClick={() => handleAction(onDownload)} />
          )}
          <MenuItem icon={Pencil} label="Rename" onClick={() => handleAction(onRename)} />
          <MenuItem icon={FolderInput} label="Move" onClick={() => handleAction(onMove)} />
          <MenuItem icon={Share2} label="Share" onClick={() => handleAction(onShare)} />
          <MenuItem
            icon={starred ? StarOff : Star}
            label={starred ? 'Remove star' : 'Add star'}
            onClick={() => handleAction(onToggleStar)}
          />
          <MenuItem icon={Info} label="Details" onClick={() => handleAction(onShowDetails)} />
          <div className="my-1 border-t border-slate-100" />
          <MenuItem icon={Trash2} label="Move to trash" danger onClick={() => handleAction(onTrash)} />
        </div>
      )}
    </div>
  );
}

function MenuItem({
  icon: Icon,
  label,
  onClick,
  danger,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  onClick: () => void;
  danger?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex w-full items-center gap-3 px-4 py-2 text-sm transition-colors ${
        danger ? 'text-red-600 hover:bg-red-50' : 'text-slate-700 hover:bg-slate-50'
      }`}
    >
      <Icon className="h-4 w-4" />
      {label}
    </button>
  );
}
