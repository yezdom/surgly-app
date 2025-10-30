import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import DashboardLayout from './DashboardLayout';
import { getSelectedAccount, checkFacebookConnection, getCreatives, getCampaigns, getInsights } from '../lib/facebookService';
import { useAuth } from '../contexts/AuthContext';
import { validateManualAd } from '../lib/validationService';
import { savePreLaunchReport } from '../lib/reportService';
import { supabase } from '../lib/supabase';
import { createAICore } from '../lib/aiCore';
import {
  Stethoscope,
  TrendingUp,
  DollarSign,
  Eye,
  MousePointer,
  AlertCircle,
  CheckCircle,
  Loader2,
  Sparkles,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Target,
  Zap,
  Copy,
  RefreshCw,
} from 'lucide-react';

interface AdWithMetrics {
  id: string;
  name: string;
  campaign_id?: string;
  campaign_name?: string;
  adset_id?: string;
  adset_name?: string;
  status: string;
  headline: string;
  primaryText: string;
  description: string;
  cta: string;
  thumbnailUrl: string;
  metrics?: {
    reach?: string;
    impressions?: string;
    clicks?: string;
    ctr?: string;
    cpc?: string;
    spend?: string;
    roas?: string;
  };
}

interface AIRecommendation {
  issue: string;
  recommendation: string;
  priority: 'high' | 'medium' | 'low';
}

interface ImprovedVersion {
  headline: string;
  primaryText: string;
  description: string;
  cta: string;
  reasoning: string;
}

interface CampaignGroup {
  id: string;
  name: string;
  status: string;
  ads: AdWithMetrics[];
  metrics: {
    totalSpend: number;
    totalReach: number;
    avgCTR: number;
    avgCPC: number;
    avgROAS: number;
  };
}

export default function AdDoctor() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [selectedAccount, setSelectedAccount] = useState<any>(null);
  const [ads, setAds] = useState<AdWithMetrics[]>([]);
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [campaignGroups, setCampaignGroups] = useState<CampaignGroup[]>([]);
  const [expandedCampaigns, setExpandedCampaigns] = useState<{ [key: string]: boolean }>({});
  const [analyzing, setAnalyzing] = useState<{ [key: string]: boolean }>({});
  const [recommendations, setRecommendations] = useState<{ [key: string]: AIRecommendation[] }>({});
  const [improvedVersions, setImprovedVersions] = useState<{ [key: string]: ImprovedVersion }>({});
  const [generatingImproved, setGeneratingImproved] = useState<{ [key: string]: boolean }>({});
  const [expandedAd, setExpandedAd] = useState<string | null>(null);
  const [showImprovedVersion, setShowImprovedVersion] = useState<{ [key: string]: boolean }>({});
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      setLoading(true);
      const connected = await checkFacebookConnection();

      if (!connected) {
        setLoading(false);
        return;
      }

      const account = await getSelectedAccount();
      if (!account) {
        setLoading(false);
        return;
      }

      setSelectedAccount(account);

      const [adsData, campaignsData] = await Promise.all([
        getCreatives(account.account_id, 50),
        getCampaigns(account.account_id),
      ]);

      setCampaigns(campaignsData.data || []);
      setAds(adsData);

      organizeCampaignHierarchy(adsData, campaignsData.data || []);
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  }

  function organizeCampaignHierarchy(adsData: AdWithMetrics[], campaignsData: any[]) {
    const grouped: { [key: string]: CampaignGroup } = {};

    adsData.forEach((ad) => {
      const campaignId = ad.campaign_id || 'unknown';
      const campaignName = ad.campaign_name || 'Unknown Campaign';
      const campaignStatus = campaignsData.find(c => c.id === campaignId)?.status || 'UNKNOWN';

      if (!grouped[campaignId]) {
        grouped[campaignId] = {
          id: campaignId,
          name: campaignName,
          status: campaignStatus,
          ads: [],
          metrics: {
            totalSpend: 0,
            totalReach: 0,
            avgCTR: 0,
            avgCPC: 0,
            avgROAS: 0,
          },
        };
      }

      grouped[campaignId].ads.push(ad);
    });

    Object.values(grouped).forEach((group) => {
      let totalSpend = 0;
      let totalReach = 0;
      let totalCTR = 0;
      let totalCPC = 0;
      let totalROAS = 0;
      let count = 0;

      group.ads.forEach((ad) => {
        if (ad.metrics) {
          totalSpend += parseFloat(ad.metrics.spend || '0');
          totalReach += parseFloat(ad.metrics.reach || '0');
          totalCTR += parseFloat(ad.metrics.ctr || '0');
          totalCPC += parseFloat(ad.metrics.cpc || '0');
          totalROAS += parseFloat(ad.metrics.roas || '0');
          count++;
        }
      });

      group.metrics = {
        totalSpend,
        totalReach,
        avgCTR: count > 0 ? totalCTR / count : 0,
        avgCPC: count > 0 ? totalCPC / count : 0,
        avgROAS: count > 0 ? totalROAS / count : 0,
      };
    });

    setCampaignGroups(Object.values(grouped));
  }

  function isUnderperforming(ad: AdWithMetrics): boolean {
    const ctr = parseFloat(ad.metrics?.ctr || '0');
    const cpc = parseFloat(ad.metrics?.cpc || '0');
    return ctr < 1 || cpc > 2;
  }

  function getPerformanceBadge(value: number, type: 'ctr' | 'cpc' | 'roas'): { color: string; label: string } {
    if (type === 'ctr') {
      if (value >= 2) return { color: 'text-green-500', label: 'Great' };
      if (value >= 1) return { color: 'text-blue-500', label: 'Good' };
      if (value >= 0.5) return { color: 'text-yellow-500', label: 'Fair' };
      return { color: 'text-red-500', label: 'Poor' };
    }
    if (type === 'cpc') {
      if (value <= 1) return { color: 'text-green-500', label: 'Great' };
      if (value <= 2) return { color: 'text-blue-500', label: 'Good' };
      if (value <= 3) return { color: 'text-yellow-500', label: 'Fair' };
      return { color: 'text-red-500', label: 'High' };
    }
    if (type === 'roas') {
      if (value >= 4) return { color: 'text-green-500', label: 'Excellent' };
      if (value >= 2) return { color: 'text-blue-500', label: 'Good' };
      if (value >= 1) return { color: 'text-yellow-500', label: 'Fair' };
      return { color: 'text-red-500', label: 'Poor' };
    }
    return { color: 'text-gray-500', label: 'N/A' };
  }

  async function analyzeAd(ad: AdWithMetrics) {
    setAnalyzing(prev => ({ ...prev, [ad.id]: true }));

    try {
      const adText = `Headline: ${ad.headline}\n\nPrimary Text: ${ad.primaryText}\n\nDescription: ${ad.description}\n\nCTA: ${ad.cta}`;
      const result = await validateManualAd(adText);

      const recs: AIRecommendation[] = [];

      const ctr = parseFloat(ad.metrics?.ctr || '0');
      const cpc = parseFloat(ad.metrics?.cpc || '0');
      const roas = parseFloat(ad.metrics?.roas || '0');

      if (ctr < 1) {
        recs.push({
          issue: `Low CTR (${ctr.toFixed(2)}%)`,
          recommendation: 'Consider testing a more compelling headline or adding urgency to your copy. Try using power words like "Limited Time" or "Exclusive".',
          priority: 'high',
        });
      }

      if (cpc > 2) {
        recs.push({
          issue: `High CPC ($${cpc.toFixed(2)})`,
          recommendation: 'Your cost per click is above average. Review your targeting and consider A/B testing different creative variations.',
          priority: 'high',
        });
      }

      if (roas < 2 && roas > 0) {
        recs.push({
          issue: `Low ROAS (${roas.toFixed(2)}x)`,
          recommendation: 'Your return on ad spend is below target. Consider optimizing your conversion funnel and testing different offers.',
          priority: 'high',
        });
      }

      if (result.readabilityScore < 70) {
        recs.push({
          issue: `Low readability score (${result.readabilityScore}/100)`,
          recommendation: 'Simplify your ad copy. Use shorter sentences and remove jargon to improve comprehension.',
          priority: 'medium',
        });
      }

      if (ad.headline.length > 40) {
        recs.push({
          issue: 'Headline too long',
          recommendation: 'Facebook may truncate long headlines. Keep it under 40 characters for optimal display.',
          priority: 'low',
        });
      }

      if (result.complianceIssues && result.complianceIssues.length > 0) {
        recs.push({
          issue: 'Potential compliance issues detected',
          recommendation: result.complianceIssues.join('. '),
          priority: 'high',
        });
      }

      if (recs.length === 0) {
        recs.push({
          issue: 'No critical issues detected',
          recommendation: 'Your ad is performing well! Continue monitoring metrics and consider scaling budget.',
          priority: 'low',
        });
      }

      setRecommendations(prev => ({ ...prev, [ad.id]: recs }));

      await savePreLaunchReport({
        type: 'ad_doctor_analysis',
        adData: {
          id: ad.id,
          name: ad.name,
          headline: ad.headline,
          primaryText: ad.primaryText,
          metrics: ad.metrics,
        },
        metrics: {
          ctr: ctr.toString(),
          cpc: cpc.toString(),
          roas: roas.toString(),
          readabilityScore: result.readabilityScore,
        },
        summary: recs.map(r => r.issue).join('; '),
      });
    } catch (error) {
      console.error('Failed to analyze ad:', error);
    } finally {
      setAnalyzing(prev => ({ ...prev, [ad.id]: false }));
    }
  }

  async function generateImprovedVersion(ad: AdWithMetrics) {
    setGeneratingImproved(prev => ({ ...prev, [ad.id]: true }));

    try {
      const aiCore = createAICore();

      const prompt = `You are an expert Facebook ads copywriter. Analyze this ad and provide improved versions:

Current Ad:
- Headline: ${ad.headline}
- Primary Text: ${ad.primaryText}
- Description: ${ad.description}
- CTA: ${ad.cta}

Performance Metrics:
- CTR: ${ad.metrics?.ctr || 'N/A'}%
- CPC: $${ad.metrics?.cpc || 'N/A'}
- ROAS: ${ad.metrics?.roas || 'N/A'}x

Generate improved versions that:
1. Increase click-through rate with more compelling copy
2. Maintain brand voice while being more persuasive
3. Address any performance issues
4. Follow Facebook ad best practices

Provide:
- Improved Headline (max 40 chars)
- Improved Primary Text (125-150 chars)
- Improved Description (max 30 chars)
- Improved CTA (select from: Learn More, Shop Now, Sign Up, Download, Get Quote)
- Brief reasoning for changes

Format as JSON:
{
  "headline": "...",
  "primaryText": "...",
  "description": "...",
  "cta": "...",
  "reasoning": "..."
}`;

      const response = await aiCore.createChatCompletion([
        { role: 'user', content: prompt }
      ]);

      const content = response.choices[0]?.message?.content || '{}';
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      const improved = jsonMatch ? JSON.parse(jsonMatch[0]) : {
        headline: ad.headline,
        primaryText: ad.primaryText,
        description: ad.description,
        cta: ad.cta,
        reasoning: 'Unable to generate improved version',
      };

      setImprovedVersions(prev => ({ ...prev, [ad.id]: improved }));
    } catch (error) {
      console.error('Failed to generate improved version:', error);
    } finally {
      setGeneratingImproved(prev => ({ ...prev, [ad.id]: false }));
    }
  }

  function copyToClipboard(text: string, id: string) {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  }

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-screen">
          <Loader2 className="w-12 h-12 animate-spin text-blue-500" />
        </div>
      </DashboardLayout>
    );
  }

  if (!selectedAccount) {
    return (
      <DashboardLayout>
        <div className="max-w-6xl mx-auto">
          <div className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/20 rounded-xl p-8">
            <div className="flex items-center gap-4 mb-4">
              <AlertCircle className="w-12 h-12 text-blue-500" />
              <div>
                <h2 className="text-2xl font-bold text-text-light-primary dark:text-text-dark-primary">
                  Connect Your Ad Account
                </h2>
                <p className="text-text-light-secondary dark:text-text-dark-secondary mt-2">
                  Connect your Facebook account and select an ad account in Settings to use Ad Doctor.
                </p>
              </div>
            </div>
            <Link
              to="/settings"
              className="inline-block px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-lg hover:shadow-lg transition font-medium"
            >
              Go to Settings
            </Link>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl">
              <Stethoscope className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-bold text-text-light-primary dark:text-text-dark-primary">
                Ad Doctor
              </h1>
              <p className="text-text-light-secondary dark:text-text-dark-secondary mt-1">
                AI-powered diagnosis and recommendations for your campaigns
              </p>
            </div>
          </div>

          {selectedAccount && (
            <div className="flex items-center gap-2 text-sm text-text-light-secondary dark:text-text-dark-secondary">
              <CheckCircle className="w-4 h-4 text-green-500" />
              <span>Connected to: {selectedAccount.name}</span>
              <span className="mx-2">•</span>
              <span>{campaignGroups.length} campaigns, {ads.length} ads</span>
            </div>
          )}
        </div>

        {campaignGroups.length === 0 ? (
          <div className="text-center py-12 bg-light-secondary dark:bg-dark-tertiary rounded-xl">
            <Stethoscope className="w-16 h-16 mx-auto mb-4 text-gray-400" />
            <h3 className="text-xl font-bold text-text-light-primary dark:text-text-dark-primary mb-2">
              No Campaigns Found
            </h3>
            <p className="text-text-light-secondary dark:text-text-dark-secondary">
              We couldn't find any campaigns in your selected account.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {campaignGroups.map((campaign) => {
              const isExpanded = expandedCampaigns[campaign.id];

              return (
                <div
                  key={campaign.id}
                  className="bg-light-primary dark:bg-dark-secondary border border-border-light dark:border-border-dark rounded-xl overflow-hidden"
                >
                  <div
                    className="p-6 cursor-pointer hover:bg-light-secondary dark:hover:bg-dark-tertiary transition"
                    onClick={() =>
                      setExpandedCampaigns(prev => ({ ...prev, [campaign.id]: !prev[campaign.id] }))
                    }
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4 flex-1">
                        {isExpanded ? (
                          <ChevronDown className="w-5 h-5 text-text-light-secondary dark:text-text-dark-secondary flex-shrink-0" />
                        ) : (
                          <ChevronRight className="w-5 h-5 text-text-light-secondary dark:text-text-dark-secondary flex-shrink-0" />
                        )}
                        <div className="flex-1">
                          <h3 className="text-lg font-bold text-text-light-primary dark:text-text-dark-primary">
                            {campaign.name}
                          </h3>
                          <p className="text-sm text-text-light-secondary dark:text-text-dark-secondary">
                            {campaign.ads.length} ads
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-6">
                        <div className="text-right">
                          <p className="text-xs text-text-light-secondary dark:text-text-dark-secondary">
                            Total Spend
                          </p>
                          <p className="text-lg font-bold text-text-light-primary dark:text-text-dark-primary">
                            ${campaign.metrics.totalSpend.toFixed(2)}
                          </p>
                        </div>

                        <div className="text-right">
                          <p className="text-xs text-text-light-secondary dark:text-text-dark-secondary">
                            Avg CTR
                          </p>
                          <p className={`text-lg font-bold ${getPerformanceBadge(campaign.metrics.avgCTR, 'ctr').color}`}>
                            {campaign.metrics.avgCTR.toFixed(2)}%
                          </p>
                        </div>

                        <div className="text-right">
                          <p className="text-xs text-text-light-secondary dark:text-text-dark-secondary">
                            Avg CPC
                          </p>
                          <p className={`text-lg font-bold ${getPerformanceBadge(campaign.metrics.avgCPC, 'cpc').color}`}>
                            ${campaign.metrics.avgCPC.toFixed(2)}
                          </p>
                        </div>

                        <span
                          className={`px-3 py-1 rounded-full text-xs font-medium ${
                            campaign.status === 'ACTIVE'
                              ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                              : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300'
                          }`}
                        >
                          {campaign.status}
                        </span>
                      </div>
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="border-t border-border-light dark:border-border-dark bg-light-secondary dark:bg-dark-tertiary p-4">
                      <div className="space-y-4">
                        {campaign.ads.map((ad) => {
                          const isLowPerf = isUnderperforming(ad);
                          const hasRecs = recommendations[ad.id] && recommendations[ad.id].length > 0;
                          const isAdExpanded = expandedAd === ad.id;
                          const hasImprovedVersion = improvedVersions[ad.id];
                          const showImproved = showImprovedVersion[ad.id];

                          return (
                            <div
                              key={ad.id}
                              className={`bg-light-primary dark:bg-dark-secondary border ${
                                isLowPerf ? 'border-red-500/50' : 'border-border-light dark:border-border-dark'
                              } rounded-lg p-4`}
                            >
                              <div className="flex gap-4">
                                {ad.thumbnailUrl && (
                                  <div className="flex-shrink-0">
                                    <img
                                      src={ad.thumbnailUrl}
                                      alt={ad.name}
                                      className="w-24 h-24 object-cover rounded-lg"
                                    />
                                  </div>
                                )}

                                <div className="flex-1 space-y-3">
                                  <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                      <div className="flex items-center gap-2 mb-1">
                                        {isLowPerf && (
                                          <AlertCircle className="w-4 h-4 text-red-500" />
                                        )}
                                        <h4 className="font-bold text-text-light-primary dark:text-text-dark-primary">
                                          {ad.name}
                                        </h4>
                                      </div>
                                      {ad.adset_name && (
                                        <div className="flex items-center gap-2 text-xs text-text-light-secondary dark:text-text-dark-secondary">
                                          <Target className="w-3 h-3" />
                                          <span>{ad.adset_name}</span>
                                        </div>
                                      )}
                                    </div>
                                    <span
                                      className={`px-2 py-1 rounded-full text-xs font-medium ${
                                        ad.status === 'ACTIVE'
                                          ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                                          : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300'
                                      }`}
                                    >
                                      {ad.status}
                                    </span>
                                  </div>

                                  <div className="grid grid-cols-2 gap-3">
                                    <div>
                                      <p className="text-xs font-semibold text-text-light-secondary dark:text-text-dark-secondary">
                                        Headline
                                      </p>
                                      <p className="text-sm font-bold text-text-light-primary dark:text-text-dark-primary line-clamp-1">
                                        {ad.headline || 'N/A'}
                                      </p>
                                    </div>
                                    <div>
                                      <p className="text-xs font-semibold text-text-light-secondary dark:text-text-dark-secondary">
                                        CTA
                                      </p>
                                      <p className="text-sm text-text-light-primary dark:text-text-dark-primary">
                                        {ad.cta || 'N/A'}
                                      </p>
                                    </div>
                                  </div>

                                  <div>
                                    <p className="text-xs font-semibold text-text-light-secondary dark:text-text-dark-secondary mb-1">
                                      Primary Text
                                    </p>
                                    <p className="text-sm text-text-light-primary dark:text-text-dark-primary line-clamp-2">
                                      {ad.primaryText || 'N/A'}
                                    </p>
                                  </div>

                                  {ad.metrics && (
                                    <div className="grid grid-cols-3 md:grid-cols-6 gap-3 pt-3 border-t border-border-light dark:border-border-dark">
                                      <div>
                                        <div className="flex items-center gap-1 mb-1">
                                          <Eye className="w-3 h-3 text-blue-500" />
                                          <p className="text-xs text-text-light-secondary dark:text-text-dark-secondary">
                                            Reach
                                          </p>
                                        </div>
                                        <p className="text-sm font-bold text-text-light-primary dark:text-text-dark-primary">
                                          {ad.metrics.reach ? parseInt(ad.metrics.reach).toLocaleString() : '—'}
                                        </p>
                                      </div>

                                      <div>
                                        <div className="flex items-center gap-1 mb-1">
                                          <Eye className="w-3 h-3 text-purple-500" />
                                          <p className="text-xs text-text-light-secondary dark:text-text-dark-secondary">
                                            Impressions
                                          </p>
                                        </div>
                                        <p className="text-sm font-bold text-text-light-primary dark:text-text-dark-primary">
                                          {ad.metrics.impressions ? parseInt(ad.metrics.impressions).toLocaleString() : '—'}
                                        </p>
                                      </div>

                                      <div>
                                        <div className="flex items-center gap-1 mb-1">
                                          <MousePointer className="w-3 h-3 text-green-500" />
                                          <p className="text-xs text-text-light-secondary dark:text-text-dark-secondary">
                                            CTR
                                          </p>
                                        </div>
                                        <p className={`text-sm font-bold ${getPerformanceBadge(parseFloat(ad.metrics.ctr || '0'), 'ctr').color}`}>
                                          {ad.metrics.ctr ? `${parseFloat(ad.metrics.ctr).toFixed(2)}%` : '—'}
                                        </p>
                                      </div>

                                      <div>
                                        <div className="flex items-center gap-1 mb-1">
                                          <DollarSign className="w-3 h-3 text-yellow-500" />
                                          <p className="text-xs text-text-light-secondary dark:text-text-dark-secondary">
                                            CPC
                                          </p>
                                        </div>
                                        <p className={`text-sm font-bold ${getPerformanceBadge(parseFloat(ad.metrics.cpc || '0'), 'cpc').color}`}>
                                          {ad.metrics.cpc ? `$${parseFloat(ad.metrics.cpc).toFixed(2)}` : '—'}
                                        </p>
                                      </div>

                                      <div>
                                        <div className="flex items-center gap-1 mb-1">
                                          <TrendingUp className="w-3 h-3 text-orange-500" />
                                          <p className="text-xs text-text-light-secondary dark:text-text-dark-secondary">
                                            Spend
                                          </p>
                                        </div>
                                        <p className="text-sm font-bold text-text-light-primary dark:text-text-dark-primary">
                                          {ad.metrics.spend ? `$${parseFloat(ad.metrics.spend).toFixed(2)}` : '—'}
                                        </p>
                                      </div>

                                      <div>
                                        <div className="flex items-center gap-1 mb-1">
                                          <TrendingUp className="w-3 h-3 text-blue-500" />
                                          <p className="text-xs text-text-light-secondary dark:text-text-dark-secondary">
                                            ROAS
                                          </p>
                                        </div>
                                        <p className={`text-sm font-bold ${getPerformanceBadge(parseFloat(ad.metrics.roas || '0'), 'roas').color}`}>
                                          {ad.metrics.roas ? `${parseFloat(ad.metrics.roas).toFixed(2)}x` : '—'}
                                        </p>
                                      </div>
                                    </div>
                                  )}

                                  <div className="flex flex-wrap gap-2 pt-2">
                                    <button
                                      onClick={() => analyzeAd(ad)}
                                      disabled={analyzing[ad.id]}
                                      className="px-3 py-1.5 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-lg hover:shadow-lg transition font-medium text-sm disabled:opacity-50 flex items-center gap-1.5"
                                    >
                                      {analyzing[ad.id] ? (
                                        <>
                                          <Loader2 className="w-3 h-3 animate-spin" />
                                          Analyzing...
                                        </>
                                      ) : (
                                        <>
                                          <Stethoscope className="w-3 h-3" />
                                          Get Diagnosis
                                        </>
                                      )}
                                    </button>

                                    {hasRecs && (
                                      <button
                                        onClick={() => setExpandedAd(isAdExpanded ? null : ad.id)}
                                        className="px-3 py-1.5 bg-light-secondary dark:bg-dark-tertiary border border-border-light dark:border-border-dark rounded-lg hover:bg-light-tertiary dark:hover:bg-dark-primary transition font-medium text-sm"
                                      >
                                        {isAdExpanded ? (
                                          <>
                                            <ChevronUp className="w-3 h-3 inline" /> Hide Notes
                                          </>
                                        ) : (
                                          <>
                                            <ChevronDown className="w-3 h-3 inline" /> View Notes
                                          </>
                                        )}
                                      </button>
                                    )}

                                    {hasRecs && (
                                      <button
                                        onClick={() => generateImprovedVersion(ad)}
                                        disabled={generatingImproved[ad.id]}
                                        className="px-3 py-1.5 bg-green-500 hover:bg-green-600 text-white rounded-lg transition font-medium text-sm disabled:opacity-50 flex items-center gap-1.5"
                                      >
                                        {generatingImproved[ad.id] ? (
                                          <>
                                            <Loader2 className="w-3 h-3 animate-spin" />
                                            Generating...
                                          </>
                                        ) : (
                                          <>
                                            <Sparkles className="w-3 h-3" />
                                            Generate Improved
                                          </>
                                        )}
                                      </button>
                                    )}

                                    {hasImprovedVersion && (
                                      <button
                                        onClick={() =>
                                          setShowImprovedVersion(prev => ({
                                            ...prev,
                                            [ad.id]: !prev[ad.id],
                                          }))
                                        }
                                        className="px-3 py-1.5 bg-gradient-to-r from-green-500 to-blue-500 text-white rounded-lg hover:shadow-lg transition font-medium text-sm flex items-center gap-1.5"
                                      >
                                        <Zap className="w-3 h-3" />
                                        {showImproved ? 'Hide' : 'View'} Improved
                                      </button>
                                    )}
                                  </div>

                                  {isAdExpanded && hasRecs && (
                                    <div className="mt-4 pt-4 border-t border-border-light dark:border-border-dark">
                                      <div className="flex items-center gap-3 mb-3">
                                        <Sparkles className="w-5 h-5 text-blue-500" />
                                        <h5 className="text-lg font-bold text-text-light-primary dark:text-text-dark-primary">
                                          Doctor Notes & Recommendations
                                        </h5>
                                      </div>

                                      <div className="space-y-2">
                                        {recommendations[ad.id].map((rec, idx) => (
                                          <div
                                            key={idx}
                                            className={`p-3 rounded-lg border ${
                                              rec.priority === 'high'
                                                ? 'bg-red-50 dark:bg-red-900/10 border-red-200 dark:border-red-800'
                                                : rec.priority === 'medium'
                                                ? 'bg-yellow-50 dark:bg-yellow-900/10 border-yellow-200 dark:border-yellow-800'
                                                : 'bg-blue-50 dark:bg-blue-900/10 border-blue-200 dark:border-blue-800'
                                            }`}
                                          >
                                            <div className="flex items-start gap-2">
                                              <div
                                                className={`mt-0.5 flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-white font-bold text-xs ${
                                                  rec.priority === 'high'
                                                    ? 'bg-red-500'
                                                    : rec.priority === 'medium'
                                                    ? 'bg-yellow-500'
                                                    : 'bg-blue-500'
                                                }`}
                                              >
                                                {idx + 1}
                                              </div>
                                              <div className="flex-1">
                                                <p className="font-bold text-text-light-primary dark:text-text-dark-primary text-sm mb-1">
                                                  {rec.issue}
                                                </p>
                                                <p className="text-xs text-text-light-secondary dark:text-text-dark-secondary">
                                                  {rec.recommendation}
                                                </p>
                                              </div>
                                            </div>
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  )}

                                  {showImproved && hasImprovedVersion && (
                                    <div className="mt-4 pt-4 border-t border-border-light dark:border-border-dark">
                                      <div className="flex items-center gap-3 mb-3">
                                        <Zap className="w-5 h-5 text-green-500" />
                                        <h5 className="text-lg font-bold text-text-light-primary dark:text-text-dark-primary">
                                          Improved Version
                                        </h5>
                                      </div>

                                      <div className="bg-gradient-to-r from-green-500/10 to-blue-500/10 border border-green-500/20 rounded-lg p-4 space-y-3">
                                        <div>
                                          <div className="flex items-center justify-between mb-1">
                                            <p className="text-xs font-semibold text-text-light-secondary dark:text-text-dark-secondary">
                                              Improved Headline
                                            </p>
                                            <button
                                              onClick={() => copyToClipboard(hasImprovedVersion.headline, `${ad.id}-headline`)}
                                              className="p-1 hover:bg-green-500/20 rounded transition"
                                            >
                                              {copiedId === `${ad.id}-headline` ? (
                                                <CheckCircle className="w-3 h-3 text-green-500" />
                                              ) : (
                                                <Copy className="w-3 h-3 text-text-light-secondary dark:text-text-dark-secondary" />
                                              )}
                                            </button>
                                          </div>
                                          <p className="text-sm font-bold text-text-light-primary dark:text-text-dark-primary">
                                            {hasImprovedVersion.headline}
                                          </p>
                                        </div>

                                        <div>
                                          <div className="flex items-center justify-between mb-1">
                                            <p className="text-xs font-semibold text-text-light-secondary dark:text-text-dark-secondary">
                                              Improved Primary Text
                                            </p>
                                            <button
                                              onClick={() => copyToClipboard(hasImprovedVersion.primaryText, `${ad.id}-text`)}
                                              className="p-1 hover:bg-green-500/20 rounded transition"
                                            >
                                              {copiedId === `${ad.id}-text` ? (
                                                <CheckCircle className="w-3 h-3 text-green-500" />
                                              ) : (
                                                <Copy className="w-3 h-3 text-text-light-secondary dark:text-text-dark-secondary" />
                                              )}
                                            </button>
                                          </div>
                                          <p className="text-sm text-text-light-primary dark:text-text-dark-primary">
                                            {hasImprovedVersion.primaryText}
                                          </p>
                                        </div>

                                        {hasImprovedVersion.description && (
                                          <div>
                                            <div className="flex items-center justify-between mb-1">
                                              <p className="text-xs font-semibold text-text-light-secondary dark:text-text-dark-secondary">
                                                Improved Description
                                              </p>
                                              <button
                                                onClick={() => copyToClipboard(hasImprovedVersion.description, `${ad.id}-desc`)}
                                                className="p-1 hover:bg-green-500/20 rounded transition"
                                              >
                                                {copiedId === `${ad.id}-desc` ? (
                                                  <CheckCircle className="w-3 h-3 text-green-500" />
                                                ) : (
                                                  <Copy className="w-3 h-3 text-text-light-secondary dark:text-text-dark-secondary" />
                                                )}
                                              </button>
                                            </div>
                                            <p className="text-sm text-text-light-primary dark:text-text-dark-primary">
                                              {hasImprovedVersion.description}
                                            </p>
                                          </div>
                                        )}

                                        <div>
                                          <p className="text-xs font-semibold text-text-light-secondary dark:text-text-dark-secondary mb-1">
                                            Improved CTA
                                          </p>
                                          <p className="text-sm font-bold text-text-light-primary dark:text-text-dark-primary">
                                            {hasImprovedVersion.cta}
                                          </p>
                                        </div>

                                        <div className="pt-3 border-t border-green-500/20">
                                          <p className="text-xs font-semibold text-text-light-secondary dark:text-text-dark-secondary mb-1">
                                            Why These Changes?
                                          </p>
                                          <p className="text-xs text-text-light-primary dark:text-text-dark-primary italic">
                                            {hasImprovedVersion.reasoning}
                                          </p>
                                        </div>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
