import type { FileItem, Folder } from '@/types';

export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

export function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export function formatDateTime(dateStr: string): string {
  return new Date(dateStr).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

export function getFileExtension(name: string): string {
  const parts = name.split('.');
  return parts.length > 1 ? parts[parts.length - 1].toLowerCase() : '';
}

export function isPreviewable(file: FileItem): boolean {
  return file.mime_type.startsWith('image/') || file.mime_type === 'application/pdf';
}

export function isImageFile(file: FileItem): boolean {
  return file.mime_type.startsWith('image/');
}

export function isPdfFile(file: FileItem): boolean {
  return file.mime_type === 'application/pdf';
}

export function getFileIconColor(mimeType: string): string {
  if (mimeType.startsWith('image/')) return 'text-violet-500 bg-violet-50';
  if (mimeType === 'application/pdf') return 'text-red-500 bg-red-50';
  if (mimeType.includes('zip') || mimeType.includes('compressed')) return 'text-amber-500 bg-amber-50';
  if (mimeType.startsWith('video/')) return 'text-pink-500 bg-pink-50';
  if (mimeType.startsWith('audio/')) return 'text-purple-500 bg-purple-50';
  if (mimeType.includes('spreadsheet') || mimeType.includes('excel')) return 'text-emerald-500 bg-emerald-50';
  if (mimeType.includes('document') || mimeType.includes('word')) return 'text-blue-500 bg-blue-50';
  if (mimeType.includes('presentation') || mimeType.includes('powerpoint')) return 'text-orange-500 bg-orange-50';
  return 'text-slate-500 bg-slate-100';
}

export function getFolderIconColor(): string {
  return 'text-sky-500 bg-sky-50';
}

export function isDescendant(
  candidateId: string,
  ancestorId: string,
  allFolders: Folder[]
): boolean {
  if (candidateId === ancestorId) return true;
  let current = allFolders.find((f) => f.id === candidateId);
  while (current && current.parent_id) {
    if (current.parent_id === ancestorId) return true;
    current = allFolders.find((f) => f.id === current!.parent_id);
  }
  return false;
}

export function buildFolderPath(folderId: string | null, allFolders: Folder[]): { id: string | null; name: string }[] {
  const path: { id: string | null; name: string }[] = [];
  let current = folderId ? allFolders.find((f) => f.id === folderId) : null;

  while (current) {
    path.unshift({ id: current.id, name: current.name });
    const parentId = current.parent_id;
    current = parentId ? allFolders.find((f) => f.id === parentId) ?? null : null;
  }

  path.unshift({ id: null, name: 'My Drive' });
  return path;
}

export function cn(...classes: (string | false | undefined | null)[]): string {
  return classes.filter(Boolean).join(' ');
}
