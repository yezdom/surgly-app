import { Link } from 'react-router-dom';
import { ArrowRight, Rocket, Activity, Palette, BarChart3, Sun, Moon } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import Logo from './Logo';
import Footer from './Footer';
import SEO from './SEO';

export default function LandingPage() {
  const { theme, toggleTheme } = useTheme();

  return (
    <>
      <SEO
        title="Surgly — AI Ads Doctor for Facebook & Beyond"
        description="Stop wasting money on underperforming ads. Let Dr. Surgly analyze, treat, and scale your campaigns automatically."
        canonical="https://surgly.app"
      />
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
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-text-light-primary dark:text-white mb-4">
            Smarter Ads Through AI-Driven Insights
          </h2>
          <p className="text-xl text-text-light-secondary dark:text-gray-300 max-w-3xl mx-auto">
            Dr. Surgly automatically analyzes ad data, detects performance issues, and prescribes optimizations that improve ROI.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-light-secondary dark:bg-white/10 backdrop-blur-lg border border-border-light dark:border-white/20 rounded-xl p-6 hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
            <Rocket className="w-12 h-12 text-blue-500 dark:text-blue-400 mb-4" />
            <h3 className="text-xl font-bold text-text-light-primary dark:text-white mb-3">Pre-Launch Validator</h3>
            <p className="text-sm text-text-light-secondary dark:text-gray-300">
              Checks the health of your ads account and evaluates ad creatives before they go live to predict engagement and conversion potential.
            </p>
          </div>

          <div className="bg-light-secondary dark:bg-white/10 backdrop-blur-lg border border-border-light dark:border-white/20 rounded-xl p-6 hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
            <Activity className="w-12 h-12 text-green-500 dark:text-green-400 mb-4" />
            <h3 className="text-xl font-bold text-text-light-primary dark:text-white mb-3">Ad Doctor</h3>
            <p className="text-sm text-text-light-secondary dark:text-gray-300">
              Diagnoses campaign inefficiencies, prescribes corrective actions using AI insights, and continuously monitors performance.
            </p>
          </div>

          <div className="bg-light-secondary dark:bg-white/10 backdrop-blur-lg border border-border-light dark:border-white/20 rounded-xl p-6 hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
            <Palette className="w-12 h-12 text-purple-500 dark:text-purple-400 mb-4" />
            <h3 className="text-xl font-bold text-text-light-primary dark:text-white mb-3">Creative Insights</h3>
            <p className="text-sm text-text-light-secondary dark:text-gray-300">
              Detects fatigue, audience mismatch, and creative design patterns that underperform. Helps you build visuals that truly convert.
            </p>
          </div>

          <div className="bg-light-secondary dark:bg-white/10 backdrop-blur-lg border border-border-light dark:border-white/20 rounded-xl p-6 hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
            <BarChart3 className="w-12 h-12 text-pink-500 dark:text-pink-400 mb-4" />
            <h3 className="text-xl font-bold text-text-light-primary dark:text-white mb-3">Reports & Analytics</h3>
            <p className="text-sm text-text-light-secondary dark:text-gray-300">
              Comprehensive campaign performance analysis with export options (PDF, CSV, Excel). Includes White Label reports for agencies in Pro & Enterprise plans.
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
    </>
  );
}
