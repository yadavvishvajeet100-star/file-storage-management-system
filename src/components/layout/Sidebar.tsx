import { NavLink, useNavigate } from 'react-router-dom';
import {
  Cloud,
  HardDrive,
  FolderClosed,
  Share2,
  Star,
  Clock,
  Trash2,
  Settings,
  HelpCircle,
  X,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { getStorageUsage } from '@/services/userService';
import { formatBytes, cn } from '@/utils/format';

interface SidebarProps {
  open: boolean;
  onClose: () => void;
}

const navItems = [
  { to: '/drive', label: 'My Drive', icon: FolderClosed },
  { to: '/shared', label: 'Shared with me', icon: Share2 },
  { to: '/starred', label: 'Starred', icon: Star },
  { to: '/recent', label: 'Recent', icon: Clock },
  { to: '/trash', label: 'Trash', icon: Trash2 },
];

export function Sidebar({ open, onClose }: SidebarProps) {
  const { user } = useAuth();
  const navigate = useNavigate();

  const { data: storage } = useQuery({
    queryKey: ['storage', user?.id],
    queryFn: () => getStorageUsage(user!.id),
    enabled: !!user,
  });

  const usedBytes = storage?.used_bytes ?? 0;
  const limitBytes = storage?.limit_bytes ?? 5368709120;
  const usagePercent = Math.min((usedBytes / limitBytes) * 100, 100);

  return (
    <>
      {open && (
        <div className="fixed inset-0 z-30 bg-slate-900/40 backdrop-blur-sm lg:hidden" onClick={onClose} />
      )}

      <aside
        className={cn(
          'fixed left-0 top-0 z-40 flex h-full w-64 flex-col border-r border-slate-100 bg-white transition-transform duration-300 lg:translate-x-0',
          open ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="flex items-center justify-between px-6 py-5">
          <button
            onClick={() => navigate('/drive')}
            className="flex items-center gap-2"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-sky-500 to-blue-600 shadow-md shadow-sky-500/30">
              <Cloud className="h-5 w-5 text-white" />
            </div>
            <span className="text-lg font-bold text-slate-900">CloudVault</span>
          </button>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 lg:hidden"
            aria-label="Close sidebar"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="flex-1 space-y-1 px-3 py-2">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={onClose}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-sky-50 text-sky-700'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                )
              }
            >
              <item.icon className="h-5 w-5 shrink-0" />
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="px-3 py-2">
          <div className="my-2 border-t border-slate-100" />
          <NavLink
            to="/settings/profile"
            onClick={onClose}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-sky-50 text-sky-700'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              )
            }
          >
            <Settings className="h-5 w-5 shrink-0" />
            Settings
          </NavLink>
          <button
            onClick={() => navigate('/settings/help')}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors"
          >
            <HelpCircle className="h-5 w-5 shrink-0" />
            Help
          </button>
        </div>

        <div className="border-t border-slate-100 p-4">
          <div className="rounded-xl bg-slate-50 p-4">
            <div className="mb-2 flex items-center gap-2">
              <HardDrive className="h-4 w-4 text-slate-500" />
              <span className="text-xs font-semibold text-slate-700">Storage</span>
            </div>
            <div className="mb-2 h-2 overflow-hidden rounded-full bg-slate-200">
              <div
                className={cn(
                  'h-full rounded-full transition-all duration-500',
                  usagePercent > 90 ? 'bg-red-500' : usagePercent > 70 ? 'bg-amber-500' : 'bg-sky-500'
                )}
                style={{ width: `${usagePercent}%` }}
              />
            </div>
            <p className="text-xs text-slate-500">
              {formatBytes(usedBytes)} of {formatBytes(limitBytes)}
            </p>
          </div>
        </div>
      </aside>
    </>
  );
}
