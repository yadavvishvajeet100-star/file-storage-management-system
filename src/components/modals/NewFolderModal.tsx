import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { FolderPlus, Loader2 } from 'lucide-react';
import { Modal } from '@/components/common/Modal';
import { useToast } from '@/contexts/ToastContext';
import { useQueryClient } from '@tanstack/react-query';
import { createFolder } from '@/services/folderService';

const schema = z.object({
  name: z.string().min(1, 'Folder name is required').max(100, 'Name is too long').refine(
    (val) => !val.includes('/') && val !== '.' && val !== '..',
    'Invalid folder name'
  ),
});

type FormData = z.infer<typeof schema>;

interface NewFolderModalProps {
  open: boolean;
  onClose: () => void;
  parentId: string | null;
}

export function NewFolderModal({ open, onClose, parentId }: NewFolderModalProps) {
  const { success, error: showError } = useToast();
  const queryClient = useQueryClient();
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    try {
      await createFolder(data.name.trim(), parentId);
      success('Folder created successfully');
      queryClient.invalidateQueries({ queryKey: ['folders'] });
      queryClient.invalidateQueries({ queryKey: ['recent'] });
      reset();
      onClose();
    } catch (err) {
      showError(err instanceof Error ? err.message : 'Failed to create folder');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  return (
    <Modal open={open} onClose={handleClose} title="New folder" maxWidth="max-w-sm">
      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="mb-4">
          <label className="mb-1.5 block text-sm font-medium text-slate-700">Folder name</label>
          <div className="relative">
            <FolderPlus className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              autoFocus
              {...register('name')}
              onKeyDown={(e) => e.key === 'Enter' && handleSubmit(onSubmit)()}
              className="w-full rounded-lg border border-slate-200 pl-10 pr-3 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/20 transition-all"
              placeholder="Untitled folder"
            />
          </div>
          {errors.name && <p className="mt-1.5 text-xs text-red-500">{errors.name.message}</p>}
        </div>

        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={handleClose}
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
            Create
          </button>
        </div>
      </form>
    </Modal>
  );
}
