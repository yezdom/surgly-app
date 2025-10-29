import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import DashboardLayout from './DashboardLayout';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { getAdAccounts, getCampaigns } from '../lib/facebookService';
import { createAICore, calculateHealthScore } from '../lib/aiCore';
import {
  TrendingUp,
  DollarSign,
  Eye,
  MousePointer,
  ArrowRight,
  Rocket,
  Zap,
  Shield,
  BarChart3,
  Image as ImageIcon,
  Stethoscope,
  Crown,
  Activity,
  Heart,
  AlertCircle,
} from 'lucide-react';

export default function Dashboard() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [stats, setStats] = useState({
    totalCampaigns: 0,
    totalSpend: 0,
    avgROAS: 0,
    connectedAccounts: 0,
  });
  const [subscriptionTier, setSubscriptionTier] = useState('Free');
  const [usageStats, setUsageStats] = useState({ used: 0, limit: 100 });
  const [healthScore, setHealthScore] = useState(50);
  const [aiPulse, setAiPulse] = useState<string>('');
  const [pulseLoading, setPulseLoading] = useState(false);

  useEffect(() => {
    loadDashboardData();
  }, [user]);

  async function loadDashboardData() {
    if (!user) return;

    try {
      setLoading(true);

      const { data: userData } = await supabase
        .from('users')
        .select('is_admin, subscription_tier')
        .eq('id', user.id)
        .maybeSingle();

      if (userData) {
        setIsAdmin(userData.is_admin || false);
        setSubscriptionTier(userData.subscription_tier || 'Free');
      }

      try {
        const accounts = await getAdAccounts();
        setStats(prev => ({ ...prev, connectedAccounts: accounts.length }));

        if (accounts.length > 0) {
          const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
            .toISOString()
            .split('T')[0];
          const today = new Date().toISOString().split('T')[0];

          const response = await getCampaigns(accounts[0].account_id, sevenDaysAgo, today);
          const campaigns = response.data || [];

          const totalSpend = campaigns.reduce(
            (sum: number, c: any) => sum + parseFloat(c.insights?.spend || '0'),
            0
          );
          const avgROAS = campaigns.length > 0
            ? campaigns.reduce((sum: number, c: any) => sum + parseFloat(c.insights?.roas || '0'), 0) / campaigns.length
            : 0;

          setStats({
            totalCampaigns: campaigns.length,
            totalSpend,
            avgROAS,
            connectedAccounts: accounts.length,
          });
        }
      } catch (error) {
        console.log('Facebook data not available:', error);
      }

      const { count } = await supabase
        .from('feature_usage')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id);

      setUsageStats({ used: count || 0, limit: 100 });
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setLoading(false);
    }
  }

  const features = [
    {
      title: 'Reports & Analytics',
      description: 'Comprehensive performance reports with export capabilities',
      icon: BarChart3,
      href: '/reports',
      color: 'from-green-500 to-teal-500',
    },
    {
      title: 'Ad Doctor',
      description: 'AI-powered diagnosis of your campaign performance',
      icon: Stethoscope,
      href: '/doctor',
      color: 'from-red-500 to-pink-500',
    },
    {
      title: 'Creative Insights',
      description: 'Analyze your ad creatives and get improvement suggestions',
      icon: ImageIcon,
      href: '/creative',
      color: 'from-purple-500 to-pink-500',
    },
    {
      title: 'Activity Monitor',
      description: 'Track recent campaign activity and alerts',
      icon: Activity,
      href: '/reports',
      color: 'from-blue-500 to-cyan-500',
    },
  ];

  const comingSoonPlatforms = [
    {
      name: 'TikTok Ads',
      description: 'Connect and analyze your TikTok ad campaigns with AI-powered insights',
      icon: '🎵',
      color: 'from-pink-500 to-rose-500',
    },
    {
      name: 'Google Ads',
      description: 'Optimize your Google Ads with advanced analytics and recommendations',
      icon: '🔍',
      color: 'from-blue-500 to-indigo-500',
    },
  ];

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-text-light-primary dark:text-text-dark-primary mb-2">
            Welcome back, {user?.email?.split('@')[0]}!
          </h1>
          <p className="text-text-light-secondary dark:text-text-dark-secondary">
            Here's your ad performance overview
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          <div className="bg-light-primary dark:bg-dark-secondary border border-border-light dark:border-border-dark rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <DollarSign className="w-8 h-8 text-green-500" />
              <span className="text-xs font-medium text-green-500 bg-green-500/10 px-2 py-1 rounded">
                +12.5%
              </span>
            </div>
            <p className="text-sm text-text-light-secondary dark:text-text-dark-secondary mb-1">
              Total Spend
            </p>
            <p className="text-2xl font-bold text-text-light-primary dark:text-text-dark-primary">
              ${loading ? '...' : stats.totalSpend.toFixed(2)}
            </p>
          </div>

          <div className="bg-light-primary dark:bg-dark-secondary border border-border-light dark:border-border-dark rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <Eye className="w-8 h-8 text-blue-500" />
              <span className="text-xs font-medium text-blue-500 bg-blue-500/10 px-2 py-1 rounded">
                +8.2%
              </span>
            </div>
            <p className="text-sm text-text-light-secondary dark:text-text-dark-secondary mb-1">
              Campaigns
            </p>
            <p className="text-2xl font-bold text-text-light-primary dark:text-text-dark-primary">
              {loading ? '...' : stats.totalCampaigns}
            </p>
          </div>

          <div className="bg-light-primary dark:bg-dark-secondary border border-border-light dark:border-border-dark rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <MousePointer className="w-8 h-8 text-purple-500" />
              <span className="text-xs font-medium text-purple-500 bg-purple-500/10 px-2 py-1 rounded">
                +15.7%
              </span>
            </div>
            <p className="text-sm text-text-light-secondary dark:text-text-dark-secondary mb-1">
              Connected Accounts
            </p>
            <p className="text-2xl font-bold text-text-light-primary dark:text-text-dark-primary">
              {loading ? '...' : stats.connectedAccounts}
            </p>
          </div>

          <div className="bg-light-primary dark:bg-dark-secondary border border-border-light dark:border-border-dark rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <TrendingUp className="w-8 h-8 text-orange-500" />
              <span className="text-xs font-medium text-orange-500 bg-orange-500/10 px-2 py-1 rounded">
                +5.3%
              </span>
            </div>
            <p className="text-sm text-text-light-secondary dark:text-text-dark-secondary mb-1">
              Avg ROAS (7d)
            </p>
            <p className="text-2xl font-bold text-text-light-primary dark:text-text-dark-primary">
              {loading ? '...' : stats.avgROAS.toFixed(1)}x
            </p>
          </div>
        </div>

        {isAdmin && (
          <div className="mb-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Shield className="w-6 h-6" />
                  <h3 className="text-xl font-bold">Admin Access</h3>
                </div>
                <p className="text-purple-100 mb-4">
                  Manage users, subscriptions, and system settings
                </p>
                <Link
                  to="/admin"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-white text-purple-600 rounded-lg hover:shadow-lg transition font-medium"
                >
                  <Shield className="w-5 h-5" />
                  Open Admin Panel
                </Link>
              </div>
              <Crown className="w-20 h-20 opacity-20" />
            </div>
          </div>
        )}

        <div className="mb-8 bg-light-primary dark:bg-dark-secondary border border-border-light dark:border-border-dark rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-bold text-text-light-primary dark:text-text-dark-primary">
                Subscription: {subscriptionTier}
              </h3>
              <p className="text-sm text-text-light-secondary dark:text-text-dark-secondary">
                Feature Usage: {usageStats.used} / {usageStats.limit}
              </p>
            </div>
            <Link
              to="/pricing"
              className="px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-lg hover:shadow-lg transition text-sm font-medium"
            >
              Upgrade
            </Link>
          </div>
          <div className="w-full bg-light-secondary dark:bg-dark-tertiary rounded-full h-2">
            <div
              className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full transition-all"
              style={{ width: `${(usageStats.used / usageStats.limit) * 100}%` }}
            />
          </div>
        </div>

        <div className="mb-8">
          <h2 className="text-2xl font-bold text-text-light-primary dark:text-text-dark-primary mb-6">
            Quick Actions
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {features.map((feature) => (
              <Link
                key={feature.href}
                to={feature.href}
                className="group bg-light-primary dark:bg-dark-secondary border border-border-light dark:border-border-dark rounded-xl p-6 hover:shadow-lg transition"
              >
                <div className="flex items-start gap-4">
                  <div className={`flex items-center justify-center w-16 h-16 rounded-xl bg-gradient-to-br ${feature.color}`}>
                    <feature.icon className="w-8 h-8 text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-text-light-primary dark:text-text-dark-primary mb-2 group-hover:text-accent-blue transition">
                      {feature.title}
                    </h3>
                    <p className="text-sm text-text-light-secondary dark:text-text-dark-secondary">
                      {feature.description}
                    </p>
                  </div>
                  <ArrowRight className="w-5 h-5 text-text-light-secondary dark:text-text-dark-secondary opacity-0 group-hover:opacity-100 transition" />
                </div>
              </Link>
            ))}
          </div>
        </div>

        <div className="mb-8">
          <h2 className="text-2xl font-bold text-text-light-primary dark:text-text-dark-primary mb-6">
            Coming Soon
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {comingSoonPlatforms.map((platform) => (
              <div
                key={platform.name}
                className="bg-light-primary dark:bg-dark-secondary border border-border-light dark:border-border-dark rounded-xl p-6 opacity-75 relative overflow-hidden"
              >
                <div className="absolute top-4 right-4 px-3 py-1 bg-gradient-to-r from-yellow-500 to-orange-500 text-white text-xs font-bold rounded-full">
                  COMING SOON
                </div>
                <div className="flex items-start gap-4">
                  <div className={`flex items-center justify-center w-16 h-16 rounded-xl bg-gradient-to-br ${platform.color}`}>
                    <span className="text-3xl">{platform.icon}</span>
                  </div>
                  <div className="flex-1 pr-24">
                    <h3 className="text-lg font-bold text-text-light-primary dark:text-text-dark-primary mb-2">
                      {platform.name}
                    </h3>
                    <p className="text-sm text-text-light-secondary dark:text-text-dark-secondary">
                      {platform.description}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-gradient-to-br from-blue-500 to-purple-500 rounded-xl p-8 text-white">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-2xl font-bold mb-2">Connect Your Facebook Account</h2>
              <p className="text-blue-100 mb-6">
                Get started by connecting your Facebook ad account to unlock all features
              </p>
              <Link
                to="/settings"
                className="inline-flex items-center gap-2 px-6 py-3 bg-white text-purple-600 rounded-lg hover:shadow-lg transition font-medium"
              >
                <Rocket className="w-5 h-5" />
                Get Started
              </Link>
            </div>
            <Zap className="w-24 h-24 opacity-20" />
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
