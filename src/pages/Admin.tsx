import { useState, useEffect } from 'react';
import DashboardLayout from '../components/DashboardLayout';
import { supabase } from '../lib/supabase';
import {
  syncStripeCustomers,
  refundPayment,
  cancelUserSubscription,
} from '../lib/adminService';
import {
  Shield,
  Users,
  DollarSign,
  Activity,
  Search,
  ChevronDown,
  ChevronUp,
  Ban,
  Trash2,
  CheckCircle,
  AlertCircle,
  ExternalLink,
  RefreshCw,
  CreditCard,
  XCircle,
  Receipt,
  Eye,
} from 'lucide-react';

interface User {
  id: string;
  email: string;
  created_at: string;
  subscription_tier: string;
  is_active: boolean;
  is_admin: boolean;
  stripe_customer_id?: string;
  stripe_subscription_id?: string;
}

interface BillingEvent {
  id: string;
  user_id: string;
  event_type: string;
  stripe_event_id: string;
  amount: number;
  currency: string;
  created_at: string;
  metadata?: any;
  user_email?: string;
}

type TabType = 'users' | 'billing' | 'stripe';

export default function Admin() {
  const [activeTab, setActiveTab] = useState<TabType>('users');
  const [users, setUsers] = useState<User[]>([]);
  const [billingEvents, setBillingEvents] = useState<BillingEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' }>({
    key: 'created_at',
    direction: 'desc',
  });
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeSubscriptions: 0,
    tierCounts: { Free: 0, Starter: 0, Growth: 0, Pro: 0, Agency: 0 },
    recentActivity: 0,
  });
  const [confirmAction, setConfirmAction] = useState<{ type: string; userId: string } | null>(null);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [userBillingEvents, setUserBillingEvents] = useState<BillingEvent[]>([]);
  const [refundModal, setRefundModal] = useState<{ open: boolean; paymentId: string; reason: string }>({
    open: false,
    paymentId: '',
    reason: '',
  });
  const [cancelModal, setCancelModal] = useState<{ open: boolean; userId: string; reason: string }>({
    open: false,
    userId: '',
    reason: '',
  });
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    loadAdminData();
  }, []);

  useEffect(() => {
    if (activeTab === 'billing') {
      loadBillingEvents();
    }
  }, [activeTab]);

  async function loadAdminData() {
    try {
      setLoading(true);

      const { data: usersData, error: usersError } = await supabase
        .from('users')
        .select('*')
        .order('created_at', { ascending: false });

      if (usersError) throw usersError;

      setUsers(usersData || []);

      const tierCounts = { Free: 0, Starter: 0, Growth: 0, Pro: 0, Agency: 0 };
      let activeCount = 0;

      (usersData || []).forEach((user: User) => {
        if (user.subscription_tier) {
          tierCounts[user.subscription_tier as keyof typeof tierCounts]++;
        }
        if (user.is_active) {
          activeCount++;
        }
      });

      const { count: activityCount } = await supabase
        .from('feature_usage')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString());

      setStats({
        totalUsers: usersData?.length || 0,
        activeSubscriptions: activeCount,
        tierCounts,
        recentActivity: activityCount || 0,
      });
    } catch (error) {
      console.error('Failed to load admin data:', error);
    } finally {
      setLoading(false);
    }
  }

  async function loadBillingEvents() {
    try {
      const { data, error } = await supabase
        .from('billing_events')
        .select(`
          *,
          users!inner(email)
        `)
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) throw error;

      const eventsWithEmail = (data || []).map((event: any) => ({
        ...event,
        user_email: event.users?.email || 'Unknown',
      }));

      setBillingEvents(eventsWithEmail);
    } catch (error) {
      console.error('Failed to load billing events:', error);
    }
  }

  async function handleSuspendUser(userId: string) {
    try {
      const user = users.find(u => u.id === userId);
      const { error } = await supabase
        .from('users')
        .update({ is_active: !user?.is_active })
        .eq('id', userId);

      if (error) throw error;

      await loadAdminData();
      setConfirmAction(null);
    } catch (error) {
      console.error('Failed to suspend user:', error);
      alert('Failed to update user status');
    }
  }

  async function handleDeleteUser(userId: string) {
    try {
      const { error } = await supabase.from('users').delete().eq('id', userId);

      if (error) throw error;

      await loadAdminData();
      setConfirmAction(null);
    } catch (error) {
      console.error('Failed to delete user:', error);
      alert('Failed to delete user');
    }
  }

  async function handleViewUserDetails(userId: string) {
    const user = users.find(u => u.id === userId);
    if (!user) return;

    setSelectedUser(user);

    try {
      const { data, error } = await supabase
        .from('billing_events')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setUserBillingEvents(data || []);
    } catch (error) {
      console.error('Failed to load user billing events:', error);
      setUserBillingEvents([]);
    }
  }

  async function handleSyncStripe() {
    try {
      setProcessing(true);
      const result = await syncStripeCustomers();
      alert(`Successfully synced ${result.syncedCount} of ${result.totalCustomers} customers`);
      await loadAdminData();
    } catch (error) {
      alert(`Failed to sync: ${error.message}`);
    } finally {
      setProcessing(false);
    }
  }

  async function handleRefund() {
    if (!refundModal.paymentId) {
      alert('Please enter a Payment Intent ID');
      return;
    }

    try {
      setProcessing(true);
      const result = await refundPayment(refundModal.paymentId, refundModal.reason);
      alert(`Refund successful: ${result.refund?.id}`);
      setRefundModal({ open: false, paymentId: '', reason: '' });
      await loadBillingEvents();
    } catch (error) {
      alert(`Refund failed: ${error.message}`);
    } finally {
      setProcessing(false);
    }
  }

  async function handleCancelSubscription() {
    if (!cancelModal.userId) return;

    try {
      setProcessing(true);
      const result = await cancelUserSubscription(cancelModal.userId, cancelModal.reason);
      alert(result.message || 'Subscription cancelled successfully');
      setCancelModal({ open: false, userId: '', reason: '' });
      await loadAdminData();
    } catch (error) {
      alert(`Failed to cancel subscription: ${error.message}`);
    } finally {
      setProcessing(false);
    }
  }

  function handleSort(key: string) {
    setSortConfig({
      key,
      direction: sortConfig.key === key && sortConfig.direction === 'asc' ? 'desc' : 'asc',
    });
  }

  const filteredUsers = users
    .filter(user => user.email.toLowerCase().includes(searchTerm.toLowerCase()))
    .sort((a, b) => {
      const aValue = a[sortConfig.key as keyof User] || '';
      const bValue = b[sortConfig.key as keyof User] || '';

      if (sortConfig.direction === 'asc') {
        return aValue > bValue ? 1 : -1;
      }
      return aValue < bValue ? 1 : -1;
    });

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto">
        {/* Admin Testing Mode Banner */}
        <div className="mb-6 bg-gradient-to-r from-purple-500/10 via-blue-500/10 to-purple-500/10 border border-purple-500/30 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="text-2xl">🧠</div>
            <div>
              <h2 className="text-lg font-bold text-purple-600 dark:text-purple-400">
                Admin Panel — Testing Mode Enabled
              </h2>
              <p className="text-sm text-text-light-secondary dark:text-text-dark-secondary">
                Full access to user management, billing controls, and system analytics
              </p>
            </div>
          </div>
        </div>

        <div className="mb-8">
          <h1 className="text-4xl font-bold text-text-light-primary dark:text-text-dark-primary mb-2 flex items-center gap-3">
            <Shield className="w-10 h-10 text-blue-500" />
            Admin Panel
          </h1>
          <p className="text-text-light-secondary dark:text-text-dark-secondary">
            Manage users, billing, and Stripe integration
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-light-primary dark:bg-dark-secondary border border-border-light dark:border-border-dark rounded-xl p-6">
            <Users className="w-8 h-8 text-blue-500 mb-4" />
            <p className="text-sm text-text-light-secondary dark:text-text-dark-secondary mb-1">
              Total Users
            </p>
            <p className="text-3xl font-bold text-text-light-primary dark:text-text-dark-primary">
              {stats.totalUsers}
            </p>
          </div>

          <div className="bg-light-primary dark:bg-dark-secondary border border-border-light dark:border-border-dark rounded-xl p-6">
            <CheckCircle className="w-8 h-8 text-green-500 mb-4" />
            <p className="text-sm text-text-light-secondary dark:text-text-dark-secondary mb-1">
              Active Subscriptions
            </p>
            <p className="text-3xl font-bold text-text-light-primary dark:text-text-dark-primary">
              {stats.activeSubscriptions}
            </p>
          </div>

          <div className="bg-light-primary dark:bg-dark-secondary border border-border-light dark:border-border-dark rounded-xl p-6">
            <DollarSign className="w-8 h-8 text-green-500 mb-4" />
            <p className="text-sm text-text-light-secondary dark:text-text-dark-secondary mb-1">
              Pro/Agency Users
            </p>
            <p className="text-3xl font-bold text-text-light-primary dark:text-text-dark-primary">
              {stats.tierCounts.Pro + stats.tierCounts.Agency}
            </p>
          </div>

          <div className="bg-light-primary dark:bg-dark-secondary border border-border-light dark:border-border-dark rounded-xl p-6">
            <Activity className="w-8 h-8 text-orange-500 mb-4" />
            <p className="text-sm text-text-light-secondary dark:text-text-dark-secondary mb-1">
              Activity (7d)
            </p>
            <p className="text-3xl font-bold text-text-light-primary dark:text-text-dark-primary">
              {stats.recentActivity}
            </p>
          </div>
        </div>

        <div className="bg-light-primary dark:bg-dark-secondary border border-border-light dark:border-border-dark rounded-xl mb-8">
          <div className="border-b border-border-light dark:border-border-dark">
            <div className="flex gap-4 px-6">
              <button
                onClick={() => setActiveTab('users')}
                className={`py-4 px-2 font-semibold border-b-2 transition ${
                  activeTab === 'users'
                    ? 'border-blue-500 text-blue-500'
                    : 'border-transparent text-text-light-secondary dark:text-text-dark-secondary hover:text-text-light-primary dark:hover:text-text-dark-primary'
                }`}
              >
                <Users className="w-5 h-5 inline-block mr-2" />
                Users Overview
              </button>
              <button
                onClick={() => setActiveTab('billing')}
                className={`py-4 px-2 font-semibold border-b-2 transition ${
                  activeTab === 'billing'
                    ? 'border-blue-500 text-blue-500'
                    : 'border-transparent text-text-light-secondary dark:text-text-dark-secondary hover:text-text-light-primary dark:hover:text-text-dark-primary'
                }`}
              >
                <Receipt className="w-5 h-5 inline-block mr-2" />
                Billing History
              </button>
              <button
                onClick={() => setActiveTab('stripe')}
                className={`py-4 px-2 font-semibold border-b-2 transition ${
                  activeTab === 'stripe'
                    ? 'border-blue-500 text-blue-500'
                    : 'border-transparent text-text-light-secondary dark:text-text-dark-secondary hover:text-text-light-primary dark:hover:text-text-dark-primary'
                }`}
              >
                <CreditCard className="w-5 h-5 inline-block mr-2" />
                Stripe Management
              </button>
            </div>
          </div>

          <div className="p-6">
            {activeTab === 'users' && (
              <div>
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold text-text-light-primary dark:text-text-dark-primary">
                    User Management
                  </h2>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-text-light-secondary dark:text-text-dark-secondary" />
                    <input
                      type="text"
                      placeholder="Search users..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 pr-4 py-2 bg-light-secondary dark:bg-dark-tertiary border border-border-light dark:border-border-dark rounded-lg text-text-light-primary dark:text-text-dark-primary"
                    />
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-border-light dark:border-border-dark">
                        <th
                          className="text-left py-3 px-4 cursor-pointer hover:bg-light-secondary dark:hover:bg-dark-tertiary"
                          onClick={() => handleSort('email')}
                        >
                          <div className="flex items-center gap-2">
                            Email
                            {sortConfig.key === 'email' &&
                              (sortConfig.direction === 'asc' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />)}
                          </div>
                        </th>
                        <th
                          className="text-left py-3 px-4 cursor-pointer hover:bg-light-secondary dark:hover:bg-dark-tertiary"
                          onClick={() => handleSort('created_at')}
                        >
                          <div className="flex items-center gap-2">
                            Created
                            {sortConfig.key === 'created_at' &&
                              (sortConfig.direction === 'asc' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />)}
                          </div>
                        </th>
                        <th className="text-left py-3 px-4">Tier</th>
                        <th className="text-left py-3 px-4">Status</th>
                        <th className="text-left py-3 px-4">Role</th>
                        <th className="text-right py-3 px-4">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredUsers.map((user) => (
                        <tr
                          key={user.id}
                          className="border-b border-border-light dark:border-border-dark hover:bg-light-secondary dark:hover:bg-dark-tertiary"
                        >
                          <td className="py-3 px-4 text-text-light-primary dark:text-text-dark-primary">
                            {user.email}
                          </td>
                          <td className="py-3 px-4 text-text-light-secondary dark:text-text-dark-secondary text-sm">
                            {new Date(user.created_at).toLocaleDateString()}
                          </td>
                          <td className="py-3 px-4">
                            <span className="px-2 py-1 bg-blue-500/10 text-blue-500 rounded text-xs">
                              {user.subscription_tier || 'Free'}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <span
                              className={`px-2 py-1 rounded text-xs ${
                                user.is_active
                                  ? 'bg-green-500/10 text-green-500'
                                  : 'bg-red-500/10 text-red-500'
                              }`}
                            >
                              {user.is_active ? 'Active' : 'Suspended'}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            {user.is_admin && (
                              <span className="px-2 py-1 bg-blue-500/10 text-blue-500 rounded text-xs">
                                Admin
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => handleViewUserDetails(user.id)}
                                className="p-2 hover:bg-blue-500/10 text-blue-500 rounded-lg transition"
                                title="View Details"
                              >
                                <Eye className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => setConfirmAction({ type: 'suspend', userId: user.id })}
                                className={`p-2 rounded-lg transition ${
                                  user.is_active
                                    ? 'hover:bg-yellow-500/10 text-yellow-500'
                                    : 'hover:bg-green-500/10 text-green-500'
                                }`}
                                title={user.is_active ? 'Suspend' : 'Activate'}
                              >
                                {user.is_active ? <Ban className="w-4 h-4" /> : <CheckCircle className="w-4 h-4" />}
                              </button>
                              <button
                                onClick={() => setConfirmAction({ type: 'delete', userId: user.id })}
                                className="p-2 hover:bg-red-500/10 text-red-500 rounded-lg transition"
                                title="Delete"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {activeTab === 'billing' && (
              <div>
                <h2 className="text-xl font-bold text-text-light-primary dark:text-text-dark-primary mb-6">
                  Billing History
                </h2>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-border-light dark:border-border-dark">
                        <th className="text-left py-3 px-4">Date</th>
                        <th className="text-left py-3 px-4">User Email</th>
                        <th className="text-left py-3 px-4">Event Type</th>
                        <th className="text-left py-3 px-4">Amount</th>
                        <th className="text-left py-3 px-4">Stripe Event ID</th>
                      </tr>
                    </thead>
                    <tbody>
                      {billingEvents.map((event) => (
                        <tr
                          key={event.id}
                          className="border-b border-border-light dark:border-border-dark hover:bg-light-secondary dark:hover:bg-dark-tertiary"
                        >
                          <td className="py-3 px-4 text-text-light-secondary dark:text-text-dark-secondary text-sm">
                            {new Date(event.created_at).toLocaleString()}
                          </td>
                          <td className="py-3 px-4 text-text-light-primary dark:text-text-dark-primary">
                            {event.user_email}
                          </td>
                          <td className="py-3 px-4">
                            <span className="px-2 py-1 bg-blue-500/10 text-blue-500 rounded text-xs">
                              {event.event_type}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-text-light-primary dark:text-text-dark-primary font-semibold">
                            £{(event.amount / 100).toFixed(2)}
                          </td>
                          <td className="py-3 px-4 text-text-light-secondary dark:text-text-dark-secondary text-xs font-mono">
                            {event.stripe_event_id}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {billingEvents.length === 0 && (
                    <div className="text-center py-12 text-text-light-secondary dark:text-text-dark-secondary">
                      No billing events found
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'stripe' && (
              <div>
                <h2 className="text-xl font-bold text-text-light-primary dark:text-text-dark-primary mb-6">
                  Stripe Management Tools
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="border border-border-light dark:border-border-dark rounded-xl p-6">
                    <ExternalLink className="w-8 h-8 text-blue-500 mb-4" />
                    <h3 className="text-lg font-bold text-text-light-primary dark:text-text-dark-primary mb-2">
                      Open Stripe Dashboard
                    </h3>
                    <p className="text-sm text-text-light-secondary dark:text-text-dark-secondary mb-4">
                      Manage customers, payments, and subscriptions directly in Stripe
                    </p>
                    <a
                      href="https://dashboard.stripe.com/test/customers"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition"
                    >
                      Open Dashboard
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  </div>

                  <div className="border border-border-light dark:border-border-dark rounded-xl p-6">
                    <RefreshCw className="w-8 h-8 text-green-500 mb-4" />
                    <h3 className="text-lg font-bold text-text-light-primary dark:text-text-dark-primary mb-2">
                      Sync Stripe Customers
                    </h3>
                    <p className="text-sm text-text-light-secondary dark:text-text-dark-secondary mb-4">
                      Update Supabase with Stripe customer IDs
                    </p>
                    <button
                      onClick={handleSyncStripe}
                      disabled={processing}
                      className="inline-flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition disabled:opacity-50"
                    >
                      {processing ? 'Syncing...' : 'Sync Customers'}
                      <RefreshCw className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="border border-border-light dark:border-border-dark rounded-xl p-6">
                    <DollarSign className="w-8 h-8 text-orange-500 mb-4" />
                    <h3 className="text-lg font-bold text-text-light-primary dark:text-text-dark-primary mb-2">
                      Manual Refund
                    </h3>
                    <p className="text-sm text-text-light-secondary dark:text-text-dark-secondary mb-4">
                      Process a refund for a specific payment
                    </p>
                    <button
                      onClick={() => setRefundModal({ open: true, paymentId: '', reason: '' })}
                      className="inline-flex items-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition"
                    >
                      Open Refund Tool
                      <DollarSign className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="border border-border-light dark:border-border-dark rounded-xl p-6">
                    <XCircle className="w-8 h-8 text-red-500 mb-4" />
                    <h3 className="text-lg font-bold text-text-light-primary dark:text-text-dark-primary mb-2">
                      Cancel Subscription
                    </h3>
                    <p className="text-sm text-text-light-secondary dark:text-text-dark-secondary mb-4">
                      Cancel a user's subscription immediately
                    </p>
                    <button
                      onClick={() => setCancelModal({ open: true, userId: '', reason: '' })}
                      className="inline-flex items-center gap-2 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition"
                    >
                      Open Cancel Tool
                      <XCircle className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {confirmAction && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-light-primary dark:bg-dark-secondary border border-border-light dark:border-border-dark rounded-xl p-6 max-w-md w-full mx-4">
            <div className="flex items-center gap-3 mb-4">
              <AlertCircle className="w-8 h-8 text-orange-500" />
              <h3 className="text-xl font-bold text-text-light-primary dark:text-text-dark-primary">
                Confirm Action
              </h3>
            </div>
            <p className="text-text-light-secondary dark:text-text-dark-secondary mb-6">
              {confirmAction.type === 'delete'
                ? 'Are you sure you want to delete this user? This action cannot be undone.'
                : 'Are you sure you want to change this user\'s status?'}
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmAction(null)}
                className="flex-1 px-4 py-2 bg-light-secondary dark:bg-dark-tertiary text-text-light-primary dark:text-text-dark-primary rounded-lg hover:opacity-80 transition"
              >
                Cancel
              </button>
              <button
                onClick={() =>
                  confirmAction.type === 'delete'
                    ? handleDeleteUser(confirmAction.userId)
                    : handleSuspendUser(confirmAction.userId)
                }
                className="flex-1 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}

      {selectedUser && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-light-primary dark:bg-dark-secondary border border-border-light dark:border-border-dark rounded-xl p-6 max-w-3xl w-full my-8">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold text-text-light-primary dark:text-text-dark-primary">
                User Details
              </h3>
              <button
                onClick={() => setSelectedUser(null)}
                className="p-2 hover:bg-light-secondary dark:hover:bg-dark-tertiary rounded-lg transition"
              >
                <XCircle className="w-6 h-6" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-6">
              <div>
                <p className="text-sm text-text-light-secondary dark:text-text-dark-secondary mb-1">Email</p>
                <p className="text-text-light-primary dark:text-text-dark-primary font-semibold">{selectedUser.email}</p>
              </div>
              <div>
                <p className="text-sm text-text-light-secondary dark:text-text-dark-secondary mb-1">Created</p>
                <p className="text-text-light-primary dark:text-text-dark-primary font-semibold">
                  {new Date(selectedUser.created_at).toLocaleDateString()}
                </p>
              </div>
              <div>
                <p className="text-sm text-text-light-secondary dark:text-text-dark-secondary mb-1">Subscription Tier</p>
                <p className="text-text-light-primary dark:text-text-dark-primary font-semibold">
                  {selectedUser.subscription_tier || 'Free'}
                </p>
              </div>
              <div>
                <p className="text-sm text-text-light-secondary dark:text-text-dark-secondary mb-1">Status</p>
                <span
                  className={`inline-block px-2 py-1 rounded text-xs font-semibold ${
                    selectedUser.is_active
                      ? 'bg-green-500/10 text-green-500'
                      : 'bg-red-500/10 text-red-500'
                  }`}
                >
                  {selectedUser.is_active ? 'Active' : 'Suspended'}
                </span>
              </div>
              <div>
                <p className="text-sm text-text-light-secondary dark:text-text-dark-secondary mb-1">Stripe Customer ID</p>
                <p className="text-text-light-primary dark:text-text-dark-primary font-mono text-xs">
                  {selectedUser.stripe_customer_id || 'Not set'}
                </p>
              </div>
              <div>
                <p className="text-sm text-text-light-secondary dark:text-text-dark-secondary mb-1">Stripe Subscription ID</p>
                <p className="text-text-light-primary dark:text-text-dark-primary font-mono text-xs">
                  {selectedUser.stripe_subscription_id || 'None'}
                </p>
              </div>
            </div>

            <div className="mb-6">
              <h4 className="text-lg font-bold text-text-light-primary dark:text-text-dark-primary mb-4">
                Billing Events
              </h4>
              <div className="max-h-64 overflow-y-auto">
                {userBillingEvents.length > 0 ? (
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border-light dark:border-border-dark">
                        <th className="text-left py-2 px-2">Date</th>
                        <th className="text-left py-2 px-2">Event</th>
                        <th className="text-left py-2 px-2">Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      {userBillingEvents.map((event) => (
                        <tr key={event.id} className="border-b border-border-light dark:border-border-dark">
                          <td className="py-2 px-2 text-text-light-secondary dark:text-text-dark-secondary">
                            {new Date(event.created_at).toLocaleDateString()}
                          </td>
                          <td className="py-2 px-2 text-text-light-primary dark:text-text-dark-primary">
                            {event.event_type}
                          </td>
                          <td className="py-2 px-2 text-text-light-primary dark:text-text-dark-primary font-semibold">
                            £{(event.amount / 100).toFixed(2)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <p className="text-center py-8 text-text-light-secondary dark:text-text-dark-secondary">
                    No billing events found
                  </p>
                )}
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setConfirmAction({ type: 'suspend', userId: selectedUser.id });
                  setSelectedUser(null);
                }}
                className={`flex-1 px-4 py-2 rounded-lg transition ${
                  selectedUser.is_active
                    ? 'bg-yellow-500/10 text-yellow-500 hover:bg-yellow-500/20'
                    : 'bg-green-500/10 text-green-500 hover:bg-green-500/20'
                }`}
              >
                {selectedUser.is_active ? 'Deactivate Account' : 'Activate Account'}
              </button>
              <button
                onClick={() => setSelectedUser(null)}
                className="flex-1 px-4 py-2 bg-light-secondary dark:bg-dark-tertiary text-text-light-primary dark:text-text-dark-primary rounded-lg hover:opacity-80 transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {refundModal.open && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-light-primary dark:bg-dark-secondary border border-border-light dark:border-border-dark rounded-xl p-6 max-w-md w-full">
            <h3 className="text-xl font-bold text-text-light-primary dark:text-text-dark-primary mb-4">
              Process Refund
            </h3>
            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-text-light-primary dark:text-text-dark-primary mb-2">
                  Payment Intent ID
                </label>
                <input
                  type="text"
                  value={refundModal.paymentId}
                  onChange={(e) => setRefundModal({ ...refundModal, paymentId: e.target.value })}
                  placeholder="pi_xxxxxxxxxxxxx"
                  className="w-full px-4 py-2 bg-light-secondary dark:bg-dark-tertiary border border-border-light dark:border-border-dark rounded-lg text-text-light-primary dark:text-text-dark-primary"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-text-light-primary dark:text-text-dark-primary mb-2">
                  Reason (Optional)
                </label>
                <input
                  type="text"
                  value={refundModal.reason}
                  onChange={(e) => setRefundModal({ ...refundModal, reason: e.target.value })}
                  placeholder="Customer request"
                  className="w-full px-4 py-2 bg-light-secondary dark:bg-dark-tertiary border border-border-light dark:border-border-dark rounded-lg text-text-light-primary dark:text-text-dark-primary"
                />
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setRefundModal({ open: false, paymentId: '', reason: '' })}
                className="flex-1 px-4 py-2 bg-light-secondary dark:bg-dark-tertiary text-text-light-primary dark:text-text-dark-primary rounded-lg hover:opacity-80 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleRefund}
                disabled={processing}
                className="flex-1 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition disabled:opacity-50"
              >
                {processing ? 'Processing...' : 'Process Refund'}
              </button>
            </div>
          </div>
        </div>
      )}

      {cancelModal.open && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-light-primary dark:bg-dark-secondary border border-border-light dark:border-border-dark rounded-xl p-6 max-w-md w-full">
            <h3 className="text-xl font-bold text-text-light-primary dark:text-text-dark-primary mb-4">
              Cancel Subscription
            </h3>
            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-text-light-primary dark:text-text-dark-primary mb-2">
                  User Email
                </label>
                <select
                  value={cancelModal.userId}
                  onChange={(e) => setCancelModal({ ...cancelModal, userId: e.target.value })}
                  className="w-full px-4 py-2 bg-light-secondary dark:bg-dark-tertiary border border-border-light dark:border-border-dark rounded-lg text-text-light-primary dark:text-text-dark-primary"
                >
                  <option value="">Select user...</option>
                  {users
                    .filter(u => u.stripe_subscription_id)
                    .map(u => (
                      <option key={u.id} value={u.id}>{u.email}</option>
                    ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-text-light-primary dark:text-text-dark-primary mb-2">
                  Reason
                </label>
                <input
                  type="text"
                  value={cancelModal.reason}
                  onChange={(e) => setCancelModal({ ...cancelModal, reason: e.target.value })}
                  placeholder="Admin cancelled"
                  className="w-full px-4 py-2 bg-light-secondary dark:bg-dark-tertiary border border-border-light dark:border-border-dark rounded-lg text-text-light-primary dark:text-text-dark-primary"
                />
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setCancelModal({ open: false, userId: '', reason: '' })}
                className="flex-1 px-4 py-2 bg-light-secondary dark:bg-dark-tertiary text-text-light-primary dark:text-text-dark-primary rounded-lg hover:opacity-80 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleCancelSubscription}
                disabled={processing || !cancelModal.userId}
                className="flex-1 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition disabled:opacity-50"
              >
                {processing ? 'Cancelling...' : 'Cancel Subscription'}
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
