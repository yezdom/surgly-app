import { createClient } from 'jsr:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

function createErrorPage(title: string, message: string, details?: string) {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title} - SURGLY</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: linear-gradient(135deg, #1a1a2e 0%, #0f3460 100%);
      color: #fff;
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      padding: 20px;
    }
    .container {
      max-width: 600px;
      background: rgba(255, 255, 255, 0.05);
      backdrop-filter: blur(10px);
      border-radius: 20px;
      padding: 40px;
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
      border: 1px solid rgba(255, 255, 255, 0.1);
    }
    .icon { font-size: 64px; text-align: center; margin-bottom: 20px; }
    h1 { font-size: 28px; margin-bottom: 16px; text-align: center; }
    p { font-size: 16px; line-height: 1.6; color: #b8c5d6; margin-bottom: 12px; text-align: center; }
    .details {
      background: rgba(255, 77, 77, 0.1);
      border-left: 4px solid #ff4d4d;
      padding: 16px;
      margin-top: 20px;
      border-radius: 8px;
      font-size: 14px;
      font-family: monospace;
      color: #ffaaaa;
      word-break: break-word;
    }
    .button {
      display: inline-block;
      background: #1877F2;
      color: #fff;
      padding: 12px 32px;
      border-radius: 8px;
      text-decoration: none;
      margin-top: 24px;
      font-weight: 600;
      transition: background 0.3s;
    }
    .button:hover { background: #166FE5; }
    .button-container { text-align: center; }
  </style>
</head>
<body>
  <div class="container">
    <div class="icon">⚠️</div>
    <h1>${title}</h1>
    <p>${message}</p>
    ${details ? `<div class="details">${details}</div>` : ''}
    <div class="button-container">
      <a href="/settings?tab=integrations" class="button">Back to Settings</a>
    </div>
  </div>
</body>
</html>
  `;
}

function createSuccessPage() {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Connected Successfully - SURGLY</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: linear-gradient(135deg, #1a1a2e 0%, #0f3460 100%);
      color: #fff;
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      padding: 20px;
    }
    .container {
      max-width: 600px;
      background: rgba(255, 255, 255, 0.05);
      backdrop-filter: blur(10px);
      border-radius: 20px;
      padding: 40px;
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
      border: 1px solid rgba(255, 255, 255, 0.1);
      text-align: center;
    }
    .icon { font-size: 80px; margin-bottom: 20px; animation: bounce 1s ease; }
    @keyframes bounce {
      0%, 20%, 50%, 80%, 100% { transform: translateY(0); }
      40% { transform: translateY(-20px); }
      60% { transform: translateY(-10px); }
    }
    h1 { font-size: 32px; margin-bottom: 16px; color: #4ade80; }
    p { font-size: 18px; line-height: 1.6; color: #b8c5d6; margin-bottom: 12px; }
    .redirect-text {
      margin-top: 30px;
      font-size: 14px;
      color: #94a3b8;
    }
    .spinner {
      display: inline-block;
      width: 16px;
      height: 16px;
      border: 2px solid rgba(255, 255, 255, 0.3);
      border-top-color: #fff;
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
      margin-left: 8px;
      vertical-align: middle;
    }
    @keyframes spin {
      to { transform: rotate(360deg); }
    }
  </style>
  <script>
    setTimeout(() => {
      window.location.href = '/settings?tab=integrations&connected=facebook';
    }, 2000);
  </script>
</head>
<body>
  <div class="container">
    <div class="icon">✅</div>
    <h1>Facebook Connected Successfully!</h1>
    <p>Your Facebook account has been connected to SURGLY.</p>
    <p>You can now access your ad campaigns and performance data.</p>
    <div class="redirect-text">
      Redirecting to your dashboard<span class="spinner"></span>
    </div>
  </div>
</body>
</html>
  `;
}

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
      console.error('❌ Missing Authorization header');
      return new Response(
        createErrorPage(
          'Authentication Required',
          'Missing authorization header. Please log in and try again.',
          'Error: Missing Authorization header'
        ),
        {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'text/html' },
        }
      );
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
      return new Response(
        createErrorPage(
          'Authentication Failed',
          'Unable to authenticate user. Please log in and try again.',
          `Error: ${userError?.message || 'User not found'}`
        ),
        {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'text/html' },
        }
      );
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
      console.error('❌ Missing authorization code');
      return new Response(
        createErrorPage(
          'Invalid Request',
          'Missing authorization code from Facebook.',
          'Error: No authorization code provided'
        ),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'text/html' },
        }
      );
    }

    const FACEBOOK_APP_ID = Deno.env.get('FACEBOOK_APP_ID');
    const FACEBOOK_APP_SECRET = Deno.env.get('FACEBOOK_APP_SECRET');
    const FACEBOOK_REDIRECT_URI = Deno.env.get('FACEBOOK_REDIRECT_URI');

    if (!FACEBOOK_APP_ID || !FACEBOOK_APP_SECRET || !FACEBOOK_REDIRECT_URI) {
      console.error('❌ Missing Facebook environment variables');
      return new Response(
        createErrorPage(
          'Configuration Error',
          'Facebook app is not properly configured. Please contact support.',
          'Error: Missing Facebook environment variables'
        ),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'text/html' },
        }
      );
    }

    console.log('🔧 Facebook Config:', {
      appId: FACEBOOK_APP_ID,
      redirectUri: FACEBOOK_REDIRECT_URI,
      hasSecret: !!FACEBOOK_APP_SECRET,
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
      return new Response(
        createErrorPage(
          'Facebook API Error',
          'Received invalid response from Facebook.',
          `Error: Failed to parse response - ${responseText.substring(0, 200)}`
        ),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'text/html' },
        }
      );
    }

    console.log('📊 Parsed token data:', {
      hasAccessToken: !!tokenData.access_token,
      hasError: !!tokenData.error,
      expiresIn: tokenData.expires_in,
      tokenType: tokenData.token_type,
    });

    if (tokenData.error) {
      console.error('❌ Facebook API error:', tokenData.error);
      return new Response(
        createErrorPage(
          'Facebook Authorization Failed',
          tokenData.error.message || 'Failed to exchange code for access token.',
          `Error Code: ${tokenData.error.code || 'Unknown'}\nType: ${tokenData.error.type || 'Unknown'}\nMessage: ${tokenData.error.message || 'No details provided'}`
        ),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'text/html' },
        }
      );
    }

    if (!tokenData.access_token) {
      console.error('❌ No access token in response');
      return new Response(
        createErrorPage(
          'Token Exchange Failed',
          'Facebook did not return an access token.',
          'Error: No access_token in Facebook response'
        ),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'text/html' },
        }
      );
    }

    console.log('✅ Access token received from Facebook');

    const expiresIn = tokenData.expires_in || 5184000;
    const expiresAt = new Date(Date.now() + expiresIn * 1000);

    console.log('💾 Storing access token in database...');
    console.log('📅 Token expires at:', expiresAt.toISOString());

    const { error: insertError } = await supabaseClient
      .from('facebook_tokens')
      .upsert({
        user_id: user.id,
        access_token: tokenData.access_token,
        token_type: tokenData.token_type || 'bearer',
        expires_in: expiresIn,
        expires_at: expiresAt.toISOString(),
        refresh_token: tokenData.refresh_token || null,
        is_valid: true,
        last_refreshed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'user_id',
      });

    if (insertError) {
      console.error('❌ Failed to store token:', insertError);
      return new Response(
        createErrorPage(
          'Database Error',
          'Failed to save your Facebook connection.',
          `Error: ${insertError.message}`
        ),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'text/html' },
        }
      );
    }

    console.log('✅ Token stored successfully in database');

    console.log('🔍 Fetching user businesses...');

    const businessResponse = await fetch(
      `https://graph.facebook.com/v18.0/me/businesses?access_token=${tokenData.access_token}`
    );

    const businessData = await businessResponse.json();
    console.log('📊 Businesses response:', {
      hasData: !!businessData.data,
      count: businessData.data?.length || 0,
    });

    console.log('✅ Facebook OAuth flow completed successfully');

    return new Response(createSuccessPage(), {
      status: 200,
      headers: {
        ...corsHeaders,
        'Content-Type': 'text/html',
      },
    });
  } catch (error: any) {
    console.error('❌ Unexpected error in facebook-oauth-callback:', error);

    return new Response(
      createErrorPage(
        'Unexpected Error',
        'An unexpected error occurred during Facebook OAuth.',
        `Error: ${error.message || 'Unknown error'}\nStack: ${error.stack?.substring(0, 500) || 'No stack trace'}`
      ),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'text/html',
        },
      }
    );
  }
});