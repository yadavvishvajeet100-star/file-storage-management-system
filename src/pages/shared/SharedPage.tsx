import { useQuery } from '@tanstack/react-query';
import { Share2, Mail } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { FileIcon } from '@/components/common/FileIcon';
import { EmptyState } from '@/components/common/EmptyState';
import { FileListSkeleton } from '@/components/common/Skeletons';
import { getSharedWithMe } from '@/services/shareService';
import { formatDate } from '@/utils/format';
import { useNavigate } from 'react-router-dom';

export function SharedPage() {
  const navigate = useNavigate();

  const { data: shares = [], isLoading } = useQuery({
    queryKey: ['shared-with-me'],
    queryFn: getSharedWithMe,
  });

  return (
    <AppLayout currentFolderId={null}>
      <div className="mb-6">
        <h1 className="text-xl font-bold text-slate-900">Shared with me</h1>
        <p className="mt-1 text-sm text-slate-500">Files and folders others have shared with you</p>
      </div>

      {isLoading ? (
        <FileListSkeleton />
      ) : shares.length === 0 ? (
        <EmptyState
          icon={<Share2 className="h-8 w-8" />}
          title="No shared files"
          description="Files and folders that others share with you will appear here."
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
                <th className="hidden px-4 py-3 md:table-cell">Shared by</th>
                <th className="px-4 py-3">Permission</th>
                <th className="hidden px-4 py-3 sm:table-cell">Shared date</th>
                <th className="px-4 py-3 text-right">Type</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {shares.map((share) => (
                <tr
                  key={share.id}
                  className="group cursor-pointer transition-colors hover:bg-slate-50"
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <FileIcon isFolder={share.item_type === 'folder'} size="sm" />
                      <span className="truncate text-sm font-medium text-slate-900">
                        {share.item_type === 'folder' ? 'Shared folder' : 'Shared file'}
                      </span>
                    </div>
                  </td>
                  <td className="hidden px-4 py-3 text-sm text-slate-500 md:table-cell">
                    <div className="flex items-center gap-2">
                      <Mail className="h-3.5 w-3.5 text-slate-400" />
                      {share.shared_with_email}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${
                      share.permission === 'editor'
                        ? 'bg-emerald-50 text-emerald-700'
                        : 'bg-slate-100 text-slate-600'
                    }`}>
                      {share.permission === 'editor' ? 'Editor' : 'Viewer'}
                    </span>
                  </td>
                  <td className="hidden px-4 py-3 text-sm text-slate-500 sm:table-cell">{formatDate(share.created_at)}</td>
                  <td className="px-4 py-3 text-right text-xs text-slate-400 capitalize">{share.item_type}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </AppLayout>
  );
}
