import { Link } from 'react-router-dom';
import Logo from './Logo';
import { Twitter, Linkedin, Instagram } from 'lucide-react';
import { useState } from 'react';

export default function Footer() {
  const [email, setEmail] = useState('');
  const [subscribeStatus, setSubscribeStatus] = useState<'idle' | 'success' | 'error'>('idle');

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !email.includes('@')) {
      setSubscribeStatus('error');
      return;
    }

    setSubscribeStatus('success');
    setEmail('');

    setTimeout(() => {
      setSubscribeStatus('idle');
    }, 3000);
  };

  const socialLinks = [
    { icon: Linkedin, href: 'https://linkedin.com', label: 'LinkedIn' },
    { icon: Twitter, href: 'https://twitter.com', label: 'Twitter' },
    { icon: Instagram, href: 'https://instagram.com', label: 'Instagram' },
  ];

  return (
    <footer className="bg-[#0B0C10] border-t border-gray-800 mt-auto">
      <div className="container mx-auto px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          <div>
            <Logo variant="footer" linkTo="/" className="mb-4" />
            <p className="text-gray-400 text-sm leading-relaxed">
              AI Ads Doctor for Smarter Facebook Marketing
            </p>
          </div>

          <div>
            <h4 className="font-bold text-white mb-4">Quick Links</h4>
            <div className="space-y-2">
              <Link to="/" className="block text-gray-400 hover:text-white transition text-sm">
                Home
              </Link>
              <a href="/#features" className="block text-gray-400 hover:text-white transition text-sm">
                Features
              </a>
              <a href="/#pricing" className="block text-gray-400 hover:text-white transition text-sm">
                Pricing
              </a>
              <Link to="/about" className="block text-gray-400 hover:text-white transition text-sm">
                About
              </Link>
              <a href="/#faq" className="block text-gray-400 hover:text-white transition text-sm">
                FAQs
              </a>
            </div>
          </div>

          <div>
            <h4 className="font-bold text-white mb-4">Legal</h4>
            <div className="space-y-2">
              <Link to="/contact" className="block text-gray-400 hover:text-white transition text-sm">
                Contact
              </Link>
              <Link to="/privacy" className="block text-gray-400 hover:text-white transition text-sm">
                Privacy Policy
              </Link>
              <a href="https://surgly.app/data-deletion-instructions" className="block text-gray-400 hover:text-white transition text-sm">
                Data Deletion
              </a>
              <Link to="/terms" className="block text-gray-400 hover:text-white transition text-sm">
                Terms of Service
              </Link>
            </div>
          </div>

          <div>
            <h4 className="font-bold text-white mb-4">Stay Updated</h4>
            <p className="text-gray-400 text-sm mb-3">
              Get new features and insights delivered to your inbox
            </p>
            <form onSubmit={handleSubscribe} className="space-y-2">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500 transition"
              />
              <button
                type="submit"
                className="w-full px-4 py-2 bg-accent-blue hover:bg-accent-blueHover text-white rounded-lg text-sm font-medium transition"
              >
                Subscribe
              </button>
              {subscribeStatus === 'success' && (
                <p className="text-green-400 text-xs">Thanks for subscribing!</p>
              )}
              {subscribeStatus === 'error' && (
                <p className="text-red-400 text-xs">Please enter a valid email</p>
              )}
            </form>
          </div>
        </div>

        <div className="pt-8 border-t border-gray-800 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-gray-500 text-sm">
            © {new Date().getFullYear()} Surgly. All rights reserved.
          </p>

          <div className="flex items-center gap-4">
            {socialLinks.map((social) => (
              <a
                key={social.label}
                href={social.href}
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-400 hover:text-white transition"
                aria-label={social.label}
              >
                <social.icon className="w-5 h-5" />
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
