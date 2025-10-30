import { useAuth } from '../contexts/AuthContext';
import { Shield } from 'lucide-react';

export default function AdminBanner() {
  const { user } = useAuth();

  if (user?.email !== 'ironzola@gmail.com') {
    return null;
  }

  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-r from-purple-600 to-blue-600 text-white py-2 px-4 shadow-lg">
      <div className="max-w-7xl mx-auto flex items-center justify-center gap-2">
        <Shield className="w-4 h-4" />
        <p className="text-sm font-semibold">
          🧠 Admin Test Mode Active — All features unlocked (temporary override)
        </p>
      </div>
    </div>
  );
}
