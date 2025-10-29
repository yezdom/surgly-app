import { Link } from 'react-router-dom';
import { Check, ArrowLeft, PartyPopper } from 'lucide-react';
import { useState, useEffect } from 'react';
import Logo from './Logo';
import Footer from './Footer';
import { useTheme } from '../contexts/ThemeContext';
import SEO from './SEO';

export default function Pricing() {
  const { theme } = useTheme();
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>(() => {
    const saved = localStorage.getItem('billingCycle');
    return (saved as 'monthly' | 'annual') || 'annual';
  });

  useEffect(() => {
    localStorage.setItem('billingCycle', billingCycle);
  }, [billingCycle]);

  const plans = [
    {
      name: 'Free Account',
      monthlyPrice: 0,
      comparePrice: 0,
      description: '3-Day Trial (1 Account)',
      accounts: '1 Ad Account',
      features: [
        'Pre-Launch Validator',
        'Ad Doctor',
        'Creative Insights',
        'Reports & Analytics',
      ],
      cta: 'Start Free',
      ctaColor: 'bg-gray-500 hover:bg-gray-600',
      badge: null,
      badgeColor: 'bg-gray-500',
      borderColor: 'border-gray-300 dark:border-gray-600',
    },
    {
      name: 'Starter',
      monthlyPrice: 29,
      comparePrice: 58,
      description: 'All features included',
      accounts: '3 Accounts',
      features: [
        'All features included',
      ],
      cta: 'Upgrade to Starter',
      ctaColor: 'bg-green-600 hover:bg-green-700',
      borderColor: 'border-border-light dark:border-border-dark',
    },
    {
      name: 'Pro',
      monthlyPrice: 49,
      comparePrice: 98,
      description: 'All features included',
      accounts: '5 Accounts',
      features: [
        'All features included',
      ],
      cta: 'Get Pro',
      ctaColor: 'bg-accent-blue hover:bg-accent-blueHover',
      badge: 'Most Popular',
      badgeColor: 'bg-accent-blue',
      popular: true,
      borderColor: 'border-blue-400',
      bgHighlight: 'bg-blue-50 dark:bg-blue-900/10',
    },
    {
      name: 'Agency',
      monthlyPrice: 99,
      comparePrice: 198,
      description: 'All features included + White Label Downloads',
      accounts: '10 Accounts',
      features: [
        'All features included',
        'White Label Downloads',
      ],
      cta: 'Upgrade to Agency',
      ctaColor: 'bg-gray-900 hover:bg-black dark:bg-white dark:text-gray-900 dark:hover:bg-gray-100',
      borderColor: 'border-4 border-transparent bg-gradient-to-r from-blue-500 to-purple-500 bg-clip-border',
    },
  ];

  const calculateAnnualPrice = (monthlyPrice: number) => {
    return (monthlyPrice * 12 * 0.8).toFixed(2);
  };

  const getDisplayPrice = (monthlyPrice: number) => {
    if (monthlyPrice === 0) return '£0';
    if (billingCycle === 'annual') {
      return `£${monthlyPrice}`;
    }
    return `£${monthlyPrice}`;
  };

  return (
    <>
      <SEO
        title="Pricing | Flexible Plans for Every Marketer"
        description="Start free and grow with Surgly. Choose Free, Pro, or Enterprise plans designed for advertisers and agencies."
        canonical="https://surgly.app/pricing"
      />
      <div className="min-h-screen flex flex-col bg-white dark:bg-gradient-to-br dark:from-slate-900 dark:via-purple-900 dark:to-slate-900 transition-colors duration-500">
      <nav className="container mx-auto px-6 py-6 flex items-center justify-between border-b border-border-light dark:border-transparent">
        <Logo variant="header" linkTo="/" />
        <Link
          to="/"
          className="flex items-center gap-2 text-text-light-primary dark:text-white hover:text-accent-blue dark:hover:text-blue-300 transition"
        >
          <ArrowLeft className="w-5 h-5" />
          Back to Home
        </Link>
      </nav>

      <div className="container mx-auto px-6 py-12 flex-1">
        <div className="mb-12 bg-accent-blue text-white py-4 px-6 rounded-lg text-center font-bold text-lg flex items-center justify-center gap-2 max-w-4xl mx-auto shadow-lg">
          <PartyPopper className="w-6 h-6" />
          🎉 50% OFF! Introductory Offer – Limited Time Only
        </div>

        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold text-text-light-primary dark:text-white mb-4">
            Simple, Transparent Pricing for Every Marketer
          </h1>
          <p className="text-xl text-text-light-secondary dark:text-gray-300 mb-8">
            Whether you're running one ad or a hundred, Dr. Surgly scales with you.
          </p>

          <div className="flex items-center justify-center gap-4 mb-4">
            <span className={`text-sm font-medium ${billingCycle === 'monthly' ? 'text-text-light-primary dark:text-white' : 'text-text-light-secondary dark:text-gray-400'}`}>
              Monthly
            </span>
            <button
              onClick={() => setBillingCycle(billingCycle === 'monthly' ? 'annual' : 'monthly')}
              className={`relative w-14 h-7 rounded-full transition-colors ${
                billingCycle === 'annual' ? 'bg-accent-blue' : 'bg-gray-300 dark:bg-gray-600'
              }`}
              aria-label="Toggle billing cycle"
            >
              <span
                className={`absolute top-1 left-1 w-5 h-5 bg-white rounded-full transition-transform ${
                  billingCycle === 'annual' ? 'transform translate-x-7' : ''
                }`}
              />
            </button>
            <span className={`text-sm font-medium ${billingCycle === 'annual' ? 'text-text-light-primary dark:text-white' : 'text-text-light-secondary dark:text-gray-400'}`}>
              Annual
              <span className="ml-2 text-green-600 dark:text-green-400 font-bold">Save 20%</span>
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto mb-12">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`${plan.bgHighlight || 'bg-light-secondary dark:bg-white/10'} backdrop-blur-lg border ${plan.borderColor} rounded-xl p-6 relative transition-all duration-300 hover:shadow-xl hover:-translate-y-1 ${plan.popular ? 'scale-105' : ''}`}
            >
              {plan.badge && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <span className={`${plan.badgeColor} text-white px-4 py-1 rounded-full text-xs font-bold shadow-md`}>
                    {plan.badge}
                  </span>
                </div>
              )}

              <div className="mb-4">
                <h3 className="text-2xl font-bold text-text-light-primary dark:text-white mb-2">{plan.name}</h3>
                <p className="text-sm text-text-light-secondary dark:text-gray-300 mb-2">{plan.description}</p>
                <p className="text-xs text-text-light-secondary dark:text-gray-400">{plan.accounts}</p>
              </div>

              <div className="mb-6">
                {plan.comparePrice > 0 && (
                  <div className="text-red-500 line-through text-lg font-semibold">
                    £{plan.comparePrice}
                  </div>
                )}
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-bold text-text-light-primary dark:text-white">
                    {getDisplayPrice(plan.monthlyPrice)}
                  </span>
                  <span className="text-text-light-secondary dark:text-gray-300">/month</span>
                </div>
                {billingCycle === 'annual' && plan.monthlyPrice > 0 && (
                  <p className="text-sm text-green-600 dark:text-green-400 mt-1">
                    Billed annually at £{calculateAnnualPrice(plan.monthlyPrice)} (20% off)
                  </p>
                )}
              </div>

              <ul className="space-y-3 mb-6 min-h-[180px]">
                {plan.features.map((feature, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <Check className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                    <span className="text-sm text-text-light-primary dark:text-gray-200">{feature}</span>
                  </li>
                ))}
              </ul>

              <Link
                to={plan.cta === 'Contact Sales' ? '/contact' : '/signup'}
                className={`block text-center py-3 rounded-lg font-medium transition ${plan.ctaColor} text-white shadow-md`}
              >
                {plan.cta}
              </Link>

              <p className="text-xs text-center text-text-light-secondary dark:text-gray-400 mt-3">
                No contracts. Cancel anytime.
              </p>
            </div>
          ))}
        </div>

        <p className="text-center text-sm text-text-light-secondary dark:text-gray-400 max-w-3xl mx-auto">
          *All prices in GBP. 20% annual discount automatically applied. Introductory offer valid for a limited time.
        </p>
      </div>

      <Footer />
      </div>
    </>
  );
}
