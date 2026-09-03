export type ItemType = 'file' | 'folder';
export type Permission = 'viewer' | 'editor';
export type ViewMode = 'grid' | 'list';
export type SortField = 'name' | 'updated_at' | 'created_at' | 'size_bytes' | 'mime_type';
export type SortOrder = 'asc' | 'desc';
export type UploadStatus = 'waiting' | 'uploading' | 'processing' | 'completed' | 'failed' | 'cancelled';

export interface Profile {
  id: string;
  display_name: string;
  avatar_url: string | null;
  storage_limit_bytes: number;
  created_at: string;
  updated_at: string;
}

export interface Folder {
  id: string;
  name: string;
  owner_id: string;
  parent_id: string | null;
  starred: boolean;
  trashed: boolean;
  trashed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface FileItem {
  id: string;
  name: string;
  owner_id: string;
  folder_id: string | null;
  storage_path: string;
  mime_type: string;
  size_bytes: number;
  starred: boolean;
  trashed: boolean;
  trashed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface Share {
  id: string;
  item_type: ItemType;
  item_id: string;
  shared_with_email: string;
  shared_by: string;
  permission: Permission;
  created_at: string;
}

export interface PublicLink {
  id: string;
  token: string;
  item_type: ItemType;
  item_id: string;
  created_by: string;
  permission: Permission;
  password_hash: string | null;
  expires_at: string | null;
  disabled: boolean;
  created_at: string;
}

export interface FileActivity {
  id: string;
  item_type: ItemType;
  item_id: string;
  user_id: string;
  action: string;
  metadata: Record<string, unknown> | null;
  created_at: string;
}

export interface StorageInfo {
  used_bytes: number;
  limit_bytes: number;
}

export interface DriveItem {
  type: ItemType;
  data: Folder | FileItem;
}

export interface Breadcrumb {
  id: string | null;
  name: string;
}

export interface UploadTask {
  id: string;
  file: File;
  progress: number;
  status: UploadStatus;
  error?: string;
  fileId?: string;
}

export interface ApiError {
  message: string;
  code?: string;
  status?: number;
}

export interface PaginationInfo {
  page: number;
  size: number;
  total: number;
  totalPages: number;
}
