import { Shield } from 'lucide-react';
import { Link } from 'react-router-dom';

export function Footer() {
  return (
    <footer className="bg-slate-950 border-t border-slate-800 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <div className="flex items-center mb-6 md:mb-0">
            <Shield className="w-8 h-8 text-teal-500 mr-2" />
            <div>
              <span className="text-xl font-bold text-slate-50 tracking-tight">RoadGuard <span className="text-teal-500">AI</span></span>
              <p className="text-sm text-slate-400 mt-1">AI-powered intelligence for safer roads.</p>
            </div>
          </div>
          
          <div className="flex space-x-8">
            <Link to="/" className="text-sm text-slate-400 hover:text-teal-400 transition-colors">Product</Link>
            <a href="#features" className="text-sm text-slate-400 hover:text-teal-400 transition-colors">Features</a>
            <a href="#about" className="text-sm text-slate-400 hover:text-teal-400 transition-colors">About</a>
            <a href="https://github.com" target="_blank" rel="noreferrer" className="text-sm text-slate-400 hover:text-teal-400 transition-colors">GitHub</a>
          </div>
        </div>
        
        <div className="mt-8 border-t border-slate-900 pt-8 flex justify-center">
          <p className="text-sm text-slate-500">
            &copy; {new Date().getFullYear()} RoadGuard AI. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
