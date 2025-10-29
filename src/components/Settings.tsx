import DashboardLayout from './DashboardLayout';
import FacebookAuthButton from './FacebookAuthButton';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { useState, useEffect } from 'react';
import { Settings as SettingsIcon, User, CreditCard, Link as LinkIcon, Bell, ArrowUpCircle, ArrowDownCircle, XCircle, Edit } from 'lucide-react';
import { createCheckout, createCustomerPortalSession, cancelSubscription } from '../lib/billingService';

export default function Settings() {
  const { user } = useAuth();
  const [subscriptionTier, setSubscriptionTier] = useState('Free');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showToast, setShowToast] = useState(false);

  const [userProfile, setUserProfile] = useState({
    fullName: '',
    email: user?.email || '',
    companyName: '',
    profileImage: ''
  });

  useEffect(() => {
    loadUserData();
  }, [user]);

  async function loadUserData() {
    if (!user) return;

    try {
      const { data } = await supabase
        .from('users')
        .select('subscription_tier, full_name, company_name')
        .eq('id', user.id)
        .maybeSingle();

      if (data) {
        setSubscriptionTier(data.subscription_tier || 'Free');
        setUserProfile(prev => ({
          ...prev,
          fullName: data.full_name || '',
          companyName: data.company_name || ''
        }));
      }
    } catch (error) {
      console.error('Failed to load user data:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleSaveProfile() {
    if (!user) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from('users')
        .update({
          full_name: userProfile.fullName,
          company_name: userProfile.companyName
        })
        .eq('id', user.id);

      if (!error) {
        setShowToast(true);
        setTimeout(() => setShowToast(false), 3000);
      }
    } catch (error) {
      console.error('Failed to save profile:', error);
    } finally {
      setSaving(false);
    }
  }

  async function handleUpgrade() {
    if (!user) return;

    // For now, default to Pro plan. In production, show a plan selector modal
    await createCheckout({
      plan: 'pro',
      userId: user.id,
      billingCycle: 'monthly'
    });
  }

  async function handleManageBilling() {
    if (!user) return;

    await createCustomerPortalSession(user.id);
  }

  async function handleCancelSubscription() {
    if (!user) return;

    const confirmed = confirm(
      'Are you sure you want to cancel your subscription? It will remain active until the end of your billing period.'
    );

    if (confirmed) {
      const success = await cancelSubscription(user.id);
      if (success) {
        alert('Your subscription has been scheduled for cancellation at the end of the billing period.');
        loadUserData(); // Refresh data
      }
    }
  }

  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto">
        <h1 className="text-4xl font-bold text-text-light-primary dark:text-text-dark-primary mb-4 flex items-center gap-3">
          <SettingsIcon className="w-10 h-10" />
          Settings
        </h1>
        <p className="text-text-light-secondary dark:text-text-dark-secondary mb-8">
          Manage your account, billing, and integrations
        </p>

        {showToast && (
          <div className="fixed top-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg z-50 animate-fade-in">
            ✅ Your changes have been saved successfully.
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* User Account Settings */}
          <div className="bg-light-primary dark:bg-dark-secondary border border-border-light dark:border-border-dark rounded-xl p-6">
            <h2 className="text-2xl font-bold text-text-light-primary dark:text-text-dark-primary mb-6 flex items-center gap-2">
              <User className="w-6 h-6" />
              User Account Settings
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-text-light-secondary dark:text-text-dark-secondary mb-2">
                  Full Name
                </label>
                <input
                  type="text"
                  value={userProfile.fullName}
                  onChange={(e) => setUserProfile({...userProfile, fullName: e.target.value})}
                  placeholder="Enter your full name"
                  className="w-full px-4 py-3 bg-white dark:bg-dark-tertiary border border-border-light dark:border-border-dark rounded-lg text-text-light-primary dark:text-text-dark-primary focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-text-light-secondary dark:text-text-dark-secondary mb-2">
                  Email Address
                </label>
                <input
                  type="email"
                  value={userProfile.email}
                  disabled
                  className="w-full px-4 py-3 bg-light-secondary dark:bg-dark-tertiary border border-border-light dark:border-border-dark rounded-lg text-text-light-secondary dark:text-text-dark-secondary cursor-not-allowed"
                />
                <p className="text-xs text-text-light-secondary dark:text-text-dark-secondary mt-1">
                  Email cannot be changed
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-text-light-secondary dark:text-text-dark-secondary mb-2">
                  Company / Agency Name
                </label>
                <input
                  type="text"
                  value={userProfile.companyName}
                  onChange={(e) => setUserProfile({...userProfile, companyName: e.target.value})}
                  placeholder="Enter company or agency name"
                  className="w-full px-4 py-3 bg-white dark:bg-dark-tertiary border border-border-light dark:border-border-dark rounded-lg text-text-light-primary dark:text-text-dark-primary focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-text-light-secondary dark:text-text-dark-secondary mb-2">
                  Profile Image
                </label>
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold text-2xl">
                    {userProfile.fullName ? userProfile.fullName.charAt(0).toUpperCase() : user?.email?.charAt(0).toUpperCase()}
                  </div>
                  <button className="px-4 py-2 bg-light-secondary dark:bg-dark-tertiary border border-border-light dark:border-border-dark rounded-lg text-text-light-primary dark:text-text-dark-primary hover:bg-light-tertiary dark:hover:bg-dark-primary transition text-sm">
                    Upload Image (Optional)
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-text-light-secondary dark:text-text-dark-secondary mb-2">
                  Password
                </label>
                <button className="px-4 py-2 bg-light-secondary dark:bg-dark-tertiary border border-border-light dark:border-border-dark rounded-lg text-accent-blue dark:text-blue-400 hover:bg-light-tertiary dark:hover:bg-dark-primary transition text-sm font-medium">
                  Change Password
                </button>
              </div>

              <button
                onClick={handleSaveProfile}
                disabled={saving}
                className="w-full px-6 py-3 bg-accent-blue hover:bg-accent-blueHover text-white rounded-lg font-bold transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>

          {/* Billing & Subscription */}
          <div className="bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-6">
            <h2 className="text-2xl font-bold text-text-light-primary dark:text-text-dark-primary mb-6 flex items-center gap-2">
              <CreditCard className="w-6 h-6" />
              Billing & Subscription
            </h2>

            <div className="mb-6">
              <h3 className="text-lg font-bold text-text-light-primary dark:text-text-dark-primary mb-2">
                Current Plan
              </h3>
              <div className="flex items-center justify-between mb-2">
                <p className="text-2xl font-bold text-text-light-primary dark:text-text-dark-primary">
                  {loading ? 'Loading...' : subscriptionTier}
                </p>
                <span className="px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-full text-sm font-medium">
                  Active
                </span>
              </div>
              <p className="text-sm text-text-light-secondary dark:text-text-dark-secondary">
                {subscriptionTier === 'Free' && 'Free Trial - 1 Ad Account'}
                {subscriptionTier === 'Starter' && 'Monthly billing - 3 Ad Accounts'}
                {subscriptionTier === 'Pro' && 'Monthly billing - 5 Ad Accounts'}
                {subscriptionTier === 'Agency' && 'Monthly billing - 10 Ad Accounts'}
              </p>
            </div>

            <div className="mb-6">
              <h3 className="text-lg font-bold text-text-light-primary dark:text-text-dark-primary mb-2">
                Payment Method
              </h3>
              <div className="flex items-center gap-3 p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                <CreditCard className="w-6 h-6 text-gray-400" />
                <div>
                  <p className="text-sm text-text-light-secondary dark:text-text-dark-secondary">
                    {subscriptionTier !== 'Free' ? 'Manage payment methods in billing portal' : 'No payment method on file'}
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              {subscriptionTier === 'Free' ? (
                <button
                  onClick={handleUpgrade}
                  className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-lg hover:shadow-lg transition font-bold"
                >
                  <ArrowUpCircle className="w-5 h-5" />
                  Upgrade to Paid Plan
                </button>
              ) : (
                <>
                  <button
                    onClick={handleUpgrade}
                    className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-lg hover:shadow-lg transition font-bold"
                  >
                    <ArrowUpCircle className="w-5 h-5" />
                    Change Plan
                  </button>

                  <button
                    onClick={handleCancelSubscription}
                    className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-text-light-primary dark:text-text-dark-primary rounded-lg hover:bg-light-secondary dark:hover:bg-dark-tertiary transition font-medium"
                  >
                    <XCircle className="w-5 h-5" />
                    Cancel Subscription
                  </button>

                  <button
                    onClick={handleManageBilling}
                    className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-text-light-primary dark:text-text-dark-primary rounded-lg hover:bg-light-secondary dark:hover:bg-dark-tertiary transition font-medium"
                  >
                    <Edit className="w-5 h-5" />
                    Manage Billing Portal
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Ad Platform Integrations */}
          <div className="lg:col-span-2 bg-light-primary dark:bg-dark-secondary border border-border-light dark:border-border-dark rounded-xl p-6">
            <h2 className="text-2xl font-bold text-text-light-primary dark:text-text-dark-primary mb-6 flex items-center gap-2">
              <LinkIcon className="w-6 h-6" />
              Ad Platform Integrations
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

              {/* Facebook Integration */}
              <div className="p-6 bg-white dark:bg-dark-tertiary border border-border-light dark:border-border-dark rounded-lg">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold text-xl">
                    f
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-text-light-primary dark:text-text-dark-primary">
                      Facebook Integration
                    </h3>
                  </div>
                </div>
                <p className="text-sm text-text-light-secondary dark:text-text-dark-secondary mb-4">
                  Connect your Facebook account to access your ad campaigns.
                </p>
                <FacebookAuthButton />
              </div>

              {/* TikTok Integration - Coming Soon */}
              <div className="p-6 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-lg opacity-60 relative">
                <div className="absolute top-3 right-3 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300 px-3 py-1 rounded-full text-xs font-bold">
                  COMING SOON
                </div>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 bg-black dark:bg-gray-900 rounded-lg flex items-center justify-center text-white font-bold text-xl">
                    🎵
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-text-light-primary dark:text-text-dark-primary">
                      TikTok Ads
                    </h3>
                  </div>
                </div>
                <p className="text-sm text-text-light-secondary dark:text-text-dark-secondary mb-4">
                  Connect and analyze your TikTok campaigns with AI-powered insights.
                </p>
                <button
                  disabled
                  title="Available in upcoming release"
                  className="w-full px-4 py-2 bg-gray-300 dark:bg-gray-700 text-gray-500 dark:text-gray-400 rounded-lg cursor-not-allowed"
                >
                  Connect (Coming Soon)
                </button>
              </div>

              {/* Google Ads - Coming Soon */}
              <div className="p-6 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-lg opacity-60 relative">
                <div className="absolute top-3 right-3 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300 px-3 py-1 rounded-full text-xs font-bold">
                  COMING SOON
                </div>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 via-red-500 via-yellow-500 to-green-500 rounded-lg flex items-center justify-center text-white font-bold text-xl">
                    G
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-text-light-primary dark:text-text-dark-primary">
                      Google Ads
                    </h3>
                  </div>
                </div>
                <p className="text-sm text-text-light-secondary dark:text-text-dark-secondary mb-4">
                  Connect and analyze your Google campaigns with AI-powered insights.
                </p>
                <button
                  disabled
                  title="Available in upcoming release"
                  className="w-full px-4 py-2 bg-gray-300 dark:bg-gray-700 text-gray-500 dark:text-gray-400 rounded-lg cursor-not-allowed"
                >
                  Connect (Coming Soon)
                </button>
              </div>

              {/* Microsoft Ads - Coming Soon */}
              <div className="p-6 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-lg opacity-60 relative">
                <div className="absolute top-3 right-3 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300 px-3 py-1 rounded-full text-xs font-bold">
                  COMING SOON
                </div>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 bg-blue-700 rounded-lg flex items-center justify-center text-white font-bold text-xl">
                    M
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-text-light-primary dark:text-text-dark-primary">
                      Microsoft Ads
                    </h3>
                  </div>
                </div>
                <p className="text-sm text-text-light-secondary dark:text-text-dark-secondary mb-4">
                  Track and improve your Microsoft Ads performance with AI insights.
                </p>
                <button
                  disabled
                  title="Available in upcoming release"
                  className="w-full px-4 py-2 bg-gray-300 dark:bg-gray-700 text-gray-500 dark:text-gray-400 rounded-lg cursor-not-allowed"
                >
                  Connect (Coming Soon)
                </button>
              </div>
            </div>
          </div>

        </div>
      </div>
    </DashboardLayout>
  );
}
