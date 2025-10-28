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
      // Get code from URL (Facebook redirected here with the code)
      const params = new URLSearchParams(window.location.search);
      const code = params.get('code');
      const error = params.get('error');

      if (error) {
        throw new Error(`Facebook denied access: ${error}`);
      }

      if (!code) {
        throw new Error('No authorization code received from Facebook');
      }

      console.log('Got authorization code from Facebook');
      setMessage('Exchanging authorization code...');

      // Get current user session (user must be logged in first)
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        throw new Error('Please log in first before connecting Facebook');
      }

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

      // Check if response is JSON
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const text = await response.text();
        console.error('Non-JSON response:', text.substring(0, 200));
        throw new Error('Server returned invalid response format');
      }

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to connect Facebook account');
      }

      console.log('Facebook connected successfully:', data);
      
      setStatus('success');
      setMessage('Facebook account connected successfully!');
      
      // Redirect to dashboard after 1 second
      setTimeout(() => {
        navigate('/dashboard?facebook_connected=true');
      }, 1000);

    } catch (err: any) {
      console.error('Facebook callback error:', err);
      setStatus('error');
      setMessage(err.message || 'Failed to connect Facebook account');
      
      // Redirect to home with error after 3 seconds
      setTimeout(() => {
        navigate(`/?error=${encodeURIComponent(err.message)}`);
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
              Redirecting to home page...
            </p>
          </>
        )}
      </div>
    </div>
  );
}
