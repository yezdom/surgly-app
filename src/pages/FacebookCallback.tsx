import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';

export default function FacebookCallback() {
  const navigate = useNavigate();
  const [status, setStatus] = useState<'processing' | 'success' | 'error'>('processing');
  const [message, setMessage] = useState('Completing Facebook authentication...');

  useEffect(() => {
    handleCallback();
  }, []);

  async function handleCallback() {
    try {
      console.log('🔗 Facebook OAuth callback initiated');

      // Verify redirect URI matches environment variable
      const expectedRedirectUri = import.meta.env.VITE_FACEBOOK_REDIRECT_URI;
      const currentUrl = window.location.origin + window.location.pathname;

      console.log('🔍 Redirect URI check:', {
        expected: expectedRedirectUri,
        current: currentUrl,
        matches: expectedRedirectUri === currentUrl
      });

      if (expectedRedirectUri && !currentUrl.includes(expectedRedirectUri.split('?')[0])) {
        console.warn('⚠️ Redirect URI mismatch detected');
        setStatus('error');
        setMessage('Facebook connection failed. Please verify redirect URL settings in your Facebook Developer App.');

        setTimeout(() => {
          navigate('/settings?tab=integrations&error=redirect_mismatch');
        }, 4000);
        return;
      }

      // Check both query params and hash fragments
      const params = new URLSearchParams(window.location.search);
      const hashParams = new URLSearchParams(window.location.hash.substring(1));

      const code = params.get('code') || hashParams.get('code');
      const error = params.get('error') || hashParams.get('error');
      const errorDescription = params.get('error_description') || hashParams.get('error_description');
      const errorReason = params.get('error_reason') || hashParams.get('error_reason');

      console.log('📋 OAuth params:', {
        hasCode: !!code,
        error,
        errorDescription,
        errorReason,
        search: window.location.search,
        hash: window.location.hash
      });

      // Handle error from Facebook
      if (error) {
        console.error('❌ Facebook OAuth error:', error, errorDescription);
        setStatus('error');

        if (error === 'access_denied') {
          setMessage('You denied access to Facebook. Please try again and authorize the app.');
        } else if (error === 'redirect_uri_mismatch') {
          setMessage('Facebook connection failed. Please verify redirect URL settings in your Facebook Developer App.');
        } else {
          setMessage(`Facebook authentication failed: ${errorDescription || error}`);
        }

        setTimeout(() => {
          navigate('/settings?tab=integrations&error=oauth_failed');
        }, 4000);
        return;
      }

      // Handle missing code
      if (!code) {
        console.error('❌ No authorization code received from Facebook');
        setStatus('error');
        setMessage('No authorization code received. Facebook connection failed. Please verify redirect URL settings in your Facebook Developer App.');

        setTimeout(() => {
          navigate('/settings?tab=integrations&error=no_code');
        }, 4000);
        return;
      }

      console.log('✅ Authorization code received, exchanging for session...');
      setMessage('Exchanging authorization code...');

      // Get current user session (user must be logged in first)
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        console.error('❌ No user session found');
        setStatus('error');
        setMessage('Please log in first before connecting Facebook.');

        setTimeout(() => {
          navigate('/login?message=login_required');
        }, 2000);
        return;
      }

      console.log('✅ User session found:', session.user.email);
      console.log('📡 Calling Edge Function to exchange code for token...');

      // Call Edge Function with the code
      const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;

      const response = await fetch(
        `${SUPABASE_URL}/functions/v1/facebook-oauth-callback`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ code })
        }
      );

      console.log('📡 Edge Function response status:', response.status);

      // Check if response is JSON
      const contentType = response.headers.get('content-type');

      if (!contentType || !contentType.includes('application/json')) {
        const text = await response.text();
        console.error('❌ Non-JSON response from Edge Function:', text.substring(0, 200));

        // Check if it's an HTML redirect (common issue)
        if (text.includes('<!DOCTYPE') || text.includes('<html')) {
          throw new Error('Server returned HTML instead of JSON. Edge Function may not be deployed correctly.');
        }

        throw new Error('Server returned invalid response format');
      }

      const data = await response.json();
      console.log('📦 Edge Function response:', data);

      if (!response.ok) {
        console.error('❌ Edge Function error:', data.error);
        throw new Error(data.error || 'Failed to connect Facebook account');
      }

      console.log('✅ Facebook account connected successfully!');
      console.log('📊 Ad accounts:', data.ad_accounts?.length || 0);

      setStatus('success');
      setMessage('Facebook account connected successfully!');

      // Redirect to dashboard after 1 second
      setTimeout(() => {
        navigate('/dashboard?facebook_connected=true');
      }, 1000);

    } catch (err: any) {
      console.error('❌ Facebook callback handler error:', err);
      setStatus('error');
      setMessage(err.message || 'Failed to connect Facebook account');

      // Redirect to login with error after 3 seconds
      setTimeout(() => {
        navigate(`/login?error=${encodeURIComponent(err.message || 'callback_failed')}`);
      }, 3000);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 via-white to-pink-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="text-center max-w-md mx-auto p-8 bg-white dark:bg-gray-800 rounded-2xl shadow-xl">
        {status === 'processing' && (
          <>
            <div className="relative mx-auto mb-6 w-16 h-16">
              <div className="absolute inset-0 rounded-full border-4 border-purple-200 dark:border-purple-900"></div>
              <div className="absolute inset-0 rounded-full border-4 border-t-purple-500 animate-spin"></div>
            </div>
            <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-2">
              Connecting Facebook
            </h2>
            <p className="text-gray-600 dark:text-gray-300">{message}</p>
          </>
        )}

        {status === 'success' && (
          <>
            <div className="text-6xl mb-4">✓</div>
            <h2 className="text-xl font-bold text-green-600 mb-2">Success!</h2>
            <p className="text-gray-600 dark:text-gray-300">{message}</p>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
              Redirecting to dashboard...
            </p>
          </>
        )}

        {status === 'error' && (
          <>
            <div className="text-6xl mb-4">✕</div>
            <h2 className="text-xl font-bold text-red-600 mb-2">
              Connection Failed
            </h2>
            <p className="text-gray-600 dark:text-gray-300 mb-4">{message}</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Redirecting...
            </p>
          </>
        )}
      </div>
    </div>
  );
}
