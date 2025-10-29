import { Link } from 'react-router-dom';
import { Stethoscope, TrendingUp } from 'lucide-react';

interface LogoProps {
  variant?: 'header' | 'footer' | 'sidebar';
  showTagline?: boolean;
  className?: string;
  linkTo?: string;
}

export default function Logo({ variant = 'header', showTagline = false, className = '', linkTo = '/' }: LogoProps) {
  const textSize = variant === 'header' ? 'text-2xl' : variant === 'sidebar' ? 'text-xl' : 'text-3xl';
  const iconSize = variant === 'sidebar' ? 'w-5 h-5' : 'w-6 h-6';

  const content = (
    <>
      <div className="relative flex items-center justify-center">
        <div className={`absolute ${iconSize} bg-gradient-to-br from-blue-500 to-purple-500 rounded-lg opacity-20 blur-sm`}></div>
        <div className={`relative ${iconSize} bg-gradient-to-br from-blue-500 to-purple-500 rounded-lg p-1.5 flex items-center justify-center group-hover:scale-105 transition-transform`}>
          <Stethoscope className="w-full h-full text-white" strokeWidth={2.5} />
          <TrendingUp className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 text-green-400" strokeWidth={3} />
        </div>
      </div>

      <div className="flex flex-col">
        <span className={`${textSize} font-extrabold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent dark:from-blue-400 dark:to-purple-400`}>
          SURGLY
        </span>
        {(showTagline || variant === 'footer') && (
          <span className="text-xs text-gray-400 dark:text-gray-500 -mt-1">
            The AI Ads Doctor
          </span>
        )}
      </div>
    </>
  );

  if (linkTo) {
    return (
      <Link to={linkTo} className={`flex items-center gap-2 group ${className}`}>
        {content}
      </Link>
    );
  }

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {content}
    </div>
  );
}
