import { Link } from 'react-router-dom';
import { ArrowRight, Zap, Shield, TrendingUp, Sun, Moon } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import Logo from './Logo';

export default function LandingPage() {
  const { theme, toggleTheme } = useTheme();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 dark:from-slate-900 dark:via-purple-900 dark:to-slate-900 bg-light-secondary transition-colors duration-300">
      <nav className="container mx-auto px-6 py-6 flex items-center justify-between">
        <Logo variant="header" linkTo="/" className="text-white" />
        <div className="flex items-center gap-4">
          <button
            onClick={toggleTheme}
            className="p-2 rounded-lg hover:bg-white/10 dark:hover:bg-white/10 hover:bg-light-tertiary transition-colors duration-200"
            aria-label="Toggle theme"
          >
            {theme === 'dark' ? (
              <Sun className="w-5 h-5 text-white" />
            ) : (
              <Moon className="w-5 h-5 text-text-light-primary" />
            )}
          </button>
          <Link
            to="/login"
            className="px-6 py-2 text-white hover:text-blue-300 transition font-medium"
          >
            Login
          </Link>
          <Link
            to="/signup"
            className="px-6 py-2 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-lg hover:shadow-lg transition font-medium"
          >
            Get Started
          </Link>
        </div>
      </nav>

      <section className="container mx-auto px-6 py-20 text-center">
        <h1 className="text-6xl font-bold text-white mb-6">
          Optimize Your Facebook Ads
          <br />
          <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
            With AI-Powered Insights
          </span>
        </h1>
        <p className="text-xl text-gray-300 mb-12 max-w-3xl mx-auto">
          Surgly helps you diagnose, optimize, and scale your Facebook ad campaigns with
          intelligent recommendations and comprehensive analytics.
        </p>
        <Link
          to="/signup"
          className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-lg hover:shadow-xl transition font-bold text-lg"
        >
          Start Free Trial
          <ArrowRight className="w-5 h-5" />
        </Link>
      </section>

      <section className="container mx-auto px-6 py-20">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-xl p-8">
            <Zap className="w-12 h-12 text-blue-400 mb-4" />
            <h3 className="text-2xl font-bold text-white mb-4">AI-Powered Diagnosis</h3>
            <p className="text-gray-300">
              Get instant insights into your campaign performance with advanced AI analysis.
            </p>
          </div>

          <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-xl p-8">
            <Shield className="w-12 h-12 text-purple-400 mb-4" />
            <h3 className="text-2xl font-bold text-white mb-4">Budget Protection</h3>
            <p className="text-gray-300">
              Monitor spending in real-time and get alerts before you overspend.
            </p>
          </div>

          <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-xl p-8">
            <TrendingUp className="w-12 h-12 text-pink-400 mb-4" />
            <h3 className="text-2xl font-bold text-white mb-4">Performance Reports</h3>
            <p className="text-gray-300">
              Comprehensive analytics with white-label reports and export options.
            </p>
          </div>
        </div>
      </section>

      <section className="container mx-auto px-6 py-20">
        <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-xl p-12 text-center">
          <h2 className="text-4xl font-bold text-white mb-8">Trusted by Agencies Worldwide</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
            {[
              { label: 'Active Users', value: '10K+' },
              { label: 'Campaigns Analyzed', value: '500K+' },
              { label: 'Money Saved', value: '$5M+' },
              { label: 'Avg ROAS Increase', value: '3.5x' },
            ].map((stat) => (
              <div key={stat.label}>
                <div className="text-4xl font-bold text-blue-400 mb-2">{stat.value}</div>
                <div className="text-gray-300">{stat.label}</div>
              </div>
            ))}
          </div>
          <Link
            to="/pricing"
            className="inline-flex items-center gap-2 px-8 py-4 bg-white text-purple-900 rounded-lg hover:shadow-xl transition font-bold text-lg"
          >
            View Pricing
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>

      <footer className="container mx-auto px-6 py-12 border-t border-white/10">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          <div>
            <Logo variant="footer" linkTo="/" className="mb-4" />
            <p className="text-gray-400">AI-powered Facebook ad optimization platform.</p>
          </div>
          <div>
            <h4 className="font-bold text-white mb-4">Product</h4>
            <div className="space-y-2">
              <Link to="/pricing" className="block text-gray-400 hover:text-white transition">
                Pricing
              </Link>
              <Link to="/about" className="block text-gray-400 hover:text-white transition">
                About
              </Link>
            </div>
          </div>
          <div>
            <h4 className="font-bold text-white mb-4">Support</h4>
            <div className="space-y-2">
              <Link to="/contact" className="block text-gray-400 hover:text-white transition">
                Contact
              </Link>
            </div>
          </div>
          <div>
            <h4 className="font-bold text-white mb-4">Legal</h4>
            <div className="space-y-2">
              <Link to="/privacy" className="block text-gray-400 hover:text-white transition">
                Privacy
              </Link>
              <Link to="/terms" className="block text-gray-400 hover:text-white transition">
                Terms
              </Link>
              <Link to="/refund" className="block text-gray-400 hover:text-white transition">
                Refund Policy
              </Link>
            </div>
          </div>
        </div>
        <div className="text-center text-gray-400 pt-8 border-t border-white/10">
          © 2024 Surgly. All rights reserved.
        </div>
      </footer>
    </div>
  );
}
