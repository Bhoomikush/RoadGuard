import { Link } from 'react-router-dom';
import { Shield, Menu, X } from 'lucide-react';
import { useState } from 'react';
import { Button } from '../ui/Button';

export function Navbar() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <nav className="sticky top-0 z-50 bg-slate-950/80 backdrop-blur-md border-b border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <Link to="/" className="flex items-center gap-2">
              <Shield className="w-8 h-8 text-teal-500" />
              <span className="text-xl font-bold text-slate-50 tracking-tight">RoadGuard <span className="text-teal-500">AI</span></span>
            </Link>
          </div>
          
          <div className="hidden md:flex items-center space-x-8">
            <Link to="/" className="text-sm font-medium text-slate-300 hover:text-teal-400 transition-colors">Home</Link>
            <a href="#how-it-works" className="text-sm font-medium text-slate-300 hover:text-teal-400 transition-colors">How It Works</a>
            <a href="#features" className="text-sm font-medium text-slate-300 hover:text-teal-400 transition-colors">Features</a>
            <a href="#about" className="text-sm font-medium text-slate-300 hover:text-teal-400 transition-colors">About</a>
          </div>

          <div className="hidden md:flex items-center space-x-4">
            <Link to="/login">
              <Button variant="ghost">Login</Button>
            </Link>
            <Link to="/register">
              <Button variant="primary">Get Started</Button>
            </Link>
          </div>

          <div className="flex md:hidden items-center">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="text-slate-300 hover:text-white p-2"
            >
              {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden bg-slate-900 border-b border-slate-800">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
            <Link to="/" className="block px-3 py-2 rounded-md text-base font-medium text-slate-300 hover:text-white hover:bg-slate-800">Home</Link>
            <a href="#how-it-works" className="block px-3 py-2 rounded-md text-base font-medium text-slate-300 hover:text-white hover:bg-slate-800">How It Works</a>
            <a href="#features" className="block px-3 py-2 rounded-md text-base font-medium text-slate-300 hover:text-white hover:bg-slate-800">Features</a>
            <a href="#about" className="block px-3 py-2 rounded-md text-base font-medium text-slate-300 hover:text-white hover:bg-slate-800">About</a>
            <div className="mt-4 pt-4 border-t border-slate-800 flex flex-col space-y-2 px-3">
              <Link to="/login" className="w-full">
                <Button variant="outline" className="w-full">Login</Button>
              </Link>
              <Link to="/register" className="w-full">
                <Button variant="primary" className="w-full">Get Started</Button>
              </Link>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
