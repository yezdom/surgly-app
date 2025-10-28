import { supabase } from './supabase';

// Helper function to calculate date range (last 90 days)
export function getDateRange(daysBack: number = 90): { startDate: string; endDate: string } {
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - daysBack);

  return {
    startDate: startDate.toISOString().split('T')[0],
    endDate: endDate.toISOString().split('T')[0]
  };
}

export async function getAdAccounts() {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      throw new Error('Not authenticated');
    }

    console.log('Fetching ad accounts for user:', user.id);

    const { data: accounts, error } = await supabase
      .from('ad_accounts')
      .select('*')
      .eq('user_id', user.id);

    if (error) throw error;

    console.log('Ad accounts found:', accounts?.length || 0);
    return accounts || [];
  } catch (error) {
    console.error('Error fetching ad accounts:', error);
    throw error;
  }
}

export async function getCampaigns(accountId: string, startDate?: string, endDate?: string) {
  try {
    const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
    const { data: { session } } = await supabase.auth.getSession();

    if (!session?.access_token) {
      throw new Error('Not authenticated');
    }

    console.log('Fetching campaigns for account:', accountId);

    // Use provided dates or default to last 90 days
    const dateRange = (startDate && endDate)
      ? { startDate, endDate }
      : getDateRange(90);

    const url = `${SUPABASE_URL}/functions/v1/facebook-get-campaigns?account_id=${accountId}&start_date=${dateRange.startDate}&end_date=${dateRange.endDate}`;

    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${session.access_token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Failed to fetch campaigns, status:', response.status);
      console.error('Error response:', errorText);
      throw new Error(`Failed to fetch campaigns: ${response.status}`);
    }

    const data = await response.json();
    console.log('Campaigns response:', data);
    return data;
  } catch (error) {
    console.error('Error in getCampaigns:', error);
    throw error;
  }
}

export async function getCreativeInsights(accountId: string) {
  try {
    const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
    const { data: { session } } = await supabase.auth.getSession();

    if (!session?.access_token) {
      throw new Error('Not authenticated');
    }

    console.log('Fetching creative insights for account:', accountId);

    const dateRange = getDateRange(90);
    const url = `${SUPABASE_URL}/functions/v1/facebook-get-campaigns?account_id=${accountId}&start_date=${dateRange.startDate}&end_date=${dateRange.endDate}&include_creatives=true`;

    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${session.access_token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Failed to fetch creative insights, status:', response.status);
      console.error('Error response:', errorText);
      throw new Error(`Failed to fetch creative insights: ${response.status}`);
    }

    const data = await response.json();
    console.log('Creative insights response:', data);
    return data;
  } catch (error) {
    console.error('Error in getCreativeInsights:', error);
    throw error;
  }
}

export async function checkFacebookConnection(): Promise<boolean> {
  try {
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return false;
    }

    const { data } = await supabase
      .from('facebook_tokens')
      .select('id, expires_at')
      .eq('user_id', user.id)
      .maybeSingle();

    if (!data) {
      return false;
    }

    const expiresAt = new Date(data.expires_at);
    return expiresAt > new Date();
  } catch (error) {
    console.error('Error checking Facebook connection:', error);
    return false;
  }
}
