import { Link } from 'react-router-dom';
import { ArrowLeft, Mail } from 'lucide-react';

export default function Contact() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <nav className="container mx-auto px-6 py-6">
        <Link to="/" className="flex items-center gap-2 text-white hover:text-blue-300 transition">
          <ArrowLeft className="w-5 h-5" />
          Back to Home
        </Link>
      </nav>
      <div className="container mx-auto px-6 py-20 max-w-4xl">
        <h1 className="text-5xl font-bold text-white mb-8">Contact Us</h1>
        <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-xl p-8 text-white">
          <p className="mb-4">Get in touch with our team:</p>
          <a href="mailto:support@surgly.com" className="flex items-center gap-2 text-blue-400 hover:text-blue-300">
            <Mail className="w-5 h-5" />
            support@surgly.com
          </a>
        </div>
      </div>
    </div>
  );
}
