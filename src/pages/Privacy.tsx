import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import Logo from '../components/Logo';
import Footer from '../components/Footer';

export default function Privacy() {
  return (
    <div className="min-h-screen flex flex-col bg-white dark:bg-gradient-to-br dark:from-slate-900 dark:via-purple-900 dark:to-slate-900 transition-colors duration-500">
      <nav className="container mx-auto px-6 py-6 border-b border-gray-200 dark:border-transparent">
        <div className="flex items-center justify-between">
          <Logo variant="header" linkTo="/" />
          <Link to="/" className="flex items-center gap-2 text-text-light-primary dark:text-white hover:text-accent-blue dark:hover:text-blue-300 transition">
            <ArrowLeft className="w-5 h-5" />
            Back to Home
          </Link>
        </div>
      </nav>

      <div className="container mx-auto px-6 py-20 max-w-4xl flex-1">
        <h1 className="text-5xl font-bold text-text-light-primary dark:text-white mb-4">Privacy Policy</h1>
        <p className="text-xl text-text-light-secondary dark:text-gray-300 mb-12">
          Your privacy and trust are our top priorities.
        </p>

        <div className="bg-light-secondary dark:bg-white/10 backdrop-blur-lg border border-border-light dark:border-white/20 rounded-xl p-10 text-text-light-primary dark:text-white space-y-8">
          <p className="text-lg leading-relaxed">
            At Surgly, we take your privacy seriously. This policy explains how we collect, store, and use your information to provide AI-powered ad optimization services.
          </p>

          <div>
            <h2 className="text-3xl font-bold mb-4">1. Information We Collect</h2>
            <p className="text-lg leading-relaxed mb-4">
              We collect account information (like name, email, connected ad accounts) and performance data to generate insights and reports.
            </p>
            <p className="text-lg leading-relaxed">
              We <strong>do not</strong> collect or store ad creative assets unless explicitly authorized by you.
            </p>
          </div>

          <div>
            <h2 className="text-3xl font-bold mb-4">2. How We Use Your Information</h2>
            <p className="text-lg leading-relaxed mb-4">
              We use your data to:
            </p>
            <ul className="list-disc list-inside space-y-2 text-lg ml-4">
              <li>Deliver campaign diagnostics and reports</li>
              <li>Generate performance recommendations</li>
              <li>Improve model accuracy and service quality</li>
            </ul>
          </div>

          <div>
            <h2 className="text-3xl font-bold mb-4">3. How We Protect Your Data</h2>
            <p className="text-lg leading-relaxed">
              All data is encrypted in transit and at rest using Supabase's enterprise-grade security. We comply with GDPR and CCPA requirements, ensuring transparency and control.
            </p>
          </div>

          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6">
            <h2 className="text-3xl font-bold mb-4">4. Data Retention & Deletion</h2>
            <p className="text-lg leading-relaxed mb-4">
              You can request account or data deletion at any time via our{' '}
              <Link to="/data-deletion-instructions" className="text-accent-blue dark:text-blue-400 hover:underline font-semibold">
                Data Deletion Instructions
              </Link>.
            </p>
            <p className="text-lg leading-relaxed">
              Once processed, all user data and associated analytics are permanently removed from our systems.
            </p>
          </div>

          <div>
            <h2 className="text-3xl font-bold mb-4">5. Third-Party Integrations</h2>
            <p className="text-lg leading-relaxed mb-4">
              Surgly integrates with ad platforms and analytics APIs (like Meta, Google, TikTok) via secure OAuth 2.0 authorization.
            </p>
            <p className="text-lg leading-relaxed">
              We <strong>never share</strong> your data with unauthorized third parties.
            </p>
          </div>

          <div>
            <h2 className="text-3xl font-bold mb-4">6. Updates</h2>
            <p className="text-lg leading-relaxed">
              We may update this policy periodically to reflect product improvements. You'll always find the latest version here.
            </p>
          </div>

          <div className="mt-12 pt-8 border-t border-gray-300 dark:border-gray-700">
            <p className="text-lg leading-relaxed italic">
              By using Surgly, you agree to this policy and our responsible use of AI-driven advertising analytics.
            </p>
            <p className="text-sm text-text-light-secondary dark:text-gray-400 mt-4">
              Last updated: {new Date().getFullYear()}
            </p>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
