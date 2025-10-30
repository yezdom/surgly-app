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

export async function exchangeCodeForToken(code: string): Promise<{ success: boolean; message: string }> {
  try {
    console.log('🔄 Starting token exchange...');

    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      throw new Error('User not authenticated');
    }

    const FACEBOOK_APP_ID = import.meta.env.VITE_FACEBOOK_APP_ID;
    const FACEBOOK_APP_SECRET = import.meta.env.VITE_FACEBOOK_APP_SECRET;
    const redirectUri = import.meta.env.VITE_FACEBOOK_REDIRECT_URI ||
                        `${window.location.origin}/auth/facebook/callback`;

    if (!FACEBOOK_APP_ID || !FACEBOOK_APP_SECRET) {
      throw new Error('Facebook app credentials not configured');
    }

    console.log('📡 Exchanging code for access token...');

    const tokenUrl = `https://graph.facebook.com/v18.0/oauth/access_token?client_id=${FACEBOOK_APP_ID}&redirect_uri=${encodeURIComponent(redirectUri)}&client_secret=${FACEBOOK_APP_SECRET}&code=${code}`;

    const tokenResponse = await fetch(tokenUrl);

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      console.error('❌ Token exchange failed:', errorText);
      throw new Error('Failed to exchange authorization code for access token');
    }

    const tokenData = await tokenResponse.json();

    if (!tokenData.access_token) {
      throw new Error('No access token received from Facebook');
    }

    console.log('✅ Access token received');

    const expiresIn = tokenData.expires_in || 5184000;
    const expiresAt = new Date(Date.now() + expiresIn * 1000).toISOString();

    console.log('💾 Storing access token in database...');

    const { error: upsertError } = await supabase
      .from('facebook_tokens')
      .upsert(
        {
          user_id: user.id,
          access_token: tokenData.access_token,
          expires_at: expiresAt,
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: 'user_id',
        }
      );

    if (upsertError) {
      console.error('❌ Failed to store token:', upsertError);
      throw new Error('Failed to store access token');
    }

    console.log('✅ Token stored successfully');

    console.log('📊 Fetching user businesses and ad accounts...');

    try {
      const businessesUrl = `https://graph.facebook.com/v18.0/me/businesses?access_token=${tokenData.access_token}&fields=id,name`;
      const businessesResponse = await fetch(businessesUrl);

      if (businessesResponse.ok) {
        const businessesData = await businessesResponse.json();
        console.log('✅ Found', businessesData.data?.length || 0, 'businesses');
      }
    } catch (err) {
      console.warn('⚠️ Could not fetch businesses (non-critical):', err);
    }

    return {
      success: true,
      message: 'Facebook connected successfully!'
    };

  } catch (error: any) {
    console.error('❌ Token exchange error:', error);
    return {
      success: false,
      message: error.message || 'Connection failed. Please try again.'
    };
  }
}

async function getAccessToken(): Promise<string | null> {
  try {
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return null;
    }

    const { data } = await supabase
      .from('facebook_tokens')
      .select('access_token')
      .eq('user_id', user.id)
      .maybeSingle();

    return data?.access_token || null;
  } catch (error) {
    console.error('Error getting access token:', error);
    return null;
  }
}

export async function getBusinesses() {
  try {
    const accessToken = await getAccessToken();

    if (!accessToken) {
      throw new Error('No access token available');
    }

    const response = await fetch(
      `https://graph.facebook.com/v18.0/me/businesses?fields=id,name&access_token=${accessToken}`
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch businesses: ${response.status}`);
    }

    const data = await response.json();
    return data.data || [];
  } catch (error) {
    console.error('Error fetching businesses:', error);
    throw error;
  }
}

export async function getAdAccountsFromBusiness(businessId: string) {
  try {
    const accessToken = await getAccessToken();

    if (!accessToken) {
      throw new Error('No access token available');
    }

    const response = await fetch(
      `https://graph.facebook.com/v18.0/${businessId}/owned_ad_accounts?fields=id,name,account_id,account_status&access_token=${accessToken}`
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch ad accounts: ${response.status}`);
    }

    const data = await response.json();
    return data.data || [];
  } catch (error) {
    console.error('Error fetching ad accounts from business:', error);
    throw error;
  }
}

export async function getInsights(adAccountId: string, datePreset: string = 'last_7d') {
  try {
    const accessToken = await getAccessToken();

    if (!accessToken) {
      throw new Error('No access token available');
    }

    const fields = 'spend,impressions,reach,clicks,ctr,cpc,actions,action_values';
    const response = await fetch(
      `https://graph.facebook.com/v18.0/act_${adAccountId}/insights?fields=${fields}&date_preset=${datePreset}&access_token=${accessToken}`
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch insights: ${response.status}`);
    }

    const data = await response.json();

    const insights = data.data?.[0] || {};

    const purchases = insights.actions?.find((a: any) => a.action_type === 'purchase')?.value || '0';
    const purchaseValue = insights.action_values?.find((a: any) => a.action_type === 'purchase')?.value || '0';

    const roas = parseFloat(insights.spend) > 0
      ? (parseFloat(purchaseValue) / parseFloat(insights.spend)).toFixed(2)
      : '0';

    return {
      spend: insights.spend || '0',
      impressions: insights.impressions || '0',
      reach: insights.reach || '0',
      clicks: insights.clicks || '0',
      ctr: insights.ctr || '0',
      cpc: insights.cpc || '0',
      purchases,
      purchaseValue,
      roas,
    };
  } catch (error) {
    console.error('Error fetching insights:', error);
    throw error;
  }
}

export async function getCreatives(adAccountId: string, limit: number = 50) {
  try {
    const accessToken = await getAccessToken();

    if (!accessToken) {
      throw new Error('No access token available');
    }

    const fields = 'id,name,effective_status,creative{title,body,call_to_action_type,image_url,thumbnail_url,object_story_spec}';
    const response = await fetch(
      `https://graph.facebook.com/v18.0/act_${adAccountId}/ads?fields=${fields}&limit=${limit}&access_token=${accessToken}`
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch creatives: ${response.status}`);
    }

    const data = await response.json();

    return (data.data || []).map((ad: any) => ({
      id: ad.id,
      name: ad.name,
      status: ad.effective_status,
      headline: ad.creative?.title || ad.creative?.object_story_spec?.link_data?.name || '',
      primaryText: ad.creative?.body || ad.creative?.object_story_spec?.link_data?.message || '',
      description: ad.creative?.object_story_spec?.link_data?.description || '',
      cta: ad.creative?.call_to_action_type || ad.creative?.object_story_spec?.link_data?.call_to_action?.type || '',
      thumbnailUrl: ad.creative?.thumbnail_url || ad.creative?.image_url || ad.creative?.object_story_spec?.link_data?.picture || '',
    }));
  } catch (error) {
    console.error('Error fetching creatives:', error);
    throw error;
  }
}

export async function saveSelectedAccount(businessId: string, adAccountId: string, adAccountName: string) {
  try {
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      throw new Error('Not authenticated');
    }

    const { data, error } = await supabase
      .from('ad_accounts')
      .upsert({
        user_id: user.id,
        business_id: businessId,
        account_id: adAccountId,
        name: adAccountName,
        platform: 'facebook',
      }, {
        onConflict: 'user_id,account_id',
      })
      .select()
      .single();

    if (error) throw error;

    return data;
  } catch (error) {
    console.error('Error saving selected account:', error);
    throw error;
  }
}

export async function getSelectedAccount() {
  try {
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return null;
    }

    const { data } = await supabase
      .from('ad_accounts')
      .select('*')
      .eq('user_id', user.id)
      .eq('platform', 'facebook')
      .order('created_at', { ascending: false })
      .maybeSingle();

    return data;
  } catch (error) {
    console.error('Error getting selected account:', error);
    return null;
  }
}
