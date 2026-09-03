import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Search, Download } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { FileIcon } from '@/components/common/FileIcon';
import { EmptyState } from '@/components/common/EmptyState';
import { FileListSkeleton } from '@/components/common/Skeletons';
import { searchFiles, getDownloadUrl } from '@/services/fileService';
import { useToast } from '@/contexts/ToastContext';
import { formatBytes, formatDate } from '@/utils/format';

export function SearchPage() {
  const [searchParams] = useSearchParams();
  const query = searchParams.get('q') || '';
  const { error: showError } = useToast();
  const [debounced, setDebounced] = useState(query);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(query), 300);
    return () => clearTimeout(timer);
  }, [query]);

  const { data: results = [], isLoading } = useQuery({
    queryKey: ['search', debounced],
    queryFn: () => searchFiles(debounced),
    enabled: debounced.trim().length > 0,
  });

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
        <h1 className="text-xl font-bold text-slate-900">Search results</h1>
        <p className="mt-1 text-sm text-slate-500">
          {debounced ? `Showing results for "${debounced}"` : 'Type in the search bar above to find your files'}
        </p>
      </div>

      {!debounced.trim() ? (
        <EmptyState
          icon={<Search className="h-8 w-8" />}
          title="Start searching"
          description="Use the search bar at the top to find files across your entire drive."
        />
      ) : isLoading ? (
        <FileListSkeleton />
      ) : results.length === 0 ? (
        <EmptyState
          icon={<Search className="h-8 w-8" />}
          title="No search results"
          description={`No files found matching "${debounced}". Try a different search term.`}
        />
      ) : (
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
              {results.map((file) => (
                <tr key={file.id} className="group cursor-pointer transition-colors hover:bg-slate-50">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <FileIcon file={file} size="sm" />
                      <span className="truncate text-sm font-medium text-slate-900">{file.name}</span>
                    </div>
                  </td>
                  <td className="hidden px-4 py-3 text-sm text-slate-500 md:table-cell">{formatDate(file.updated_at)}</td>
                  <td className="hidden px-4 py-3 text-sm text-slate-500 sm:table-cell">{formatBytes(file.size_bytes)}</td>
                  <td className="hidden px-4 py-3 text-sm text-slate-500 lg:table-cell">{file.mime_type.split('/')[1] || 'file'}</td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => handleDownload(file.storage_path, file.name)}
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
          <div className="border-t border-slate-100 px-4 py-3 text-sm text-slate-500">
            {results.length} result{results.length !== 1 ? 's' : ''} found
          </div>
        </div>
      )}
    </AppLayout>
  );
}
