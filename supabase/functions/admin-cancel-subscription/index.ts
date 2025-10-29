import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import Stripe from "npm:stripe@17.5.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
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
    const { user_id, reason } = await req.json();

    if (!user_id) {
      throw new Error("User ID is required");
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error("Missing Supabase configuration");
    }

    // Get user's Stripe customer ID and subscription ID
    const userResponse = await fetch(`${supabaseUrl}/rest/v1/users?id=eq.${user_id}&select=stripe_customer_id,stripe_subscription_id,email`, {
      headers: {
        "Authorization": `Bearer ${supabaseServiceKey}`,
        "apikey": supabaseServiceKey,
      },
    });

    if (!userResponse.ok) {
      throw new Error("User not found");
    }

    const users = await userResponse.json();
    const user = users[0];

    if (!user?.stripe_subscription_id) {
      throw new Error("User has no active subscription");
    }

    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2024-06-20",
    });

    // Cancel the subscription at period end
    const subscription = await stripe.subscriptions.update(
      user.stripe_subscription_id,
      {
        cancel_at_period_end: true,
        metadata: {
          cancellation_reason: reason || "admin_cancelled",
        },
      }
    );

    // Update user in Supabase
    await fetch(`${supabaseUrl}/rest/v1/users?id=eq.${user_id}`, {
      method: "PATCH",
      headers: {
        "Authorization": `Bearer ${supabaseServiceKey}`,
        "apikey": supabaseServiceKey,
        "Content-Type": "application/json",
        "Prefer": "return=minimal",
      },
      body: JSON.stringify({
        subscription_tier: "Free",
        is_active: true,
      }),
    });

    // Log billing event
    await fetch(`${supabaseUrl}/rest/v1/billing_events`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${supabaseServiceKey}`,
        "apikey": supabaseServiceKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        user_id: user_id,
        event_type: "subscription.cancelled",
        stripe_event_id: `admin_cancel_${Date.now()}`,
        amount: 0,
        currency: "gbp",
        metadata: {
          reason: reason || "admin_cancelled",
          subscription_id: user.stripe_subscription_id,
        },
      }),
    });

    return new Response(
      JSON.stringify({
        success: true,
        message: "Subscription cancelled successfully",
        subscription: {
          id: subscription.id,
          cancel_at_period_end: subscription.cancel_at_period_end,
          current_period_end: subscription.current_period_end,
        },
      }),
      {
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  } catch (error) {
    console.error("Subscription cancellation error:", error);

    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
      }),
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
