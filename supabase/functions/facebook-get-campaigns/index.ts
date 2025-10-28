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
    // Parse query parameters
    const url = new URL(req.url);
    const accountId = url.searchParams.get("account_id");
    const startDate = url.searchParams.get("start_date");
    const endDate = url.searchParams.get("end_date");
    const includeCreatives = url.searchParams.get("include_creatives") === "true";

    if (!accountId) {
      throw new Error("account_id parameter is required");
    }

    console.log("Request params:", { accountId, startDate, endDate, includeCreatives });

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("Missing authorization header");
    }

    const token = authHeader.replace("Bearer ", "");

    const supabaseAuth = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? ""
    );

    const { data: { user }, error: userError } = await supabaseAuth.auth.getUser(token);

    if (userError || !user) {
      console.error("User auth error:", userError);
      throw new Error("Invalid user token");
    }

    console.log("User authenticated:", user.id);

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const { data: tokens, error: tokenError } = await supabaseAdmin
      .from("facebook_tokens")
      .select("access_token, expires_at")
      .eq("user_id", user.id)
      .maybeSingle();

    if (tokenError || !tokens) {
      throw new Error("Facebook account not connected");
    }

    if (tokens.expires_at && new Date(tokens.expires_at) < new Date()) {
      throw new Error("Facebook token expired. Please reconnect your account.");
    }

    // Build time range for insights
    let timeRange = "date_preset=last_90d";
    if (startDate && endDate) {
      timeRange = `time_range={"since":"${startDate}","until":"${endDate}"}`;
    }

    console.log("Fetching campaigns from Facebook API with time range:", timeRange);

    const campaignsResponse = await fetch(
      `https://graph.facebook.com/v18.0/${accountId}/campaigns?fields=id,name,objective,status,daily_budget,lifetime_budget,created_time,updated_time,start_time,stop_time&limit=100&access_token=${tokens.access_token}`
    );

    const campaignsData = await campaignsResponse.json();

    if (campaignsData.error) {
      console.error("Facebook API error:", campaignsData.error);
      throw new Error(campaignsData.error.message || "Failed to fetch campaigns");
    }

    console.log("Campaigns fetched:", campaignsData.data?.length);

    const campaignsWithData = await Promise.all(
      (campaignsData.data || []).map(async (campaign: any) => {
        try {
          // Fetch insights with dynamic time range
          const insightsResponse = await fetch(
            `https://graph.facebook.com/v18.0/${campaign.id}/insights?fields=impressions,clicks,spend,ctr,cpc,cpm,frequency,reach,actions,cost_per_action_type&${timeRange}&access_token=${tokens.access_token}`
          );
          const insightsData = await insightsResponse.json();

          // Fetch ads with HIGH RESOLUTION creative data
          const creativeFields = includeCreatives
            ? "id,name,status,creative{id,title,body,image_url,thumbnail_url,object_story_spec,video_id,image_hash,images}"
            : "id,name,status,creative{id,image_hash}";

          const adsResponse = await fetch(
            `https://graph.facebook.com/v18.0/${campaign.id}/ads?fields=${creativeFields}&limit=50&access_token=${tokens.access_token}`
          );
          const adsData = await adsResponse.json();

          console.log(`Campaign ${campaign.id}: Fetched ${adsData.data?.length || 0} ads`);

          // Process ads to get high-resolution images
          const adsWithInsights = await Promise.all(
            (adsData.data || []).map(async (ad: any) => {
              try {
                // Fetch ad insights with time range
                const adInsightsResponse = await fetch(
                  `https://graph.facebook.com/v18.0/${ad.id}/insights?fields=impressions,clicks,spend,ctr,cpc,cpm,frequency,reach,actions,cost_per_action_type&${timeRange}&access_token=${tokens.access_token}`
                );
                const adInsightsData = await adInsightsResponse.json();

                // Get high-resolution image if image_hash exists
                let highResImageUrl = ad.creative?.image_url || null;

                if (includeCreatives && ad.creative?.image_hash) {
                  try {
                    // Fetch all available image sizes
                    const imageResponse = await fetch(
                      `https://graph.facebook.com/v18.0/${ad.creative.image_hash}?fields=images&access_token=${tokens.access_token}`
                    );
                    const imageData = await imageResponse.json();

                    // Sort by width descending and get the largest image (up to 1200x1200)
                    if (imageData.images && imageData.images.length > 0) {
                      const sortedImages = imageData.images.sort((a: any, b: any) => b.width - a.width);
                      highResImageUrl = sortedImages[0].source;
                      console.log(`High-res image for ad ${ad.id}: ${sortedImages[0].width}x${sortedImages[0].height}`);
                    }
                  } catch (error) {
                    console.error(`Failed to fetch high-res image for ad ${ad.id}:`, error);
                  }
                }

                return {
                  ...ad,
                  creative: {
                    ...ad.creative,
                    high_res_image_url: highResImageUrl,
                  },
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

    console.log("Success! Campaigns with data:", campaignsWithData.length);

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