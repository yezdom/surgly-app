import { Heart, TrendingUp, TrendingDown, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';

interface AIPulseProps {
  healthScore: number;
  message: string;
  loading?: boolean;
}

export default function AIPulse({ healthScore, message, loading }: AIPulseProps) {
  const getHealthColor = (score: number) => {
    if (score >= 80) return 'from-green-500 to-emerald-500';
    if (score >= 60) return 'from-blue-500 to-cyan-500';
    if (score >= 40) return 'from-yellow-500 to-orange-500';
    return 'from-red-500 to-pink-500';
  };

  const getHealthIcon = (score: number) => {
    if (score >= 80) return <TrendingUp className="w-6 h-6" />;
    if (score >= 60) return <Heart className="w-6 h-6" />;
    if (score >= 40) return <AlertCircle className="w-6 h-6" />;
    return <TrendingDown className="w-6 h-6" />;
  };

  const getHealthLabel = (score: number) => {
    if (score >= 80) return 'Excellent Health';
    if (score >= 60) return 'Good Health';
    if (score >= 40) return 'Needs Attention';
    return 'Critical';
  };

  if (loading) {
    return (
      <div className="bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl p-6 text-white mb-8">
        <div className="flex items-center gap-4">
          <div className="animate-pulse flex items-center justify-center w-16 h-16 bg-white/20 rounded-full">
            <Heart className="w-8 h-8 animate-pulse" />
          </div>
          <div className="flex-1">
            <div className="h-6 bg-white/20 rounded w-32 mb-2 animate-pulse"></div>
            <div className="h-4 bg-white/20 rounded w-full animate-pulse"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`bg-gradient-to-r ${getHealthColor(healthScore)} rounded-xl p-6 text-white mb-8 shadow-lg`}
    >
      <div className="flex items-start gap-4">
        <motion.div
          animate={{
            scale: [1, 1.1, 1],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
          className="flex items-center justify-center w-16 h-16 bg-white/20 rounded-full backdrop-blur-sm"
        >
          {getHealthIcon(healthScore)}
        </motion.div>
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <h3 className="text-xl font-bold">AI Pulse</h3>
            <span className="px-3 py-1 bg-white/20 backdrop-blur-sm rounded-full text-sm font-medium">
              {getHealthLabel(healthScore)}
            </span>
            <span className="text-2xl font-bold">{healthScore}/100</span>
          </div>
          <p className="text-white/90 leading-relaxed">
            {message || 'Analyzing your campaign performance...'}
          </p>
        </div>
      </div>

      <div className="mt-4 flex items-center gap-4">
        <div className="flex-1 bg-white/20 rounded-full h-3 overflow-hidden backdrop-blur-sm">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${healthScore}%` }}
            transition={{ duration: 1, ease: 'easeOut' }}
            className="h-full bg-white rounded-full"
          />
        </div>
        <span className="text-sm font-medium opacity-90">Campaign Health</span>
      </div>
    </motion.div>
  );
}
