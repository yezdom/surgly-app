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
        <div className="flex items-center gap-6">
          <a
            href="#features"
            className="text-text-light-primary dark:text-white hover:text-accent-blue dark:hover:text-blue-300 transition font-medium"
          >
            Features
          </a>
          <a
            href="#pricing"
            className="text-text-light-primary dark:text-white hover:text-accent-blue dark:hover:text-blue-300 transition font-medium"
          >
            Pricing
          </a>
          <Link
            to="/contact"
            className="text-text-light-primary dark:text-white hover:text-accent-blue dark:hover:text-blue-300 transition font-medium"
          >
            Contact
          </Link>
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
            to="/signup"
            className="px-6 py-2 bg-accent-blue hover:bg-accent-blueHover dark:bg-gradient-to-r dark:from-blue-500 dark:to-purple-500 text-white rounded-lg hover:shadow-lg transition font-medium"
          >
            Get Started
          </Link>
        </div>
      </nav>

      <section className="container mx-auto px-6 py-20 text-center">
        <h1 className="text-6xl font-bold text-text-light-primary dark:text-white mb-6">
          Your Personal AI Ads Doctor
          <br />
          <span className="bg-gradient-to-r from-blue-500 to-purple-500 bg-clip-text text-transparent">
            for Facebook & Beyond
          </span>
        </h1>
        <p className="text-xl text-text-light-secondary dark:text-gray-300 mb-12 max-w-3xl mx-auto">
          Stop wasting money on underperforming ads. Let Dr. Surgly diagnose, treat, and scale your campaigns automatically.
        </p>
        <div className="flex items-center justify-center gap-4">
          <a
            href="#features"
            className="inline-flex items-center gap-2 px-8 py-4 bg-white dark:bg-gray-800 text-text-light-primary dark:text-white border-2 border-accent-blue rounded-lg hover:shadow-xl transition font-bold text-lg"
          >
            Try Free Demo
          </a>
          <Link
            to="/signup"
            className="inline-flex items-center gap-2 px-8 py-4 bg-accent-blue hover:bg-accent-blueHover dark:bg-gradient-to-r dark:from-blue-500 dark:to-purple-500 text-white rounded-lg hover:shadow-xl transition font-bold text-lg"
          >
            Get Started
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>

      <section id="features" className="container mx-auto px-6 py-20">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-text-light-primary dark:text-white mb-4">
            Smarter Ads Through AI-Driven Insights
          </h2>
          <p className="text-xl text-text-light-secondary dark:text-gray-300 max-w-3xl mx-auto">
            Dr. Surgly automatically analyzes ad data, detects performance issues, and prescribes optimizations that improve ROI.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
          <div className="bg-light-secondary dark:bg-white/10 backdrop-blur-lg border border-border-light dark:border-white/20 rounded-xl p-8 hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
            <Rocket className="w-14 h-14 text-blue-500 dark:text-blue-400 mb-6" />
            <h3 className="text-2xl font-bold text-text-light-primary dark:text-white mb-4">Pre-Launch Validator</h3>
            <p className="text-base text-text-light-secondary dark:text-gray-300">
              Evaluate ad creatives before they go live to predict engagement and conversion potential.
            </p>
          </div>

          <div className="bg-light-secondary dark:bg-white/10 backdrop-blur-lg border border-border-light dark:border-white/20 rounded-xl p-8 hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
            <Activity className="w-14 h-14 text-green-500 dark:text-green-400 mb-6" />
            <h3 className="text-2xl font-bold text-text-light-primary dark:text-white mb-4">Ad Doctor</h3>
            <p className="text-base text-text-light-secondary dark:text-gray-300">
              Diagnose campaign inefficiencies and prescribe corrective actions using AI insights.
            </p>
          </div>

          <div className="bg-light-secondary dark:bg-white/10 backdrop-blur-lg border border-border-light dark:border-white/20 rounded-xl p-8 hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
            <Palette className="w-14 h-14 text-purple-500 dark:text-purple-400 mb-6" />
            <h3 className="text-2xl font-bold text-text-light-primary dark:text-white mb-4">Creative Insights</h3>
            <p className="text-base text-text-light-secondary dark:text-gray-300">
              Detect fatigue, audience mismatch, and creative design patterns that underperform.
            </p>
          </div>

          <div className="bg-light-secondary dark:bg-white/10 backdrop-blur-lg border border-border-light dark:border-white/20 rounded-xl p-8 hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
            <BarChart3 className="w-14 h-14 text-pink-500 dark:text-pink-400 mb-6" />
            <h3 className="text-2xl font-bold text-text-light-primary dark:text-white mb-4">Reports & Analytics</h3>
            <p className="text-base text-text-light-secondary dark:text-gray-300">
              Comprehensive campaign performance analysis with export options (PDF, CSV, Excel). Includes White Label reports for agencies in Pro & Agency plans.
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
