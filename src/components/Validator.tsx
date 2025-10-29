import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import DashboardLayout from './DashboardLayout';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { getAdAccounts, getCampaigns } from '../lib/facebookService';
import {
  validateAdWithLandingPage,
  validateManualAd,
  auditLandingPage,
  fetchLandingPageText,
  generateImprovedAdCopy,
  AdValidationResult,
  LandingPageAuditResult,
} from '../lib/validationService';
import {
  CheckCircle,
  XCircle,
  Loader2,
  AlertCircle,
  ArrowRight,
  Rocket,
  ChevronDown,
  ChevronUp,
  Upload,
  Link as LinkIcon,
  Edit,
  Sparkles,
  TrendingUp,
  Shield,
  Target,
  Download,
  Lock,
} from 'lucide-react';

interface ValidationCheck {
  id: string;
  name: string;
  description: string;
  status: 'pending' | 'checking' | 'passed' | 'failed';
  error?: string;
  action?: { label: string; href: string };
}

type ValidationMode = 'auto' | 'landing' | 'manual';

export default function Validator() {
  const { user } = useAuth();
  const [validationMode, setValidationMode] = useState<ValidationMode>('auto');
  const [systemChecksExpanded, setSystemChecksExpanded] = useState(false);

  // System checks
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
      id: 'billing_active',
      name: 'Billing Active',
      description: 'Account billing status is active',
      status: 'pending',
    },
  ]);
  const [validatingSystem, setValidatingSystem] = useState(false);
  const [systemReadinessScore, setSystemReadinessScore] = useState(0);

  // Auto validation
  const [autoValidating, setAutoValidating] = useState(false);
  const [autoResult, setAutoResult] = useState<AdValidationResult | null>(null);

  // Landing page validation
  const [landingUrl, setLandingUrl] = useState('');
  const [landingValidating, setLandingValidating] = useState(false);
  const [landingResult, setLandingResult] = useState<LandingPageAuditResult | null>(null);

  // Manual validation
  const [manualAdCopy, setManualAdCopy] = useState('');
  const [manualValidating, setManualValidating] = useState(false);
  const [manualResult, setManualResult] = useState<AdValidationResult | null>(null);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);

  // Improved copy generation
  const [generatingCopy, setGeneratingCopy] = useState(false);
  const [improvedCopy, setImprovedCopy] = useState<{ headline: string; body: string } | null>(null);

  const userPlan = user?.subscription_tier || 'Free';
  const isPro = userPlan === 'Pro' || userPlan === 'Agency';
  const isAgency = userPlan === 'Agency';

  useEffect(() => {
    runSystemValidation();
  }, []);

  async function runSystemValidation() {
    setValidatingSystem(true);

    for (const check of checks) {
      await validateCheck(check.id);
      await new Promise(resolve => setTimeout(resolve, 300));
    }

    setValidatingSystem(false);
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
          const { data: { user: authUser } } = await supabase.auth.getUser();
          if (!authUser) throw new Error('Not authenticated');

          const { data } = await supabase
            .from('facebook_tokens')
            .select('id, expires_at')
            .eq('user_id', authUser.id)
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
    setSystemReadinessScore(score);
  }, [checks]);

  async function handleAutoValidation() {
    if (!isPro) {
      alert('Auto-validation is available for Pro and Agency users only. Please upgrade your plan.');
      return;
    }

    setAutoValidating(true);
    setAutoResult(null);

    try {
      const accounts = await getAdAccounts();
      if (accounts.length === 0) {
        throw new Error('No ad accounts found. Please connect your Facebook account.');
      }

      const campaigns = await getCampaigns(accounts[0].account_id);
      if (!campaigns.data || campaigns.data.length === 0) {
        throw new Error('No campaigns found. Please create a campaign first.');
      }

      const campaign = campaigns.data[0];
      const headline = campaign.name || 'Untitled Campaign';
      const body = 'Sample ad body text';
      const objective = campaign.objective || 'CONVERSIONS';
      const destinationUrl = 'https://example.com';

      let landingPageText = '';
      try {
        landingPageText = await fetchLandingPageText(destinationUrl);
      } catch (error) {
        console.warn('Could not fetch landing page, continuing without it');
      }

      const result = await validateAdWithLandingPage(
        headline,
        body,
        objective,
        landingPageText
      );

      setAutoResult(result);
    } catch (error: any) {
      alert(error.message || 'Failed to validate ad automatically');
    } finally {
      setAutoValidating(false);
    }
  }

  async function handleLandingPageValidation() {
    if (!landingUrl.trim()) {
      alert('Please enter a landing page URL');
      return;
    }

    setLandingValidating(true);
    setLandingResult(null);

    try {
      const landingPageText = await fetchLandingPageText(landingUrl);
      const result = await auditLandingPage(landingPageText);
      setLandingResult(result);
    } catch (error: any) {
      alert(error.message || 'Failed to validate landing page');
    } finally {
      setLandingValidating(false);
    }
  }

  async function handleManualValidation() {
    if (!manualAdCopy.trim()) {
      alert('Please enter your ad copy');
      return;
    }

    setManualValidating(true);
    setManualResult(null);

    try {
      const result = await validateManualAd(manualAdCopy);
      setManualResult(result);
    } catch (error: any) {
      alert(error.message || 'Failed to validate ad');
    } finally {
      setManualValidating(false);
    }
  }

  async function handleGenerateImprovedCopy() {
    if (!manualResult) return;

    setGeneratingCopy(true);

    try {
      const improved = await generateImprovedAdCopy(
        manualAdCopy,
        manualResult.recommendations
      );
      setImprovedCopy(improved);
    } catch (error: any) {
      alert(error.message || 'Failed to generate improved copy');
    } finally {
      setGeneratingCopy(false);
    }
  }

  function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) {
      setUploadedFile(file);
    }
  }

  function renderValidationResult(result: AdValidationResult) {
    const getScoreColor = (score: number) => {
      if (score >= 80) return 'text-green-500';
      if (score >= 60) return 'text-yellow-500';
      return 'text-red-500';
    };

    const getEngagementIcon = (level: string) => {
      if (level === 'High') return '🔥';
      if (level === 'Medium') return '⚡';
      return '💤';
    };

    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center mb-8">
          <div className="relative w-48 h-48">
            <svg className="w-full h-full transform -rotate-90">
              <circle
                cx="96"
                cy="96"
                r="80"
                stroke="currentColor"
                strokeWidth="12"
                fill="none"
                className="text-gray-200 dark:text-gray-700"
              />
              <circle
                cx="96"
                cy="96"
                r="80"
                stroke="currentColor"
                strokeWidth="12"
                fill="none"
                strokeDasharray={`${2 * Math.PI * 80}`}
                strokeDashoffset={`${2 * Math.PI * 80 * (1 - result.adReadinessScore / 100)}`}
                className={getScoreColor(result.adReadinessScore)}
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <div className={`text-5xl font-bold ${getScoreColor(result.adReadinessScore)}`}>
                {result.adReadinessScore}
              </div>
              <div className="text-sm text-text-light-secondary dark:text-text-dark-secondary">
                Ad Readiness
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="bg-light-primary dark:bg-dark-secondary border border-border-light dark:border-border-dark rounded-xl p-6">
            <div className="flex items-center gap-3 mb-2">
              <Target className="w-5 h-5 text-blue-500" />
              <h3 className="font-bold text-text-light-primary dark:text-text-dark-primary">
                Readability
              </h3>
            </div>
            <div className={`text-3xl font-bold ${getScoreColor(result.readabilityScore)}`}>
              {result.readabilityScore}%
            </div>
            <p className="text-sm text-text-light-secondary dark:text-text-dark-secondary mt-1">
              {result.emotionalTone}
            </p>
          </div>

          <div className="bg-light-primary dark:bg-dark-secondary border border-border-light dark:border-border-dark rounded-xl p-6">
            <div className="flex items-center gap-3 mb-2">
              <Shield className="w-5 h-5 text-green-500" />
              <h3 className="font-bold text-text-light-primary dark:text-text-dark-primary">
                Compliance
              </h3>
            </div>
            <div className={`text-3xl font-bold ${
              result.complianceRisk === 'Low' ? 'text-green-500' :
              result.complianceRisk === 'Medium' ? 'text-yellow-500' :
              'text-red-500'
            }`}>
              {result.complianceRisk === 'Low' ? '✅' :
               result.complianceRisk === 'Medium' ? '⚠️' : '🚫'}
            </div>
            <p className="text-sm text-text-light-secondary dark:text-text-dark-secondary mt-1">
              {result.complianceRisk} Risk
            </p>
          </div>

          <div className="bg-light-primary dark:bg-dark-secondary border border-border-light dark:border-border-dark rounded-xl p-6">
            <div className="flex items-center gap-3 mb-2">
              <TrendingUp className="w-5 h-5 text-orange-500" />
              <h3 className="font-bold text-text-light-primary dark:text-text-dark-primary">
                Engagement
              </h3>
            </div>
            <div className="text-3xl font-bold text-orange-500">
              {getEngagementIcon(result.engagementLevel)} {result.engagementLevel}
            </div>
            <p className="text-sm text-text-light-secondary dark:text-text-dark-secondary mt-1">
              Predicted Level
            </p>
          </div>

          {isPro && (
            <>
              <div className="bg-light-primary dark:bg-dark-secondary border border-border-light dark:border-border-dark rounded-xl p-6">
                <div className="flex items-center gap-3 mb-2">
                  <Sparkles className="w-5 h-5 text-blue-500" />
                  <h3 className="font-bold text-text-light-primary dark:text-text-dark-primary">
                    Predicted CTR
                  </h3>
                </div>
                <div className="text-3xl font-bold text-blue-500">
                  {result.predictedCTR.toFixed(1)}%
                </div>
                <p className="text-sm text-text-light-secondary dark:text-text-dark-secondary mt-1">
                  Click-through Rate
                </p>
              </div>

              <div className="bg-light-primary dark:bg-dark-secondary border border-border-light dark:border-border-dark rounded-xl p-6">
                <div className="flex items-center gap-3 mb-2">
                  <TrendingUp className="w-5 h-5 text-green-500" />
                  <h3 className="font-bold text-text-light-primary dark:text-text-dark-primary">
                    Predicted ROI
                  </h3>
                </div>
                <div className="text-3xl font-bold text-green-500">
                  {result.predictedROI.toFixed(1)}x
                </div>
                <p className="text-sm text-text-light-secondary dark:text-text-dark-secondary mt-1">
                  Return on Investment
                </p>
              </div>

              <div className="bg-light-primary dark:bg-dark-secondary border border-border-light dark:border-border-dark rounded-xl p-6">
                <div className="flex items-center gap-3 mb-2">
                  <Target className="w-5 h-5 text-purple-500" />
                  <h3 className="font-bold text-text-light-primary dark:text-text-dark-primary">
                    Conversion
                  </h3>
                </div>
                <div className="text-3xl font-bold text-purple-500">
                  {result.conversionPotential}
                </div>
                <p className="text-sm text-text-light-secondary dark:text-text-dark-secondary mt-1">
                  Potential
                </p>
              </div>
            </>
          )}

          {!isPro && (
            <div className="md:col-span-2 lg:col-span-3 bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/20 rounded-xl p-6">
              <div className="flex items-center gap-3 mb-3">
                <Lock className="w-6 h-6 text-blue-500" />
                <h3 className="text-lg font-bold text-text-light-primary dark:text-text-dark-primary">
                  Unlock Advanced Metrics
                </h3>
              </div>
              <p className="text-text-light-secondary dark:text-text-dark-secondary mb-4">
                Upgrade to Pro or Agency to access Predicted CTR, ROI estimates, and conversion potential analysis.
              </p>
              <Link
                to="/pricing"
                className="inline-block px-6 py-2 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-lg hover:shadow-lg transition font-medium"
              >
                Upgrade Now
              </Link>
            </div>
          )}
        </div>

        <div className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/20 rounded-xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <Sparkles className="w-6 h-6 text-blue-500" />
            <h3 className="text-xl font-bold text-text-light-primary dark:text-text-dark-primary">
              Dr. Surgly Recommends
            </h3>
          </div>
          <div className="space-y-3">
            {result.recommendations.map((rec, index) => (
              <div key={index} className="flex items-start gap-3">
                <div className="mt-1 w-6 h-6 rounded-full bg-blue-500 text-white flex items-center justify-center text-sm font-bold flex-shrink-0">
                  {index + 1}
                </div>
                <p className="text-text-light-primary dark:text-text-dark-primary">{rec}</p>
              </div>
            ))}
          </div>
        </div>

        {result.suggestedHeadline && (
          <div className="bg-light-primary dark:bg-dark-secondary border border-border-light dark:border-border-dark rounded-xl p-6">
            <h3 className="text-lg font-bold text-text-light-primary dark:text-text-dark-primary mb-3">
              Suggested Headline Rewrite
            </h3>
            <p className="text-text-light-primary dark:text-text-dark-primary italic">
              "{result.suggestedHeadline}"
            </p>
          </div>
        )}

        <div className="flex flex-wrap gap-3">
          <button
            onClick={handleGenerateImprovedCopy}
            disabled={generatingCopy}
            className="px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-lg hover:shadow-lg transition font-medium disabled:opacity-50 flex items-center gap-2"
          >
            {generatingCopy ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5" />
                Generate Improved Version
              </>
            )}
          </button>

          {isPro && (
            <button
              className="px-6 py-3 bg-light-secondary dark:bg-dark-tertiary text-text-light-primary dark:text-text-dark-primary rounded-lg hover:opacity-80 transition font-medium flex items-center gap-2"
            >
              <Download className="w-5 h-5" />
              Save Report
            </button>
          )}

          {isAgency && (
            <button
              className="px-6 py-3 bg-light-secondary dark:bg-dark-tertiary text-text-light-primary dark:text-text-dark-primary rounded-lg hover:opacity-80 transition font-medium flex items-center gap-2"
            >
              <Download className="w-5 h-5" />
              Export as PDF
            </button>
          )}
        </div>

        {improvedCopy && (
          <div className="bg-gradient-to-r from-green-500/10 to-teal-500/10 border border-green-500/20 rounded-xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <CheckCircle className="w-6 h-6 text-green-500" />
              <h3 className="text-xl font-bold text-text-light-primary dark:text-text-dark-primary">
                Improved Ad Copy
              </h3>
            </div>
            <div className="space-y-4">
              <div>
                <p className="text-sm font-semibold text-text-light-secondary dark:text-text-dark-secondary mb-2">
                  Headline:
                </p>
                <p className="text-text-light-primary dark:text-text-dark-primary font-medium">
                  {improvedCopy.headline}
                </p>
              </div>
              <div>
                <p className="text-sm font-semibold text-text-light-secondary dark:text-text-dark-secondary mb-2">
                  Body:
                </p>
                <p className="text-text-light-primary dark:text-text-dark-primary">
                  {improvedCopy.body}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-text-light-primary dark:text-text-dark-primary mb-2">
            Pre-Launch Validator
          </h1>
          <p className="text-text-light-secondary dark:text-text-dark-secondary">
            Validate your ad setup before spending money
          </p>
        </div>

        <div className="bg-light-primary dark:bg-dark-secondary border border-border-light dark:border-border-dark rounded-xl mb-8">
          <div className="border-b border-border-light dark:border-border-dark">
            <div className="flex flex-wrap gap-2 p-4">
              <button
                onClick={() => setValidationMode('auto')}
                className={`flex-1 min-w-[200px] px-6 py-4 rounded-lg font-semibold transition ${
                  validationMode === 'auto'
                    ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-lg'
                    : 'bg-light-secondary dark:bg-dark-tertiary text-text-light-primary dark:text-text-dark-primary hover:opacity-80'
                }`}
              >
                <div className="flex items-center justify-center gap-2 mb-1">
                  <Rocket className="w-5 h-5" />
                  Auto-Validate
                </div>
                <div className="text-xs opacity-80">Connected Account</div>
              </button>

              <button
                onClick={() => setValidationMode('landing')}
                className={`flex-1 min-w-[200px] px-6 py-4 rounded-lg font-semibold transition ${
                  validationMode === 'landing'
                    ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-lg'
                    : 'bg-light-secondary dark:bg-dark-tertiary text-text-light-primary dark:text-text-dark-primary hover:opacity-80'
                }`}
              >
                <div className="flex items-center justify-center gap-2 mb-1">
                  <LinkIcon className="w-5 h-5" />
                  Landing Page Audit
                </div>
                <div className="text-xs opacity-80">URL Input</div>
              </button>

              <button
                onClick={() => setValidationMode('manual')}
                className={`flex-1 min-w-[200px] px-6 py-4 rounded-lg font-semibold transition ${
                  validationMode === 'manual'
                    ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-lg'
                    : 'bg-light-secondary dark:bg-dark-tertiary text-text-light-primary dark:text-text-dark-primary hover:opacity-80'
                }`}
              >
                <div className="flex items-center justify-center gap-2 mb-1">
                  <Edit className="w-5 h-5" />
                  Manual Upload
                </div>
                <div className="text-xs opacity-80">Paste Ad Copy</div>
              </button>
            </div>
          </div>

          <div className="p-8">
            {validationMode === 'auto' && (
              <div className="space-y-6">
                <div className="text-center">
                  <Rocket className="w-16 h-16 mx-auto mb-4 text-blue-500" />
                  <h2 className="text-2xl font-bold text-text-light-primary dark:text-text-dark-primary mb-2">
                    Automatic Ad Validation
                  </h2>
                  <p className="text-text-light-secondary dark:text-text-dark-secondary mb-6">
                    Connect your Facebook account to automatically analyze your active campaigns
                  </p>
                  {!isPro && (
                    <div className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/20 rounded-xl p-6 mb-6">
                      <Lock className="w-8 h-8 mx-auto mb-3 text-blue-500" />
                      <p className="text-text-light-primary dark:text-text-dark-primary font-semibold mb-2">
                        Pro Feature
                      </p>
                      <p className="text-text-light-secondary dark:text-text-dark-secondary mb-4">
                        Automatic validation is available for Pro and Agency users only
                      </p>
                      <Link
                        to="/pricing"
                        className="inline-block px-6 py-2 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-lg hover:shadow-lg transition font-medium"
                      >
                        Upgrade to Pro
                      </Link>
                    </div>
                  )}
                  <button
                    onClick={handleAutoValidation}
                    disabled={autoValidating || !isPro}
                    className="px-8 py-3 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-lg hover:shadow-lg transition font-medium disabled:opacity-50 flex items-center gap-2 mx-auto"
                  >
                    {autoValidating ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Analyzing...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-5 h-5" />
                        Run Auto-Validation
                      </>
                    )}
                  </button>
                </div>

                {autoResult && renderValidationResult(autoResult)}
              </div>
            )}

            {validationMode === 'landing' && (
              <div className="space-y-6">
                <div className="text-center mb-6">
                  <LinkIcon className="w-16 h-16 mx-auto mb-4 text-blue-500" />
                  <h2 className="text-2xl font-bold text-text-light-primary dark:text-text-dark-primary mb-2">
                    Landing Page Audit
                  </h2>
                  <p className="text-text-light-secondary dark:text-text-dark-secondary">
                    Enter your landing page URL and we'll generate optimized ad copy
                  </p>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-text-light-primary dark:text-text-dark-primary mb-2">
                      Landing Page URL
                    </label>
                    <input
                      type="url"
                      value={landingUrl}
                      onChange={(e) => setLandingUrl(e.target.value)}
                      placeholder="https://your-landing-page.com"
                      className="w-full px-4 py-3 bg-light-secondary dark:bg-dark-tertiary border border-border-light dark:border-border-dark rounded-lg text-text-light-primary dark:text-text-dark-primary"
                    />
                  </div>

                  <button
                    onClick={handleLandingPageValidation}
                    disabled={landingValidating}
                    className="w-full px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-lg hover:shadow-lg transition font-medium disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {landingValidating ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Analyzing Page...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-5 h-5" />
                        Audit Landing Page
                      </>
                    )}
                  </button>
                </div>

                {landingResult && (
                  <div className="space-y-6 mt-8">
                    <div className="bg-gradient-to-r from-green-500/10 to-teal-500/10 border border-green-500/20 rounded-xl p-6">
                      <h3 className="text-xl font-bold text-text-light-primary dark:text-text-dark-primary mb-4">
                        Suggested Ad Copy
                      </h3>
                      <div className="space-y-4">
                        <div>
                          <p className="text-sm font-semibold text-text-light-secondary dark:text-text-dark-secondary mb-2">
                            Headline:
                          </p>
                          <p className="text-text-light-primary dark:text-text-dark-primary font-medium">
                            {landingResult.suggestedAdCopy.headline}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-text-light-secondary dark:text-text-dark-secondary mb-2">
                            Body:
                          </p>
                          <p className="text-text-light-primary dark:text-text-dark-primary">
                            {landingResult.suggestedAdCopy.body}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="bg-light-primary dark:bg-dark-secondary border border-border-light dark:border-border-dark rounded-xl p-6">
                        <h3 className="font-bold text-text-light-primary dark:text-text-dark-primary mb-2">
                          Clarity Score
                        </h3>
                        <div className="text-3xl font-bold text-blue-500">
                          {landingResult.clarityScore}%
                        </div>
                      </div>

                      <div className="bg-light-primary dark:bg-dark-secondary border border-border-light dark:border-border-dark rounded-xl p-6">
                        <h3 className="font-bold text-text-light-primary dark:text-text-dark-primary mb-2">
                          Compliance
                        </h3>
                        <div className="text-3xl font-bold text-green-500">
                          {landingResult.complianceLevel}
                        </div>
                      </div>

                      <div className="bg-light-primary dark:bg-dark-secondary border border-border-light dark:border-border-dark rounded-xl p-6">
                        <h3 className="font-bold text-text-light-primary dark:text-text-dark-primary mb-2">
                          Conversion Ready
                        </h3>
                        <div className="text-3xl font-bold text-purple-500">
                          {landingResult.conversionReadiness}%
                        </div>
                      </div>
                    </div>

                    <div className="bg-light-primary dark:bg-dark-secondary border border-border-light dark:border-border-dark rounded-xl p-6">
                      <h3 className="text-lg font-bold text-text-light-primary dark:text-text-dark-primary mb-4">
                        Recommendations
                      </h3>
                      <div className="space-y-3">
                        {landingResult.recommendations.map((rec, index) => (
                          <div key={index} className="flex items-start gap-3">
                            <div className="mt-1 w-6 h-6 rounded-full bg-blue-500 text-white flex items-center justify-center text-sm font-bold flex-shrink-0">
                              {index + 1}
                            </div>
                            <p className="text-text-light-primary dark:text-text-dark-primary">{rec}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {validationMode === 'manual' && (
              <div className="space-y-6">
                <div className="text-center mb-6">
                  <Edit className="w-16 h-16 mx-auto mb-4 text-blue-500" />
                  <h2 className="text-2xl font-bold text-text-light-primary dark:text-text-dark-primary mb-2">
                    Manual Ad Validation
                  </h2>
                  <p className="text-text-light-secondary dark:text-text-dark-secondary">
                    Upload your creative and paste your ad copy for AI analysis
                  </p>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-text-light-primary dark:text-text-dark-primary mb-2">
                      Upload Creative (Optional)
                    </label>
                    <div className="border-2 border-dashed border-border-light dark:border-border-dark rounded-xl p-8 text-center">
                      <input
                        type="file"
                        accept="image/*,video/*"
                        onChange={handleFileUpload}
                        className="hidden"
                        id="file-upload"
                      />
                      <label htmlFor="file-upload" className="cursor-pointer">
                        <Upload className="w-12 h-12 mx-auto mb-3 text-text-light-secondary dark:text-text-dark-secondary" />
                        <p className="text-text-light-primary dark:text-text-dark-primary font-medium mb-1">
                          {uploadedFile ? uploadedFile.name : 'Click to upload'}
                        </p>
                        <p className="text-sm text-text-light-secondary dark:text-text-dark-secondary">
                          PNG, JPG, MP4 up to 10MB
                        </p>
                      </label>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-text-light-primary dark:text-text-dark-primary mb-2">
                      Ad Copy
                    </label>
                    <textarea
                      value={manualAdCopy}
                      onChange={(e) => setManualAdCopy(e.target.value)}
                      placeholder="Paste your ad headline and body text here..."
                      rows={8}
                      className="w-full px-4 py-3 bg-light-secondary dark:bg-dark-tertiary border border-border-light dark:border-border-dark rounded-lg text-text-light-primary dark:text-text-dark-primary"
                    />
                  </div>

                  <button
                    onClick={handleManualValidation}
                    disabled={manualValidating}
                    className="w-full px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-lg hover:shadow-lg transition font-medium disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {manualValidating ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Analyzing Ad...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-5 h-5" />
                        Run Validation
                      </>
                    )}
                  </button>
                </div>

                {manualResult && renderValidationResult(manualResult)}
              </div>
            )}
          </div>
        </div>

        <div className="bg-light-primary dark:bg-dark-secondary border border-border-light dark:border-border-dark rounded-xl">
          <button
            onClick={() => setSystemChecksExpanded(!systemChecksExpanded)}
            className="w-full px-6 py-4 flex items-center justify-between hover:bg-light-secondary dark:hover:bg-dark-tertiary transition"
          >
            <div className="flex items-center gap-3">
              <Shield className="w-6 h-6 text-blue-500" />
              <div className="text-left">
                <h3 className="text-lg font-bold text-text-light-primary dark:text-text-dark-primary">
                  System Readiness
                </h3>
                <p className="text-sm text-text-light-secondary dark:text-text-dark-secondary">
                  {systemReadinessScore}% Complete
                </p>
              </div>
            </div>
            {systemChecksExpanded ? (
              <ChevronUp className="w-6 h-6 text-text-light-secondary dark:text-text-dark-secondary" />
            ) : (
              <ChevronDown className="w-6 h-6 text-text-light-secondary dark:text-text-dark-secondary" />
            )}
          </button>

          {systemChecksExpanded && (
            <div className="border-t border-border-light dark:border-border-dark p-6 space-y-4">
              {checks.map((check) => (
                <div
                  key={check.id}
                  className="flex items-start justify-between gap-4 p-4 bg-light-secondary dark:bg-dark-tertiary rounded-lg"
                >
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
                      <h3 className="font-bold text-text-light-primary dark:text-text-dark-primary mb-1">
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
              ))}

              <button
                onClick={runSystemValidation}
                disabled={validatingSystem}
                className="w-full py-3 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-lg hover:shadow-lg transition font-medium disabled:opacity-50"
              >
                {validatingSystem ? 'Validating...' : 'Re-run System Check'}
              </button>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
