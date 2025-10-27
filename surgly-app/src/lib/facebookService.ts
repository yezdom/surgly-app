import { supabase } from './supabase';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;

export interface FacebookAccount {
  id: string;
  name: string;
  account_status: number;
  currency: string;
  timezone_name: string;
  amount_spent?: string;
  balance?: string;
}

export interface Campaign {
  id: string;
  name: string;
  objective: string;
  status: string;
  daily_budget?: string;
  lifetime_budget?: string;
  created_time: string;
  updated_time: string;
  start_time?: string;
  stop_time?: string;
  insights?: {
    impressions?: string;
    clicks?: string;
    spend?: string;
    ctr?: string;
    cpc?: string;
  };
}

export interface DiagnosisResult {
  overall_score: number;
  health_status: string;
  summary: string;
  critical_issues: Array<{
    category: string;
    severity: string;
    issue: string;
    evidence: string;
    impact: string;
    recommendation: string;
    expected_improvement: string;
  }>;
  strengths: string[];
  quick_wins: Array<{
    action: string;
    difficulty: string;
    impact: string;
    expected_result: string;
  }>;
  benchmarks: {
    your_ctr: string;
    industry_avg_ctr: string;
    your_cpc: string;
    industry_avg_cpc: string;
    your_performance_vs_industry: string;
  };
  predicted_optimizations: {
    potential_cost_savings: string;
    potential_conversion_increase: string;
    recommended_budget_adjustment: string;
  };
}

async function getAuthToken(): Promise<string> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.access_token) {
    throw new Error('Not authenticated');
  }
  return session.access_token;
}

export async function checkFacebookConnection(): Promise<boolean> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;

    const { data } = await supabase
      .from('facebook_tokens')
      .select('id, expires_at')
      .eq('user_id', user.id)
      .maybeSingle();

    if (!data) return false;

    const expiresAt = new Date(data.expires_at);
    if (expiresAt < new Date()) return false;

    return true;
  } catch (error) {
    console.error('Error checking Facebook connection:', error);
    return false;
  }
}

export async function getAdAccounts(): Promise<FacebookAccount[]> {
  try {
    const token = await getAuthToken();
    const response = await fetch(
      `${SUPABASE_URL}/functions/v1/facebook-get-accounts`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      throw new Error('Failed to fetch ad accounts');
    }

    const data = await response.json();
    return data.accounts || [];
  } catch (error) {
    console.error('Error fetching ad accounts:', error);
    throw error;
  }
}

export async function getCampaigns(
  adAccountId: string,
  startDate?: string,
  endDate?: string
): Promise<Campaign[]> {
  try {
    const token = await getAuthToken();
    const params = new URLSearchParams({
      ad_account_id: adAccountId,
    });

    if (startDate) params.append('start_date', startDate);
    if (endDate) params.append('end_date', endDate);

    const response = await fetch(
      `${SUPABASE_URL}/functions/v1/facebook-get-campaigns?${params}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      throw new Error('Failed to fetch campaigns');
    }

    const data = await response.json();
    return data.campaigns || [];
  } catch (error) {
    console.error('Error fetching campaigns:', error);
    throw error;
  }
}

export async function diagnoseCampaign(
  campaignId: string
): Promise<DiagnosisResult> {
  try {
    const token = await getAuthToken();
    const response = await fetch(
      `${SUPABASE_URL}/functions/v1/facebook-diagnose-campaign`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ campaign_id: campaignId }),
      }
    );

    if (!response.ok) {
      throw new Error('Failed to diagnose campaign');
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error diagnosing campaign:', error);
    throw error;
  }
}
