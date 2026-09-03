import { useState, useEffect } from 'react';
import { X, Download, FileWarning, Loader2 } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { getFileById, getDownloadUrl } from '@/services/fileService';
import { isImageFile, isPdfFile, formatBytes, formatDateTime } from '@/utils/format';
import { useToast } from '@/contexts/ToastContext';
import type { FileItem } from '@/types';

interface PreviewModalProps {
  open: boolean;
  onClose: () => void;
  fileId: string | null;
}

export function PreviewModal({ open, onClose, fileId }: PreviewModalProps) {
  const { error: showError } = useToast();
  const [signedUrl, setSignedUrl] = useState<string | null>(null);
  const [loadingUrl, setLoadingUrl] = useState(false);

  const { data: file, isLoading } = useQuery({
    queryKey: ['file', fileId],
    queryFn: () => getFileById(fileId!),
    enabled: open && !!fileId,
  });

  useEffect(() => {
    if (!open || !file) return;
    let cancelled = false;
    setLoadingUrl(true);
    getDownloadUrl(file.storage_path)
      .then((url) => {
        if (!cancelled) setSignedUrl(url);
      })
      .catch(() => {
        if (!cancelled) showError('Failed to load preview');
      })
      .finally(() => {
        if (!cancelled) setLoadingUrl(false);
      });
    return () => {
      cancelled = true;
      setSignedUrl(null);
    };
  }, [open, file, showError]);

  if (!open) return null;

  const canPreview = file && (isImageFile(file) || isPdfFile(file));

  const handleDownload = async () => {
    if (!file) return;
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-sm" onClick={onClose} />
      <div className="relative flex max-h-[90vh] w-full max-w-4xl flex-col rounded-xl bg-white shadow-2xl animate-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-3">
          <div className="min-w-0">
            <h2 className="truncate text-base font-semibold text-slate-900">{file?.name || 'Preview'}</h2>
            {file && (
              <p className="text-xs text-slate-400">
                {formatBytes(file.size_bytes)} · {formatDateTime(file.updated_at)}
              </p>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleDownload}
              disabled={!file}
              className="flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors disabled:opacity-50"
            >
              <Download className="h-4 w-4" />
              <span className="hidden sm:inline">Download</span>
            </button>
            <button
              onClick={onClose}
              className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
              aria-label="Close preview"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-auto rounded-b-xl bg-slate-50 p-4">
          {isLoading || loadingUrl ? (
            <div className="flex h-96 items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
            </div>
          ) : canPreview && signedUrl ? (
            isImageFile(file as FileItem) ? (
              <div className="flex items-center justify-center">
                <img src={signedUrl} alt={file!.name} className="max-h-[70vh] rounded-lg object-contain" />
              </div>
            ) : isPdfFile(file as FileItem) ? (
              <iframe src={signedUrl} title={file!.name} className="h-[70vh] w-full rounded-lg border-0" />
            ) : null
          ) : (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-slate-100 text-slate-400">
                <FileWarning className="h-8 w-8" />
              </div>
              <h3 className="text-lg font-semibold text-slate-700">Preview unavailable</h3>
              <p className="mt-1 max-w-sm text-sm text-slate-400">
                This file type can't be previewed in the browser. Download it to view its contents.
              </p>
              <button
                onClick={handleDownload}
                className="mt-5 flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 transition-colors"
              >
                <Download className="h-4 w-4" />
                Download file
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
