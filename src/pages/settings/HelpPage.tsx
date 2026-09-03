import { HelpCircle, Cloud, Search, Upload, Share2, FolderClosed, Star, Trash2 } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';

export function HelpPage() {
  const topics = [
    { icon: Upload, title: 'Uploading files', desc: 'Click the Upload button or drag files into the upload area. You can upload multiple files at once and track progress in real time.' },
    { icon: FolderClosed, title: 'Organizing with folders', desc: 'Create folders and nested folders to organize your files. Navigate using breadcrumbs at the top of My Drive.' },
    { icon: Share2, title: 'Sharing files', desc: 'Share files and folders with specific people by email, or create public links that anyone can access.' },
    { icon: Star, title: 'Starring items', desc: 'Star important files and folders for quick access. They appear in the Starred section of your sidebar.' },
    { icon: Search, title: 'Searching', desc: 'Use the search bar at the top to find files by name across your entire drive.' },
    { icon: Trash2, title: 'Trash and recovery', desc: 'Deleted items go to Trash where you can restore them or delete them permanently. Empty Trash to free up storage.' },
  ];

  return (
    <AppLayout currentFolderId={null}>
      <div className="mx-auto max-w-3xl">
        <div className="mb-8 flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-sky-50 text-sky-500">
            <HelpCircle className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900">Help & Support</h1>
            <p className="text-sm text-slate-500">Learn how to get the most out of CloudVault</p>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          {topics.map((topic) => (
            <div key={topic.title} className="rounded-xl border border-slate-100 bg-white p-5 transition-all hover:border-slate-200 hover:shadow-sm">
              <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-slate-50 text-slate-500">
                <topic.icon className="h-5 w-5" />
              </div>
              <h3 className="mb-1 text-sm font-semibold text-slate-900">{topic.title}</h3>
              <p className="text-sm text-slate-500">{topic.desc}</p>
            </div>
          ))}
        </div>

        <div className="mt-8 rounded-xl bg-gradient-to-br from-sky-50 to-blue-50 p-6 text-center">
          <Cloud className="mx-auto mb-2 h-8 w-8 text-sky-500" />
          <p className="text-sm font-medium text-slate-700">Need more help?</p>
          <p className="mt-1 text-xs text-slate-500">CloudVault provides 5GB of free storage for every account.</p>
        </div>
      </div>
    </AppLayout>
  );
}
