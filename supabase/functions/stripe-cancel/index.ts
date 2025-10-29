import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import Stripe from 'npm:stripe@17.5.0';
import { createClient } from 'jsr:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
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
    const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
      apiVersion: '2024-06-20',
    });

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { user_id } = await req.json();

    // Get user's Stripe subscription ID
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('stripe_subscription_id, subscription_tier')
      .eq('id', user_id)
      .single();

    if (userError || !userData) {
      throw new Error('User not found');
    }

    if (!userData.stripe_subscription_id) {
      throw new Error('No active subscription found');
    }

    // Cancel the subscription at period end
    const subscription = await stripe.subscriptions.update(
      userData.stripe_subscription_id,
      {
        cancel_at_period_end: true,
      }
    );

    // Log cancellation event
    await supabase.from('billing_events').insert({
      user_id: user_id,
      event_type: 'subscription_cancel_scheduled',
      plan: userData.subscription_tier,
      metadata: {
        subscription_id: subscription.id,
        cancel_at: subscription.cancel_at,
      },
    });

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Subscription will be canceled at the end of the billing period',
        cancel_at: subscription.cancel_at,
      }),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err.message }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  }
});