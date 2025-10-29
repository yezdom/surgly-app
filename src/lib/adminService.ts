import { supabase } from './supabase';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

interface SyncResponse {
  success: boolean;
  message: string;
  totalCustomers: number;
  syncedCount: number;
  errors?: string[];
}

interface RefundResponse {
  success: boolean;
  refund?: {
    id: string;
    amount: number;
    currency: string;
    status: string;
  };
  error?: string;
}

interface CancelSubscriptionResponse {
  success: boolean;
  message?: string;
  subscription?: {
    id: string;
    cancel_at_period_end: boolean;
    current_period_end: number;
  };
  error?: string;
}

export async function syncStripeCustomers(): Promise<SyncResponse> {
  try {
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      throw new Error('Not authenticated');
    }

    const response = await fetch(
      `${SUPABASE_URL}/functions/v1/admin-sync-stripe`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to sync Stripe customers');
    }

    return await response.json();
  } catch (error) {
    console.error('Sync Stripe customers error:', error);
    throw error;
  }
}

export async function refundPayment(
  paymentIntentId: string,
  reason?: string
): Promise<RefundResponse> {
  try {
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      throw new Error('Not authenticated');
    }

    const response = await fetch(
      `${SUPABASE_URL}/functions/v1/admin-refund-payment`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          payment_intent_id: paymentIntentId,
          reason: reason || 'requested_by_customer',
        }),
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to process refund');
    }

    return await response.json();
  } catch (error) {
    console.error('Refund payment error:', error);
    throw error;
  }
}

export async function cancelUserSubscription(
  userId: string,
  reason?: string
): Promise<CancelSubscriptionResponse> {
  try {
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      throw new Error('Not authenticated');
    }

    const response = await fetch(
      `${SUPABASE_URL}/functions/v1/admin-cancel-subscription`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: userId,
          reason: reason || 'admin_cancelled',
        }),
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to cancel subscription');
    }

    return await response.json();
  } catch (error) {
    console.error('Cancel subscription error:', error);
    throw error;
  }
}
