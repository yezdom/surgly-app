import { Link } from 'react-router-dom';
import { ArrowLeft, Brain, Target, TrendingUp } from 'lucide-react';
import Footer from '../components/Footer';
import Logo from '../components/Logo';

export default function About() {
  return (
    <div className="min-h-screen flex flex-col bg-white dark:bg-gradient-to-br dark:from-slate-900 dark:via-purple-900 dark:to-slate-900 transition-colors duration-500">
      <nav className="container mx-auto px-6 py-6 border-b border-gray-200 dark:border-transparent">
        <div className="flex items-center justify-between">
          <Logo variant="header" linkTo="/" />
          <Link
            to="/"
            className="flex items-center gap-2 text-text-light-primary dark:text-white hover:text-accent-blue dark:hover:text-blue-300 transition"
          >
            <ArrowLeft className="w-5 h-5" />
            Back to Home
          </Link>
        </div>
      </nav>

      <div className="container mx-auto px-6 py-20 max-w-5xl flex-1">
        <h1 className="text-6xl font-bold text-text-light-primary dark:text-white mb-4">
          Meet Dr. Surgly — The AI Doctor for Your Ads
        </h1>
        <p className="text-2xl text-text-light-secondary dark:text-gray-300 mb-16">
          Intelligent Ad Optimization for Every Marketer.
        </p>

        <div className="bg-light-secondary dark:bg-white/10 backdrop-blur-lg border border-border-light dark:border-white/20 rounded-2xl p-10 text-text-light-primary dark:text-white space-y-8">
          <p className="text-lg leading-relaxed">
            Surgly was built to solve a simple but expensive problem — <strong>underperforming ads</strong>.
          </p>

          <p className="text-lg leading-relaxed">
            Instead of guessing what's wrong, Dr. Surgly uses AI-powered diagnosis to evaluate, detect, and treat campaign issues before they drain your budget.
          </p>

          <p className="text-lg leading-relaxed">
            Our mission is to make advertising smarter, simpler, and more profitable. We combine machine learning with real campaign data to deliver clear, actionable insights that help you fix, improve, and scale.
          </p>

          <p className="text-lg leading-relaxed">
            Surgly is not just another analytics tool — it's your <strong>AI-powered marketing doctor</strong>, available 24/7 to monitor, predict, and optimize your ad performance.
          </p>

          <div className="bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-xl p-8 mt-12">
            <h2 className="text-3xl font-bold mb-6">Founded by Data Scientists & Digital Strategists</h2>
            <p className="text-lg leading-relaxed mb-4">
              Surgly helps agencies and advertisers around the world turn ad data into growth.
            </p>
            <p className="text-lg leading-relaxed">
              We believe in transparency, precision, and continuous improvement. Every recommendation is backed by data. Every insight is actionable. Every result is measurable.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
            <div className="text-center p-6 bg-white dark:bg-gray-800 rounded-xl">
              <Brain className="w-12 h-12 text-blue-600 dark:text-blue-400 mx-auto mb-4" />
              <h3 className="text-xl font-bold mb-2">AI-Powered</h3>
              <p className="text-sm text-text-light-secondary dark:text-gray-400">
                Advanced machine learning models analyze your campaigns in real-time
              </p>
            </div>

            <div className="text-center p-6 bg-white dark:bg-gray-800 rounded-xl">
              <Target className="w-12 h-12 text-green-600 dark:text-green-400 mx-auto mb-4" />
              <h3 className="text-xl font-bold mb-2">Data-Driven</h3>
              <p className="text-sm text-text-light-secondary dark:text-gray-400">
                Every recommendation is backed by real campaign performance data
              </p>
            </div>

            <div className="text-center p-6 bg-white dark:bg-gray-800 rounded-xl">
              <TrendingUp className="w-12 h-12 text-purple-600 dark:text-purple-400 mx-auto mb-4" />
              <h3 className="text-xl font-bold mb-2">Results-Focused</h3>
              <p className="text-sm text-text-light-secondary dark:text-gray-400">
                Built for measurable growth and sustainable ad performance improvement
              </p>
            </div>
          </div>

          <div className="mt-16 text-center">
            <h2 className="text-4xl font-bold mb-6">Our Philosophy</h2>
            <p className="text-2xl text-blue-600 dark:text-blue-400 font-semibold">
              Better Data → Better Diagnosis → Better Results
            </p>
          </div>

          <div className="mt-16 text-center p-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl text-white">
            <p className="text-3xl font-bold mb-2">Powered by AI. Driven by Data. Built for Results.</p>
            <Link
              to="/signup"
              className="inline-block mt-6 px-8 py-3 bg-white text-blue-700 rounded-lg font-bold hover:shadow-xl transition"
            >
              Start Your Free Trial
            </Link>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
