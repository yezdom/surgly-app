import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

export default function About() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <nav className="container mx-auto px-6 py-6">
        <Link
          to="/"
          className="flex items-center gap-2 text-white hover:text-blue-300 transition"
        >
          <ArrowLeft className="w-5 h-5" />
          Back to Home
        </Link>
      </nav>

      <div className="container mx-auto px-6 py-20 max-w-4xl">
        <h1 className="text-5xl font-bold text-white mb-8">About Surgly</h1>

        <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-xl p-8 text-white space-y-6">
          <p className="text-lg">
            Surgly is an AI-powered platform designed to help businesses optimize their Facebook
            advertising campaigns through intelligent analysis and actionable insights.
          </p>

          <p className="text-lg">
            Our mission is to make professional-grade ad optimization accessible to businesses of
            all sizes, from small startups to large agencies.
          </p>

          <h2 className="text-2xl font-bold mt-8 mb-4">What We Do</h2>
          <ul className="space-y-3 text-gray-200">
            <li>• AI-powered campaign diagnosis and optimization</li>
            <li>• Real-time performance tracking and analytics</li>
            <li>• Comprehensive reporting with white-label options</li>
            <li>• Budget monitoring and alert systems</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
