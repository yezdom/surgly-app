import { useState, useEffect } from 'react';
import DashboardLayout from '../components/DashboardLayout';
import { getAdAccounts } from '../lib/facebookService';
import { supabase } from '../lib/supabase';
import {
  Image as ImageIcon,
  TrendingUp,
  DollarSign,
  Sparkles,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Loader2,
} from 'lucide-react';

interface AdCreative {
  id: string;
  name: string;
  image_url: string | null;  // Changed from thumbnail_url
  storage_error?: string | null;  // Track storage errors
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
  const [error, setError] = useState<string | null>(null);

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
      setError(null);
      const accounts = await getAdAccounts();
      setAdAccounts(accounts);
      if (accounts.length > 0) {
        setSelectedAccount(accounts[0].id);
      }
    } catch (error) {
      console.error('Failed to load ad accounts:', error);
      setError('Failed to load ad accounts. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  async function loadCreatives() {
    try {
      setError(null);
      const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
      const { data: { session } } = await supabase.auth.getSession();

      if (!session?.access_token) {
        throw new Error('Not authenticated');
      }

      console.log('Fetching campaigns for account:', selectedAccount);

      // UPDATED: Now calling facebook-get-campaigns instead of facebook-get-creatives
      const response = await fetch(
        `${SUPABASE_URL}/functions/v1/facebook-get-campaigns?account_id=${selectedAccount}`,
        {
          headers: {
            Authorization: `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        console.error('API Error:', errorText);
        throw new Error(`Failed to fetch campaigns: ${response.status}`);
      }

      const data = await response.json();
      console.log('Campaigns response:', data);

      // Extract ads from campaigns
      const allAds: AdCreative[] = [];
      
      if (data.data && Array.isArray(data.data)) {
        data.data.forEach((campaign: any) => {
          if (campaign.ads?.data && Array.isArray(campaign.ads.data)) {
            campaign.ads.data.forEach((ad: any) => {
              // Map the ad data to our AdCreative interface
              allAds.push({
                id: ad.id,
                name: ad.name || 'Unnamed Ad',
                image_url: ad.image_url || null,  // NEW: From Supabase Storage
                storage_error: ad.storage_error || null,  // NEW: Track errors
                status: ad.status || 'UNKNOWN',
                insights: {
                  spend: ad.insights?.data?.[0]?.spend || '0',
                  impressions: ad.insights?.data?.[0]?.impressions || '0',
                  clicks: ad.insights?.data?.[0]?.clicks || '0',
                  ctr: ad.insights?.data?.[0]?.ctr || '0',
                  cpc: ad.insights?.data?.[0]?.cpc || '0',
                },
                performance_score: 0, // Will be calculated next
              });
            });
          }
        });
      }

      // Calculate performance scores
      const creativesWithScores = allAds.map((creative) => ({
        ...creative,
        performance_score: calculatePerformanceScore(creative),
      }));

      console.log(`Loaded ${creativesWithScores.length} creatives`);
      setCreatives(creativesWithScores);

      // Log any storage errors
      const errored = creativesWithScores.filter(c => c.storage_error);
      if (errored.length > 0) {
        console.warn(`${errored.length} creatives had storage errors:`, errored);
      }

    } catch (error) {
      console.error('Failed to load creatives:', error);
      setError('Failed to load ad creatives. Please check your connection.');
      // Don't generate mock data - show the error instead
      setCreatives([]);
    }
  }

  function calculatePerformanceScore(creative: AdCreative): number {
    const ctr = parseFloat(creative.insights?.ctr || '0');
    const cpc = parseFloat(creative.insights?.cpc || '0');
    const clicks = parseInt(creative.insights?.clicks || '0');

    let score = 0;

    // CTR scoring (0-40 points)
    if (ctr > 3) score += 40;
    else if (ctr > 2) score += 30;
    else if (ctr > 1) score += 20;
    else score += 10;

    // CPC scoring (0-40 points)
    if (cpc < 0.5) score += 40;
    else if (cpc < 1) score += 30;
    else if (cpc < 2) score += 20;
    else score += 10;

    // Clicks scoring (0-20 points)
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

  async function analyzeCreative(creativeId: string, imageUrl: string | null) {
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
            image_url: imageUrl,
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

        {/* Error Banner */}
        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-lg flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0" />
            <div>
              <p className="text-red-500 font-medium">{error}</p>
              <button
                onClick={() => loadCreatives()}
                className="text-sm text-red-400 hover:text-red-300 underline mt-1"
              >
                Try again
              </button>
            </div>
          </div>
        )}

        {/* Stats Cards */}
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
              ${creatives.reduce((sum, c) => sum + parseFloat(c.insights.spend || '0'), 0).toFixed(2)}
            </p>
          </div>
        </div>

        {/* Account Selector */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-text-light-secondary dark:text-text-dark-secondary mb-2">
            Ad Account
          </label>
          <select
            value={selectedAccount}
            onChange={(e) => setSelectedAccount(e.target.value)}
            className="w-full md:w-96 px-4 py-2 bg-light-primary dark:bg-dark-secondary border border-border-light dark:border-border-dark rounded-lg text-text-light-primary dark:text-text-dark-primary"
          >
            {adAccounts.map((account) => (
              <option key={account.id} value={account.id}>
                {account.name}
              </option>
            ))}
          </select>
        </div>

        {/* Creatives Grid */}
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
                  {/* UPDATED: Image with Storage URL and inline SVG fallback */}
                  <img
                    src={
                      creative.image_url || 
                      'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="320" height="256"%3E%3Crect fill="%233b82f6" width="320" height="256"/%3E%3Ctext x="50%25" y="50%25" text-anchor="middle" dy=".3em" fill="%23ffffff" font-size="16" font-family="Arial"%3ENo Image%3C/text%3E%3C/svg%3E'
                    }
                    alt={creative.name}
                    className="w-full h-64 object-cover"
                    onError={(e) => {
                      console.error(`Image failed to load for ${creative.id}:`, creative.image_url);
                      (e.target as HTMLImageElement).src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="320" height="256"%3E%3Crect fill="%23ef4444" width="320" height="256"/%3E%3Ctext x="50%25" y="50%25" text-anchor="middle" dy=".3em" fill="%23ffffff" font-size="14" font-family="Arial"%3EImage Failed%3C/text%3E%3C/svg%3E';
                    }}
                  />
                  <div className={`absolute top-3 right-3 px-3 py-1 rounded-full border ${status.color} backdrop-blur-sm flex items-center gap-2 font-medium text-sm`}>
                    <StatusIcon className="w-4 h-4" />
                    {status.label}
                  </div>
                  
                  {/* NEW: Show storage error indicator if present */}
                  {creative.storage_error && (
                    <div className="absolute bottom-3 left-3 px-2 py-1 bg-yellow-500/90 text-white text-xs rounded flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3" />
                      Storage Issue
                    </div>
                  )}
                </div>

                <div className="p-4">
                  <h3 className="font-bold text-text-light-primary dark:text-text-dark-primary mb-2 truncate">
                    {creative.name}
                  </h3>

                  <div className="grid grid-cols-3 gap-2 mb-4 text-xs">
                    <div>
                      <p className="text-text-light-secondary dark:text-text-dark-secondary">Spend</p>
                      <p className="font-bold text-text-light-primary dark:text-text-dark-primary">
                        ${parseFloat(creative.insights.spend).toFixed(0)}
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
                        ${creative.insights.cpc}
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => analyzeCreative(creative.id, creative.image_url)}
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

        {/* Empty State */}
        {creatives.length === 0 && !error && (
          <div className="text-center py-20 bg-light-primary dark:bg-dark-secondary border border-border-light dark:border-border-dark rounded-xl">
            <ImageIcon className="w-16 h-16 text-purple-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-text-light-primary dark:text-text-dark-primary mb-2">
              No Creatives Found
            </h2>
            <p className="text-text-light-secondary dark:text-text-dark-secondary">
              No ads found for this account. Try selecting a different account or create some ads first.
            </p>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
