import { supabase } from './supabase';

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
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      console.error('No user found');
      return [];
    }

    console.log('Fetching ad accounts for user:', user.id);

    // Read directly from ad_accounts table
    const { data: accounts, error } = await supabase
      .from('ad_accounts')
      .select('*')
      .eq('user_id', user.id)
      .eq('is_active', true);

    if (error) {
      console.error('Database error fetching ad accounts:', error);
      return [];
    }

    if (!accounts || accounts.length === 0) {
      console.log('No ad accounts found in database');
      return [];
    }

    console.log('Ad accounts found:', accounts.length);

    // Transform to match expected format
    return accounts.map(account => ({
      id: account.account_id,
      name: account.account_name,
      account_status: 1,
      currency: account.currency || 'GBP',
      timezone_name: 'Europe/London',
    }));
  } catch (error) {
    console.error('Error fetching ad accounts:', error);
    return [];
  }
}

export async function getCampaigns(
  adAccountId: string,
  startDate?: string,
  endDate?: string
): Promise<Campaign[]> {
  try {
    console.log('Fetching campaigns for account:', adAccountId);
    
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.access_token) {
      console.error('Not authenticated');
      return [];
    }

    const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
    
    const response = await fetch(
      `${SUPABASE_URL}/functions/v1/facebook-get-campaigns`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          adAccountId: adAccountId,
          startDate: startDate,
          endDate: endDate
        }),
      }
    );

    if (!response.ok) {
      console.error('Failed to fetch campaigns, status:', response.status);
      const errorText = await response.text();
      console.error('Error response:', errorText);
      return [];
    }

    const data = await response.json();
    console.log('Campaigns fetched:', data.data?.length || 0);
    
    return data.data || [];
  } catch (error) {
    console.error('Error fetching campaigns:', error);
    return [];
  }
}

export async function diagnoseCampaign(campaignId: string): Promise<any> {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.access_token) {
      throw new Error('Not authenticated');
    }

    const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
    const response = await fetch(
      `${SUPABASE_URL}/functions/v1/facebook-diagnose-campaign`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${session.access_token}`,
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
