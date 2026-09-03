import { useState } from 'react';
import { Mail, UserPlus, Loader2, Copy, Check, Link2, Shield, Trash2, ChevronDown } from 'lucide-react';
import { Modal } from '@/components/common/Modal';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { useToast } from '@/contexts/ToastContext';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { createShare, getShares, removeShare, updateShare } from '@/services/shareService';
import { createPublicLink, getPublicLinks, disablePublicLink } from '@/services/publicLinkService';
import type { ItemType, Permission, Share } from '@/types';
import { formatDate } from '@/utils/format';

interface ShareModalProps {
  open: boolean;
  onClose: () => void;
  itemId: string;
  itemName: string;
  itemType: ItemType;
}

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function ShareModal({ open, onClose, itemId, itemName, itemType }: ShareModalProps) {
  const { success, error: showError } = useToast();
  const queryClient = useQueryClient();
  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState('');
  const [permission, setPermission] = useState<Permission>('viewer');
  const [loading, setLoading] = useState(false);
  const [linkLoading, setLinkLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [updatingShareId, setUpdatingShareId] = useState<string | null>(null);
  const [removeTarget, setRemoveTarget] = useState<Share | null>(null);
  const [removeLoading, setRemoveLoading] = useState(false);

  const { data: shares = [] } = useQuery({
    queryKey: ['shares', itemId],
    queryFn: () => getShares(itemId),
    enabled: open,
  });

  const { data: links = [] } = useQuery({
    queryKey: ['public-links', itemId],
    queryFn: () => getPublicLinks(itemId),
    enabled: open,
  });

  const activeLink = links.find((link) => !link.disabled);

  const handleShare = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedEmail = email.trim().toLowerCase();

    if (!trimmedEmail) {
      setEmailError('Please enter an email address');
      return;
    }
    if (!isValidEmail(trimmedEmail)) {
      setEmailError('Please enter a valid email address');
      return;
    }

    const alreadyShared = shares.some((s) => s.shared_with_email === trimmedEmail);
    if (alreadyShared) {
      setEmailError('This person already has access');
      return;
    }

    setEmailError('');
    setLoading(true);
    try {
      await createShare(itemType, itemId, trimmedEmail, permission);
      success('Access granted successfully');
      setEmail('');
      queryClient.invalidateQueries({ queryKey: ['shares', itemId] });
    } catch (err) {
      showError(err instanceof Error ? err.message : 'Failed to share');
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = async () => {
    if (!removeTarget) return;
    setRemoveLoading(true);
    try {
      await removeShare(removeTarget.id);
      success('Access removed');
      queryClient.invalidateQueries({ queryKey: ['shares', itemId] });
    } catch (err) {
      showError(err instanceof Error ? err.message : 'Failed to remove access');
    } finally {
      setRemoveLoading(false);
      setRemoveTarget(null);
    }
  };

  const handlePermissionChange = async (share: Share, newPermission: Permission) => {
    setUpdatingShareId(share.id);
    try {
      await updateShare(share.id, newPermission);
      success('Permission updated');
      queryClient.invalidateQueries({ queryKey: ['shares', itemId] });
    } catch (err) {
      showError(err instanceof Error ? err.message : 'Failed to update permission');
    } finally {
      setUpdatingShareId(null);
    }
  };

  const handleCreateLink = async () => {
    setLinkLoading(true);
    try {
      await createPublicLink(itemType, itemId);
      success('Public link created');
      queryClient.invalidateQueries({ queryKey: ['public-links', itemId] });
    } catch (err) {
      showError(err instanceof Error ? err.message : 'Failed to create link');
    } finally {
      setLinkLoading(false);
    }
  };

  const handleDisableLink = async (linkId: string) => {
    try {
      await disablePublicLink(linkId);
      success('Public link disabled');
      queryClient.invalidateQueries({ queryKey: ['public-links', itemId] });
    } catch (err) {
      showError(err instanceof Error ? err.message : 'Failed to disable link');
    }
  };

  const copyLink = async () => {
    if (!activeLink) return;
    const url = `${window.location.origin}/shared-link/${activeLink.token}`;
    await navigator.clipboard.writeText(url);
    setCopied(true);
    success('Link copied to clipboard');
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Modal open={open} onClose={onClose} title={`Share "${itemName}"`} maxWidth="max-w-lg">
      <div className="space-y-6">
        <form onSubmit={handleShare}>
          <label className="mb-1.5 block text-sm font-medium text-slate-700">Share with people</label>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (emailError) setEmailError('');
                }}
                placeholder="email@example.com"
                className={`w-full rounded-lg border pl-10 pr-3 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 transition-all ${
                  emailError
                    ? 'border-red-300 focus:border-red-500 focus:ring-red-500/20'
                    : 'border-slate-200 focus:border-sky-500 focus:ring-sky-500/20'
                }`}
              />
            </div>
            <select
              value={permission}
              onChange={(e) => setPermission(e.target.value as Permission)}
              className="rounded-lg border border-slate-200 bg-white px-2.5 py-2 text-sm text-slate-700 focus:border-sky-500 focus:outline-none"
            >
              <option value="viewer">Viewer</option>
              <option value="editor">Editor</option>
            </select>
            <button
              type="submit"
              disabled={loading || !email.trim()}
              className="flex items-center justify-center rounded-lg bg-sky-600 px-3 text-white hover:bg-sky-700 transition-colors disabled:opacity-50"
              aria-label="Add person"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserPlus className="h-4 w-4" />}
            </button>
          </div>
          {emailError && <p className="mt-1.5 text-xs text-red-500">{emailError}</p>}
        </form>

        {shares.length > 0 && (
          <div>
            <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-400">People with access</h3>
            <div className="space-y-2">
              {shares.map((share) => (
                <div key={share.id} className="flex items-center gap-3 rounded-lg bg-slate-50 px-3 py-2.5">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-sky-100 text-sky-600">
                    <Mail className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-slate-700">{share.shared_with_email}</p>
                    <p className="text-xs text-slate-400">Shared {formatDate(share.created_at)}</p>
                  </div>
                  <div className="relative">
                    <select
                      value={share.permission}
                      onChange={(e) => handlePermissionChange(share, e.target.value as Permission)}
                      disabled={updatingShareId === share.id}
                      className="appearance-none rounded-lg border border-slate-200 bg-white py-1.5 pl-3 pr-7 text-xs font-medium text-slate-700 focus:border-sky-500 focus:outline-none disabled:opacity-50"
                    >
                      <option value="viewer">Viewer</option>
                      <option value="editor">Editor</option>
                    </select>
                    {updatingShareId === share.id ? (
                      <Loader2 className="pointer-events-none absolute right-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 animate-spin text-sky-500" />
                    ) : (
                      <ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
                    )}
                  </div>
                  <button
                    onClick={() => setRemoveTarget(share)}
                    className="rounded-lg p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-500 transition-colors"
                    aria-label="Remove access"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="border-t border-slate-100 pt-5">
          <div className="mb-2 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-slate-800">Public link</h3>
              <p className="text-xs text-slate-500">Anyone with the link can view</p>
            </div>
            <Link2 className="h-5 w-5 text-slate-400" />
          </div>

          {activeLink ? (
            <div className="flex items-center gap-2 rounded-lg bg-slate-50 p-2">
              <div className="flex-1 truncate px-2 text-xs text-slate-500">
                {window.location.origin}/shared-link/{activeLink.token}
              </div>
              <button
                onClick={copyLink}
                className="flex items-center gap-1.5 rounded-md bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 shadow-sm hover:bg-slate-100 transition-colors"
              >
                {copied ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
                {copied ? 'Copied' : 'Copy'}
              </button>
              <button
                onClick={() => handleDisableLink(activeLink.id)}
                className="rounded-md p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-500 transition-colors"
                aria-label="Disable public link"
              >
                <Shield className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <button
              onClick={handleCreateLink}
              disabled={linkLoading}
              className="flex w-full items-center justify-center gap-2 rounded-lg border border-slate-200 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors disabled:opacity-50"
            >
              {linkLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Link2 className="h-4 w-4" />}
              Create public link
            </button>
          )}
        </div>
      </div>

      <ConfirmDialog
        open={!!removeTarget}
        title="Remove access?"
        message={`This will remove access for ${removeTarget?.shared_with_email || 'this person'}. They will no longer be able to view or edit this ${itemType}.`}
        confirmLabel="Remove"
        onConfirm={handleRemove}
        onCancel={() => !removeLoading && setRemoveTarget(null)}
        loading={removeLoading}
      />
    </Modal>
  );
}
