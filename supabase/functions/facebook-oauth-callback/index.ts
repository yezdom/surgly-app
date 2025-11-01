import { createClient } from 'jsr:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

// ⏱ Helper function to add a timeout to fetch requests
async function fetchWithTimeout(url: string, options: RequestInit = {}, timeout = 4000) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);
  try {
    const response = await fetch(url, { ...options, signal: controller.signal });
    clearTimeout(id);
    return response;
  } catch (err) {
    clearTimeout(id);
    console.error('⚠️ fetchWithTimeout failed:', err);
    throw err;
  }
}

function createErrorPage(title: string, message: string, details?: string) {
  return `
  <!DOCTYPE html>
  <html lang="en">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title} - SURGLY</title>
    <style>
      body {
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        background: linear-gradient(135deg, #1a1a2e 0%, #0f3460 100%);
        color: #fff;
        display: flex;
        align-items: center;
        justify-content: center;
        height: 100vh;
        text-align: center;
      }
      .details { color: #ffaaaa; font-size: 14px; margin-top: 20px; white-space: pre-wrap; }
      a { color: #4ea8de; text-decoration: none; font-weight: bold; }
    </style>
  </head>
  <body>
    <div>
      <h1>⚠️ ${title}</h1>
      <p>${message}</p>
      ${details ? `<div class="details">${details}</div>` : ''}
      <p><a href="/settings?tab=integrations">Back to Settings</a></p>
    </div>
  </body>
  </html>`;
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
      body {
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        background: linear-gradient(135deg, #1a1a2e 0%, #0f3460 100%);
        color: #fff;
        display: flex;
        align-items: center;
        justify-content: center;
        height: 100vh;
        text-align: center;
      }
      .spinner {
        display: inline-block;
        width: 14px;
        height: 14px;
        border: 2px solid rgba(255,255,255,0.3);
        border-top-color: #fff;
        border-radius: 50%;
        animation: spin 0.8s linear infinite;
        margin-left: 6px;
      }
      @keyframes spin { to { transform: rotate(360deg); } }
    </style>
    <script>
      setTimeout(() => {
        window.location.href = '/settings?tab=integrations&connected=facebook';
      }, 2000);
    </script>
  </head>
  <body>
    <div>
      <h1>✅ Facebook Connected Successfully!</h1>
      <p>Redirecting to your dashboard<span class="spinner"></span></p>
    </div>
  </body>
  </html>`;
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  console.log('🚀 facebook-oauth-callback started at', new Date().toISOString());

  try {
    const authHeader = req.headers.get('Authorization') || `Bearer ${Deno.env.get('SUPABASE_ANON_KEY')}`;
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();

    if (userError || !user) {
      console.error('❌ User authentication failed:', userError);
      return new Response(
        createErrorPage('Authentication Failed', 'Please log in again.', `Error: ${userError?.message || 'No user found'}`),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'text/html' } }
      );
    }

    console.log('✅ Authenticated user:', user.email);

    const url = new URL(req.url);
    const code = url.searchParams.get('code');
    if (!code) {
      return new Response(
        createErrorPage('Missing Code', 'No Facebook code found in callback URL.'),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'text/html' } }
      );
    }

    console.log('🔄 Exchanging code for token...');

    const FACEBOOK_APP_ID = Deno.env.get('FACEBOOK_APP_ID');
    const FACEBOOK_APP_SECRET = Deno.env.get('FACEBOOK_APP_SECRET');
    const FACEBOOK_REDIRECT_URI = Deno.env.get('FACEBOOK_REDIRECT_URI');

    const tokenUrl = `https://graph.facebook.com/v18.0/oauth/access_token?client_id=${FACEBOOK_APP_ID}&redirect_uri=${encodeURIComponent(FACEBOOK_REDIRECT_URI)}&client_secret=${FACEBOOK_APP_SECRET}&code=${code}`;

    const tokenResponse = await fetchWithTimeout(tokenUrl);
    const text = await tokenResponse.text();

    console.log('📥 Facebook token response:', text.substring(0, 200));

    const tokenData = JSON.parse(text);

    if (tokenData.error || !tokenData.access_token) {
      return new Response(
        createErrorPage('Token Exchange Failed', 'Could not get access token.', JSON.stringify(tokenData.error, null, 2)),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'text/html' } }
      );
    }

    console.log('✅ Access token received, storing in DB...');

    const expiresIn = tokenData.expires_in || 5184000;
    const expiresAt = new Date(Date.now() + expiresIn * 1000).toISOString();

    const { error: insertError } = await supabaseClient
      .from('facebook_tokens')
      .upsert({
        user_id: user.id,
        access_token: tokenData.access_token,
        expires_in: expiresIn,
        expires_at: expiresAt,
        updated_at: new Date().toISOString(),
        is_valid: true,
      }, { onConflict: 'user_id' });

    if (insertError) {
      return new Response(
        createErrorPage('Database Error', 'Failed to save Facebook token.', insertError.message),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'text/html' } }
      );
    }

    console.log('✅ Token stored successfully');
    return new Response(createSuccessPage(), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'text/html' } });

  } catch (error: any) {
    console.error('❌ Fatal error:', error);
    return new Response(
      createErrorPage('Unexpected Error', 'Something went wrong.', error.message || 'Unknown error'),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'text/html' } }
    );
  }
});
