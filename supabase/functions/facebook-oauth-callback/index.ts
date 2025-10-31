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
    } catch (parseError) {
      console.error('❌ Failed to parse Facebook response as JSON:', parseError);
      throw new Error('Invalid JSON response from Facebook');
    }

    console.log('📊 Parsed token data:', {
      hasAccessToken: !!tokenData.access_token,
      hasError: !!tokenData.error,
      expiresIn: tokenData.expires_in,
      tokenType: tokenData.token_type,
      errorMessage: tokenData.error?.message,
      errorCode: tokenData.error?.code,
    });

    if (tokenData.error) {
      console.error('❌ Facebook API error:', JSON.stringify(tokenData.error, null, 2));
      const errorMessage = tokenData.error.message || 'Unknown Facebook error';
      const errorCode = tokenData.error.code || 'N/A';
      throw new Error(`Facebook API Error (${errorCode}): ${errorMessage}`);
    }

    if (!tokenResponse.ok) {
      console.error('❌ Facebook token exchange failed with status:', tokenResponse.status);
      throw new Error(`Facebook token exchange failed with status ${tokenResponse.status}: ${responseText}`);
    }

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

    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const errorStack = error instanceof Error ? error.stack : '';

    console.error('🔍 Error details:', {
      message: errorMessage,
      stack: errorStack,
      type: error?.constructor?.name,
    });

    const acceptHeader = req.headers.get('Accept') || '';
    const wantsHtml = acceptHeader.includes('text/html');

    if (wantsHtml) {
      const htmlError = `
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Facebook OAuth Error</title>
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              min-height: 100vh;
              display: flex;
              align-items: center;
              justify-content: center;
              padding: 20px;
              margin: 0;
            }
            .error-container {
              background: white;
              border-radius: 12px;
              box-shadow: 0 20px 60px rgba(0,0,0,0.3);
              max-width: 600px;
              width: 100%;
              padding: 40px;
            }
            .error-icon {
              width: 64px;
              height: 64px;
              background: #fee;
              border-radius: 50%;
              display: flex;
              align-items: center;
              justify-content: center;
              margin: 0 auto 20px;
              font-size: 32px;
            }
            h1 {
              color: #dc2626;
              font-size: 24px;
              margin: 0 0 16px;
              text-align: center;
            }
            .error-message {
              background: #fee;
              border-left: 4px solid #dc2626;
              padding: 16px;
              border-radius: 4px;
              color: #991b1b;
              font-family: 'Courier New', monospace;
              font-size: 14px;
              margin: 20px 0;
              word-break: break-word;
            }
            .error-details {
              background: #f9fafb;
              padding: 16px;
              border-radius: 4px;
              font-size: 12px;
              color: #6b7280;
              margin: 20px 0;
            }
            .button {
              display: inline-block;
              background: #667eea;
              color: white;
              padding: 12px 24px;
              border-radius: 6px;
              text-decoration: none;
              font-weight: 600;
              text-align: center;
              display: block;
              margin-top: 24px;
              transition: background 0.2s;
            }
            .button:hover {
              background: #5568d3;
            }
            pre {
              background: #1f2937;
              color: #e5e7eb;
              padding: 12px;
              border-radius: 4px;
              overflow-x: auto;
              font-size: 11px;
              margin: 12px 0 0;
            }
          </style>
        </head>
        <body>
          <div class="error-container">
            <div class="error-icon">❌</div>
            <h1>Facebook OAuth Error</h1>
            <p style="text-align: center; color: #6b7280; margin-bottom: 24px;">
              Failed to connect your Facebook account
            </p>

            <div class="error-message">
              ${errorMessage}
            </div>

            <div class="error-details">
              <strong>What happened?</strong><br>
              The token exchange with Facebook failed. This could be due to:
              <ul style="margin: 8px 0; padding-left: 20px;">
                <li>Invalid or expired authorization code</li>
                <li>Mismatched redirect URI configuration</li>
                <li>Facebook app configuration issues</li>
                <li>Network or server errors</li>
              </ul>
            </div>

            ${errorStack ? `<details style="margin: 16px 0;">
              <summary style="cursor: pointer; color: #6b7280; font-size: 12px;">
                Show technical details
              </summary>
              <pre>${errorStack.substring(0, 500)}</pre>
            </details>` : ''}

            <a href="/settings?tab=integrations" class="button">
              Return to Settings
            </a>
          </div>
        </body>
        </html>
      `;

      return new Response(htmlError, {
        status: 400,
        headers: {
          ...corsHeaders,
          'Content-Type': 'text/html; charset=utf-8',
        },
      });
    }

    return new Response(
      JSON.stringify({
        success: false,
        error: errorMessage,
        details: errorStack ? errorStack.substring(0, 200) : undefined,
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
