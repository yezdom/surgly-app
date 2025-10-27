import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from 'jsr:@supabase/supabase-js@2';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  if (req.method === "GET") {
    return new Response(
      JSON.stringify({
        message: 'Facebook Data Deletion Callback Endpoint',
        instructions: 'This endpoint handles data deletion requests from Facebook users.',
        url: 'https://surgly.app/api/data-deletion',
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }

  try {
    const body = await req.json();
    const { signed_request } = body;

    if (!signed_request) {
      return new Response(
        JSON.stringify({ error: 'Missing signed_request parameter' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const [encodedSig, payload] = signed_request.split('.');
    const decoder = new TextDecoder();
    const data = JSON.parse(decoder.decode(Uint8Array.from(atob(payload), c => c.charCodeAt(0))));
    
    const userId = data.user_id;

    if (!userId) {
      return new Response(
        JSON.stringify({ error: 'Invalid user_id in signed_request' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    console.log(`Data deletion request received for Facebook user: ${userId}`);

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const { data: user, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('facebook_id', userId)
      .maybeSingle();

    if (user) {
      await supabase.from('users').delete().eq('id', user.id);
      console.log(`Successfully deleted data for user: ${user.id}`);
    }

    const statusUrl = `https://surgly.app/data-deletion-status?id=${userId}`;
    const confirmationCode = `${userId}_${Date.now()}`;

    return new Response(
      JSON.stringify({
        url: statusUrl,
        confirmation_code: confirmationCode,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Data deletion error:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to process data deletion request' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});