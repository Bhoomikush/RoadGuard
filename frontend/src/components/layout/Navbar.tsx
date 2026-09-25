import { Link } from 'react-router-dom';
import { Shield, Menu, X } from 'lucide-react';
import { useState } from 'react';

export function Navbar() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <nav className="sticky top-0 z-50 bg-[#0E1013]/80 backdrop-blur-md border-b border-[rgba(255,255,255,0.08)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <Link to="/" className="flex items-center gap-2">
              <Shield className="w-8 h-8 text-[#FFC629]" />
              <span className="text-xl font-bold text-[#F3F4F6] tracking-tight">RoadGuard</span>
            </Link>
          </div>
          
          <div className="hidden md:flex items-center space-x-8">
            <Link to="/" className="text-sm font-medium text-[#9CA3AF] hover:text-[#F3F4F6] transition-colors">Home</Link>
            <a href="#how-it-works" className="text-sm font-medium text-[#9CA3AF] hover:text-[#F3F4F6] transition-colors">How It Works</a>
            <a href="#features" className="text-sm font-medium text-[#9CA3AF] hover:text-[#F3F4F6] transition-colors">Features</a>
            <a href="#about" className="text-sm font-medium text-[#9CA3AF] hover:text-[#F3F4F6] transition-colors">About</a>
          </div>

          <div className="hidden md:flex items-center space-x-6">
            <Link to="/login" className="text-sm font-medium text-[#9CA3AF] hover:text-[#F3F4F6] transition-colors">
              Login
            </Link>
            <Link to="/register" className="px-5 py-2 rounded-full bg-[#FFC629] text-[#0E1013] font-bold text-sm hover:opacity-90 transition-opacity">
              Get Started
            </Link>
          </div>

          <div className="flex md:hidden items-center">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="text-[#9CA3AF] hover:text-[#F3F4F6] p-2"
            >
              {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden bg-[#161A20] border-b border-[rgba(255,255,255,0.08)]">
          <div className="px-4 pt-2 pb-6 space-y-2">
            <Link to="/" className="block py-2 text-base font-medium text-[#9CA3AF] hover:text-[#F3F4F6]">Home</Link>
            <a href="#how-it-works" className="block py-2 text-base font-medium text-[#9CA3AF] hover:text-[#F3F4F6]">How It Works</a>
            <a href="#features" className="block py-2 text-base font-medium text-[#9CA3AF] hover:text-[#F3F4F6]">Features</a>
            <a href="#about" className="block py-2 text-base font-medium text-[#9CA3AF] hover:text-[#F3F4F6]">About</a>
            <div className="mt-4 pt-4 border-t border-[rgba(255,255,255,0.08)] flex flex-col space-y-4">
              <Link to="/login" className="block text-center py-2 text-base font-medium text-[#9CA3AF] hover:text-[#F3F4F6]">
                Login
              </Link>
              <Link to="/register" className="block w-full text-center px-5 py-3 rounded-full bg-[#FFC629] text-[#0E1013] font-bold">
                Get Started
              </Link>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
