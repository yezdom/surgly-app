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
    const { adAccountId } = await req.json();

    if (!adAccountId) {
      throw new Error("Ad account ID is required");
    }

    console.log("Step 1: Ad account ID received:", adAccountId);

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      console.error("Step 2 FAILED: No authorization header");
      throw new Error("Missing authorization header");
    }

    console.log("Step 2: Auth header received");

    const token = authHeader.replace("Bearer ", "");

    const supabaseAuth = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? ""
    );

    const { data: { user }, error: userError } = await supabaseAuth.auth.getUser(token);

    if (userError || !user) {
      console.error("Step 3 FAILED: User auth error:", userError);
      throw new Error("Invalid user token");
    }

    console.log("Step 3: User authenticated:", user.id);

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const { data: tokens, error: tokenError } = await supabaseAdmin
      .from("facebook_tokens")
      .select("access_token, expires_at")
      .eq("user_id", user.id);

    console.log("Step 4: Token query result:", {
      tokensCount: tokens?.length,
      hasError: !!tokenError,
    });

    if (tokenError || !tokens || tokens.length === 0) {
      throw new Error("Facebook account not connected");
    }

    const tokenData = tokens[0];
    console.log("Step 5: Token retrieved successfully");

    if (tokenData.expires_at && new Date(tokenData.expires_at) < new Date()) {
      throw new Error("Facebook token expired. Please reconnect your account.");
    }

    console.log("Step 6: Fetching campaigns from Facebook API...");
    const campaignsResponse = await fetch(
      `https://graph.facebook.com/v18.0/${adAccountId}/campaigns?fields=id,name,objective,status,daily_budget,lifetime_budget,created_time,updated_time,start_time,stop_time&limit=100&access_token=${tokenData.access_token}`
    );

    const campaignsData = await campaignsResponse.json();

    if (campaignsData.error) {
      console.error("Step 6 FAILED: Facebook API error:", campaignsData.error);
      throw new Error(campaignsData.error.message || "Failed to fetch campaigns");
    }

    console.log("Step 7: Campaigns fetched:", campaignsData.data?.length);
    console.log("Step 8: Fetching insights and ads for each campaign...");

    const campaignsWithData = await Promise.all(
      (campaignsData.data || []).map(async (campaign: any) => {
        try {
          // Fetch insights
          const insightsResponse = await fetch(
            `https://graph.facebook.com/v18.0/${campaign.id}/insights?fields=impressions,clicks,spend,ctr,cpc,frequency,conversions&date_preset=last_7d&access_token=${tokenData.access_token}`
          );
          const insightsData = await insightsResponse.json();

          // Fetch ads with creative data (including thumbnail_url for videos)
          const adsResponse = await fetch(
            `https://graph.facebook.com/v18.0/${campaign.id}/ads?fields=id,name,status,creative{id,title,body,image_url,thumbnail_url,object_story_spec,video_id,image_hash}&limit=50&access_token=${tokenData.access_token}`
          );
          const adsData = await adsResponse.json();

          console.log(`Campaign ${campaign.id}: Fetched ${adsData.data?.length || 0} ads`);

          // Fetch insights for each ad
          const adsWithInsights = await Promise.all(
            (adsData.data || []).map(async (ad: any) => {
              try {
                const adInsightsResponse = await fetch(
                  `https://graph.facebook.com/v18.0/${ad.id}/insights?fields=impressions,clicks,spend,ctr,cpc,frequency,conversions,cost_per_conversion&date_preset=last_7d&access_token=${tokenData.access_token}`
                );
                const adInsightsData = await adInsightsResponse.json();
                return {
                  ...ad,
                  insights: adInsightsData.data?.[0] || null,
                };
              } catch (error) {
                console.error(`Failed to fetch insights for ad ${ad.id}:`, error);
                return {
                  ...ad,
                  insights: null,
                };
              }
            })
          );

          return {
            ...campaign,
            insights: insightsData.data?.[0] || null,
            ads: adsWithInsights,
          };
        } catch (error) {
          console.error(`Failed to fetch data for campaign ${campaign.id}:`, error);
          return {
            ...campaign,
            insights: null,
            ads: [],
          };
        }
      })
    );

    console.log("Step 9: Success! Campaigns with data:", campaignsWithData.length);

    return new Response(
      JSON.stringify({ data: campaignsWithData }),
      {
        status: 200,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  } catch (error: any) {
    console.error("Get campaigns error:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Failed to fetch campaigns" }),
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
