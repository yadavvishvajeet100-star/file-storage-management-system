import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2 } from 'lucide-react';
import { Modal } from '@/components/common/Modal';
import { useToast } from '@/contexts/ToastContext';
import { useQueryClient } from '@tanstack/react-query';
import { renameFile } from '@/services/fileService';
import { renameFolder } from '@/services/folderService';

const schema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name is too long'),
});

type FormData = z.infer<typeof schema>;

interface RenameModalProps {
  open: boolean;
  onClose: () => void;
  itemId: string;
  currentName: string;
  isFolder: boolean;
}

export function RenameModal({ open, onClose, itemId, currentName, isFolder }: RenameModalProps) {
  const { success, error: showError } = useToast();
  const queryClient = useQueryClient();
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  useEffect(() => {
    if (open) reset({ name: currentName });
  }, [open, currentName, reset]);

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    try {
      if (isFolder) {
        await renameFolder(itemId, data.name.trim());
        queryClient.invalidateQueries({ queryKey: ['folders'] });
      } else {
        await renameFile(itemId, data.name.trim());
        queryClient.invalidateQueries({ queryKey: ['files'] });
      }
      success(`${isFolder ? 'Folder' : 'File'} renamed successfully`);
      onClose();
    } catch (err) {
      showError(err instanceof Error ? err.message : 'Failed to rename');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title={`Rename ${isFolder ? 'folder' : 'file'}`} maxWidth="max-w-sm">
      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="mb-4">
          <label className="mb-1.5 block text-sm font-medium text-slate-700">Name</label>
          <input
            type="text"
            autoFocus
            {...register('name')}
            className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/20 transition-all"
          />
          {errors.name && <p className="mt-1.5 text-xs text-red-500">{errors.name.message}</p>}
        </div>

        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="flex items-center gap-2 rounded-lg bg-sky-600 px-4 py-2 text-sm font-semibold text-white hover:bg-sky-700 transition-colors disabled:opacity-50"
          >
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            Rename
          </button>
        </div>
      </form>
    </Modal>
  );
}
