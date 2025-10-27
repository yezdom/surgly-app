import { Link } from 'react-router-dom';
import Logo from './Logo';
import { Twitter, Linkedin, Facebook, Youtube } from 'lucide-react';

export default function Footer() {
  const productLinks = [
    { name: 'Reports', href: '/reports' },
    { name: 'Creative Insights', href: '/creative' },
    { name: 'Ad Doctor', href: '/doctor' },
    { name: 'Pre-Launch Validator', href: '/validator' },
    { name: 'Pricing', href: '/pricing' },
  ];

  const resourceLinks = [
    { name: 'Documentation', href: '#' },
    { name: 'API Reference', href: '#' },
    { name: 'Blog', href: '#' },
    { name: 'Case Studies', href: '#' },
    { name: 'FAQs', href: '#' },
    { name: 'Contact Support', href: '/contact' },
  ];

  const legalLinks = [
    { name: 'Terms of Service', href: '/terms' },
    { name: 'Privacy Policy', href: '/privacy' },
    { name: 'Refund Policy', href: '/refund' },
    { name: 'Cookie Policy', href: '/cookies' },
    { name: 'Data Deletion', href: '/data-deletion' },
    { name: 'About Us', href: '/about' },
  ];

  const socialLinks = [
    { icon: Twitter, href: 'https://twitter.com/surgly', label: 'Twitter' },
    { icon: Linkedin, href: 'https://linkedin.com/company/surgly', label: 'LinkedIn' },
    { icon: Facebook, href: 'https://facebook.com/surgly', label: 'Facebook' },
    { icon: Youtube, href: 'https://youtube.com/surgly', label: 'YouTube' },
  ];

  return (
    <footer className="bg-black border-t border-purple-500/20 mt-auto">
      <div className="container mx-auto px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
          <div>
            <Logo variant="footer" showTagline />
            <p className="text-gray-400 text-sm mt-4 mb-6">
              Precision ad optimization powered by AI. Stop wasting budget on underperforming campaigns.
            </p>
            <div className="flex gap-4">
              {socialLinks.map((social) => (
                <a
                  key={social.label}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 bg-white/5 hover:bg-white/10 rounded-lg flex items-center justify-center transition"
                  aria-label={social.label}
                >
                  <social.icon className="w-5 h-5 text-gray-400" />
                </a>
              ))}
            </div>
          </div>

          <div>
            <h4 className="text-white font-bold mb-4">Product</h4>
            <ul className="space-y-2">
              {productLinks.map((link) => (
                <li key={link.name}>
                  <Link
                    to={link.href}
                    className="text-gray-400 hover:text-white transition text-sm"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
              <li>
                <Link to="/#roadmap" className="text-gray-400 hover:text-white transition text-sm">
                  Roadmap
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-white font-bold mb-4">Resources</h4>
            <ul className="space-y-2">
              <li>
                <Link to="/#how-it-works" className="text-gray-400 hover:text-white transition text-sm">
                  How It Works
                </Link>
              </li>
              <li>
                <Link to="/#features" className="text-gray-400 hover:text-white transition text-sm">
                  Features
                </Link>
              </li>
              <li>
                <Link to="/#testimonials" className="text-gray-400 hover:text-white transition text-sm">
                  Testimonials
                </Link>
              </li>
              <li>
                <Link to="/#faq" className="text-gray-400 hover:text-white transition text-sm">
                  FAQs
                </Link>
              </li>
              <li>
                <a href="mailto:support@surgly.app" className="text-gray-400 hover:text-white transition text-sm">
                  Contact Support
                </a>
              </li>
              <li>
                <Link to="/about" className="text-gray-400 hover:text-white transition text-sm">
                  About Us
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-white font-bold mb-4">Legal & Support</h4>
            <ul className="space-y-2">
              {legalLinks.map((link) => (
                <li key={link.name}>
                  <Link
                    to={link.href}
                    className="text-gray-400 hover:text-white transition text-sm"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
            <div className="mt-6 p-3 bg-purple-600/10 border border-purple-500/20 rounded-lg">
              <p className="text-xs text-gray-400 mb-2">Need help?</p>
              <p className="text-sm text-white">💬 Chat with Dr. Surgly 24/7</p>
              <p className="text-xs text-gray-400 mt-1">or email: support@surgly.app</p>
              <p className="text-xs text-purple-400 mt-1">We reply within 24 hours</p>
            </div>
          </div>
        </div>

        <div className="border-t border-white/10 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-gray-400 text-sm">
            Built with ❤️ for advertisers
          </p>
          <p className="text-gray-400 text-sm">
            © 2025 Surgly. All rights reserved.
          </p>
          <p className="text-gray-400 text-sm flex items-center gap-2">
            Status: All systems operational <span className="w-2 h-2 bg-green-500 rounded-full"></span>
          </p>
        </div>
      </div>
    </footer>
  );
}
