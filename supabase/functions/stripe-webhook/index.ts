import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import Stripe from 'npm:stripe@17.5.0';
import { createClient } from 'jsr:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey, stripe-signature',
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

    const signature = req.headers.get('stripe-signature');
    if (!signature) {
      throw new Error('No stripe signature');
    }

    const body = await req.text();
    const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET');

    let event: Stripe.Event;

    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret || '');
    } catch (err) {
      console.error('Webhook signature verification failed:', err.message);
      return new Response(
        JSON.stringify({ error: 'Webhook signature verification failed' }),
        { status: 400, headers: corsHeaders }
      );
    }

    // Handle different event types
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        const userId = session.metadata?.user_id;
        const plan = session.metadata?.plan;

        if (!userId) break;

        // Update user subscription tier
        await supabase
          .from('users')
          .update({
            subscription_tier: plan || 'free',
            stripe_subscription_id: session.subscription as string,
          })
          .eq('id', userId);

        // Log billing event
        await supabase.from('billing_events').insert({
          user_id: userId,
          event_type: 'checkout_completed',
          plan: plan || 'unknown',
          amount: (session.amount_total || 0) / 100,
          stripe_session_id: session.id,
          metadata: {
            subscription_id: session.subscription,
            customer_id: session.customer,
          },
        });

        console.log(`Subscription activated for user ${userId}, plan: ${plan}`);
        break;
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId = subscription.customer as string;

        // Find user by customer ID
        const { data: user } = await supabase
          .from('users')
          .select('id')
          .eq('stripe_customer_id', customerId)
          .single();

        if (!user) break;

        const plan = subscription.metadata?.plan || 'unknown';

        // Update subscription status
        await supabase
          .from('users')
          .update({
            subscription_tier: subscription.status === 'active' ? plan : 'free',
            stripe_subscription_id: subscription.id,
          })
          .eq('id', user.id);

        // Log billing event
        await supabase.from('billing_events').insert({
          user_id: user.id,
          event_type: 'subscription_updated',
          plan: plan,
          metadata: {
            subscription_id: subscription.id,
            status: subscription.status,
          },
        });

        console.log(`Subscription updated for user ${user.id}`);
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId = subscription.customer as string;

        // Find user by customer ID
        const { data: user } = await supabase
          .from('users')
          .select('id')
          .eq('stripe_customer_id', customerId)
          .single();

        if (!user) break;

        // Downgrade to free plan
        await supabase
          .from('users')
          .update({
            subscription_tier: 'free',
            stripe_subscription_id: null,
          })
          .eq('id', user.id);

        // Log billing event
        await supabase.from('billing_events').insert({
          user_id: user.id,
          event_type: 'subscription_canceled',
          plan: 'free',
          metadata: {
            subscription_id: subscription.id,
            canceled_at: new Date().toISOString(),
          },
        });

        console.log(`Subscription canceled for user ${user.id}`);
        break;
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice;
        const customerId = invoice.customer as string;

        // Find user by customer ID
        const { data: user } = await supabase
          .from('users')
          .select('id')
          .eq('stripe_customer_id', customerId)
          .single();

        if (!user) break;

        // Log payment
        await supabase.from('billing_events').insert({
          user_id: user.id,
          event_type: 'payment_succeeded',
          amount: (invoice.amount_paid || 0) / 100,
          metadata: {
            invoice_id: invoice.id,
            subscription_id: invoice.subscription,
          },
        });

        console.log(`Payment succeeded for user ${user.id}`);
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        const customerId = invoice.customer as string;

        // Find user by customer ID
        const { data: user } = await supabase
          .from('users')
          .select('id')
          .eq('stripe_customer_id', customerId)
          .single();

        if (!user) break;

        // Log failed payment
        await supabase.from('billing_events').insert({
          user_id: user.id,
          event_type: 'payment_failed',
          amount: (invoice.amount_due || 0) / 100,
          metadata: {
            invoice_id: invoice.id,
            subscription_id: invoice.subscription,
          },
        });

        console.log(`Payment failed for user ${user.id}`);
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return new Response(
      JSON.stringify({ received: true }),
      {
        status: 200,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  } catch (err) {
    console.error('Webhook error:', err);
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