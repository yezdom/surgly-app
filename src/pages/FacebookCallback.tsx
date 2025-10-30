import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { exchangeCodeForToken } from '../lib/facebookService';

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

      const redirectUri = import.meta.env.VITE_FACEBOOK_REDIRECT_URI ||
                          `${window.location.origin}/auth/facebook/callback`;
      const currentUrl = window.location.origin + window.location.pathname;

      console.log('🔍 Redirect URI check:', {
        expected: redirectUri,
        current: currentUrl,
      });

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

      if (!code) {
        console.error('❌ No authorization code received from Facebook');
        setStatus('error');
        setMessage('No authorization code received. Facebook connection failed. Please verify redirect URL settings in your Facebook Developer App.');

        setTimeout(() => {
          navigate('/settings?tab=integrations&error=no_code');
        }, 4000);
        return;
      }

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
      console.log('🔄 Exchanging authorization code for access token...');
      setMessage('Exchanging authorization code...');

      const result = await exchangeCodeForToken(code);

      if (!result.success) {
        console.error('❌ Token exchange failed:', result.message);
        setStatus('error');
        setMessage(result.message);

        setTimeout(() => {
          navigate('/settings?tab=integrations&error=token_exchange_failed');
        }, 4000);
        return;
      }

      console.log('✅ Facebook account connected successfully!');

      setStatus('success');
      setMessage(result.message);

      setTimeout(() => {
        navigate('/settings?tab=integrations&success=facebook_connected');
      }, 1500);

    } catch (err: any) {
      console.error('❌ Facebook callback handler error:', err);
      setStatus('error');
      setMessage(err.message || 'Failed to connect Facebook account');

      setTimeout(() => {
        navigate(`/settings?tab=integrations&error=${encodeURIComponent(err.message || 'callback_failed')}`);
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
              Redirecting to settings...
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
