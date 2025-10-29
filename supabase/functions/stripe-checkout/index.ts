import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import Stripe from 'npm:stripe@17.5.0';
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
    const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
      apiVersion: '2024-06-20',
    });

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { plan, user_id, billing_cycle = 'monthly' } = await req.json();

    // Get user data
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('email, stripe_customer_id')
      .eq('id', user_id)
      .single();

    if (userError || !userData) {
      throw new Error('User not found');
    }

    // Create or retrieve Stripe customer
    let customerId = userData.stripe_customer_id;
    
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: userData.email,
        metadata: { supabase_user_id: user_id },
      });
      customerId = customer.id;
      
      // Save customer ID to Supabase
      await supabase
        .from('users')
        .update({ stripe_customer_id: customerId })
        .eq('id', user_id);
    }

    // Price IDs for different plans (these should be configured in Stripe Dashboard)
    const priceIds: Record<string, { monthly: string; annual: string }> = {
      starter: {
        monthly: Deno.env.get('STRIPE_PRICE_STARTER_MONTHLY') || 'price_starter_monthly',
        annual: Deno.env.get('STRIPE_PRICE_STARTER_ANNUAL') || 'price_starter_annual',
      },
      pro: {
        monthly: Deno.env.get('STRIPE_PRICE_PRO_MONTHLY') || 'price_pro_monthly',
        annual: Deno.env.get('STRIPE_PRICE_PRO_ANNUAL') || 'price_pro_annual',
      },
      agency: {
        monthly: Deno.env.get('STRIPE_PRICE_AGENCY_MONTHLY') || 'price_agency_monthly',
        annual: Deno.env.get('STRIPE_PRICE_AGENCY_ANNUAL') || 'price_agency_annual',
      },
    };

    const priceId = priceIds[plan.toLowerCase()]?.[billing_cycle];
    
    if (!priceId) {
      throw new Error('Invalid plan selected');
    }

    // Create Stripe Checkout Session
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      success_url: `${Deno.env.get('APP_URL') || 'https://surgly.app'}/dashboard?success=true`,
      cancel_url: `${Deno.env.get('APP_URL') || 'https://surgly.app'}/settings?canceled=true`,
      metadata: {
        user_id: user_id,
        plan: plan.toLowerCase(),
        billing_cycle: billing_cycle,
      },
      subscription_data: {
        metadata: {
          user_id: user_id,
          plan: plan.toLowerCase(),
        },
      },
    });

    // Log checkout initiation
    await supabase.from('billing_events').insert({
      user_id: user_id,
      event_type: 'checkout_initiated',
      plan: plan.toLowerCase(),
      stripe_session_id: session.id,
      metadata: { billing_cycle },
    });

    return new Response(
      JSON.stringify({ url: session.url }),
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