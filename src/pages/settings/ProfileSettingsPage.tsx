import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { User, Mail, Loader2, Save } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { updateProfile } from '@/services/userService';
import { useQueryClient } from '@tanstack/react-query';

const schema = z.object({
  display_name: z
    .string()
    .min(1, 'Name is required')
    .max(50, 'Name is too long')
    .refine((val) => /^[a-zA-Z]+$/.test(val), 'Name can only contain letters (no spaces, numbers, or special characters)'),
});

type FormData = z.infer<typeof schema>;

export function ProfileSettingsPage() {
  const { user, profile, refreshProfile } = useAuth();
  const { success, error: showError } = useToast();
  const queryClient = useQueryClient();
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { display_name: profile?.display_name || '' },
  });

  const onSubmit = async (data: FormData) => {
    if (!user) return;
    setLoading(true);
    try {
      await updateProfile(user.id, { display_name: data.display_name.trim() });
      await refreshProfile();
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      success('Profile updated successfully');
    } catch {
      showError('Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const initials = (profile?.display_name || user?.email || '?')
    .split(' ')
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <AppLayout currentFolderId={null}>
      <div className="mx-auto max-w-2xl">
        <h1 className="mb-1 text-xl font-bold text-slate-900">Profile settings</h1>
        <p className="mb-6 text-sm text-slate-500">Manage your account information</p>

        <div className="rounded-xl border border-slate-100 bg-white p-6">
          <div className="mb-6 flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-sky-500 to-blue-600 text-xl font-semibold text-white">
              {initials}
            </div>
            <div>
              <p className="text-base font-semibold text-slate-900">{profile?.display_name || 'User'}</p>
              <p className="text-sm text-slate-500">{user?.email}</p>
            </div>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">Full name</label>
              <div className="relative">
                <User className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  {...register('display_name')}
                  className="w-full rounded-lg border border-slate-200 pl-10 pr-3 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/20 transition-all"
                />
              </div>
              {errors.display_name && <p className="mt-1.5 text-xs text-red-500">{errors.display_name.message}</p>}
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">Email</label>
              <div className="relative">
                <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  type="email"
                  value={user?.email || ''}
                  disabled
                  className="w-full cursor-not-allowed rounded-lg border border-slate-200 bg-slate-50 pl-10 pr-3 py-2.5 text-sm text-slate-500"
                />
              </div>
              <p className="mt-1.5 text-xs text-slate-400">Email cannot be changed</p>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-2 rounded-lg bg-sky-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-sky-700 transition-colors disabled:opacity-50"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              Save changes
            </button>
          </form>
        </div>
      </div>
    </AppLayout>
  );
}
