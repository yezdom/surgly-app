import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { X, CheckCircle, XCircle, AlertCircle } from 'lucide-react';

export default function AdminFacebookStatus() {
  const [isVisible, setIsVisible] = useState(true);
  const [token, setToken] = useState<string | null>(null);
  const [status, setStatus] = useState<string>('Checking...');
  const [statusType, setStatusType] = useState<'loading' | 'connected' | 'error'>('loading');
  const [expiresAt, setExpiresAt] = useState<string | null>(null);

  useEffect(() => {
    fetchTokenStatus();
    const interval = setInterval(fetchTokenStatus, 30000);
    return () => clearInterval(interval);
  }, []);

  async function fetchTokenStatus() {
    try {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        setStatus('Not logged in');
        setStatusType('error');
        return;
      }

      const { data, error } = await supabase
        .from('facebook_tokens')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) {
        console.error('Error fetching Facebook token:', error);
        setStatus('Error checking connection');
        setStatusType('error');
      } else if (data?.access_token) {
        setToken(data.access_token);
        setExpiresAt(data.expires_at);

        const expiryDate = new Date(data.expires_at);
        const isExpired = expiryDate < new Date();

        if (isExpired) {
          setStatus('Token Expired');
          setStatusType('error');
        } else {
          setStatus('Connected');
          setStatusType('connected');
        }
      } else {
        setStatus('No token found');
        setStatusType('error');
      }
    } catch (err) {
      console.error('Error in fetchTokenStatus:', err);
      setStatus('Error');
      setStatusType('error');
    }
  }

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-5 right-5 bg-gray-900 dark:bg-gray-800 text-white rounded-xl shadow-2xl border border-gray-700 z-50 w-80 animate-fade-in">
      <div className="flex items-center justify-between p-4 border-b border-gray-700">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
          <h4 className="font-bold text-sm">Admin Test Mode</h4>
        </div>
        <button
          onClick={() => setIsVisible(false)}
          className="text-gray-400 hover:text-white transition"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="p-4 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-400">Facebook Status:</span>
          <div className="flex items-center gap-2">
            {statusType === 'loading' && (
              <>
                <AlertCircle className="w-4 h-4 text-yellow-400" />
                <span className="text-sm font-medium text-yellow-400">{status}</span>
              </>
            )}
            {statusType === 'connected' && (
              <>
                <CheckCircle className="w-4 h-4 text-green-400" />
                <span className="text-sm font-medium text-green-400">{status}</span>
              </>
            )}
            {statusType === 'error' && (
              <>
                <XCircle className="w-4 h-4 text-red-400" />
                <span className="text-sm font-medium text-red-400">{status}</span>
              </>
            )}
          </div>
        </div>

        {token && (
          <>
            <div className="space-y-1">
              <span className="text-xs text-gray-400">Access Token:</span>
              <div className="bg-gray-800 dark:bg-gray-900 rounded p-2 text-xs font-mono text-gray-300 break-all">
                {token.substring(0, 40)}...
              </div>
            </div>

            {expiresAt && (
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-400">Expires:</span>
                <span className="text-gray-300">
                  {new Date(expiresAt).toLocaleDateString()}
                </span>
              </div>
            )}
          </>
        )}

        <button
          onClick={fetchTokenStatus}
          className="w-full mt-2 px-3 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-xs font-medium transition"
        >
          Refresh Status
        </button>
      </div>

      <div className="px-4 py-2 bg-gray-800 dark:bg-gray-900 rounded-b-xl">
        <p className="text-xs text-gray-500">
          Admin verification mode active
        </p>
      </div>
    </div>
  );
}
