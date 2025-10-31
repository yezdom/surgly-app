import { supabase } from './supabase';

export interface FacebookToken {
  user_id: string;
  access_token: string;
  token_type?: string;
  expires_in?: number;
  expires_at?: string;
  refresh_token?: string;
  is_valid?: boolean;
  last_refreshed_at?: string;
}

export async function getFacebookToken(userId: string): Promise<FacebookToken | null> {
  try {
    const { data, error } = await supabase
      .from('facebook_tokens')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    if (error) {
      console.error('Failed to fetch Facebook token:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Error fetching Facebook token:', error);
    return null;
  }
}

export async function isTokenExpired(token: FacebookToken): Promise<boolean> {
  if (!token.expires_at) {
    return false;
  }

  const expiresAt = new Date(token.expires_at);
  const now = new Date();
  const fiveMinutesFromNow = new Date(now.getTime() + 5 * 60 * 1000);

  return expiresAt <= fiveMinutesFromNow;
}

export async function refreshFacebookToken(userId: string, oldToken: string): Promise<boolean> {
  try {
    console.log('🔁 Attempting to refresh Facebook token...');

    const FACEBOOK_APP_ID = import.meta.env.VITE_FACEBOOK_APP_ID;
    const FACEBOOK_APP_SECRET = import.meta.env.VITE_FACEBOOK_APP_SECRET;

    if (!FACEBOOK_APP_ID || !FACEBOOK_APP_SECRET) {
      console.error('⚠️ Missing Facebook app credentials');
      return false;
    }

    const response = await fetch(
      `https://graph.facebook.com/v18.0/oauth/access_token?grant_type=fb_exchange_token&client_id=${FACEBOOK_APP_ID}&client_secret=${FACEBOOK_APP_SECRET}&fb_exchange_token=${oldToken}`
    );

    const data = await response.json();

    if (data.error) {
      console.error('⚠️ Failed to refresh Facebook token:', data.error);

      await supabase
        .from('facebook_tokens')
        .update({ is_valid: false })
        .eq('user_id', userId);

      return false;
    }

    if (data.access_token) {
      const expiresIn = data.expires_in || 5184000;
      const expiresAt = new Date(Date.now() + expiresIn * 1000);

      const { error: updateError } = await supabase
        .from('facebook_tokens')
        .update({
          access_token: data.access_token,
          token_type: data.token_type || 'bearer',
          expires_in: expiresIn,
          expires_at: expiresAt.toISOString(),
          is_valid: true,
          last_refreshed_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', userId);

      if (updateError) {
        console.error('⚠️ Failed to update refreshed token:', updateError);
        return false;
      }

      console.log('🔁 Facebook token refreshed successfully');
      console.log('📅 New expiry:', expiresAt.toISOString());
      return true;
    }

    return false;
  } catch (error) {
    console.error('⚠️ Error refreshing Facebook token:', error);
    return false;
  }
}

export async function getValidFacebookToken(userId: string): Promise<string | null> {
  try {
    const token = await getFacebookToken(userId);

    if (!token) {
      console.log('ℹ️ No Facebook token found for user');
      return null;
    }

    if (!token.is_valid) {
      console.log('⚠️ Token is marked as invalid');
      return null;
    }

    const expired = await isTokenExpired(token);

    if (expired) {
      console.log('⏰ Token is expired, attempting refresh...');
      const refreshed = await refreshFacebookToken(userId, token.access_token);

      if (!refreshed) {
        console.error('❌ Failed to refresh expired token');
        return null;
      }

      const newToken = await getFacebookToken(userId);
      return newToken?.access_token || null;
    }

    return token.access_token;
  } catch (error) {
    console.error('Error getting valid Facebook token:', error);
    return null;
  }
}

export async function invalidateFacebookToken(userId: string): Promise<void> {
  try {
    await supabase
      .from('facebook_tokens')
      .update({ is_valid: false, updated_at: new Date().toISOString() })
      .eq('user_id', userId);

    console.log('🔒 Facebook token invalidated');
  } catch (error) {
    console.error('Error invalidating Facebook token:', error);
  }
}

export async function deleteFacebookToken(userId: string): Promise<void> {
  try {
    await supabase
      .from('facebook_tokens')
      .delete()
      .eq('user_id', userId);

    console.log('🗑️ Facebook token deleted');
  } catch (error) {
    console.error('Error deleting Facebook token:', error);
  }
}
