import { Link } from 'react-router-dom';
import { Scissors } from 'lucide-react';

interface LogoProps {
  variant?: 'header' | 'footer';
  showTagline?: boolean;
  className?: string;
}

export default function Logo({ variant = 'header', showTagline = false, className = '' }: LogoProps) {
  const textSize = variant === 'header' ? 'text-2xl' : 'text-3xl';

  return (
    <Link to="/" className={`flex items-center gap-3 group ${className}`}>
      <div className="relative">
        <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg blur-lg opacity-50"></div>
        <div className="relative bg-gradient-to-r from-purple-600 to-pink-600 p-2 rounded-lg transform group-hover:scale-105 transition-transform">
          <Scissors className="w-6 h-6 text-white" />
        </div>
      </div>

      <div className="flex flex-col">
        <span className={`${textSize} font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent`}>
          SURGLY
        </span>
        {(showTagline || variant === 'footer') && (
          <span className="text-xs text-gray-400 -mt-1">
            AI-Powered Ad Optimization
          </span>
        )}
      </div>
    </Link>
  );
}
