import { Link } from 'react-router-dom';
import { ArrowRight, Rocket, Activity, Palette, BarChart3, Sun, Moon, ChevronDown, Play, Brain, Zap, FileCheck, TrendingUp, Shield, Lock, CheckCircle, Award, Users } from 'lucide-react';
import { useState } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import Logo from './Logo';
import Footer from './Footer';
import SEO from './SEO';

export default function LandingPage() {
  const { theme, toggleTheme } = useTheme();
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const toggleFaq = (index: number) => {
    setOpenFaq(openFaq === index ? null : index);
  };

  const faqs = [
    {
      question: 'What is Dr. Surgly?',
      answer: 'Dr. Surgly is an AI-powered advertising platform that analyzes ad campaigns, detects performance issues, and prescribes optimization recommendations to improve ROI.'
    },
    {
      question: 'How does Surgly improve my campaigns?',
      answer: 'It monitors performance, detects inefficiencies, and suggests data-backed fixes before your budget is wasted.'
    },
    {
      question: 'What are your current plans and pricing?',
      answer: 'Free 3-Day Trial (1 Account), Starter £29, Pro £49, Agency £99 per month with 20% annual discount. All plans include full AI features; Agency adds White Label Downloads.'
    },
    {
      question: 'Can I cancel anytime?',
      answer: 'Yes — cancel or upgrade any time from your dashboard.'
    },
    {
      question: 'Is my data secure?',
      answer: 'Yes — Surgly uses OAuth 2.0 and encrypted Supabase storage.'
    },
    {
      question: 'Do I get real-time updates?',
      answer: 'Yes — reports and recommendations refresh dynamically.'
    }
  ];

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
          <Link
            to="/pricing"
            className="text-text-light-primary dark:text-white hover:text-accent-blue dark:hover:text-blue-300 transition font-medium"
          >
            Pricing
          </Link>
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

      <section className="relative container mx-auto px-6 py-24 text-center overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 dark:from-blue-900/10 dark:via-purple-900/10 dark:to-pink-900/10 -z-10" />
        <div className="max-w-5xl mx-auto">
          <h1 className="text-6xl md:text-7xl font-bold text-text-light-primary dark:text-white mb-6 leading-tight">
            AI That Treats Your Ads
            <br />
            <span className="bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 bg-clip-text text-transparent">
              Like a Doctor Treats Patients
            </span>
          </h1>
          <p className="text-xl md:text-2xl text-text-light-secondary dark:text-gray-300 mb-8 max-w-4xl mx-auto leading-relaxed">
            Surgly isn't guesswork — it's real, data-driven intelligence that evaluates, diagnoses, detects, and reports.
          </p>
          <p className="text-lg text-text-light-secondary dark:text-gray-400 mb-12 font-medium">
            Stop wasting budget and start optimizing every click.
          </p>
          <div className="flex items-center justify-center gap-4 flex-wrap">
            <Link
              to="/signup"
              className="inline-flex items-center gap-2 px-10 py-5 bg-accent-blue hover:bg-accent-blueHover dark:bg-gradient-to-r dark:from-blue-500 dark:to-purple-500 text-white rounded-xl hover:shadow-2xl hover:scale-105 transition-all duration-300 font-bold text-lg"
            >
              Start Free Trial
              <ArrowRight className="w-5 h-5" />
            </Link>
            <button
              onClick={() => window.scrollTo({ top: document.getElementById('features')?.offsetTop || 0, behavior: 'smooth' })}
              className="inline-flex items-center gap-2 px-10 py-5 bg-white dark:bg-gray-800 text-text-light-primary dark:text-white border-2 border-gray-300 dark:border-gray-600 rounded-xl hover:shadow-xl hover:scale-105 transition-all duration-300 font-bold text-lg"
            >
              <Play className="w-5 h-5" />
              Watch Demo Video
            </button>
          </div>
        </div>
      </section>

      <section className="container mx-auto px-6 py-20 bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-900 dark:to-gray-800">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-5xl font-bold text-text-light-primary dark:text-white mb-6">
              The Only AI Built to Heal Your Ad Performance
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-10 text-center hover:shadow-2xl transition-all duration-300 hover:-translate-y-2">
              <div className="w-20 h-20 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
                <FileCheck className="w-10 h-10 text-blue-600 dark:text-blue-400" />
              </div>
              <h3 className="text-2xl font-bold text-text-light-primary dark:text-white mb-4">Evaluate</h3>
              <p className="text-text-light-secondary dark:text-gray-300 leading-relaxed">
                Understand campaign health with predictive scoring before you launch.
              </p>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-2xl p-10 text-center hover:shadow-2xl transition-all duration-300 hover:-translate-y-2">
              <div className="w-20 h-20 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
                <Brain className="w-10 h-10 text-green-600 dark:text-green-400" />
              </div>
              <h3 className="text-2xl font-bold text-text-light-primary dark:text-white mb-4">Diagnose</h3>
              <p className="text-text-light-secondary dark:text-gray-300 leading-relaxed">
                Detect problems before they waste spend with AI-powered analysis.
              </p>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-2xl p-10 text-center hover:shadow-2xl transition-all duration-300 hover:-translate-y-2">
              <div className="w-20 h-20 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
                <TrendingUp className="w-10 h-10 text-purple-600 dark:text-purple-400" />
              </div>
              <h3 className="text-2xl font-bold text-text-light-primary dark:text-white mb-4">Treat & Report</h3>
              <p className="text-text-light-secondary dark:text-gray-300 leading-relaxed">
                Prescribe clear data-driven improvements and deliver exportable reports.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="container mx-auto px-6 py-20">
        <div className="text-center mb-16">
          <h2 className="text-5xl font-bold text-text-light-primary dark:text-white mb-4">
            Trusted by Agencies and Marketers Worldwide
          </h2>
          <p className="text-xl text-text-light-secondary dark:text-gray-300">
            See how businesses use Dr. Surgly to diagnose, fix, and scale their ads.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
          <div className="bg-light-secondary dark:bg-white/10 backdrop-blur-lg border border-border-light dark:border-white/20 rounded-xl p-8 hover:shadow-xl transition-all duration-300">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white font-bold text-2xl">
                BB
              </div>
              <div>
                <h4 className="font-bold text-text-light-primary dark:text-white">BrightBoost Media</h4>
                <p className="text-sm text-text-light-secondary dark:text-gray-400">Digital Agency</p>
              </div>
            </div>
            <div className="bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 px-4 py-2 rounded-lg inline-block mb-4 font-bold">
              +42% ROAS in 7 days
            </div>
            <p className="text-text-light-secondary dark:text-gray-300 italic">
              \"Surgly's AI diagnosis caught issues our team missed for weeks.\"
            </p>
          </div>

          <div className="bg-light-secondary dark:bg-white/10 backdrop-blur-lg border border-border-light dark:border-white/20 rounded-xl p-8 hover:shadow-xl transition-all duration-300">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-2xl">
                TL
              </div>
              <div>
                <h4 className="font-bold text-text-light-primary dark:text-white">The Local Agency</h4>
                <p className="text-sm text-text-light-secondary dark:text-gray-400">Marketing Team</p>
              </div>
            </div>
            <div className="bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-4 py-2 rounded-lg inline-block mb-4 font-bold">
              -35% CPA in one week
            </div>
            <p className="text-text-light-secondary dark:text-gray-300 italic">
              \"Cut costs instantly with precise targeting recommendations.\"
            </p>
          </div>

          <div className="bg-light-secondary dark:bg-white/10 backdrop-blur-lg border border-border-light dark:border-white/20 rounded-xl p-8 hover:shadow-xl transition-all duration-300">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-green-600 rounded-full flex items-center justify-center text-white font-bold text-2xl">
                EA
              </div>
              <div>
                <h4 className="font-bold text-text-light-primary dark:text-white">Eco Ad Solutions</h4>
                <p className="text-sm text-text-light-secondary dark:text-gray-400">E-Commerce</p>
              </div>
            </div>
            <div className="bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 px-4 py-2 rounded-lg inline-block mb-4 font-bold">
              3x engagement boost
            </div>
            <p className="text-text-light-secondary dark:text-gray-300 italic">
              \"Creative insights tripled our click-through rate overnight.\"
            </p>
          </div>
        </div>
      </section>

      <section className="container mx-auto px-6 py-20 bg-white dark:bg-gray-900">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-text-light-primary dark:text-white mb-4">
            Integrated with the World's Most Reliable Platforms
          </h2>
        </div>

        <div className="grid grid-cols-3 md:grid-cols-5 gap-8 max-w-5xl mx-auto items-center">
          {['Facebook', 'Google', 'TikTok', 'LinkedIn', 'Microsoft', 'PayPal', 'Stripe', 'Supabase', 'Vercel', 'OpenAI'].map((partner) => (
            <div key={partner} className="flex items-center justify-center p-6 bg-gray-100 dark:bg-gray-800 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition grayscale hover:grayscale-0 opacity-60 hover:opacity-100">
              <span className="font-bold text-sm text-gray-600 dark:text-gray-300">{partner}</span>
            </div>
          ))}
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

      <section className="container mx-auto px-6 py-20 bg-gradient-to-br from-gray-50 to-blue-50 dark:from-gray-900 dark:to-gray-800">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-5xl font-bold text-text-light-primary dark:text-white mb-4">
              How Dr. Surgly Compares to Other AI Ad Tools
            </h2>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 overflow-x-auto shadow-2xl">
            <table className="w-full">
              <thead>
                <tr className="border-b-2 border-gray-200 dark:border-gray-700">
                  <th className="text-left p-4 font-bold text-text-light-primary dark:text-white">Feature</th>
                  <th className="text-center p-4 font-bold text-gray-600 dark:text-gray-400">AdCreative.ai</th>
                  <th className="text-center p-4 font-bold text-gray-600 dark:text-gray-400">Madgicx</th>
                  <th className="text-center p-4 font-bold bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400">Surgly AI Doctor</th>
                </tr>
              </thead>
              <tbody className="text-sm">
                <tr className="border-b border-gray-100 dark:border-gray-700">
                  <td className="p-4 font-medium text-text-light-primary dark:text-white">Predictive Pre-Launch Validation</td>
                  <td className="p-4 text-center text-yellow-600">⚠️ Basic</td>
                  <td className="p-4 text-center text-green-600">✅ Advanced</td>
                  <td className="p-4 text-center bg-blue-50 dark:bg-blue-900/20 text-green-600 font-semibold">✅ Real-Time AI Evaluation</td>
                </tr>
                <tr className="border-b border-gray-100 dark:border-gray-700">
                  <td className="p-4 font-medium text-text-light-primary dark:text-white">Ad Diagnosis & Treatment</td>
                  <td className="p-4 text-center text-red-600">❌</td>
                  <td className="p-4 text-center text-yellow-600">⚠️ Limited</td>
                  <td className="p-4 text-center bg-blue-50 dark:bg-blue-900/20 text-green-600 font-semibold">✅ Full AI Doctor System</td>
                </tr>
                <tr className="border-b border-gray-100 dark:border-gray-700">
                  <td className="p-4 font-medium text-text-light-primary dark:text-white">Multi-Platform Integration</td>
                  <td className="p-4 text-center text-yellow-600">⚠️ Partial</td>
                  <td className="p-4 text-center text-green-600">✅</td>
                  <td className="p-4 text-center bg-blue-50 dark:bg-blue-900/20 text-green-600 font-semibold">✅ Secure API (OAuth 2.0)</td>
                </tr>
                <tr className="border-b border-gray-100 dark:border-gray-700">
                  <td className="p-4 font-medium text-text-light-primary dark:text-white">Exportable Reports</td>
                  <td className="p-4 text-center text-yellow-600">⚠️ PDF Only</td>
                  <td className="p-4 text-center text-green-600">✅ CSV</td>
                  <td className="p-4 text-center bg-blue-50 dark:bg-blue-900/20 text-green-600 font-semibold">✅ PDF / CSV / Excel / White Label</td>
                </tr>
                <tr>
                  <td className="p-4 font-medium text-text-light-primary dark:text-white">Free Trial Available</td>
                  <td className="p-4 text-center text-red-600">❌</td>
                  <td className="p-4 text-center text-yellow-600">⚠️</td>
                  <td className="p-4 text-center bg-blue-50 dark:bg-blue-900/20 text-green-600 font-semibold">✅ 3-Day Trial Included</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="text-center mt-8">
            <Link
              to="/signup"
              className="inline-flex items-center gap-2 px-8 py-4 bg-accent-blue hover:bg-accent-blueHover text-white rounded-xl hover:shadow-xl transition font-bold text-lg"
            >
              Switch to the AI Doctor That Delivers
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </section>

      <section className="container mx-auto px-6 py-20">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-5xl font-bold text-text-light-primary dark:text-white mb-4">
              Real Marketers. Real Results.
            </h2>
            <p className="text-xl text-text-light-secondary dark:text-gray-300">
              What our customers say about Dr. Surgly.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-light-secondary dark:bg-white/10 backdrop-blur-lg border border-border-light dark:border-white/20 rounded-xl p-8 hover:shadow-xl transition-all duration-300">
              <div className="flex items-start gap-4 mb-4">
                <div className="w-16 h-16 bg-gradient-to-br from-pink-400 to-pink-600 rounded-full flex items-center justify-center text-white font-bold text-xl flex-shrink-0">
                  AW
                </div>
                <div>
                  <h4 className="font-bold text-text-light-primary dark:text-white text-lg">Anna W.</h4>
                  <p className="text-sm text-text-light-secondary dark:text-gray-400">Ad Manager</p>
                </div>
              </div>
              <p className="text-text-light-secondary dark:text-gray-300 leading-relaxed italic">
                "Surgly pinpointed our weak ads instantly — we saved £1,200 in the first week."
              </p>
            </div>

            <div className="bg-light-secondary dark:bg-white/10 backdrop-blur-lg border border-border-light dark:border-white/20 rounded-xl p-8 hover:shadow-xl transition-all duration-300">
              <div className="flex items-start gap-4 mb-4">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center text-white font-bold text-xl flex-shrink-0">
                  JM
                </div>
                <div>
                  <h4 className="font-bold text-text-light-primary dark:text-white text-lg">Jordan M.</h4>
                  <p className="text-sm text-text-light-secondary dark:text-gray-400">Creative Director</p>
                </div>
              </div>
              <p className="text-text-light-secondary dark:text-gray-300 leading-relaxed italic">
                "It's like having a marketing doctor on call 24/7."
              </p>
            </div>

            <div className="bg-light-secondary dark:bg-white/10 backdrop-blur-lg border border-border-light dark:border-white/20 rounded-xl p-8 hover:shadow-xl transition-all duration-300">
              <div className="flex items-start gap-4 mb-4">
                <div className="w-16 h-16 bg-gradient-to-br from-purple-400 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-xl flex-shrink-0">
                  ST
                </div>
                <div>
                  <h4 className="font-bold text-text-light-primary dark:text-white text-lg">Sara T.</h4>
                  <p className="text-sm text-text-light-secondary dark:text-gray-400">Agency Owner</p>
                </div>
              </div>
              <p className="text-text-light-secondary dark:text-gray-300 leading-relaxed italic">
                "The Reports & Analytics feature won us clients with white-label exports."
              </p>
            </div>

            <div className="bg-light-secondary dark:bg-white/10 backdrop-blur-lg border border-border-light dark:border-white/20 rounded-xl p-8 hover:shadow-xl transition-all duration-300">
              <div className="flex items-start gap-4 mb-4">
                <div className="w-16 h-16 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center text-white font-bold text-xl flex-shrink-0">
                  LK
                </div>
                <div>
                  <h4 className="font-bold text-text-light-primary dark:text-white text-lg">Liam K.</h4>
                  <p className="text-sm text-text-light-secondary dark:text-gray-400">E-Commerce Founder</p>
                </div>
              </div>
              <p className="text-text-light-secondary dark:text-gray-300 leading-relaxed italic">
                "Finally an AI that actually understands ad data and ROI."
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="container mx-auto px-6 py-16 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-gray-900 dark:to-gray-800">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-text-light-primary dark:text-white mb-8">
              Used by 20+ Growing Brands
            </h2>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6">
            {['PixelWave', 'GreenFlow', 'AdNova', 'Marketingly', 'LeadEdge', 'VisionIQ', 'Growthify', 'BrandLift', 'MetricMind', 'AdPulse', 'SparkAds', 'FlowMarket', 'GrowthHub', 'AdFlow', 'DataDrive', 'LeadGen Pro', 'AdSync', 'MarketPro', 'AdWave', 'GrowthEdge'].map((company) => (
              <div key={company} className="flex items-center justify-center p-4 bg-white dark:bg-gray-800 rounded-lg hover:shadow-lg transition grayscale hover:grayscale-0 opacity-70 hover:opacity-100">
                <span className="font-semibold text-xs text-gray-600 dark:text-gray-300">{company}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="container mx-auto px-6 py-16">
        <div className="max-w-5xl mx-auto">
          <div className="flex flex-wrap items-center justify-center gap-8 mb-8">
            <div className="flex items-center gap-3 px-6 py-3 bg-light-secondary dark:bg-white/10 rounded-full">
              <Lock className="w-5 h-5 text-green-600 dark:text-green-400" />
              <span className="font-semibold text-sm text-text-light-primary dark:text-white">SSL Encrypted</span>
            </div>
            <div className="flex items-center gap-3 px-6 py-3 bg-light-secondary dark:bg-white/10 rounded-full">
              <Shield className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              <span className="font-semibold text-sm text-text-light-primary dark:text-white">GDPR Compliant</span>
            </div>
            <div className="flex items-center gap-3 px-6 py-3 bg-light-secondary dark:bg-white/10 rounded-full">
              <CheckCircle className="w-5 h-5 text-purple-600 dark:text-purple-400" />
              <span className="font-semibold text-sm text-text-light-primary dark:text-white">Verified by Stripe</span>
            </div>
            <div className="flex items-center gap-3 px-6 py-3 bg-light-secondary dark:bg-white/10 rounded-full">
              <Award className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
              <span className="font-semibold text-sm text-text-light-primary dark:text-white">AI Accuracy Reports</span>
            </div>
            <div className="flex items-center gap-3 px-6 py-3 bg-light-secondary dark:bg-white/10 rounded-full">
              <Users className="w-5 h-5 text-pink-600 dark:text-pink-400" />
              <span className="font-semibold text-sm text-text-light-primary dark:text-white">24/7 Support</span>
            </div>
          </div>
          <p className="text-center text-sm text-text-light-secondary dark:text-gray-400">
            Your data and results are protected by enterprise-grade security and transparency.
          </p>
        </div>
      </section>

      <section className="relative py-24 bg-gradient-to-br from-blue-600 via-blue-700 to-purple-800 overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{ backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(255,255,255,.05) 10px, rgba(255,255,255,.05) 20px)' }} />
        </div>
        <div className="container mx-auto px-6 text-center relative z-10">
          <h2 className="text-5xl md:text-6xl font-bold text-white mb-6">
            Ready to Heal Your Ad Performance?
          </h2>
          <p className="text-xl md:text-2xl text-blue-100 mb-12 max-w-3xl mx-auto">
            Join thousands of advertisers already boosting ROI with Dr. Surgly.
          </p>
          <div className="flex items-center justify-center gap-4 flex-wrap">
            <Link
              to="/signup"
              className="inline-flex items-center gap-2 px-10 py-5 bg-white text-blue-700 rounded-xl hover:shadow-2xl hover:scale-105 transition-all duration-300 font-bold text-lg"
            >
              Start Free Trial
              <ArrowRight className="w-5 h-5" />
            </Link>
            <Link
              to="/pricing"
              className="inline-flex items-center gap-2 px-10 py-5 bg-blue-800 hover:bg-blue-900 text-white border-2 border-white/30 rounded-xl hover:shadow-xl hover:scale-105 transition-all duration-300 font-bold text-lg"
            >
              See Pricing Plans
            </Link>
          </div>
        </div>
      </section>

      <section id="faq" className="container mx-auto px-6 py-20">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-text-light-primary dark:text-white mb-4">
              Frequently Asked Questions
            </h2>
            <p className="text-xl text-text-light-secondary dark:text-gray-300">
              Got questions? Dr. Surgly has answers.
            </p>
          </div>

          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <div
                key={index}
                className="bg-light-secondary dark:bg-white/10 backdrop-blur-lg border border-border-light dark:border-white/20 rounded-xl overflow-hidden transition-all duration-300"
              >
                <button
                  onClick={() => toggleFaq(index)}
                  className="w-full flex items-center justify-between p-6 text-left hover:bg-light-tertiary dark:hover:bg-white/5 transition"
                >
                  <span className="text-lg font-semibold text-text-light-primary dark:text-white">
                    {faq.question}
                  </span>
                  <ChevronDown
                    className={`w-5 h-5 text-text-light-secondary dark:text-gray-400 transition-transform duration-300 ${
                      openFaq === index ? 'transform rotate-180' : ''
                    }`}
                  />
                </button>
                <div
                  className={`overflow-hidden transition-all duration-300 ${
                    openFaq === index ? 'max-h-48' : 'max-h-0'
                  }`}
                >
                  <div className="px-6 pb-6 text-text-light-secondary dark:text-gray-300">
                    {faq.answer}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </div>
    </>
  );
}
