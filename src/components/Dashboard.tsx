import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import DashboardLayout from './DashboardLayout';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { getAdAccounts, getCampaigns, checkFacebookConnection, getSelectedAccount, getInsights } from '../lib/facebookService';
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
  const [facebookConnected, setFacebookConnected] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState<any>(null);
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

        // Admin override: grant Agency tier access
        if (user.email === 'ironzola@gmail.com') {
          setSubscriptionTier('Agency');
        } else {
          setSubscriptionTier(userData.subscription_tier || 'Free');
        }
      }

      const connected = await checkFacebookConnection();
      setFacebookConnected(connected);

      if (connected) {
        const savedAccount = await getSelectedAccount();
        setSelectedAccount(savedAccount);

        if (savedAccount) {
          try {
            const insights = await getInsights(savedAccount.account_id, 'last_7d');

            const accounts = await getAdAccounts();
            const totalAccounts = accounts.length;

            const response = await getCampaigns(savedAccount.account_id);
            const campaigns = response.data || [];
            const activeCampaigns = campaigns.filter((c: any) => c.status === 'ACTIVE').length;

            setStats({
              totalCampaigns: activeCampaigns,
              totalSpend: parseFloat(insights.spend),
              avgROAS: parseFloat(insights.roas),
              connectedAccounts: totalAccounts,
            });
          } catch (error) {
            console.log('Failed to load Facebook insights:', error);
          }
        }
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
      title: 'Pre-Launch Validator',
      description: 'Evaluate ad creatives before they go live to predict engagement and conversion potential.',
      icon: Rocket,
      href: '/validator',
      color: 'from-blue-500 to-purple-500',
      tooltip: 'Click to start new ad validation',
    },
    {
      title: 'Ad Doctor',
      description: 'Diagnose campaign inefficiencies and prescribe corrective actions using AI insights.',
      icon: Stethoscope,
      href: '/doctor',
      color: 'from-red-500 to-pink-500',
      tooltip: 'Diagnose your campaign\'s performance in real time',
    },
    {
      title: 'Creative Insights',
      description: 'Detect fatigue, audience mismatch, and creative design patterns that underperform.',
      icon: ImageIcon,
      href: '/creative',
      color: 'from-purple-500 to-pink-500',
      tooltip: 'Reveal audience trends and creative patterns',
    },
    {
      title: 'Reports & Analytics',
      description: 'Comprehensive campaign performance analysis with export options (PDF, CSV, and Excel).',
      icon: BarChart3,
      href: '/reports',
      color: 'from-green-500 to-teal-500',
      tooltip: 'View and export your campaign results',
    },
  ];

  const comingSoonPlatforms = [
    {
      name: 'TikTok Ads',
      description: 'Connect and analyze your TikTok campaigns with AI-powered insights.',
      icon: '🎵',
      color: 'from-pink-500 to-rose-500',
      bgColor: 'bg-pink-500/10',
    },
    {
      name: 'Google Ads',
      description: 'Optimize your Google Ads with advanced analytics and recommendations.',
      icon: '🔍',
      color: 'from-blue-500 to-indigo-500',
      bgColor: 'bg-blue-500/10',
    },
    {
      name: 'Microsoft Ads',
      description: 'Track and improve your Microsoft Ads performance with AI insights.',
      icon: '📊',
      color: 'from-purple-500 to-violet-500',
      bgColor: 'bg-purple-500/10',
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

        {!facebookConnected && (
          <div className="mb-6 bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/20 rounded-xl p-6">
            <div className="flex items-start gap-4">
              <AlertCircle className="w-6 h-6 text-blue-500 flex-shrink-0 mt-1" />
              <div className="flex-1">
                <h3 className="text-lg font-bold text-text-light-primary dark:text-text-dark-primary mb-2">
                  Connect Your Facebook Account
                </h3>
                <p className="text-text-light-secondary dark:text-text-dark-secondary mb-4">
                  Connect your Facebook account and select an ad account to unlock live analytics and AI-powered insights.
                </p>
                <Link
                  to="/settings"
                  className="inline-flex items-center gap-2 px-6 py-2 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-lg hover:shadow-lg transition font-medium"
                >
                  <Rocket className="w-4 h-4" />
                  Go to Settings
                </Link>
              </div>
            </div>
          </div>
        )}

        {facebookConnected && !selectedAccount && (
          <div className="mb-6 bg-gradient-to-r from-yellow-500/10 to-orange-500/10 border border-yellow-500/20 rounded-xl p-6">
            <div className="flex items-start gap-4">
              <AlertCircle className="w-6 h-6 text-yellow-500 flex-shrink-0 mt-1" />
              <div className="flex-1">
                <h3 className="text-lg font-bold text-text-light-primary dark:text-text-dark-primary mb-2">
                  Select Your Ad Account
                </h3>
                <p className="text-text-light-secondary dark:text-text-dark-secondary mb-4">
                  You're connected to Facebook! Now select an ad account in Settings to see your live campaign data.
                </p>
                <Link
                  to="/settings"
                  className="inline-flex items-center gap-2 px-6 py-2 bg-gradient-to-r from-yellow-500 to-orange-500 text-white rounded-lg hover:shadow-lg transition font-medium"
                >
                  Select Account
                </Link>
              </div>
            </div>
          </div>
        )}

        <div className="mb-8">
          <h2 className="text-xl font-bold text-text-light-primary dark:text-text-dark-primary mb-4">
            Upcoming Ad Platforms
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {comingSoonPlatforms.map((platform) => (
              <div
                key={platform.name}
                className="group bg-light-primary dark:bg-dark-secondary border border-border-light dark:border-border-dark rounded-lg p-4 relative overflow-hidden transition-all duration-200 hover:shadow-lg hover:scale-102 cursor-pointer"
              >
                <div className="absolute top-2 right-2 px-2 py-0.5 bg-gradient-to-r from-pink-500 to-orange-500 text-white text-[10px] font-bold rounded-full">
                  COMING SOON
                </div>
                <div className="flex items-center gap-3">
                  <div className={`flex items-center justify-center w-12 h-12 rounded-lg bg-gradient-to-br ${platform.color} flex-shrink-0`}>
                    <span className="text-2xl">{platform.icon}</span>
                  </div>
                  <div className="flex-1 pr-16">
                    <h3 className="text-base font-bold text-text-light-primary dark:text-text-dark-primary mb-1">
                      {platform.name}
                    </h3>
                    <p className="text-xs text-text-light-secondary dark:text-text-dark-secondary line-clamp-2">
                      {platform.description}
                    </p>
                  </div>
                </div>
                <div className={`absolute inset-0 ${platform.bgColor} opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none rounded-lg`} />
              </div>
            ))}
          </div>
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
                className="group relative bg-light-primary dark:bg-dark-secondary border border-border-light dark:border-border-dark rounded-xl p-6 hover:shadow-lg transition-all duration-300"
                title={feature.tooltip}
              >
                <div className="flex items-start gap-4">
                  <div className={`flex items-center justify-center w-16 h-16 rounded-xl bg-gradient-to-br ${feature.color} transition-transform duration-300 group-hover:scale-110`}>
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
                  <ArrowRight className="w-5 h-5 text-text-light-secondary dark:text-text-dark-secondary opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                </div>

                {/* Hover tooltip */}
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
                  {feature.tooltip}
                  <div className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
                </div>
              </Link>
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
