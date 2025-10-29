import DashboardLayout from './DashboardLayout';
import FacebookAuthButton from './FacebookAuthButton';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { useState, useEffect } from 'react';
import { Settings as SettingsIcon, User, Shield, CreditCard, Crown, Lock } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Settings() {
  const { user } = useAuth();
  const [subscriptionTier, setSubscriptionTier] = useState('Free');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUserData();
  }, [user]);

  async function loadUserData() {
    if (!user) return;

    try {
      const { data } = await supabase
        .from('users')
        .select('subscription_tier')
        .eq('id', user.id)
        .maybeSingle();

      if (data) {
        setSubscriptionTier(data.subscription_tier || 'Free');
      }
    } catch (error) {
      console.error('Failed to load user data:', error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold text-text-light-primary dark:text-text-dark-primary mb-4 flex items-center gap-3">
          <SettingsIcon className="w-10 h-10" />
          Settings
        </h1>
        <p className="text-text-light-secondary dark:text-text-dark-secondary mb-8">
          Manage your account and preferences
        </p>

        <div className="space-y-6">
          <div className="bg-light-primary dark:bg-dark-secondary border border-border-light dark:border-border-dark rounded-xl p-6">
            <h2 className="text-xl font-bold text-text-light-primary dark:text-text-dark-primary mb-4 flex items-center gap-2">
              <User className="w-6 h-6" />
              Account Information
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-text-light-secondary dark:text-text-dark-secondary mb-1">
                  Email
                </label>
                <input
                  type="email"
                  value={user?.email || ''}
                  disabled
                  className="w-full px-4 py-2 bg-light-secondary dark:bg-dark-tertiary border border-border-light dark:border-border-dark rounded-lg text-text-light-primary dark:text-text-dark-primary"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-text-light-secondary dark:text-text-dark-secondary mb-1">
                  User ID
                </label>
                <input
                  type="text"
                  value={user?.id || ''}
                  disabled
                  className="w-full px-4 py-2 bg-light-secondary dark:bg-dark-tertiary border border-border-light dark:border-border-dark rounded-lg text-text-light-primary dark:text-text-dark-primary text-xs font-mono"
                />
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-6">
            <h2 className="text-xl font-bold text-text-light-primary dark:text-text-dark-primary mb-4 flex items-center gap-2">
              <Crown className="w-6 h-6 text-yellow-500" />
              Subscription Plan
            </h2>
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-2xl font-bold text-text-light-primary dark:text-text-dark-primary">
                  {loading ? 'Loading...' : subscriptionTier}
                </p>
                <p className="text-sm text-text-light-secondary dark:text-text-dark-secondary">
                  Current plan
                </p>
              </div>
              <Link
                to="/pricing"
                className="px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-lg hover:shadow-lg transition font-medium"
              >
                Upgrade Plan
              </Link>
            </div>
            <div className="text-sm text-text-light-secondary dark:text-text-dark-secondary">
              {subscriptionTier === 'Free' && 'Upgrade to Pro or Enterprise for unlimited features'}
              {subscriptionTier === 'Pro' && 'You have access to professional features'}
              {subscriptionTier === 'Enterprise' && 'You have access to all features'}
            </div>
          </div>

          <div className="bg-light-primary dark:bg-dark-secondary border border-border-light dark:border-border-dark rounded-xl p-6">
            <h2 className="text-xl font-bold text-text-light-primary dark:text-text-dark-primary mb-4 flex items-center gap-2">
              <Shield className="w-6 h-6" />
              Facebook Integration
            </h2>
            <p className="text-text-light-secondary dark:text-text-dark-secondary mb-4">
              Connect your Facebook account to access your ad campaigns
            </p>
            <FacebookAuthButton />
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
