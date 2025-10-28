import { useState, useEffect } from 'react';
import DashboardLayout from '../components/DashboardLayout';
import { supabase } from '../lib/supabase';
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
} from 'lucide-react';

interface User {
  id: string;
  email: string;
  created_at: string;
  subscription_tier: string;
  is_active: boolean;
  is_admin: boolean;
}

export default function Admin() {
  const [users, setUsers] = useState<User[]>([]);
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

  useEffect(() => {
    loadAdminData();
  }, []);

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
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500"></div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-text-light-primary dark:text-text-dark-primary mb-2 flex items-center gap-3">
            <Shield className="w-10 h-10 text-purple-500" />
            Admin Panel
          </h1>
          <p className="text-text-light-secondary dark:text-text-dark-secondary">
            Manage users, subscriptions, and system settings
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
            <DollarSign className="w-8 h-8 text-purple-500 mb-4" />
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

        <div className="bg-light-primary dark:bg-dark-secondary border border-border-light dark:border-border-dark rounded-xl p-6 mb-8">
          <h2 className="text-xl font-bold text-text-light-primary dark:text-text-dark-primary mb-4">
            Subscription Overview
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {Object.entries(stats.tierCounts).map(([tier, count]) => (
              <div key={tier} className="text-center">
                <p className="text-2xl font-bold text-text-light-primary dark:text-text-dark-primary">
                  {count}
                </p>
                <p className="text-sm text-text-light-secondary dark:text-text-dark-secondary">
                  {tier}
                </p>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-light-primary dark:bg-dark-secondary border border-border-light dark:border-border-dark rounded-xl p-6">
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
                        <span className="px-2 py-1 bg-purple-500/10 text-purple-500 rounded text-xs">
                          Admin
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
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
      </div>
    </DashboardLayout>
  );
}
