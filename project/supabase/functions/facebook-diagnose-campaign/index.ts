import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const FB_GRAPH_URL = "https://graph.facebook.com/v18.0";

// Industry benchmarks
const BENCHMARKS: Record<string, any> = {
  OUTCOME_SALES: { name: 'E-commerce Sales', ctr: 1.8, cpc: 0.95, cpm: 11, convRate: 2.5 },
  CONVERSIONS: { name: 'Conversions', ctr: 1.8, cpc: 0.95, cpm: 11, convRate: 2.5 },
  OUTCOME_LEADS: { name: 'Lead Generation', ctr: 2.3, cpc: 0.75, cpm: 8.5, convRate: 9 },
  LEAD_GENERATION: { name: 'Lead Generation', ctr: 2.3, cpc: 0.75, cpm: 8.5, convRate: 9 },
  OUTCOME_TRAFFIC: { name: 'Traffic', ctr: 1.4, cpc: 0.45, cpm: 7 },
  LINK_CLICKS: { name: 'Traffic', ctr: 1.4, cpc: 0.45, cpm: 7 },
  OUTCOME_AWARENESS: { name: 'Brand Awareness', ctr: 1.2, cpc: 0.6, cpm: 6.5 },
  BRAND_AWARENESS: { name: 'Brand Awareness', ctr: 1.2, cpc: 0.6, cpm: 6.5 },
  DEFAULT: { name: 'General', ctr: 1.5, cpc: 1.0, cpm: 9 },
};

function isAdvantagePlus(data: any): boolean {
  const name = data.campaign?.name?.toLowerCase() || '';
  if (name.includes('advantage')) return true;
  
  const objective = data.campaign?.objective;
  if (objective === 'OUTCOME_APP_PROMOTION' || objective === 'OUTCOME_SALES' || objective === 'CONVERSIONS') {
    const targeting = data.campaign?.targeting;
    if (!targeting || targeting.message || Object.keys(targeting).length < 3) {
      return true;
    }
  }
  return false;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const { campaignId, adAccountId } = await req.json();

    if (!campaignId || !adAccountId) {
      throw new Error("Campaign ID and Ad Account ID are required");
    }

    console.log("Step 1: Request received for campaign:", campaignId);

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
      .select("access_token")
      .eq("user_id", user.id);

    console.log("Step 4: Token query result:", {
      tokensCount: tokens?.length,
      hasError: !!tokenError,
    });

    if (tokenError || !tokens || tokens.length === 0) {
      throw new Error("Facebook account not connected");
    }

    const fbToken = tokens[0].access_token;
    console.log("Step 5: Token retrieved successfully");

    console.log("Step 6: Fetching campaign data from Facebook...");
    const campaignResponse = await fetch(
      `${FB_GRAPH_URL}/${campaignId}?fields=id,name,objective,status,daily_budget,lifetime_budget,created_time&access_token=${fbToken}`
    );

    if (!campaignResponse.ok) {
      const error = await campaignResponse.json();
      throw new Error(`Facebook API error: ${error.error?.message || 'Unknown error'}`);
    }

    const campaignData = await campaignResponse.json();
    if (campaignData.error) throw new Error(campaignData.error.message);
    console.log("Step 6 SUCCESS: Campaign data fetched");

    console.log("Step 6b: Fetching ad sets for targeting data...");
    const adSetsResponse = await fetch(
      `${FB_GRAPH_URL}/${campaignId}/adsets?fields=id,name,targeting,status,optimization_goal,billing_event&access_token=${fbToken}`
    );

    let targeting = { message: "Targeting data not available" };
    let adSets = [];

    if (adSetsResponse.ok) {
      const adSetsData = await adSetsResponse.json();
      if (adSetsData.data && adSetsData.data.length > 0) {
        targeting = adSetsData.data[0].targeting || targeting;
        adSets = adSetsData.data;
        console.log("Step 6b SUCCESS: Ad sets fetched");
      }
    }

    campaignData.targeting = targeting;
    campaignData.ad_sets = adSets;

    console.log("Step 7: Fetching campaign insights...");
    const insightsResponse = await fetch(
      `${FB_GRAPH_URL}/${campaignId}/insights?fields=impressions,clicks,spend,ctr,cpc,cpm,cpp,reach,frequency,actions,cost_per_action_type,conversions,cost_per_conversion&date_preset=last_30d&access_token=${fbToken}`
    );
    const insightsData = await insightsResponse.json();
    console.log(insightsData.error ? "Step 7 WARNING" : "Step 7 SUCCESS");

    console.log("Step 8: Fetching campaign ads...");
    const adsResponse = await fetch(
      `${FB_GRAPH_URL}/${campaignId}/ads?fields=id,name,status,creative{title,body,image_url,object_story_spec,call_to_action_type}&access_token=${fbToken}`
    );
    const adsData = await adsResponse.json();
    console.log(adsData.error ? "Step 8 WARNING" : "Step 8 SUCCESS");

    const combinedData = {
      campaign: campaignData,
      insights: insightsData.data?.[0] || { message: "No insights data available" },
      ads: adsData.data || [],
      ad_sets: adSets,
    };

    console.log("Step 9: Detecting campaign type...");
    const isAdvantagePlusCampaign = isAdvantagePlus(combinedData);
    const objective = campaignData.objective || 'DEFAULT';
    const benchmarks = BENCHMARKS[objective] || BENCHMARKS.DEFAULT;
    
    console.log("Step 9: Campaign type:", isAdvantagePlusCampaign ? 'Advantage+' : 'Standard');

    const openaiApiKey = Deno.env.get("OPENAI_API_KEY");
    if (!openaiApiKey) {
      throw new Error("OpenAI API key not configured");
    }

    console.log("Step 10: Calling OpenAI for analysis...");

    let advantagePlusContext = '';
    if (isAdvantagePlusCampaign) {
      advantagePlusContext = `\n\nIMPORTANT: This is an Advantage+ campaign. Facebook's AI is handling:\n- Automatic audience targeting and expansion\n- Automatic ad creative optimization\n- Dynamic budget allocation across placements\n\nFocus recommendations on:\n1. Creative Quality & Variety: Provide 6+ creative variations\n2. Landing Page Experience: Fast load times and clear conversion paths\n3. Pixel/Conversion Tracking: Verify proper event tracking\n4. Budget & Bid Strategy: Sufficient budget for learning (50+ conversions/week)\n\nAVOID recommendations about:\n- Manual audience targeting adjustments\n- Detailed demographic targeting\n- Ad set structure changes\n- Manual placement selection\n- Manual bid adjustments`;
    }

    const benchmarkContext = `\n\nINDUSTRY BENCHMARKS FOR ${benchmarks.name.toUpperCase()}:\n- CTR Average: ${benchmarks.ctr}%\n- CPC Average: $${benchmarks.cpc}\n- CPM Average: $${benchmarks.cpm}${benchmarks.convRate ? `\n- Conversion Rate Average: ${benchmarks.convRate}%` : ''}\n\nCompare campaign metrics against these benchmarks in your analysis.`;

    const prompt = `You are an expert Facebook Ads auditor with 10+ years of experience. Analyze this REAL Facebook campaign data and provide a comprehensive diagnosis.\n\nCAMPAIGN DATA:\n${JSON.stringify(combinedData, null, 2)}${advantagePlusContext}${benchmarkContext}\n\nIMPORTANT NOTES:\n- If targeting data is unavailable, focus on available metrics\n- If insights are missing, provide recommendations based on structure\n- Always provide actionable recommendations\n\nProvide analysis in this exact JSON structure:\n{\n  "overall_score": <number 0-100>,\n  "health_status": "<Excellent/Good/Fair/Poor/Critical>",\n  "summary": "<2-3 sentence executive summary>",\n  "critical_issues": [\n    {\n      "category": "<Performance/Targeting/Creative/Budget>",\n      "severity": "<Critical/High/Medium/Low>",\n      "issue": "<Specific problem>",\n      "evidence": "<Data supporting this>",\n      "impact": "<How this affects performance>",\n      "recommendation": "<Specific actionable fix>",\n      "expected_improvement": "<What to expect>"\n    }\n  ],\n  "strengths": ["<What's working well>"],\n  "quick_wins": [\n    {\n      "action": "<Specific action>",\n      "difficulty": "<Easy/Medium/Hard>",\n      "impact": "<High/Medium/Low>",\n      "expected_result": "<What to expect>"\n    }\n  ],\n  "benchmarks": {\n    "your_ctr": "<X%>",\n    "industry_avg_ctr": "${benchmarks.ctr}%",\n    "your_cpc": "<$X>",\n    "industry_avg_cpc": "$${benchmarks.cpc}",\n    "your_performance_vs_industry": "<Better/Worse by X%>"\n  },\n  "predicted_optimizations": {\n    "potential_cost_savings": "<$X per month>",\n    "potential_conversion_increase": "<X%>",\n    "recommended_budget_adjustment": "<Increase/Decrease by X%>"\n  }\n}`;

    const openaiResponse = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${openaiApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: "You are an expert Facebook Ads auditor with 10+ years of experience. Provide specific, actionable recommendations. Return ONLY valid JSON, no markdown formatting.",
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        response_format: { type: "json_object" },
        temperature: 0.7,
      }),
    });

    const openaiData = await openaiResponse.json();
    if (openaiData.error) {
      throw new Error(openaiData.error.message || "OpenAI analysis failed");
    }

    console.log("Step 11: OpenAI analysis completed");
    const diagnosisResult = JSON.parse(openaiData.choices[0].message.content);

    console.log("Step 12: Saving analysis to database...");
    const { error: insertError } = await supabaseAdmin.from("analyses").insert({
      user_id: user.id,
      analysis_type: "ad_doctor",
      facebook_campaign_id: campaignId,
      ad_account_id_fb: adAccountId,
      results: diagnosisResult,
      score: diagnosisResult.overall_score,
    });

    if (insertError) {
      console.error("Step 12: Failed to save (non-fatal):", insertError);
    } else {
      console.log("Step 12: Analysis saved");
    }

    console.log("Step 13: Success! Returning diagnosis");

    return new Response(
      JSON.stringify({
        success: true,
        diagnosis: diagnosisResult,
        raw_data: combinedData,
      }),
      {
        status: 200,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  } catch (error: any) {
    console.error("Diagnose campaign error:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Failed to diagnose campaign" }),
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
