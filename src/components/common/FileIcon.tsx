import { File, FolderClosed, Image, FileText, FileArchive, FileVideo, FileAudio, FileSpreadsheet, FileType } from 'lucide-react';
import type { FileItem } from '@/types';
import { getFileIconColor, getFolderIconColor } from '@/utils/format';

interface FileIconProps {
  file?: FileItem;
  isFolder?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export function FileIcon({ file, isFolder, size = 'md' }: FileIconProps) {
  const sizes = {
    sm: 'h-8 w-8',
    md: 'h-12 w-12',
    lg: 'h-16 w-16',
  };
  const iconSizes = {
    sm: 'h-4 w-4',
    md: 'h-6 w-6',
    lg: 'h-8 w-8',
  };

  const colorClass = isFolder ? getFolderIconColor() : file ? getFileIconColor(file.mime_type) : 'text-slate-500 bg-slate-100';

  let Icon = File;
  if (isFolder) {
    Icon = FolderClosed;
  } else if (file) {
    if (file.mime_type.startsWith('image/')) Icon = Image;
    else if (file.mime_type === 'application/pdf') Icon = FileText;
    else if (file.mime_type.includes('zip') || file.mime_type.includes('compressed')) Icon = FileArchive;
    else if (file.mime_type.startsWith('video/')) Icon = FileVideo;
    else if (file.mime_type.startsWith('audio/')) Icon = FileAudio;
    else if (file.mime_type.includes('spreadsheet') || file.mime_type.includes('excel')) Icon = FileSpreadsheet;
    else if (file.mime_type.includes('document') || file.mime_type.includes('word')) Icon = FileText;
    else if (file.mime_type.includes('presentation') || file.mime_type.includes('powerpoint')) Icon = FileType;
  }

  return (
    <div className={`flex items-center justify-center rounded-xl ${sizes[size]} ${colorClass}`}>
      <Icon className={iconSizes[size]} />
    </div>
  );
}
