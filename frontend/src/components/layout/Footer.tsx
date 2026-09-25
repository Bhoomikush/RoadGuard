import { Shield } from 'lucide-react';
import { Link } from 'react-router-dom';

export function Footer() {
  return (
    <footer className="bg-[#0E1013] border-t border-[rgba(255,255,255,0.08)] py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <div className="flex items-center mb-6 md:mb-0">
            <Shield className="w-8 h-8 text-[#FFC629] mr-2" />
            <div>
              <span className="text-xl font-bold text-[#F3F4F6] tracking-tight">RoadGuard</span>
              <p className="text-sm text-[#9CA3AF] mt-1">AI-powered intelligence for safer roads.</p>
            </div>
          </div>
          
          <div className="flex space-x-8">
            <Link to="/" className="text-sm text-[#9CA3AF] hover:text-[#F3F4F6] transition-colors">Product</Link>
            <a href="#features" className="text-sm text-[#9CA3AF] hover:text-[#F3F4F6] transition-colors">Features</a>
            <a href="#about" className="text-sm text-[#9CA3AF] hover:text-[#F3F4F6] transition-colors">About</a>
            <a href="https://github.com" target="_blank" rel="noreferrer" className="text-sm text-[#9CA3AF] hover:text-[#F3F4F6] transition-colors">GitHub</a>
          </div>
        </div>
        
        <div className="mt-8 border-t border-[rgba(255,255,255,0.08)] pt-8 flex justify-center">
          <p className="text-sm text-[#9CA3AF]">
            &copy; {new Date().getFullYear()} RoadGuard AI. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
