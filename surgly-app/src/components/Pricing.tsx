import { Link } from 'react-router-dom';
import { Check, ArrowLeft } from 'lucide-react';

export default function Pricing() {
  const plans = [
    {
      name: 'Starter',
      price: '£29',
      period: '/month',
      description: 'Perfect for small businesses',
      features: [
        'Up to 3 ad accounts',
        'Basic campaign analysis',
        'Email support',
        '10 reports per month',
      ],
    },
    {
      name: 'Professional',
      price: '£99',
      period: '/month',
      description: 'For growing businesses',
      popular: true,
      features: [
        'Up to 10 ad accounts',
        'Advanced AI insights',
        'Priority support',
        'Unlimited reports',
        'White-label reports',
        'API access',
      ],
    },
    {
      name: 'Agency',
      price: '£299',
      period: '/month',
      description: 'For agencies and enterprises',
      features: [
        'Unlimited ad accounts',
        'Premium AI features',
        '24/7 dedicated support',
        'Custom integrations',
        'Team collaboration',
        'Custom branding',
      ],
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <nav className="container mx-auto px-6 py-6 flex items-center justify-between">
        <Link to="/" className="text-3xl font-extrabold text-white">
          SURGLY
        </Link>
        <Link
          to="/"
          className="flex items-center gap-2 text-white hover:text-blue-300 transition"
        >
          <ArrowLeft className="w-5 h-5" />
          Back
        </Link>
      </nav>

      <div className="container mx-auto px-6 py-20">
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold text-white mb-4">
            Choose Your Plan
          </h1>
          <p className="text-xl text-gray-300">
            Start optimizing your Facebook ads today
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`bg-white/10 backdrop-blur-lg border ${
                plan.popular ? 'border-blue-400' : 'border-white/20'
              } rounded-xl p-8 relative`}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <span className="bg-blue-500 text-white px-4 py-1 rounded-full text-sm font-bold">
                    Most Popular
                  </span>
                </div>
              )}

              <h3 className="text-2xl font-bold text-white mb-2">{plan.name}</h3>
              <p className="text-gray-300 mb-6">{plan.description}</p>

              <div className="mb-8">
                <span className="text-5xl font-bold text-white">{plan.price}</span>
                <span className="text-gray-300">{plan.period}</span>
              </div>

              <ul className="space-y-4 mb-8">
                {plan.features.map((feature, index) => (
                  <li key={index} className="flex items-start gap-3">
                    <Check className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-200">{feature}</span>
                  </li>
                ))}
              </ul>

              <Link
                to="/signup"
                className={`block text-center py-3 rounded-lg font-medium transition ${
                  plan.popular
                    ? 'bg-blue-500 text-white hover:bg-blue-600'
                    : 'bg-white/10 text-white hover:bg-white/20'
                }`}
              >
                Get Started
              </Link>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
