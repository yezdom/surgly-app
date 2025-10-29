import { supabase } from './supabase';

export interface CheckoutOptions {
  plan: string;
  userId: string;
  billingCycle?: 'monthly' | 'annual';
}

export async function createCheckout(options: CheckoutOptions): Promise<void> {
  const { plan, userId, billingCycle = 'monthly' } = options;

  try {
    const response = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/stripe-checkout`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({ plan, user_id: userId, billing_cycle: billingCycle }),
      }
    );

    const data = await response.json();

    if (data.url) {
      window.location.href = data.url;
    } else {
      throw new Error(data.error || 'Unable to start checkout');
    }
  } catch (error) {
    console.error('Checkout error:', error);
    alert('Unable to start checkout. Please try again later.');
  }
}

export async function createCustomerPortalSession(userId: string): Promise<void> {
  try {
    const response = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/stripe-portal`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({ user_id: userId }),
      }
    );

    const data = await response.json();

    if (data.url) {
      window.location.href = data.url;
    } else {
      throw new Error(data.error || 'Unable to access billing portal');
    }
  } catch (error) {
    console.error('Portal error:', error);
    alert('Unable to access billing portal. Please try again later.');
  }
}

export async function cancelSubscription(userId: string): Promise<boolean> {
  try {
    const response = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/stripe-cancel`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({ user_id: userId }),
      }
    );

    const data = await response.json();

    if (data.success) {
      return true;
    } else {
      throw new Error(data.error || 'Unable to cancel subscription');
    }
  } catch (error) {
    console.error('Cancel error:', error);
    alert('Unable to cancel subscription. Please contact support.');
    return false;
  }
}

export async function getBillingHistory(userId: string) {
  try {
    const { data, error } = await supabase
      .from('billing_events')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(10);

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching billing history:', error);
    return [];
  }
}
