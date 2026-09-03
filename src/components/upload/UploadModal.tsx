import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { UploadCloud, X, CheckCircle2, XCircle, Loader2, File as FileIcon } from 'lucide-react';
import { Modal } from '@/components/common/Modal';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { useQueryClient } from '@tanstack/react-query';
import { uploadFile } from '@/services/fileService';
import { formatBytes, cn } from '@/utils/format';
import type { UploadTask, UploadStatus } from '@/types';

interface UploadModalProps {
  open: boolean;
  onClose: () => void;
  folderId: string | null;
}

export function UploadModal({ open, onClose, folderId }: UploadModalProps) {
  const { user } = useAuth();
  const { success, error: showError } = useToast();
  const queryClient = useQueryClient();
  const [tasks, setTasks] = useState<UploadTask[]>([]);
  const [isDragging, setIsDragging] = useState(false);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const newTasks: UploadTask[] = acceptedFiles.map((file) => ({
      id: crypto.randomUUID(),
      file,
      progress: 0,
      status: 'waiting' as UploadStatus,
    }));
    setTasks((prev) => [...prev, ...newTasks]);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    onDragEnter: () => setIsDragging(true),
    onDragLeave: () => setIsDragging(false),
  });

  const updateTask = (id: string, updates: Partial<UploadTask>) => {
    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, ...updates } : t)));
  };

  const processUpload = async (task: UploadTask) => {
    if (!user) return;
    updateTask(task.id, { status: 'uploading', progress: 0 });

    try {
      const fileItem = await uploadFile(task.file, folderId, user.id, (progress) => {
        updateTask(task.id, { progress });
      });
      updateTask(task.id, { status: 'completed', progress: 100, fileId: fileItem.id });
    } catch (err) {
      updateTask(task.id, { status: 'failed', error: err instanceof Error ? err.message : 'Upload failed' });
    }
  };

  const handleUploadAll = async () => {
    const pending = tasks.filter((t) => t.status === 'waiting' || t.status === 'failed');
    for (const task of pending) {
      await processUpload(task);
    }

    const completed = tasks.filter((t) => t.status === 'completed').length;
    if (completed > 0) {
      success(`${completed} file${completed > 1 ? 's' : ''} uploaded successfully`);
      queryClient.invalidateQueries({ queryKey: ['files'] });
      queryClient.invalidateQueries({ queryKey: ['folders'] });
      queryClient.invalidateQueries({ queryKey: ['storage'] });
      queryClient.invalidateQueries({ queryKey: ['recent'] });
    }
    const failed = tasks.filter((t) => t.status === 'failed').length;
    if (failed > 0 && completed === 0) {
      showError('Upload failed. Please try again.');
    }
  };

  const removeTask = (id: string) => {
    setTasks((prev) => prev.filter((t) => t.id !== id));
  };

  const handleClose = () => {
    setTasks([]);
    onClose();
  };

  const allDone = tasks.length > 0 && tasks.every((t) => t.status === 'completed' || t.status === 'failed');
  const hasPending = tasks.some((t) => t.status === 'waiting' || t.status === 'failed');

  return (
    <Modal open={open} onClose={handleClose} title="Upload files" maxWidth="max-w-2xl">
      <div
        {...getRootProps()}
        className={cn(
          'flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed p-8 text-center transition-colors',
          isDragActive || isDragging ? 'border-sky-500 bg-sky-50' : 'border-slate-200 hover:border-slate-300'
        )}
      >
        <input {...getInputProps()} />
        <UploadCloud className={cn('h-10 w-10', isDragActive ? 'text-sky-500' : 'text-slate-400')} />
        <p className="mt-3 text-sm font-medium text-slate-700">
          {isDragActive ? 'Drop files here' : 'Drag and drop files, or click to browse'}
        </p>
        <p className="mt-1 text-xs text-slate-400">Upload any file type</p>
      </div>

      {tasks.length > 0 && (
        <div className="mt-4 max-h-64 space-y-2 overflow-y-auto">
          {tasks.map((task) => (
            <div key={task.id} className="flex items-center gap-3 rounded-lg border border-slate-100 bg-slate-50 px-3 py-2.5">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white">
                {task.status === 'completed' ? (
                  <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                ) : task.status === 'failed' ? (
                  <XCircle className="h-5 w-5 text-red-500" />
                ) : task.status === 'uploading' ? (
                  <Loader2 className="h-5 w-5 animate-spin text-sky-500" />
                ) : (
                  <FileIcon className="h-5 w-5 text-slate-400" />
                )}
              </div>

              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-slate-700">{task.file.name}</p>
                <p className="text-xs text-slate-400">{formatBytes(task.file.size)}</p>

                {task.status === 'uploading' && (
                  <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-slate-200">
                    <div
                      className="h-full rounded-full bg-sky-500 transition-all duration-300"
                      style={{ width: `${task.progress}%` }}
                    />
                  </div>
                )}
                {task.status === 'failed' && (
                  <p className="mt-0.5 text-xs text-red-500">{task.error}</p>
                )}
              </div>

              {task.status === 'waiting' && (
                <button
                  onClick={() => removeTask(task.id)}
                  className="rounded-lg p-1 text-slate-400 hover:bg-slate-200 transition-colors"
                  aria-label="Remove file"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      <div className="mt-6 flex justify-end gap-3">
        <button
          onClick={handleClose}
          className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
        >
          {allDone ? 'Done' : 'Cancel'}
        </button>
        {hasPending && (
          <button
            onClick={handleUploadAll}
            className="rounded-lg bg-sky-600 px-4 py-2 text-sm font-semibold text-white hover:bg-sky-700 transition-colors"
          >
            Upload {tasks.filter((t) => t.status === 'waiting' || t.status === 'failed').length} file{tasks.filter((t) => t.status === 'waiting' || t.status === 'failed').length > 1 ? 's' : ''}
          </button>
        )}
      </div>
    </Modal>
  );
}
