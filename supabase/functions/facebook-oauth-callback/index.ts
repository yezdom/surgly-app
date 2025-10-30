import { createClient } from 'jsr:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    console.log('🔗 Facebook OAuth callback handler started');

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Missing Authorization header');
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: authHeader },
        },
      }
    );

    const {
      data: { user },
      error: userError,
    } = await supabaseClient.auth.getUser();

    if (userError || !user) {
      console.error('❌ User authentication failed:', userError);
      throw new Error('User not authenticated');
    }

    console.log('✅ User authenticated:', user.email);

    const { code } = await req.json();

    if (!code) {
      throw new Error('Missing authorization code');
    }

    console.log('📋 Authorization code received');

    const FACEBOOK_APP_ID = Deno.env.get('FACEBOOK_APP_ID');
    const FACEBOOK_APP_SECRET = Deno.env.get('FACEBOOK_APP_SECRET');
    const FACEBOOK_REDIRECT_URI = Deno.env.get('FACEBOOK_REDIRECT_URI');

    if (!FACEBOOK_APP_ID || !FACEBOOK_APP_SECRET || !FACEBOOK_REDIRECT_URI) {
      console.error('❌ Missing Facebook environment variables');
      throw new Error('Facebook app not configured');
    }

    console.log('🔄 Exchanging code for access token...');

    const tokenUrl = `https://graph.facebook.com/v18.0/oauth/access_token?client_id=${FACEBOOK_APP_ID}&redirect_uri=${encodeURIComponent(FACEBOOK_REDIRECT_URI)}&client_secret=${FACEBOOK_APP_SECRET}&code=${code}`;

    const tokenResponse = await fetch(tokenUrl);

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      console.error('❌ Facebook token exchange failed:', errorText);
      throw new Error('Failed to exchange authorization code for access token');
    }

    const tokenData = await tokenResponse.json();

    if (!tokenData.access_token) {
      console.error('❌ No access token in response:', tokenData);
      throw new Error('No access token received from Facebook');
    }

    console.log('✅ Access token received from Facebook');

    const expiresIn = tokenData.expires_in || 5184000;
    const expiresAt = new Date(Date.now() + expiresIn * 1000).toISOString();

    console.log('💾 Storing access token in database...');

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { error: upsertError } = await supabaseAdmin
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

    let businesses = [];
    let adAccounts = [];

    try {
      const businessesUrl = `https://graph.facebook.com/v18.0/me/businesses?access_token=${tokenData.access_token}&fields=id,name`;
      const businessesResponse = await fetch(businessesUrl);

      if (businessesResponse.ok) {
        const businessesData = await businessesResponse.json();
        businesses = businessesData.data || [];
        console.log('✅ Found', businesses.length, 'businesses');

        for (const business of businesses) {
          const adAccountsUrl = `https://graph.facebook.com/v18.0/${business.id}/owned_ad_accounts?access_token=${tokenData.access_token}&fields=id,name,account_id,account_status`;
          const adAccountsResponse = await fetch(adAccountsUrl);

          if (adAccountsResponse.ok) {
            const adAccountsData = await adAccountsResponse.json();
            adAccounts.push(...(adAccountsData.data || []));
          }
        }

        console.log('✅ Found', adAccounts.length, 'ad accounts');
      }
    } catch (err) {
      console.warn('⚠️ Could not fetch businesses/accounts (non-critical):', err);
    }

    console.log('🎉 Facebook OAuth completed successfully');

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Facebook connected successfully!',
        businesses: businesses,
        ad_accounts: adAccounts,
      }),
      {
        status: 200,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  } catch (error) {
    console.error('❌ Facebook OAuth callback error:', error);

    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }),
      {
        status: 400,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  }
});
