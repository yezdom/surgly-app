import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import Logo from '../components/Logo';
import Footer from '../components/Footer';

export default function Terms() {
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
        <h1 className="text-5xl font-bold text-text-light-primary dark:text-white mb-4">Terms of Service</h1>
        <p className="text-xl text-text-light-secondary dark:text-gray-300 mb-12">
          Please read these terms carefully before using Surgly.
        </p>

        <div className="bg-light-secondary dark:bg-white/10 backdrop-blur-lg border border-border-light dark:border-white/20 rounded-xl p-10 text-text-light-primary dark:text-white space-y-8">

          <div>
            <h2 className="text-3xl font-bold mb-4">1. Acceptance of Terms</h2>
            <p className="text-lg leading-relaxed">
              By using Surgly, you agree to abide by these Terms of Service and any updates we post. If you do not agree to these terms, please do not use our platform.
            </p>
          </div>

          <div>
            <h2 className="text-3xl font-bold mb-4">2. Subscriptions & Payments</h2>
            <p className="text-lg leading-relaxed mb-4">
              Paid plans renew automatically unless canceled. Cancellations take effect at the end of the billing cycle.
            </p>
            <p className="text-lg leading-relaxed">
              All prices are listed in GBP (£) and exclude applicable taxes. You are responsible for any taxes associated with your subscription.
            </p>
          </div>

          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6">
            <h2 className="text-3xl font-bold mb-4">3. Refund Policy</h2>
            <p className="text-lg leading-relaxed mb-4">
              Refunds are not automatic but may be considered if the platform fails to deliver promised functionality.
            </p>
            <p className="text-lg leading-relaxed">
              To request a refund review, contact{' '}
              <a href="mailto:support@surgly.app" className="text-accent-blue dark:text-blue-400 hover:underline font-semibold">
                support@surgly.app
              </a>{' '}
              with details of the issue. Refund requests must be submitted within 14 days of the charge.
            </p>
          </div>

          <div>
            <h2 className="text-3xl font-bold mb-4">4. Acceptable Use</h2>
            <p className="text-lg leading-relaxed mb-4">
              You must comply with Meta, Google, TikTok, and Microsoft Ads policies when connecting accounts to Surgly.
            </p>
            <p className="text-lg leading-relaxed">
              You may not use Surgly for any illegal, fraudulent, or harmful activities. We reserve the right to suspend or terminate accounts that violate this policy.
            </p>
          </div>

          <div>
            <h2 className="text-3xl font-bold mb-4">5. Intellectual Property</h2>
            <p className="text-lg leading-relaxed">
              All AI models, analytics logic, and platform branding remain the property of Surgly. You may not copy, modify, or distribute any part of our technology without written permission.
            </p>
          </div>

          <div>
            <h2 className="text-3xl font-bold mb-4">6. Limitation of Liability</h2>
            <p className="text-lg leading-relaxed mb-4">
              Surgly provides optimization insights but cannot guarantee specific advertising outcomes due to platform and audience variability.
            </p>
            <p className="text-lg leading-relaxed">
              We are not liable for any losses incurred from ad performance, platform changes, or external factors beyond our control.
            </p>
          </div>

          <div>
            <h2 className="text-3xl font-bold mb-4">7. Account Security</h2>
            <p className="text-lg leading-relaxed">
              You are responsible for maintaining the security of your account credentials. Notify us immediately if you suspect unauthorized access.
            </p>
          </div>

          <div>
            <h2 className="text-3xl font-bold mb-4">8. Changes to Terms</h2>
            <p className="text-lg leading-relaxed">
              We may update these Terms of Service from time to time. Continued use of Surgly after changes are posted constitutes acceptance of the updated terms.
            </p>
          </div>

          <div>
            <h2 className="text-3xl font-bold mb-4">9. Contact</h2>
            <p className="text-lg leading-relaxed">
              Questions regarding these terms may be directed through the{' '}
              <Link to="/contact" className="text-accent-blue dark:text-blue-400 hover:underline font-semibold">
                Contact Page
              </Link>.
            </p>
          </div>

          <div className="mt-12 pt-8 border-t border-gray-300 dark:border-gray-700">
            <p className="text-lg leading-relaxed italic">
              By creating an account or using Surgly, you acknowledge that you have read, understood, and agree to be bound by these Terms of Service.
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
