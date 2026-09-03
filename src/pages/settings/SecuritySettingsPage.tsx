import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Lock, Loader2, Shield, HardDrive, LogOut } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { updatePassword, getStorageUsage } from '@/services/userService';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { formatBytes } from '@/utils/format';

const schema = z.object({
  newPassword: z.string().min(6, 'Password must be at least 6 characters'),
  confirmPassword: z.string(),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

type FormData = z.infer<typeof schema>;

export function SecuritySettingsPage() {
  const { user, signOut } = useAuth();
  const { success, error: showError } = useToast();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  const { data: storage } = useQuery({
    queryKey: ['storage', user?.id],
    queryFn: () => getStorageUsage(user!.id),
    enabled: !!user,
  });

  const usedBytes = storage?.used_bytes ?? 0;
  const limitBytes = storage?.limit_bytes ?? 5368709120;
  const usagePercent = Math.min((usedBytes / limitBytes) * 100, 100);

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    try {
      await updatePassword(data.newPassword);
      success('Password changed successfully');
      reset();
    } catch {
      showError('Failed to change password');
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    queryClient.clear();
    navigate('/login');
  };

  return (
    <AppLayout currentFolderId={null}>
      <div className="mx-auto max-w-2xl space-y-6">
        <div>
          <h1 className="mb-1 text-xl font-bold text-slate-900">Security settings</h1>
          <p className="text-sm text-slate-500">Manage your password and account security</p>
        </div>

        <div className="rounded-xl border border-slate-100 bg-white p-6">
          <div className="mb-4 flex items-center gap-2">
            <Lock className="h-5 w-5 text-slate-400" />
            <h2 className="text-base font-semibold text-slate-900">Change password</h2>
          </div>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">New password</label>
              <div className="relative">
                <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  type="password"
                  {...register('newPassword')}
                  className="w-full rounded-lg border border-slate-200 pl-10 pr-3 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/20 transition-all"
                  placeholder="At least 6 characters"
                />
              </div>
              {errors.newPassword && <p className="mt-1.5 text-xs text-red-500">{errors.newPassword.message}</p>}
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">Confirm new password</label>
              <div className="relative">
                <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  type="password"
                  {...register('confirmPassword')}
                  className="w-full rounded-lg border border-slate-200 pl-10 pr-3 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/20 transition-all"
                  placeholder="Re-enter new password"
                />
              </div>
              {errors.confirmPassword && <p className="mt-1.5 text-xs text-red-500">{errors.confirmPassword.message}</p>}
            </div>
            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-2 rounded-lg bg-sky-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-sky-700 transition-colors disabled:opacity-50"
            >
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              Update password
            </button>
          </form>
        </div>

        <div className="rounded-xl border border-slate-100 bg-white p-6">
          <div className="mb-4 flex items-center gap-2">
            <HardDrive className="h-5 w-5 text-slate-400" />
            <h2 className="text-base font-semibold text-slate-900">Storage usage</h2>
          </div>
          <div className="mb-3 h-3 overflow-hidden rounded-full bg-slate-100">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                usagePercent > 90 ? 'bg-red-500' : usagePercent > 70 ? 'bg-amber-500' : 'bg-sky-500'
              }`}
              style={{ width: `${usagePercent}%` }}
            />
          </div>
          <p className="text-sm text-slate-600">
            <span className="font-semibold">{formatBytes(usedBytes)}</span> of {formatBytes(limitBytes)} used
          </p>
          <p className="mt-1 text-xs text-slate-400">{formatBytes(limitBytes - usedBytes)} remaining</p>
        </div>

        <div className="rounded-xl border border-slate-100 bg-white p-6">
          <div className="mb-4 flex items-center gap-2">
            <Shield className="h-5 w-5 text-slate-400" />
            <h2 className="text-base font-semibold text-slate-900">Account actions</h2>
          </div>
          <button
            onClick={handleSignOut}
            className="flex items-center gap-2 rounded-lg border border-red-200 px-4 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
          >
            <LogOut className="h-4 w-4" />
            Sign out of all devices
          </button>
          <p className="mt-2 text-xs text-slate-400">This will sign you out from all active sessions on all devices.</p>
        </div>
      </div>
    </AppLayout>
  );
}
