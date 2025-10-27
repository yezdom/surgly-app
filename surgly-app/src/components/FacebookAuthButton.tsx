import { useState, useEffect } from 'react';
import { Facebook, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { checkFacebookConnection } from '../lib/facebookService';

export default function FacebookAuthButton() {
  const [isConnected, setIsConnected] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkConnection();
  }, []);

  async function checkConnection() {
    setLoading(true);
    try {
      const connected = await checkFacebookConnection();
      setIsConnected(connected);
    } catch (error) {
      console.error('Failed to check connection:', error);
    } finally {
      setLoading(false);
    }
  }

  function handleConnect() {
    const redirectUri = encodeURIComponent(`${window.location.origin}/auth/facebook/callback`);
    const clientId = '2039452053259444';
    const state = Math.random().toString(36).substring(7);

    sessionStorage.setItem('fb_oauth_state', state);

    const authUrl = `https://www.facebook.com/v18.0/dialog/oauth?client_id=${clientId}&redirect_uri=${redirectUri}&scope=ads_read,ads_management&state=${state}`;
    window.location.href = authUrl;
  }

  if (loading) {
    return (
      <button
        disabled
        className="flex items-center gap-2 px-6 py-3 bg-gray-400 text-white rounded-lg font-medium cursor-not-allowed"
      >
        <Loader2 className="w-5 h-5 animate-spin" />
        Checking connection...
      </button>
    );
  }

  if (isConnected) {
    return (
      <div className="flex items-center gap-3 px-6 py-3 bg-green-500/10 border border-green-500/30 rounded-lg text-green-400">
        <CheckCircle className="w-5 h-5" />
        <span className="font-medium">Facebook Connected</span>
      </div>
    );
  }

  return (
    <button
      onClick={handleConnect}
      className="flex items-center gap-2 px-6 py-3 bg-[#1877F2] hover:bg-[#166FE5] text-white rounded-lg font-medium transition"
    >
      <Facebook className="w-5 h-5" />
      Connect Facebook
    </button>
  );
}
