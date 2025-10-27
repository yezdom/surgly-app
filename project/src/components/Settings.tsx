import { useState } from 'react';
import DashboardLayout from './DashboardLayout';
import FacebookAuthButton from './FacebookAuthButton';
import { useAuth } from '../contexts/AuthContext';
import { Settings as SettingsIcon, User, Shield, Bell } from 'lucide-react';

export default function Settings() {
  const { user } = useAuth();

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold text-text-light-primary dark:text-text-dark-primary mb-4 flex items-center gap-3">
          <SettingsIcon className="w-10 h-10" />
          Settings
        </h1>
        <p className="text-text-light-secondary dark:text-text-dark-secondary mb-8">
          Manage your account and preferences
        </p>

        <div className="space-y-6">
          <div className="bg-light-primary dark:bg-dark-secondary border border-border-light dark:border-border-dark rounded-xl p-6">
            <h2 className="text-xl font-bold text-text-light-primary dark:text-text-dark-primary mb-4 flex items-center gap-2">
              <User className="w-6 h-6" />
              Account Information
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-text-light-secondary dark:text-text-dark-secondary mb-1">
                  Email
                </label>
                <input
                  type="email"
                  value={user?.email || ''}
                  disabled
                  className="w-full px-4 py-2 bg-light-secondary dark:bg-dark-tertiary border border-border-light dark:border-border-dark rounded-lg text-text-light-primary dark:text-text-dark-primary"
                />
              </div>
            </div>
          </div>

          <div className="bg-light-primary dark:bg-dark-secondary border border-border-light dark:border-border-dark rounded-xl p-6">
            <h2 className="text-xl font-bold text-text-light-primary dark:text-text-dark-primary mb-4 flex items-center gap-2">
              <Shield className="w-6 h-6" />
              Facebook Integration
            </h2>
            <p className="text-text-light-secondary dark:text-text-dark-secondary mb-4">
              Connect your Facebook account to access your ad campaigns
            </p>
            <FacebookAuthButton />
          </div>

          <div className="bg-light-primary dark:bg-dark-secondary border border-border-light dark:border-border-dark rounded-xl p-6">
            <h2 className="text-xl font-bold text-text-light-primary dark:text-text-dark-primary mb-4 flex items-center gap-2">
              <Bell className="w-6 h-6" />
              Notifications
            </h2>
            <div className="space-y-3">
              <label className="flex items-center gap-3">
                <input type="checkbox" className="w-5 h-5" defaultChecked />
                <span className="text-text-light-primary dark:text-text-dark-primary">
                  Email notifications
                </span>
              </label>
              <label className="flex items-center gap-3">
                <input type="checkbox" className="w-5 h-5" defaultChecked />
                <span className="text-text-light-primary dark:text-text-dark-primary">
                  Budget alerts
                </span>
              </label>
              <label className="flex items-center gap-3">
                <input type="checkbox" className="w-5 h-5" />
                <span className="text-text-light-primary dark:text-text-dark-primary">
                  Performance reports
                </span>
              </label>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
