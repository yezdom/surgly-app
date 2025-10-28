import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';

export default function FacebookCallback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('Connecting to Facebook...');

  useEffect(() => {
    handleCallback();
  }, [searchParams]);

  async function handleCallback() {
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    const error = searchParams.get('error');

    if (error) {
      setStatus('error');
      setMessage(`Facebook connection failed: ${error}`);
      setTimeout(() => navigate('/settings'), 3000);
      return;
    }

    const savedState = sessionStorage.getItem('fb_oauth_state');
    if (state !== savedState) {
      setStatus('error');
      setMessage('Invalid state parameter. Please try again.');
      setTimeout(() => navigate('/settings'), 3000);
      return;
    }

    if (!code) {
      setStatus('error');
      setMessage('No authorization code received');
      setTimeout(() => navigate('/settings'), 3000);
      return;
    }

    try {
      setMessage('Exchanging authorization code...');

      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        throw new Error('Not authenticated');
      }

      const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
      const response = await fetch(
        `${SUPABASE_URL}/functions/v1/facebook-oauth-callback`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            code,
            redirect_uri: `${window.location.origin}/auth/facebook/callback`,
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to exchange code');
      }

      await response.json();

      setMessage('Fetching your ad accounts...');

      const accountsResponse = await fetch(
        `${SUPABASE_URL}/functions/v1/facebook-get-accounts`,
        {
          headers: {
            Authorization: `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!accountsResponse.ok) {
        throw new Error('Failed to fetch ad accounts');
      }

      const accountsData = await accountsResponse.json();

      sessionStorage.removeItem('fb_oauth_state');

      setStatus('success');
      setMessage(`Successfully connected! Found ${accountsData.accounts?.length || 0} ad accounts.`);
      setTimeout(() => navigate('/dashboard'), 2000);
    } catch (error: any) {
      console.error('OAuth callback error:', error);
      setStatus('error');
      setMessage(error.message || 'Failed to complete Facebook connection');
      setTimeout(() => navigate('/settings'), 3000);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-6">
      <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-xl p-12 text-center">
        {status === 'loading' && <Loader2 className="w-16 h-16 text-blue-400 mx-auto mb-4 animate-spin" />}
        {status === 'success' && <CheckCircle className="w-16 h-16 text-green-400 mx-auto mb-4" />}
        {status === 'error' && <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />}
        <p className="text-xl text-white">{message}</p>
      </div>
    </div>
  );
}
