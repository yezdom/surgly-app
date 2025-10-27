import { AlertCircle } from 'lucide-react';

export default function Suspended() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-6">
      <div className="max-w-md w-full bg-white/10 backdrop-blur-lg border border-white/20 rounded-xl p-8 text-center">
        <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
        <h1 className="text-3xl font-bold text-white mb-4">Account Suspended</h1>
        <p className="text-gray-300 mb-6">
          Your account has been suspended. Please contact support for more information.
        </p>
        <a
          href="mailto:support@surgly.com"
          className="inline-block px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition font-medium"
        >
          Contact Support
        </a>
      </div>
    </div>
  );
}
