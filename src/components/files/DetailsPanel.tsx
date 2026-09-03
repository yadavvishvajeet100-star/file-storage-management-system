import { X, Download, Star, FolderClosed, User, Calendar, HardDrive, Activity as ActivityIcon } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { getActivities } from '@/services/activityService';
import { formatBytes, formatDateTime } from '@/utils/format';
import type { FileItem, Folder } from '@/types';

interface DetailsPanelProps {
  item: FileItem | Folder | null;
  isFolder: boolean;
  onClose: () => void;
  onDownload?: () => void;
}

export function DetailsPanel({ item, isFolder, onClose, onDownload }: DetailsPanelProps) {
  const { data: activities = [] } = useQuery({
    queryKey: ['activities', item?.id],
    queryFn: () => getActivities(item!.id),
    enabled: !!item,
  });

  if (!item) return null;

  const file = isFolder ? null : item as FileItem;
  const folder = isFolder ? item as Folder : null;

  return (
    <aside className="fixed right-0 top-0 z-30 flex h-full w-full max-w-sm flex-col border-l border-slate-100 bg-white shadow-2xl animate-in slide-in-from-right duration-300">
      <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
        <h2 className="font-semibold text-slate-900">Details</h2>
        <button
          onClick={onClose}
          className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
          aria-label="Close details"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="flex flex-col items-center border-b border-slate-100 px-5 py-8">
          <div className="mb-3 flex h-16 w-16 items-center justify-center rounded-xl bg-sky-50 text-sky-500">
            {isFolder ? <FolderClosed className="h-8 w-8" /> : <HardDrive className="h-8 w-8" />}
          </div>
          <h3 className="max-w-full truncate px-4 text-center font-semibold text-slate-900">{item.name}</h3>
          <p className="mt-1 text-xs text-slate-400">{isFolder ? 'Folder' : file?.mime_type}</p>
          {!isFolder && onDownload && (
            <button
              onClick={onDownload}
              className="mt-4 flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 transition-colors"
            >
              <Download className="h-4 w-4" />
              Download
            </button>
          )}
        </div>

        <div className="space-y-4 border-b border-slate-100 p-5">
          <DetailRow icon={User} label="Owner" value="You" />
          {!isFolder && file && <DetailRow icon={HardDrive} label="Size" value={formatBytes(file.size_bytes)} />}
          {folder && <DetailRow icon={FolderClosed} label="Location" value={folder.parent_id ? 'Nested folder' : 'My Drive'} />}
          <DetailRow icon={Calendar} label="Created" value={formatDateTime(item.created_at)} />
          <DetailRow icon={Calendar} label="Modified" value={formatDateTime(item.updated_at)} />
          {'starred' in item && item.starred && <DetailRow icon={Star} label="Starred" value="Yes" />}
        </div>

        {activities.length > 0 && (
          <div className="p-5">
            <div className="mb-3 flex items-center gap-2">
              <ActivityIcon className="h-4 w-4 text-slate-400" />
              <h3 className="text-sm font-semibold text-slate-800">Activity</h3>
            </div>
            <div className="space-y-3">
              {activities.map((activity) => (
                <div key={activity.id} className="flex items-start gap-3">
                  <div className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-sky-500" />
                  <div>
                    <p className="text-sm text-slate-700 capitalize">{activity.action}</p>
                    <p className="text-xs text-slate-400">{formatDateTime(activity.created_at)}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}

function DetailRow({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-3">
      <Icon className="h-4 w-4 shrink-0 text-slate-400" />
      <span className="w-20 shrink-0 text-xs text-slate-400">{label}</span>
      <span className="truncate text-sm text-slate-700">{value}</span>
    </div>
  );
}
