import type { LucideIcon } from 'lucide-react';

interface PlaceholderPageProps {
  title: string;
  description: string;
  icon: LucideIcon;
}

export function PlaceholderPage({ title, description, icon: Icon }: PlaceholderPageProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
      <div className="w-16 h-16 bg-slate-900 rounded-full flex items-center justify-center mb-6">
        <Icon className="w-8 h-8 text-teal-500" />
      </div>
      <h1 className="text-3xl font-bold text-slate-50 mb-3">{title}</h1>
      <p className="text-slate-400 max-w-md mb-8">{description}</p>
      
      <div className="inline-flex items-center px-4 py-2 border border-slate-800 rounded-full bg-slate-900/50 text-slate-300 text-sm font-medium">
        <span className="w-2 h-2 rounded-full bg-amber-500 mr-2"></span>
        Coming Soon
      </div>
    </div>
  );
}
