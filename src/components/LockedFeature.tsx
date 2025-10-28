import { Lock } from 'lucide-react';
import { Link } from 'react-router-dom';
import DashboardLayout from './DashboardLayout';

interface LockedFeatureProps {
  title: string;
  description: string;
  icon: string;
  features: string[];
}

export default function LockedFeature({ title, description, icon, features }: LockedFeatureProps) {
  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto">
        <div className="bg-light-primary dark:bg-dark-secondary border border-border-light dark:border-border-dark rounded-xl p-12 text-center">
          <div className="text-6xl mb-6">{icon}</div>
          <Lock className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h1 className="text-3xl font-bold text-text-light-primary dark:text-text-dark-primary mb-4">
            {title}
          </h1>
          <p className="text-lg text-text-light-secondary dark:text-text-dark-secondary mb-8">
            {description}
          </p>

          <div className="bg-light-secondary dark:bg-dark-tertiary rounded-lg p-6 mb-8">
            <h3 className="font-bold text-text-light-primary dark:text-text-dark-primary mb-4">
              Features Include:
            </h3>
            <ul className="space-y-2 text-left max-w-md mx-auto">
              {features.map((feature, index) => (
                <li key={index} className="text-text-light-secondary dark:text-text-dark-secondary flex items-start gap-2">
                  <span className="text-green-500 mt-1">✓</span>
                  <span>{feature}</span>
                </li>
              ))}
            </ul>
          </div>

          <Link
            to="/pricing"
            className="inline-block px-8 py-3 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-lg hover:shadow-lg transition font-medium"
          >
            Upgrade to Unlock
          </Link>
        </div>
      </div>
    </DashboardLayout>
  );
}
