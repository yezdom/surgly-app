import { Link } from 'react-router-dom';
import { ArrowRight, Zap, Shield, TrendingUp, Sun, Moon } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import Logo from './Logo';
import Footer from './Footer';

export default function LandingPage() {
  const { theme, toggleTheme } = useTheme();

  return (
    <div className="min-h-screen bg-white dark:bg-gradient-to-br dark:from-slate-900 dark:via-purple-900 dark:to-slate-900 transition-colors duration-500">
      <nav className="container mx-auto px-6 py-6 flex items-center justify-between border-b border-border-light dark:border-transparent bg-white dark:bg-transparent">
        <Logo variant="header" linkTo="/" />
        <div className="flex items-center gap-4">
          <button
            onClick={toggleTheme}
            className="p-2 rounded-lg hover:bg-light-tertiary dark:hover:bg-white/10 transition-colors duration-200"
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
            className="px-6 py-2 text-text-light-primary dark:text-white hover:text-accent-blue dark:hover:text-blue-300 transition font-medium"
          >
            Login
          </Link>
          <Link
            to="/signup"
            className="px-6 py-2 bg-accent-blue hover:bg-accent-blueHover dark:bg-gradient-to-r dark:from-blue-500 dark:to-purple-500 text-white rounded-lg hover:shadow-lg transition font-medium"
          >
            Get Started
          </Link>
        </div>
      </nav>

      <section className="container mx-auto px-6 py-20 text-center">
        <h1 className="text-6xl font-bold text-text-light-primary dark:text-white mb-6">
          Optimize Your Facebook Ads
          <br />
          <span className="bg-gradient-to-r from-blue-500 to-purple-500 bg-clip-text text-transparent">
            With AI-Powered Insights
          </span>
        </h1>
        <p className="text-xl text-text-light-secondary dark:text-gray-300 mb-12 max-w-3xl mx-auto">
          Surgly helps you diagnose, optimize, and scale your Facebook ad campaigns with
          intelligent recommendations and comprehensive analytics.
        </p>
        <Link
          to="/signup"
          className="inline-flex items-center gap-2 px-8 py-4 bg-accent-blue hover:bg-accent-blueHover dark:bg-gradient-to-r dark:from-blue-500 dark:to-purple-500 text-white rounded-lg hover:shadow-xl transition font-bold text-lg"
        >
          Start Free Trial
          <ArrowRight className="w-5 h-5" />
        </Link>
      </section>

      <section className="container mx-auto px-6 py-20">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-light-secondary dark:bg-white/10 backdrop-blur-lg border border-border-light dark:border-white/20 rounded-xl p-8 hover:shadow-lg transition">
            <Zap className="w-12 h-12 text-blue-500 dark:text-blue-400 mb-4" />
            <h3 className="text-2xl font-bold text-text-light-primary dark:text-white mb-4">AI-Powered Diagnosis</h3>
            <p className="text-text-light-secondary dark:text-gray-300">
              Get instant insights into your campaign performance with advanced AI analysis.
            </p>
          </div>

          <div className="bg-light-secondary dark:bg-white/10 backdrop-blur-lg border border-border-light dark:border-white/20 rounded-xl p-8 hover:shadow-lg transition">
            <Shield className="w-12 h-12 text-purple-500 dark:text-purple-400 mb-4" />
            <h3 className="text-2xl font-bold text-text-light-primary dark:text-white mb-4">Budget Protection</h3>
            <p className="text-text-light-secondary dark:text-gray-300">
              Monitor spending in real-time and get alerts before you overspend.
            </p>
          </div>

          <div className="bg-light-secondary dark:bg-white/10 backdrop-blur-lg border border-border-light dark:border-white/20 rounded-xl p-8 hover:shadow-lg transition">
            <TrendingUp className="w-12 h-12 text-pink-500 dark:text-pink-400 mb-4" />
            <h3 className="text-2xl font-bold text-text-light-primary dark:text-white mb-4">Performance Reports</h3>
            <p className="text-text-light-secondary dark:text-gray-300">
              Comprehensive analytics with white-label reports and export options.
            </p>
          </div>
        </div>
      </section>

      <section className="container mx-auto px-6 py-20">
        <div className="bg-light-secondary dark:bg-white/10 backdrop-blur-lg border border-border-light dark:border-white/20 rounded-xl p-12 text-center">
          <h2 className="text-4xl font-bold text-text-light-primary dark:text-white mb-8">Trusted by Agencies Worldwide</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
            {[
              { label: 'Active Users', value: '10K+' },
              { label: 'Campaigns Analyzed', value: '500K+' },
              { label: 'Money Saved', value: '$5M+' },
              { label: 'Avg ROAS Increase', value: '3.5x' },
            ].map((stat) => (
              <div key={stat.label}>
                <div className="text-4xl font-bold text-blue-500 dark:text-blue-400 mb-2">{stat.value}</div>
                <div className="text-text-light-secondary dark:text-gray-300">{stat.label}</div>
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

      <Footer />
    </div>
  );
}
