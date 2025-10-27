import { ReactNode, useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { supabase } from '../lib/supabase';
import {
  LayoutDashboard,
  FileText,
  Settings,
  Sun,
  Moon,
  LogOut,
  Shield,
} from 'lucide-react';

interface DashboardLayoutProps {
  children: ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const { user, signOut } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    checkAdminStatus();
  }, [user]);

  async function checkAdminStatus() {
    if (!user) return;

    try {
      const { data } = await supabase
        .from('users')
        .select('is_admin')
        .eq('id', user.id)
        .maybeSingle();

      setIsAdmin(data?.is_admin || false);
    } catch (error) {
      console.error('Failed to check admin status:', error);
    }
  }

  async function handleSignOut() {
    await signOut();
    navigate('/');
  }

  const navigation = [
    {
      name: 'Dashboard',
      href: '/dashboard',
      emoji: '📊',
      color: 'text-indigo-600 dark:text-indigo-400',
      bgColor: 'bg-indigo-50 dark:bg-indigo-500/10'
    },
    {
      name: 'Pre-Launch Validator',
      href: '/validator',
      emoji: '🎯',
      color: 'text-blue-600 dark:text-blue-400',
      bgColor: 'bg-blue-50 dark:bg-blue-500/10'
    },
    {
      name: 'Ad Doctor',
      href: '/doctor',
      emoji: '🏥',
      color: 'text-red-600 dark:text-red-400',
      bgColor: 'bg-red-50 dark:bg-red-500/10'
    },
    {
      name: 'Creative Insights',
      href: '/creative',
      emoji: '🎨',
      color: 'text-purple-600 dark:text-purple-400',
      bgColor: 'bg-purple-50 dark:bg-purple-500/10'
    },
    {
      name: 'Reports',
      href: '/reports',
      emoji: '📄',
      color: 'text-gray-600 dark:text-gray-400',
      bgColor: 'bg-gray-50 dark:bg-gray-500/10'
    },
    {
      name: 'Settings',
      href: '/settings',
      emoji: '⚙️',
      color: 'text-gray-600 dark:text-gray-400',
      bgColor: 'bg-gray-50 dark:bg-gray-500/10'
    }
  ];

  const adminNavigation = [
    {
      name: 'Admin Panel',
      href: '/admin',
      emoji: '🛡️',
      color: 'text-purple-600 dark:text-purple-400',
      bgColor: 'bg-purple-50 dark:bg-purple-500/10'
    }
  ];

  return (
    <div className="min-h-screen bg-light-secondary dark:bg-dark-primary flex">
      <aside className="w-64 bg-light-primary dark:bg-dark-secondary border-r border-border-light dark:border-border-dark flex-shrink-0">
        <div className="p-6 border-b border-border-light dark:border-border-dark">
          <div className="text-2xl font-extrabold text-accent-blue">SURGLY</div>
        </div>

        <nav className="space-y-1 px-3 py-6">
          {navigation.map((item) => {
            const isActive = location.pathname === item.href;

            return (
              <Link
                key={item.name}
                to={item.href}
                className={`
                  group flex items-center gap-3 px-3 py-3 rounded-lg
                  font-bold text-sm transition-all duration-200
                  ${isActive
                    ? `${item.bgColor} ${item.color} shadow-sm`
                    : 'text-text-light-primary dark:text-text-dark-primary hover:bg-light-tertiary dark:hover:bg-dark-tertiary'
                  }
                `}
              >
                <span className={`
                  text-2xl flex items-center justify-center w-10 h-10 rounded-lg
                  ${isActive ? item.bgColor : 'bg-light-tertiary dark:bg-dark-tertiary'}
                  transition-all duration-200 group-hover:scale-110
                `}>
                  {item.emoji}
                </span>
                <span className="truncate">{item.name}</span>
              </Link>
            );
          })}

          {isAdmin && adminNavigation.map((item) => {
            const isActive = location.pathname === item.href;

            return (
              <Link
                key={item.name}
                to={item.href}
                className={`
                  group flex items-center gap-3 px-3 py-3 rounded-lg
                  font-bold text-sm transition-all duration-200
                  ${isActive
                    ? `${item.bgColor} ${item.color} shadow-sm`
                    : 'text-text-light-primary dark:text-text-dark-primary hover:bg-light-tertiary dark:hover:bg-dark-tertiary'
                  }
                `}
              >
                <span className={`
                  text-2xl flex items-center justify-center w-10 h-10 rounded-lg
                  ${isActive ? item.bgColor : 'bg-light-tertiary dark:bg-dark-tertiary'}
                  transition-all duration-200 group-hover:scale-110
                `}>
                  {item.emoji}
                </span>
                <span className="truncate">{item.name}</span>
              </Link>
            );
          })}
        </nav>

        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-border-light dark:border-border-dark">
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg hover:bg-light-tertiary dark:hover:bg-dark-tertiary transition"
            >
              {theme === 'dark' ? (
                <Sun className="w-5 h-5 text-text-dark-primary" />
              ) : (
                <Moon className="w-5 h-5 text-text-light-primary" />
              )}
            </button>
            <button
              onClick={handleSignOut}
              className="p-2 rounded-lg hover:bg-light-tertiary dark:hover:bg-dark-tertiary transition text-red-500"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
          <div className="text-xs text-text-light-secondary dark:text-text-dark-secondary truncate">
            {user?.email}
          </div>
        </div>
      </aside>

      <main className="flex-1 overflow-auto">
        <div className="p-8">{children}</div>
      </main>
    </div>
  );
}
