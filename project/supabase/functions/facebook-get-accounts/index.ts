import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      console.error("Step 1 FAILED: No authorization header");
      throw new Error("Missing authorization header");
    }

    console.log("Step 1: Auth header received");

    const token = authHeader.replace("Bearer ", "");

    // First, validate the user's JWT with ANON_KEY
    const supabaseAuth = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? ""
    );

    const { data: { user }, error: userError } = await supabaseAuth.auth.getUser(token);

    if (userError || !user) {
      console.error("Step 2 FAILED: User auth error:", userError);
      throw new Error("Invalid user token");
    }

    console.log("Step 2: User authenticated:", user.id);

    // Use SERVICE_ROLE_KEY to bypass RLS for token lookup
    // This is secure because we validated the user's JWT first
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const { data: tokens, error: tokenError } = await supabaseAdmin
      .from("facebook_tokens")
      .select("access_token, expires_at")
      .eq("user_id", user.id);

    console.log("Step 3: Token query result:", {
      tokensCount: tokens?.length,
      hasError: !!tokenError,
      errorMessage: tokenError?.message
    });

    if (tokenError) {
      console.error("Step 3 FAILED: Database error:", tokenError);
      throw new Error(`Database error: ${tokenError.message}`);
    }

    if (!tokens || tokens.length === 0) {
      console.log("Step 3: No tokens found for user");
      throw new Error("Facebook account not connected. Please connect your Facebook account first.");
    }

    const tokenData = tokens[0];
    console.log("Step 4: Token retrieved successfully");

    if (tokenData.expires_at && new Date(tokenData.expires_at) < new Date()) {
      console.log("Step 4: Token expired");
      throw new Error("Facebook token expired. Please reconnect your account.");
    }

    console.log("Step 5: Calling Facebook API...");
    const accountsResponse = await fetch(
      `https://graph.facebook.com/v18.0/me/adaccounts?fields=id,name,account_status,currency,timezone_name,amount_spent,balance&access_token=${tokenData.access_token}`
    );

    const accountsData = await accountsResponse.json();

    if (accountsData.error) {
      console.error("Step 5 FAILED: Facebook API error:", accountsData.error);
      throw new Error(accountsData.error.message || "Failed to fetch ad accounts");
    }

    console.log("Step 6: Success! Accounts fetched:", accountsData.data?.length);

    return new Response(
      JSON.stringify(accountsData),
      {
        status: 200,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  } catch (error: any) {
    console.error("Get accounts error:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Failed to fetch ad accounts" }),
      {
        status: 400,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  }
});
