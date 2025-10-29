import { Link } from 'react-router-dom';
import { ArrowLeft, Mail, Send } from 'lucide-react';
import { useState } from 'react';
import Logo from '../components/Logo';
import Footer from '../components/Footer';
import SEO from '../components/SEO';

export default function Contact() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || !formData.email || !formData.message) {
      setStatus('error');
      return;
    }

    setStatus('success');
    setFormData({ name: '', email: '', subject: '', message: '' });

    setTimeout(() => {
      setStatus('idle');
    }, 5000);
  };

  return (
    <>
      <SEO
        title="Contact Us | Get Support from Dr. Surgly"
        description="Reach out anytime — our 24/7 AI assistant, Dr. Surgly, is ready to help optimize your campaigns."
        canonical="https://surgly.app/contact"
      />
      <div className="min-h-screen flex flex-col bg-white dark:bg-gradient-to-br dark:from-slate-900 dark:via-purple-900 dark:to-slate-900 transition-colors duration-500">
      <nav className="container mx-auto px-6 py-6 flex items-center justify-between border-b border-border-light dark:border-transparent">
        <Logo variant="header" linkTo="/" />
        <Link to="/" className="flex items-center gap-2 text-text-light-primary dark:text-white hover:text-accent-blue dark:hover:text-blue-300 transition">
          <ArrowLeft className="w-5 h-5" />
          Back to Home
        </Link>
      </nav>

      <div className="container mx-auto px-6 py-20 max-w-4xl flex-1">
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold text-text-light-primary dark:text-white mb-4">Contact Us</h1>
          <p className="text-xl text-text-light-secondary dark:text-gray-300">
            We'd love to hear from you. Reach out for support or business inquiries.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
          <div className="bg-light-secondary dark:bg-white/10 backdrop-blur-lg border border-border-light dark:border-white/20 rounded-xl p-8">
            <Mail className="w-12 h-12 text-accent-blue dark:text-blue-400 mb-4" />
            <h3 className="text-xl font-bold text-text-light-primary dark:text-white mb-2">Email Us</h3>
            <p className="text-text-light-secondary dark:text-gray-300 mb-4">
              For general inquiries and support
            </p>
            <a href="mailto:support@surgly.app" className="text-accent-blue dark:text-blue-400 hover:underline">
              support@surgly.app
            </a>
          </div>

          <div className="bg-light-secondary dark:bg-white/10 backdrop-blur-lg border border-border-light dark:border-white/20 rounded-xl p-8">
            <Send className="w-12 h-12 text-accent-blue dark:text-blue-400 mb-4" />
            <h3 className="text-xl font-bold text-text-light-primary dark:text-white mb-2">Quick Response</h3>
            <p className="text-text-light-secondary dark:text-gray-300">
              We typically respond within 24 hours during business days
            </p>
          </div>
        </div>

        <div className="bg-light-secondary dark:bg-white/10 backdrop-blur-lg border border-border-light dark:border-white/20 rounded-xl p-8">
          <h2 className="text-2xl font-bold text-text-light-primary dark:text-white mb-6">Send us a message</h2>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-text-light-primary dark:text-white mb-2">
                  Full Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-3 bg-white dark:bg-gray-900 border border-border-light dark:border-gray-700 rounded-lg text-text-light-primary dark:text-white focus:outline-none focus:border-accent-blue transition"
                  placeholder="John Doe"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-text-light-primary dark:text-white mb-2">
                  Email Address *
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-4 py-3 bg-white dark:bg-gray-900 border border-border-light dark:border-gray-700 rounded-lg text-text-light-primary dark:text-white focus:outline-none focus:border-accent-blue transition"
                  placeholder="john@example.com"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-text-light-primary dark:text-white mb-2">
                Subject
              </label>
              <input
                type="text"
                value={formData.subject}
                onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                className="w-full px-4 py-3 bg-white dark:bg-gray-900 border border-border-light dark:border-gray-700 rounded-lg text-text-light-primary dark:text-white focus:outline-none focus:border-accent-blue transition"
                placeholder="How can we help?"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-text-light-primary dark:text-white mb-2">
                Message *
              </label>
              <textarea
                value={formData.message}
                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                rows={6}
                className="w-full px-4 py-3 bg-white dark:bg-gray-900 border border-border-light dark:border-gray-700 rounded-lg text-text-light-primary dark:text-white focus:outline-none focus:border-accent-blue transition resize-none"
                placeholder="Tell us more about your inquiry..."
                required
              />
            </div>

            <button
              type="submit"
              className="w-full px-6 py-3 bg-accent-blue hover:bg-accent-blueHover text-white rounded-lg font-medium transition flex items-center justify-center gap-2"
            >
              <Send className="w-5 h-5" />
              Send Message
            </button>

            {status === 'success' && (
              <div className="p-4 bg-green-500/10 border border-green-500 rounded-lg text-green-600 dark:text-green-400">
                Thank you for your message! We'll get back to you soon.
              </div>
            )}

            {status === 'error' && (
              <div className="p-4 bg-red-500/10 border border-red-500 rounded-lg text-red-600 dark:text-red-400">
                Please fill in all required fields.
              </div>
            )}
          </form>
        </div>
      </div>

      <Footer />
      </div>
    </>
  );
}
