// STEP 2: Update this file in surgly-app/src/lib/facebookService.ts

import { supabase } from './supabase';

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

export async function getCampaigns(accountId: string) {
  try {
    const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
    const { data: { session } } = await supabase.auth.getSession();

    if (!session?.access_token) {
      throw new Error('Not authenticated');
    }

    console.log('Fetching campaigns for account:', accountId);

    // FIXED: Use consistent parameter name 'account_id'
    const response = await fetch(
      `${SUPABASE_URL}/functions/v1/facebook-get-campaigns?account_id=${accountId}`,
      {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
      }
    );

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
