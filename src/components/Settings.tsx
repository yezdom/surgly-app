import DashboardLayout from './DashboardLayout';
import FacebookAuthButton from './FacebookAuthButton';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Settings as SettingsIcon, User, CreditCard, Link as LinkIcon, Bell, ArrowUpCircle, ArrowDownCircle, XCircle, Edit, CheckCircle, AlertCircle } from 'lucide-react';
import { createCheckout, createCustomerPortalSession, cancelSubscription } from '../lib/billingService';
import { checkFacebookConnection, getBusinesses, getAdAccountsFromBusiness, saveSelectedAccount, getSelectedAccount } from '../lib/facebookService';

type SettingsTab = 'account' | 'billing' | 'integrations';

export default function Settings() {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState<SettingsTab>('account');
  const [subscriptionTier, setSubscriptionTier] = useState('Free');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [showErrorToast, setShowErrorToast] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const [userProfile, setUserProfile] = useState({
    fullName: '',
    email: user?.email || '',
    companyName: '',
    profileImage: ''
  });

  const [facebookConnected, setFacebookConnected] = useState(false);
  const [businesses, setBusinesses] = useState<any[]>([]);
  const [adAccounts, setAdAccounts] = useState<any[]>([]);
  const [selectedBusiness, setSelectedBusiness] = useState('');
  const [selectedAdAccount, setSelectedAdAccount] = useState('');
  const [loadingFB, setLoadingFB] = useState(false);
  const [savingAccount, setSavingAccount] = useState(false);

  useEffect(() => {
    loadUserData();
    checkFBConnection();

    const tab = searchParams.get('tab') as SettingsTab;
    if (tab && ['account', 'billing', 'integrations'].includes(tab)) {
      setActiveTab(tab);
    }

    const error = searchParams.get('error');
    if (error) {
      setShowErrorToast(true);

      if (error === 'redirect_mismatch' || error === 'no_code' || error === 'oauth_failed') {
        setErrorMessage('Facebook connection failed. Please verify redirect URL settings in your Facebook Developer App.');
      } else {
        setErrorMessage('Facebook connection failed. Please try again.');
      }

      setTimeout(() => setShowErrorToast(false), 5000);
    }
  }, [user, searchParams]);

  useEffect(() => {
    if (facebookConnected) {
      loadBusinesses();
      loadSavedAccount();
    }
  }, [facebookConnected]);

  useEffect(() => {
    if (selectedBusiness) {
      loadAdAccounts();
    }
  }, [selectedBusiness]);

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

  async function checkFBConnection() {
    const connected = await checkFacebookConnection();
    setFacebookConnected(connected);
  }

  async function loadBusinesses() {
    try {
      setLoadingFB(true);
      const bizList = await getBusinesses();
      setBusinesses(bizList);
    } catch (error) {
      console.error('Failed to load businesses:', error);
    } finally {
      setLoadingFB(false);
    }
  }

  async function loadAdAccounts() {
    if (!selectedBusiness) return;

    try {
      setLoadingFB(true);
      const accounts = await getAdAccountsFromBusiness(selectedBusiness);
      setAdAccounts(accounts);
    } catch (error) {
      console.error('Failed to load ad accounts:', error);
    } finally {
      setLoadingFB(false);
    }
  }

  async function loadSavedAccount() {
    try {
      const saved = await getSelectedAccount();
      if (saved) {
        setSelectedBusiness(saved.business_id);
        setSelectedAdAccount(saved.account_id);
      }
    } catch (error) {
      console.error('Failed to load saved account:', error);
    }
  }

  async function handleSaveAccount() {
    if (!selectedBusiness || !selectedAdAccount) {
      alert('Please select both a business and an ad account.');
      return;
    }

    try {
      setSavingAccount(true);
      const accountName = adAccounts.find(a => a.account_id === selectedAdAccount)?.name || 'Ad Account';
      await saveSelectedAccount(selectedBusiness, selectedAdAccount, accountName);
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
    } catch (error) {
      console.error('Failed to save account:', error);
      alert('Failed to save ad account selection.');
    } finally {
      setSavingAccount(false);
    }
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
        loadUserData();
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
          <div className="fixed top-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg z-50 animate-fade-in flex items-center gap-2">
            <CheckCircle className="w-5 h-5" />
            Your changes have been saved successfully.
          </div>
        )}

        {showErrorToast && (
          <div className="fixed top-4 right-4 bg-red-500 text-white px-6 py-3 rounded-lg shadow-lg z-50 animate-fade-in flex items-center gap-2">
            <AlertCircle className="w-5 h-5" />
            {errorMessage}
          </div>
        )}

        {/* Tab Navigation */}
        <div className="flex gap-2 mb-8 border-b border-border-light dark:border-border-dark">
          <button
            onClick={() => setActiveTab('account')}
            className={`px-6 py-3 font-medium transition border-b-2 ${
              activeTab === 'account'
                ? 'border-blue-500 text-blue-500'
                : 'border-transparent text-text-light-secondary dark:text-text-dark-secondary hover:text-text-light-primary dark:hover:text-text-dark-primary'
            }`}
          >
            <User className="w-4 h-4 inline mr-2" />
            Account
          </button>
          <button
            onClick={() => setActiveTab('billing')}
            className={`px-6 py-3 font-medium transition border-b-2 ${
              activeTab === 'billing'
                ? 'border-blue-500 text-blue-500'
                : 'border-transparent text-text-light-secondary dark:text-text-dark-secondary hover:text-text-light-primary dark:hover:text-text-dark-primary'
            }`}
          >
            <CreditCard className="w-4 h-4 inline mr-2" />
            Billing
          </button>
          <button
            onClick={() => setActiveTab('integrations')}
            className={`px-6 py-3 font-medium transition border-b-2 ${
              activeTab === 'integrations'
                ? 'border-blue-500 text-blue-500'
                : 'border-transparent text-text-light-secondary dark:text-text-dark-secondary hover:text-text-light-primary dark:hover:text-text-dark-primary'
            }`}
          >
            <LinkIcon className="w-4 h-4 inline mr-2" />
            Integrations
          </button>
        </div>

        {/* Tab Content */}
        <div className="pb-8">
          {/* Account Tab */}
          {activeTab === 'account' && (
            <div className="bg-light-primary dark:bg-dark-secondary border border-border-light dark:border-border-dark rounded-xl p-8 max-w-2xl">
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
          )}

          {/* Billing Tab */}
          {activeTab === 'billing' && (
            <div className="bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-8 max-w-2xl">
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
          )}

          {/* Integrations Tab */}
          {activeTab === 'integrations' && (
            <div className="space-y-6">
              {/* Facebook Integration */}
              <div className="bg-light-primary dark:bg-dark-secondary border border-border-light dark:border-border-dark rounded-xl p-8">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold text-xl">
                      f
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-text-light-primary dark:text-text-dark-primary">
                        Facebook Integration
                      </h3>
                      {facebookConnected && (
                        <div className="flex items-center gap-1 text-sm text-green-600 dark:text-green-400">
                          <CheckCircle className="w-4 h-4" />
                          Connected
                        </div>
                      )}
                    </div>
                  </div>
                  <FacebookAuthButton />
                </div>

                {facebookConnected && (
                  <div className="space-y-4 mt-6 pt-6 border-t border-border-light dark:border-border-dark">
                    <p className="text-sm text-text-light-secondary dark:text-text-dark-secondary mb-4">
                      Select your business and ad account to analyze campaigns
                    </p>

                    <div>
                      <label className="block text-sm font-medium text-text-light-secondary dark:text-text-dark-secondary mb-2">
                        Business
                      </label>
                      <select
                        value={selectedBusiness}
                        onChange={(e) => setSelectedBusiness(e.target.value)}
                        disabled={loadingFB}
                        className="w-full px-4 py-2 bg-white dark:bg-dark-tertiary border border-border-light dark:border-border-dark rounded-lg text-text-light-primary dark:text-text-dark-primary focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">Select a business...</option>
                        {businesses.map((biz) => (
                          <option key={biz.id} value={biz.id}>
                            {biz.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    {selectedBusiness && (
                      <div>
                        <label className="block text-sm font-medium text-text-light-secondary dark:text-text-dark-secondary mb-2">
                          Ad Account
                        </label>
                        <select
                          value={selectedAdAccount}
                          onChange={(e) => setSelectedAdAccount(e.target.value)}
                          disabled={loadingFB}
                          className="w-full px-4 py-2 bg-white dark:bg-dark-tertiary border border-border-light dark:border-border-dark rounded-lg text-text-light-primary dark:text-text-dark-primary focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="">Select an ad account...</option>
                          {adAccounts.map((account) => (
                            <option key={account.id} value={account.account_id}>
                              {account.name} ({account.account_id})
                            </option>
                          ))}
                        </select>
                      </div>
                    )}

                    {selectedBusiness && selectedAdAccount && (
                      <button
                        onClick={handleSaveAccount}
                        disabled={savingAccount}
                        className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition disabled:opacity-50"
                      >
                        {savingAccount ? 'Saving...' : 'Save Selection'}
                      </button>
                    )}
                  </div>
                )}
              </div>

              {/* Coming Soon Platforms */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
