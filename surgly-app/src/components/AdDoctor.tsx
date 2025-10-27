import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import DashboardLayout from './DashboardLayout';
import { getAdAccounts, getCampaigns } from '../lib/facebookService';
import {
  Stethoscope,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Eye,
  MousePointer,
  AlertCircle,
  CheckCircle,
  XCircle,
  Loader2,
  FileText,
} from 'lucide-react';

interface Campaign {
  id: string;
  name: string;
  status: string;
  insights: {
    spend: string;
    impressions: string;
    clicks: string;
    ctr: string;
    cpc: string;
    roas?: string;
  };
}

interface Diagnosis {
  healthScore: number;
  issues: string[];
  recommendations: string[];
}

export default function AdDoctor() {
  const [loading, setLoading] = useState(true);
  const [adAccounts, setAdAccounts] = useState<any[]>([]);
  const [selectedAccount, setSelectedAccount] = useState<string>('');
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [diagnosing, setDiagnosing] = useState<string | null>(null);
  const [diagnoses, setDiagnoses] = useState<{ [key: string]: Diagnosis }>({});

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (selectedAccount) {
      loadCampaigns();
    }
  }, [selectedAccount]);

  async function loadData() {
    try {
      setLoading(true);
      const accounts = await getAdAccounts();
      setAdAccounts(accounts);
      if (accounts.length > 0) {
        setSelectedAccount(accounts[0].id);
      }
    } catch (error) {
      console.error('Failed to load ad accounts:', error);
    } finally {
      setLoading(false);
    }
  }

  async function loadCampaigns() {
    try {
      const data = await getCampaigns(selectedAccount);
      setCampaigns(data);
    } catch (error) {
      console.error('Failed to load campaigns:', error);
    }
  }

  function calculateHealthScore(campaign: Campaign): number {
    const ctr = parseFloat(campaign.insights?.ctr || '0');
    const cpc = parseFloat(campaign.insights?.cpc || '0');
    const roas = parseFloat(campaign.insights?.roas || '0');
    const clicks = parseInt(campaign.insights?.clicks || '0');

    let score = 0;

    if (ctr >= 3) score += 30;
    else if (ctr >= 2) score += 20;
    else if (ctr >= 1) score += 10;
    else score += 5;

    if (cpc <= 0.5) score += 30;
    else if (cpc <= 1) score += 20;
    else if (cpc <= 2) score += 10;
    else score += 5;

    if (roas >= 4) score += 25;
    else if (roas >= 3) score += 15;
    else if (roas >= 2) score += 10;
    else score += 5;

    if (clicks >= 500) score += 15;
    else if (clicks >= 200) score += 10;
    else if (clicks >= 100) score += 5;

    return Math.min(score, 100);
  }

  function diagnoseCampaign(campaign: Campaign) {
    setDiagnosing(campaign.id);

    setTimeout(() => {
      const healthScore = calculateHealthScore(campaign);
      const issues: string[] = [];
      const recommendations: string[] = [];

      const ctr = parseFloat(campaign.insights?.ctr || '0');
      const cpc = parseFloat(campaign.insights?.cpc || '0');
      const roas = parseFloat(campaign.insights?.roas || '0');

      if (ctr < 1) {
        issues.push('Low Click-Through Rate (CTR below 1%)');
        recommendations.push('Test different ad creatives with more compelling visuals');
        recommendations.push('Improve ad copy with stronger call-to-action');
        recommendations.push('Refine audience targeting to reach more engaged users');
      }

      if (cpc > 2) {
        issues.push('High Cost Per Click (CPC above $2)');
        recommendations.push('Optimize ad relevance score to reduce costs');
        recommendations.push('Consider broader audience targeting to increase competition');
        recommendations.push('Test different bidding strategies (lowest cost vs target cost)');
      }

      if (roas < 2) {
        issues.push('Poor Return on Ad Spend (ROAS below 2x)');
        recommendations.push('Analyze conversion funnel for drop-off points');
        recommendations.push('Test different landing pages to improve conversion rate');
        recommendations.push('Consider retargeting campaigns for warmer audiences');
      }

      if (healthScore >= 80) {
        recommendations.push('Campaign is performing excellently! Consider scaling budget.');
        recommendations.push('Duplicate winning elements to other campaigns');
      }

      if (issues.length === 0) {
        issues.push('No critical issues detected');
        recommendations.push('Continue monitoring performance metrics');
        recommendations.push('Test incremental improvements to maintain performance');
      }

      setDiagnoses({
        ...diagnoses,
        [campaign.id]: { healthScore, issues, recommendations },
      });
      setDiagnosing(null);
    }, 1500);
  }

  function getHealthColor(score: number): string {
    if (score >= 80) return 'text-green-500';
    if (score >= 50) return 'text-yellow-500';
    return 'text-red-500';
  }

  function getHealthIcon(score: number) {
    if (score >= 80) return CheckCircle;
    if (score >= 50) return AlertCircle;
    return XCircle;
  }

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500"></div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-text-light-primary dark:text-text-dark-primary mb-2 flex items-center gap-3">
            <Stethoscope className="w-10 h-10 text-red-500" />
            Ad Doctor
          </h1>
          <p className="text-text-light-secondary dark:text-text-dark-secondary">
            AI-powered campaign diagnosis and health monitoring
          </p>
        </div>

        <div className="mb-6">
          <label className="block text-sm font-medium text-text-light-secondary dark:text-text-dark-secondary mb-2">
            Ad Account
          </label>
          <select
            value={selectedAccount}
            onChange={(e) => setSelectedAccount(e.target.value)}
            className="w-full md:w-96 px-4 py-2 bg-light-primary dark:bg-dark-secondary border border-border-light dark:border-border-dark rounded-lg"
          >
            {adAccounts.map((account) => (
              <option key={account.id} value={account.id}>
                {account.name}
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {campaigns.map((campaign) => {
            const diagnosis = diagnoses[campaign.id];
            const HealthIcon = diagnosis
              ? getHealthIcon(diagnosis.healthScore)
              : Stethoscope;

            return (
              <div
                key={campaign.id}
                className="bg-light-primary dark:bg-dark-secondary border border-border-light dark:border-border-dark rounded-xl p-6"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-text-light-primary dark:text-text-dark-primary mb-1">
                      {campaign.name}
                    </h3>
                    <span
                      className={`text-xs px-2 py-1 rounded ${
                        campaign.status === 'ACTIVE'
                          ? 'bg-green-500/10 text-green-500'
                          : 'bg-gray-500/10 text-gray-500'
                      }`}
                    >
                      {campaign.status}
                    </span>
                  </div>
                  {diagnosis && (
                    <div
                      className={`flex items-center gap-2 ${getHealthColor(
                        diagnosis.healthScore
                      )}`}
                    >
                      <HealthIcon className="w-6 h-6" />
                      <span className="text-2xl font-bold">
                        {diagnosis.healthScore}
                      </span>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-3 gap-4 mb-4">
                  <div className="bg-light-secondary dark:bg-dark-tertiary rounded-lg p-3">
                    <div className="flex items-center gap-2 mb-1">
                      <DollarSign className="w-4 h-4 text-green-500" />
                      <span className="text-xs text-text-light-secondary dark:text-text-dark-secondary">
                        Spend
                      </span>
                    </div>
                    <p className="text-lg font-bold text-text-light-primary dark:text-text-dark-primary">
                      ${parseFloat(campaign.insights?.spend || '0').toFixed(0)}
                    </p>
                  </div>

                  <div className="bg-light-secondary dark:bg-dark-tertiary rounded-lg p-3">
                    <div className="flex items-center gap-2 mb-1">
                      <Eye className="w-4 h-4 text-blue-500" />
                      <span className="text-xs text-text-light-secondary dark:text-text-dark-secondary">
                        Impressions
                      </span>
                    </div>
                    <p className="text-lg font-bold text-text-light-primary dark:text-text-dark-primary">
                      {parseInt(campaign.insights?.impressions || '0').toLocaleString()}
                    </p>
                  </div>

                  <div className="bg-light-secondary dark:bg-dark-tertiary rounded-lg p-3">
                    <div className="flex items-center gap-2 mb-1">
                      <MousePointer className="w-4 h-4 text-purple-500" />
                      <span className="text-xs text-text-light-secondary dark:text-text-dark-secondary">
                        Clicks
                      </span>
                    </div>
                    <p className="text-lg font-bold text-text-light-primary dark:text-text-dark-primary">
                      {parseInt(campaign.insights?.clicks || '0').toLocaleString()}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4 mb-4">
                  <div>
                    <p className="text-xs text-text-light-secondary dark:text-text-dark-secondary mb-1">
                      CTR
                    </p>
                    <p className="text-sm font-bold text-text-light-primary dark:text-text-dark-primary">
                      {campaign.insights?.ctr}%
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-text-light-secondary dark:text-text-dark-secondary mb-1">
                      CPC
                    </p>
                    <p className="text-sm font-bold text-text-light-primary dark:text-text-dark-primary">
                      ${campaign.insights?.cpc}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-text-light-secondary dark:text-text-dark-secondary mb-1">
                      ROAS
                    </p>
                    <p className="text-sm font-bold text-text-light-primary dark:text-text-dark-primary">
                      {campaign.insights?.roas || '0'}x
                    </p>
                  </div>
                </div>

                {!diagnosis ? (
                  <button
                    onClick={() => diagnoseCampaign(campaign)}
                    disabled={diagnosing === campaign.id}
                    className="w-full py-3 bg-gradient-to-r from-red-500 to-pink-500 text-white rounded-lg hover:shadow-lg transition disabled:opacity-50 flex items-center justify-center gap-2 font-medium"
                  >
                    {diagnosing === campaign.id ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Diagnosing...
                      </>
                    ) : (
                      <>
                        <Stethoscope className="w-5 h-5" />
                        Diagnose Campaign
                      </>
                    )}
                  </button>
                ) : (
                  <div className="space-y-4">
                    <div className="bg-light-secondary dark:bg-dark-tertiary rounded-lg p-4">
                      <h4 className="font-bold text-text-light-primary dark:text-text-dark-primary mb-2 flex items-center gap-2">
                        <AlertCircle className="w-5 h-5 text-orange-500" />
                        Issues Found
                      </h4>
                      <ul className="space-y-1 text-sm text-text-light-secondary dark:text-text-dark-secondary">
                        {diagnosis.issues.map((issue, idx) => (
                          <li key={idx}>• {issue}</li>
                        ))}
                      </ul>
                    </div>

                    <div className="bg-light-secondary dark:bg-dark-tertiary rounded-lg p-4">
                      <h4 className="font-bold text-text-light-primary dark:text-text-dark-primary mb-2 flex items-center gap-2">
                        <TrendingUp className="w-5 h-5 text-blue-500" />
                        Recommendations
                      </h4>
                      <ul className="space-y-1 text-sm text-text-light-secondary dark:text-text-dark-secondary">
                        {diagnosis.recommendations.slice(0, 3).map((rec, idx) => (
                          <li key={idx}>• {rec}</li>
                        ))}
                      </ul>
                    </div>

                    <Link
                      to="/reports"
                      className="block w-full py-2 text-center bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition flex items-center justify-center gap-2 text-sm font-medium"
                    >
                      <FileText className="w-4 h-4" />
                      View Full Report
                    </Link>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {campaigns.length === 0 && (
          <div className="text-center py-20 bg-light-primary dark:bg-dark-secondary border border-border-light dark:border-border-dark rounded-xl">
            <Stethoscope className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-text-light-primary dark:text-text-dark-primary mb-2">
              No Campaigns Found
            </h2>
            <p className="text-text-light-secondary dark:text-text-dark-secondary">
              Connect your Facebook account to diagnose your campaigns
            </p>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
