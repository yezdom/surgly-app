import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import DashboardLayout from './DashboardLayout';
import { supabase } from '../lib/supabase';
import { getAdAccounts, getCampaigns } from '../lib/facebookService';
import { CheckCircle, XCircle, Loader2, AlertCircle, ArrowRight, Rocket } from 'lucide-react';

interface ValidationCheck {
  id: string;
  name: string;
  description: string;
  status: 'pending' | 'checking' | 'passed' | 'failed';
  error?: string;
  action?: { label: string; href: string };
}

export default function Validator() {
  const [checks, setChecks] = useState<ValidationCheck[]>([
    {
      id: 'facebook_connected',
      name: 'Facebook Connected',
      description: 'Verify Facebook account is connected',
      status: 'pending',
      action: { label: 'Connect Now', href: '/settings' },
    },
    {
      id: 'ad_account_found',
      name: 'Ad Account Found',
      description: 'At least one ad account is available',
      status: 'pending',
    },
    {
      id: 'active_campaigns',
      name: 'Active Campaigns',
      description: 'Campaigns exist and are active',
      status: 'pending',
      action: { label: 'View Campaigns', href: '/doctor' },
    },
    {
      id: 'recent_activity',
      name: 'Recent Activity',
      description: 'Campaigns have impressions in last 7 days',
      status: 'pending',
    },
    {
      id: 'billing_active',
      name: 'Billing Active',
      description: 'Account billing status is active',
      status: 'pending',
    },
  ]);

  const [validating, setValidating] = useState(false);
  const [readinessScore, setReadinessScore] = useState(0);

  useEffect(() => {
    runValidation();
  }, []);

  async function runValidation() {
    setValidating(true);

    for (const check of checks) {
      await validateCheck(check.id);
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    setValidating(false);
  }

  async function validateCheck(checkId: string) {
    setChecks(prev =>
      prev.map(c => (c.id === checkId ? { ...c, status: 'checking' } : c))
    );

    try {
      let passed = false;
      let error = '';

      switch (checkId) {
        case 'facebook_connected': {
          const { data: { user } } = await supabase.auth.getUser();
          if (!user) throw new Error('Not authenticated');

          const { data } = await supabase
            .from('facebook_tokens')
            .select('id, expires_at')
            .eq('user_id', user.id)
            .maybeSingle();

          if (data) {
            const expiresAt = new Date(data.expires_at);
            passed = expiresAt > new Date();
            if (!passed) error = 'Token expired';
          } else {
            error = 'No Facebook connection found';
          }
          break;
        }

        case 'ad_account_found': {
          try {
            const accounts = await getAdAccounts();
            passed = accounts.length > 0;
            if (!passed) error = 'No ad accounts found';
          } catch (err: any) {
            error = err.message || 'Failed to fetch ad accounts';
          }
          break;
        }

        case 'active_campaigns': {
          try {
            const accounts = await getAdAccounts();
            if (accounts.length > 0) {
              const campaigns = await getCampaigns(accounts[0].id);
              const activeCampaigns = campaigns.filter((c: any) => c.status === 'ACTIVE');
              passed = activeCampaigns.length > 0;
              if (!passed) error = 'No active campaigns found';
            } else {
              error = 'No ad accounts to check';
            }
          } catch (err: any) {
            error = err.message || 'Failed to fetch campaigns';
          }
          break;
        }

        case 'recent_activity': {
          try {
            const accounts = await getAdAccounts();
            if (accounts.length > 0) {
              const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
                .toISOString()
                .split('T')[0];
              const today = new Date().toISOString().split('T')[0];

              const campaigns = await getCampaigns(accounts[0].id, sevenDaysAgo, today);
              const hasImpressions = campaigns.some(
                (c: any) => parseInt(c.insights?.impressions || '0') > 0
              );
              passed = hasImpressions;
              if (!passed) error = 'No recent activity detected';
            } else {
              error = 'No ad accounts to check';
            }
          } catch (err: any) {
            error = err.message || 'Failed to check activity';
          }
          break;
        }

        case 'billing_active': {
          try {
            const accounts = await getAdAccounts();
            if (accounts.length > 0) {
              const account = accounts[0];
              passed = account.account_status === 1;
              if (!passed) error = 'Billing is not active';
            } else {
              error = 'No ad accounts to check';
            }
          } catch (err: any) {
            error = err.message || 'Failed to check billing status';
          }
          break;
        }
      }

      setChecks(prev =>
        prev.map(c =>
          c.id === checkId
            ? { ...c, status: passed ? 'passed' : 'failed', error }
            : c
        )
      );
    } catch (error: any) {
      setChecks(prev =>
        prev.map(c =>
          c.id === checkId
            ? { ...c, status: 'failed', error: error.message || 'Validation failed' }
            : c
        )
      );
    }
  }

  useEffect(() => {
    const passedChecks = checks.filter(c => c.status === 'passed').length;
    const score = Math.round((passedChecks / checks.length) * 100);
    setReadinessScore(score);
  }, [checks]);

  const allPassed = checks.every(c => c.status === 'passed');

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-text-light-primary dark:text-text-dark-primary mb-2">
            Pre-Launch Validator
          </h1>
          <p className="text-text-light-secondary dark:text-text-dark-secondary">
            Validate your ad setup before spending money
          </p>
        </div>

        <div className="bg-gradient-to-br from-blue-500 to-purple-500 rounded-xl p-8 text-white mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-2xl font-bold">Readiness Score</h2>
              <p className="text-blue-100">System health check</p>
            </div>
            <div className="text-5xl font-bold">{readinessScore}%</div>
          </div>
          <div className="w-full bg-white/20 rounded-full h-4">
            <div
              className="bg-white h-4 rounded-full transition-all duration-500"
              style={{ width: `${readinessScore}%` }}
            />
          </div>
        </div>

        <div className="space-y-4 mb-8">
          {checks.map((check) => (
            <div
              key={check.id}
              className="bg-light-primary dark:bg-dark-secondary border border-border-light dark:border-border-dark rounded-xl p-6"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-4 flex-1">
                  <div className="mt-1">
                    {check.status === 'checking' && (
                      <Loader2 className="w-6 h-6 text-blue-500 animate-spin" />
                    )}
                    {check.status === 'passed' && (
                      <CheckCircle className="w-6 h-6 text-green-500" />
                    )}
                    {check.status === 'failed' && (
                      <XCircle className="w-6 h-6 text-red-500" />
                    )}
                    {check.status === 'pending' && (
                      <AlertCircle className="w-6 h-6 text-gray-400" />
                    )}
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-text-light-primary dark:text-text-dark-primary mb-1">
                      {check.name}
                    </h3>
                    <p className="text-sm text-text-light-secondary dark:text-text-dark-secondary">
                      {check.description}
                    </p>
                    {check.status === 'failed' && check.error && (
                      <p className="text-sm text-red-500 mt-2">{check.error}</p>
                    )}
                  </div>
                </div>
                {check.status === 'failed' && check.action && (
                  <Link
                    to={check.action.href}
                    className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition text-sm font-medium whitespace-nowrap"
                  >
                    {check.action.label}
                  </Link>
                )}
              </div>
            </div>
          ))}
        </div>

        {allPassed ? (
          <div className="bg-gradient-to-r from-green-500 to-teal-500 rounded-xl p-8 text-white text-center">
            <Rocket className="w-16 h-16 mx-auto mb-4" />
            <h2 className="text-3xl font-bold mb-2">All Systems Ready!</h2>
            <p className="text-green-100 mb-6">Your account is fully configured and ready to launch campaigns</p>
            <Link
              to="/dashboard"
              className="inline-flex items-center gap-2 px-8 py-3 bg-white text-green-600 rounded-lg hover:shadow-lg transition font-medium"
            >
              Launch Dashboard
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        ) : (
          <button
            onClick={runValidation}
            disabled={validating}
            className="w-full py-3 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-lg hover:shadow-lg transition font-medium disabled:opacity-50"
          >
            {validating ? 'Validating...' : 'Re-run Validation'}
          </button>
        )}
      </div>
    </DashboardLayout>
  );
}
