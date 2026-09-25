import { Link } from 'react-router-dom';
import ConeMascot from '../components/ConeMascot';

export function NotFoundPage() {
  return (
    <div className="min-h-screen bg-[#0E1013] flex flex-col items-center justify-center p-4 text-center font-['Inter']">
      <div className="mb-8">
        <ConeMascot size={160} waving={true} title="RoadGuard Mascot" />
      </div>
      <h1 className="text-4xl md:text-5xl font-['Sora',sans-serif] font-bold text-[#F3F4F6] mb-4">404 - Page Not Found</h1>
      <p className="text-[#9CA3AF] max-w-md mx-auto mb-8 text-lg">
        Oops! It looks like you've ventured off the mapped roads. The page you're looking for doesn't exist.
      </p>
      <Link 
        to="/" 
        className="h-12 px-8 rounded-full bg-[#FFC629] text-[#0E1013] font-bold shadow-[0_4px_14px_rgba(255,198,41,0.2)] hover:scale-105 transition-transform flex items-center justify-center min-w-[200px]"
      >
        Return to Safety
      </Link>
    </div>
  );
}
