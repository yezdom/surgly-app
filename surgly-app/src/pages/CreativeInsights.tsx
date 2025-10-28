import { useState, useEffect } from 'react';
import DashboardLayout from '../components/DashboardLayout';
import { getAdAccounts } from '../lib/facebookService';
import { supabase } from '../lib/supabase';
import {
  Image as ImageIcon,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Eye,
  MousePointer,
  Sparkles,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Loader2,
} from 'lucide-react';

interface AdCreative {
  id: string;
  name: string;
  thumbnail_url: string;
  status: string;
  insights: {
    spend: string;
    impressions: string;
    clicks: string;
    ctr: string;
    cpc: string;
  };
  performance_score?: number;
}

export default function CreativeInsights() {
  const [loading, setLoading] = useState(true);
  const [adAccounts, setAdAccounts] = useState<any[]>([]);
  const [selectedAccount, setSelectedAccount] = useState<string>('');
  const [creatives, setCreatives] = useState<AdCreative[]>([]);
  const [analyzing, setAnalyzing] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<{ [key: string]: any }>({});

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (selectedAccount) {
      loadCreatives();
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

  async function loadCreatives() {
    try {
      const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
      const { data: { session } } = await supabase.auth.getSession();

      if (!session?.access_token) {
        throw new Error('Not authenticated');
      }

      // Call facebook-get-campaigns and extract ads from campaigns
      const response = await fetch(
        `${SUPABASE_URL}/functions/v1/facebook-get-campaigns`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ 
            adAccountId: selectedAccount 
          }),
        }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch campaigns');
      }

      const data = await response.json();
      
      // Extract all ads from all campaigns
      const allAds: any[] = [];
      (data.data || []).forEach((campaign: any) => {
        if (campaign.ads && campaign.ads.length > 0) {
          campaign.ads.forEach((ad: any) => {
            allAds.push({
              id: ad.id,
              name: ad.name || 'Untitled Ad',
              thumbnail_url: ad.thumbnail_url || ad.creative?.image_url || ad.creative?.thumbnail_url || 'https://via.placeholder.com/320x320/3b82f6/ffffff?text=No+Image',
              status: ad.status,
              insights: ad.insights || {
                spend: '0',
                impressions: '0',
                clicks: '0',
                ctr: '0',
                cpc: '0',
              },
            });
          });
        }
      });

      console.log('Total ads extracted:', allAds.length);
      console.log('Sample ad with thumbnail:', allAds[0]);

      const creativesWithScores = allAds.map((creative: any) => ({
        ...creative,
        performance_score: calculatePerformanceScore(creative),
      }));

      setCreatives(creativesWithScores);
    } catch (error) {
      console.error('Failed to load creatives:', error);
      // Show empty state instead of mock data
      setCreatives([]);
    }
  }

  function calculatePerformanceScore(creative: any): number {
    const ctr = parseFloat(creative.insights?.ctr || '0');
    const cpc = parseFloat(creative.insights?.cpc || '0');
    const clicks = parseInt(creative.insights?.clicks || '0');

    let score = 0;

    if (ctr > 3) score += 40;
    else if (ctr > 2) score += 30;
    else if (ctr > 1) score += 20;
    else score += 10;

    if (cpc < 0.5) score += 40;
    else if (cpc < 1) score += 30;
    else if (cpc < 2) score += 20;
    else score += 10;

    if (clicks > 500) score += 20;
    else if (clicks > 200) score += 10;
    else score += 5;

    return Math.min(score, 100);
  }

  function getPerformanceStatus(score: number): {
    label: string;
    color: string;
    icon: any;
  } {
    if (score >= 80) {
      return { label: 'Winner', color: 'bg-green-500/10 text-green-500 border-green-500/30', icon: CheckCircle };
    } else if (score >= 60) {
      return { label: 'Performing', color: 'bg-blue-500/10 text-blue-500 border-blue-500/30', icon: TrendingUp };
    } else if (score >= 40) {
      return { label: 'Warning', color: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/30', icon: AlertTriangle };
    } else {
      return { label: 'Stop', color: 'bg-red-500/10 text-red-500 border-red-500/30', icon: XCircle };
    }
  }

  async function analyzeCreative(creativeId: string, thumbnailUrl: string) {
    setAnalyzing(creativeId);
    try {
      const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
      const { data: { session } } = await supabase.auth.getSession();

      if (!session?.access_token) {
        throw new Error('Not authenticated');
      }

      const response = await fetch(
        `${SUPABASE_URL}/functions/v1/analyze-creative`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            creative_id: creativeId,
            image_url: thumbnailUrl,
          }),
        }
      );

      if (!response.ok) {
        throw new Error('Failed to analyze creative');
      }

      const data = await response.json();
      setAnalysis({ ...analysis, [creativeId]: data.analysis });
    } catch (error) {
      console.error('Failed to analyze creative:', error);
      setAnalysis({
        ...analysis,
        [creativeId]: {
          summary: 'AI analysis is currently unavailable. Please try again later.',
          recommendations: [],
        },
      });
    } finally {
      setAnalyzing(null);
    }
  }

  const performingCreatives = creatives.filter((c) => (c.performance_score || 0) >= 60);
  const warningCreatives = creatives.filter((c) => (c.performance_score || 0) < 60);

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
          <h1 className="text-4xl font-bold text-text-light-primary dark:text-text-dark-primary mb-2">
            Creative Insights
          </h1>
          <p className="text-text-light-secondary dark:text-text-dark-secondary">
            Analyze your ad creatives with AI-powered recommendations
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-light-primary dark:bg-dark-secondary border border-border-light dark:border-border-dark rounded-xl p-6">
            <ImageIcon className="w-8 h-8 text-purple-500 mb-4" />
            <p className="text-sm text-text-light-secondary dark:text-text-dark-secondary mb-1">
              Total Creatives
            </p>
            <p className="text-3xl font-bold text-text-light-primary dark:text-text-dark-primary">
              {creatives.length}
            </p>
          </div>

          <div className="bg-light-primary dark:bg-dark-secondary border border-border-light dark:border-border-dark rounded-xl p-6">
            <CheckCircle className="w-8 h-8 text-green-500 mb-4" />
            <p className="text-sm text-text-light-secondary dark:text-text-dark-secondary mb-1">
              Performing Well
            </p>
            <p className="text-3xl font-bold text-text-light-primary dark:text-text-dark-primary">
              {performingCreatives.length}
            </p>
          </div>

          <div className="bg-light-primary dark:bg-dark-secondary border border-border-light dark:border-border-dark rounded-xl p-6">
            <AlertTriangle className="w-8 h-8 text-yellow-500 mb-4" />
            <p className="text-sm text-text-light-secondary dark:text-text-dark-secondary mb-1">
              Needs Attention
            </p>
            <p className="text-3xl font-bold text-text-light-primary dark:text-text-dark-primary">
              {warningCreatives.length}
            </p>
          </div>

          <div className="bg-light-primary dark:bg-dark-secondary border border-border-light dark:border-border-dark rounded-xl p-6">
            <DollarSign className="w-8 h-8 text-blue-500 mb-4" />
            <p className="text-sm text-text-light-secondary dark:text-text-dark-secondary mb-1">
              Total Spend
            </p>
            <p className="text-3xl font-bold text-text-light-primary dark:text-text-dark-primary">
              £{creatives.reduce((sum, c) => sum + parseFloat(c.insights.spend), 0).toFixed(2)}
            </p>
          </div>
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

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {creatives.map((creative) => {
            const status = getPerformanceStatus(creative.performance_score || 0);
            const StatusIcon = status.icon;

            return (
              <div
                key={creative.id}
                className="bg-light-primary dark:bg-dark-secondary border border-border-light dark:border-border-dark rounded-xl overflow-hidden hover:shadow-lg transition"
              >
                <div className="relative">
                  <img
                    src={creative.thumbnail_url}
                    alt={creative.name}
                    className="w-full h-64 object-cover"
                    onError={(e) => {
                      console.error('Image failed to load:', creative.thumbnail_url);
                      (e.target as HTMLImageElement).src = 'https://via.placeholder.com/320x320/ef4444/ffffff?text=Image+Failed';
                    }}
                  />
                  <div className={`absolute top-3 right-3 px-3 py-1 rounded-full border ${status.color} backdrop-blur-sm flex items-center gap-2 font-medium text-sm`}>
                    <StatusIcon className="w-4 h-4" />
                    {status.label}
                  </div>
                </div>

                <div className="p-4">
                  <h3 className="font-bold text-text-light-primary dark:text-text-dark-primary mb-2 truncate">
                    {creative.name}
                  </h3>

                  <div className="grid grid-cols-3 gap-2 mb-4 text-xs">
                    <div>
                      <p className="text-text-light-secondary dark:text-text-dark-secondary">Spend</p>
                      <p className="font-bold text-text-light-primary dark:text-text-dark-primary">
                        £{parseFloat(creative.insights.spend).toFixed(0)}
                      </p>
                    </div>
                    <div>
                      <p className="text-text-light-secondary dark:text-text-dark-secondary">Impressions</p>
                      <p className="font-bold text-text-light-primary dark:text-text-dark-primary">
                        {parseInt(creative.insights.impressions).toLocaleString()}
                      </p>
                    </div>
                    <div>
                      <p className="text-text-light-secondary dark:text-text-dark-secondary">Clicks</p>
                      <p className="font-bold text-text-light-primary dark:text-text-dark-primary">
                        {parseInt(creative.insights.clicks).toLocaleString()}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 mb-4 text-xs">
                    <div className="bg-light-secondary dark:bg-dark-tertiary rounded-lg p-2">
                      <p className="text-text-light-secondary dark:text-text-dark-secondary">CTR</p>
                      <p className="font-bold text-text-light-primary dark:text-text-dark-primary">
                        {creative.insights.ctr}%
                      </p>
                    </div>
                    <div className="bg-light-secondary dark:bg-dark-tertiary rounded-lg p-2">
                      <p className="text-text-light-secondary dark:text-text-dark-secondary">CPC</p>
                      <p className="font-bold text-text-light-primary dark:text-text-dark-primary">
                        £{creative.insights.cpc}
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => analyzeCreative(creative.id, creative.thumbnail_url)}
                    disabled={analyzing === creative.id}
                    className="w-full py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg hover:shadow-lg transition disabled:opacity-50 flex items-center justify-center gap-2 text-sm font-medium"
                  >
                    {analyzing === creative.id ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Analyzing...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4" />
                        Analyze Creative
                      </>
                    )}
                  </button>

                  {analysis[creative.id] && (
                    <div className="mt-4 p-3 bg-purple-500/10 border border-purple-500/30 rounded-lg">
                      <p className="text-xs text-text-light-secondary dark:text-text-dark-secondary mb-2">
                        AI Analysis:
                      </p>
                      <p className="text-sm text-text-light-primary dark:text-text-dark-primary">
                        {analysis[creative.id].summary || 'No analysis available'}
                      </p>
                      {analysis[creative.id].recommendations?.length > 0 && (
                        <ul className="mt-2 text-xs text-text-light-secondary dark:text-text-dark-secondary space-y-1">
                          {analysis[creative.id].recommendations.slice(0, 3).map((rec: string, idx: number) => (
                            <li key={idx}>• {rec}</li>
                          ))}
                        </ul>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {creatives.length === 0 && (
          <div className="text-center py-20 bg-light-primary dark:bg-dark-secondary border border-border-light dark:border-border-dark rounded-xl">
            <ImageIcon className="w-16 h-16 text-purple-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-text-light-primary dark:text-text-dark-primary mb-2">
              No Creatives Found
            </h2>
            <p className="text-text-light-secondary dark:text-text-dark-secondary">
              Your campaigns don't have any ads yet, or they're still loading.
            </p>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
