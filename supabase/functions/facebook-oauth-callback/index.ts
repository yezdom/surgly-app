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

    let code: string | null = null;
    let state: string | null = null;

    if (req.method === 'GET') {
      const url = new URL(req.url);
      code = url.searchParams.get('code');
      state = url.searchParams.get('state');
    } else if (req.method === 'POST') {
      const requestBody = await req.json();
      code = requestBody.code;
      state = requestBody.state;
    }

    console.log('📋 Incoming query params:', {
      code: code ? `${code.substring(0, 20)}...` : null,
      state: state || 'not provided',
      hasCode: !!code,
    });

    if (!code) {
      throw new Error('Missing authorization code');
    }

    const FACEBOOK_APP_ID = Deno.env.get('FACEBOOK_APP_ID');
    const FACEBOOK_APP_SECRET = Deno.env.get('FACEBOOK_APP_SECRET');
    const FACEBOOK_REDIRECT_URI = Deno.env.get('FACEBOOK_REDIRECT_URI');

    if (!FACEBOOK_APP_ID || !FACEBOOK_APP_SECRET || !FACEBOOK_REDIRECT_URI) {
      console.error('❌ Missing Facebook environment variables');
      throw new Error('Facebook app not configured');
    }

    console.log('🔧 Facebook config:', {
      appId: FACEBOOK_APP_ID,
      redirectUri: FACEBOOK_REDIRECT_URI,
      hasAppSecret: !!FACEBOOK_APP_SECRET,
    });

    console.log('🔄 Exchanging code for access token...');

    const tokenUrl = `https://graph.facebook.com/v18.0/oauth/access_token?client_id=${FACEBOOK_APP_ID}&redirect_uri=${encodeURIComponent(FACEBOOK_REDIRECT_URI)}&client_secret=${FACEBOOK_APP_SECRET}&code=${code}`;

    const tokenUrlForLogging = `https://graph.facebook.com/v18.0/oauth/access_token?client_id=${FACEBOOK_APP_ID}&redirect_uri=${encodeURIComponent(FACEBOOK_REDIRECT_URI)}&client_secret=***&code=${code.substring(0, 20)}...`;
    console.log('📡 Token URL (sanitized):', tokenUrlForLogging);

    const tokenResponse = await fetch(tokenUrl);

    console.log('📥 Facebook response status:', tokenResponse.status);

    const responseText = await tokenResponse.text();
    console.log('📦 Facebook response body:', responseText);

    let tokenData;
    try {
      tokenData = JSON.parse(responseText);
    } catch (e) {
      console.error('❌ Failed to parse Facebook response:', e);
      throw new Error('Invalid response from Facebook');
    }

    console.log('📊 Parsed token data:', {
      hasAccessToken: !!tokenData.access_token,
      hasError: !!tokenData.error,
      expiresIn: tokenData.expires_in,
    });

    if (tokenData.error) {
      console.error('❌ Facebook API error:', tokenData.error);
      throw new Error(tokenData.error.message || 'Token exchange failed');
    }

    if (!tokenData.access_token) {
      console.error('❌ No access token in response');
      throw new Error('No access token received from Facebook');
    }

    console.log('✅ Access token received from Facebook');

    const expiresAt = new Date();
    expiresAt.setSeconds(expiresAt.getSeconds() + (tokenData.expires_in || 5184000));

    console.log('💾 Storing access token in database...');

    const { error: insertError } = await supabaseClient
      .from('facebook_tokens')
      .upsert({
        user_id: user.id,
        access_token: tokenData.access_token,
        expires_at: expiresAt.toISOString(),
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'user_id',
      });

    if (insertError) {
      console.error('❌ Failed to store token:', insertError);
      throw new Error('Failed to store access token');
    }

    console.log('✅ Token stored successfully');

    console.log('🔍 Fetching user businesses...');

    const businessResponse = await fetch(
      `https://graph.facebook.com/v18.0/me/businesses?access_token=${tokenData.access_token}`
    );

    const businessData = await businessResponse.json();
    console.log('📊 Businesses response:', {
      hasData: !!businessData.data,
      count: businessData.data?.length || 0,
    });

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Facebook account connected successfully',
        businesses: businessData.data || [],
      }),
      {
        status: 200,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  } catch (error: any) {
    console.error('❌ Error in facebook-oauth-callback:', error);

    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || 'An error occurred during Facebook OAuth',
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