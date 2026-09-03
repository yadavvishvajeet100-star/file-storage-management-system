import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Cloud, Download, FileWarning, Lock, Loader2, Link2Off, Clock, CheckCircle2 } from 'lucide-react';
import { supabase, STORAGE_BUCKET } from '@/lib/supabase';
import { getPublicLinkByToken } from '@/services/publicLinkService';
import { getFileById } from '@/services/fileService';
import { formatBytes, formatDate } from '@/utils/format';
import { FileIcon } from '@/components/common/FileIcon';
import type { PublicLink, FileItem } from '@/types';

type LinkState = 'loading' | 'valid' | 'expired' | 'disabled' | 'invalid' | 'not-found';

export function SharedLinkPage() {
  const { token } = useParams<{ token: string }>();
  const [link, setLink] = useState<PublicLink | null>(null);
  const [file, setFile] = useState<FileItem | null>(null);
  const [state, setState] = useState<LinkState>('loading');
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    if (!token) {
      setState('invalid');
      return;
    }

    getPublicLinkByToken(token)
      .then((data) => {
        if (!data) {
          setState('not-found');
          return;
        }
        if (data.disabled) {
          setState('disabled');
          return;
        }
        if (data.expires_at && new Date(data.expires_at) < new Date()) {
          setState('expired');
          return;
        }
        setLink(data);

        if (data.item_type === 'file') {
          getFileById(data.item_id)
            .then((f) => {
              if (!f) {
                setState('not-found');
                return;
              }
              setFile(f);
              setState('valid');
            })
            .catch(() => setState('not-found'));
        } else {
          setState('valid');
        }
      })
      .catch(() => setState('invalid'));
  }, [token]);

  const handleDownload = async () => {
    if (!file) return;
    setDownloading(true);
    try {
      const { data, error } = await supabase.storage
        .from(STORAGE_BUCKET)
        .createSignedUrl(file.storage_path, 3600);

      if (error) throw error;
      const a = document.createElement('a');
      a.href = data.signedUrl;
      a.download = file.name;
      a.click();
    } catch {
      setState('invalid');
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 via-white to-sky-50 px-4">
      <div className="w-full max-w-lg">
        <div className="mb-6 text-center">
          <div className="inline-flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-sky-500 to-blue-600 shadow-lg shadow-sky-500/30">
              <Cloud className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-bold text-slate-900">CloudVault</span>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-100 bg-white p-8 shadow-xl shadow-slate-200/50">
          {state === 'loading' && (
            <div className="flex flex-col items-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
              <p className="mt-3 text-sm text-slate-500">Loading shared link...</p>
            </div>
          )}

          {state === 'not-found' && (
            <ErrorState
              icon={<FileWarning className="h-8 w-8" />}
              title="File not found"
              message="The file you're looking for no longer exists or has been deleted."
            />
          )}

          {state === 'invalid' && (
            <ErrorState
              icon={<Link2Off className="h-8 w-8" />}
              title="Invalid link"
              message="This shared link is invalid or has been corrupted."
            />
          )}

          {state === 'disabled' && (
            <ErrorState
              icon={<Link2Off className="h-8 w-8" />}
              title="Link disabled"
              message="The owner has disabled this shared link. Contact them for access."
            />
          )}

          {state === 'expired' && (
            <ErrorState
              icon={<Clock className="h-8 w-8" />}
              title="Link expired"
              message="This shared link has expired. Contact the owner for a new link."
            />
          )}

          {state === 'valid' && file && (
            <div>
              <div className="mb-4 flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                <span className="text-sm font-medium text-emerald-700">Shared link is active</span>
              </div>

              <div className="flex flex-col items-center border-b border-slate-100 pb-6">
                <FileIcon file={file} size="lg" />
                <h2 className="mt-4 text-lg font-semibold text-slate-900">{file.name}</h2>
                <div className="mt-2 flex items-center gap-3 text-xs text-slate-400">
                  <span>{formatBytes(file.size_bytes)}</span>
                  <span>·</span>
                  <span>{file.mime_type}</span>
                  <span>·</span>
                  <span>Modified {formatDate(file.updated_at)}</span>
                </div>
              </div>

              {link?.permission === 'viewer' && (
                <div className="mt-4 flex items-center gap-2 rounded-lg bg-slate-50 px-3 py-2">
                  <Lock className="h-4 w-4 text-slate-400" />
                  <span className="text-xs text-slate-500">View only — you can view and download this file</span>
                </div>
              )}

              <button
                onClick={handleDownload}
                disabled={downloading}
                className="mt-6 flex w-full items-center justify-center gap-2 rounded-lg bg-slate-900 py-3 text-sm font-semibold text-white hover:bg-slate-800 transition-colors disabled:opacity-50"
              >
                {downloading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                {downloading ? 'Preparing download...' : 'Download file'}
              </button>
            </div>
          )}

          {state === 'valid' && !file && link?.item_type === 'folder' && (
            <ErrorState
              icon={<FileWarning className="h-8 w-8" />}
              title="Shared folder"
              message="This is a shared folder link. Folder sharing is supported but the viewer requires an account to access nested contents."
            />
          )}
        </div>
      </div>
    </div>
  );
}

function ErrorState({ icon, title, message }: { icon: React.ReactNode; title: string; message: string }) {
  return (
    <div className="flex flex-col items-center py-8 text-center">
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-slate-100 text-slate-400">
        {icon}
      </div>
      <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
      <p className="mt-1.5 max-w-sm text-sm text-slate-500">{message}</p>
    </div>
  );
}
