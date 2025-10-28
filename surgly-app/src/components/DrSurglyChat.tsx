import { useState, useEffect, useRef } from 'react';
import { X, Send, Stethoscope, Minimize2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

interface Message {
  id: string;
  content: string;
  sender: 'user' | 'bot';
  timestamp: Date;
}

export default function DrSurglyChat() {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen && messages.length === 0) {
      const welcomeMessage: Message = {
        id: '1',
        content: user
          ? '👋 Welcome back! 🩺 How can I help you optimize today?'
          : '👋 Hi! I\'m Dr. Surgly. I help advertisers optimize Facebook campaigns with AI. Want to see how it works?',
        sender: 'bot',
        timestamp: new Date(),
      };
      setMessages([welcomeMessage]);
    }
  }, [isOpen, user]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const quickActions = user
    ? [
        { label: 'Diagnose campaigns', value: 'diagnose' },
        { label: 'Create report', value: 'report' },
        { label: 'Get insights', value: 'insights' },
      ]
    : [
        { label: 'Show demo', value: 'demo' },
        { label: 'Explain pricing', value: 'pricing' },
        { label: 'Start trial', value: 'trial' },
      ];

  async function handleSend(message?: string) {
    const content = message || inputValue.trim();
    if (!content) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      content,
      sender: 'user',
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue('');
    setIsTyping(true);

    setTimeout(() => {
      const botResponse = generateResponse(content);
      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: botResponse,
        sender: 'bot',
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, botMessage]);
      setIsTyping(false);
    }, 1500);
  }

  function generateResponse(input: string): string {
    const lower = input.toLowerCase();

    if (lower.includes('pricing') || lower.includes('cost') || lower.includes('price')) {
      return 'Our plans start at £19/month for 50 analyses, £49/month for 200 analyses, or £99/month for unlimited. All plans include all features with no hidden fees. Would you like to see the full pricing page?';
    }

    if (lower.includes('demo') || lower.includes('how it works')) {
      return 'Great! Surgly connects to your Facebook Ads account and uses AI to analyze your campaigns. We identify issues, suggest improvements, and help you optimize performance. Want me to show you our Pre-Launch Validator to get started?';
    }

    if (lower.includes('trial') || lower.includes('sign up') || lower.includes('start')) {
      return 'Awesome! You can start with 10 free analyses—no credit card required. Just click "Start Free Trial" and connect your Facebook account. Takes less than 2 minutes. Ready to begin?';
    }

    if (lower.includes('diagnose') || lower.includes('campaign') || lower.includes('health')) {
      return 'I can help you diagnose your campaigns! Head to the Ad Doctor page where I\'ll analyze each campaign\'s health score and provide actionable recommendations. Click the button below to get started.';
    }

    if (lower.includes('report') || lower.includes('analytics')) {
      return 'You can generate comprehensive reports with beautiful charts and export them to PDF, CSV, or Excel. Visit the Reports page to create your first report. Want me to take you there?';
    }

    if (lower.includes('creative') || lower.includes('ad') || lower.includes('image')) {
      return 'Our Creative Insights feature uses GPT-4 Vision to analyze your ad creatives and suggest improvements. You can see which ads are winners and which need work. Check it out on the Creative Insights page!';
    }

    if (lower.includes('connect') || lower.includes('facebook') || lower.includes('integrate')) {
      return 'Connecting your Facebook account is easy! Go to Settings → Connect Facebook, and authorize Surgly to read your ad data. We only request read-only access and never make changes without your permission.';
    }

    if (lower.includes('help') || lower.includes('support') || lower.includes('human')) {
      return 'I\'m here to help! You can also reach our support team at support@surgly.app or use the "Talk to human" button below for immediate assistance. What specific issue can I help with?';
    }

    return 'Thanks for reaching out! I can help you with campaign optimization, reports, creative analysis, pricing, and getting started. What would you like to know more about?';
  }

  function handleQuickAction(action: string) {
    const actionMessages: Record<string, string> = {
      diagnose: 'Show me my campaign health',
      report: 'Generate a report',
      insights: 'Analyze my ad creatives',
      demo: 'Show me a demo',
      pricing: 'What does it cost?',
      trial: 'Start my free trial',
    };

    handleSend(actionMessages[action]);
  }

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full shadow-2xl flex items-center justify-center hover:scale-110 transition-transform z-50 group"
      >
        <Stethoscope className="w-7 h-7 text-white" />
        <div className="absolute -top-2 -right-2 w-3 h-3 bg-green-500 rounded-full border-2 border-white animate-pulse"></div>
        <div className="absolute -top-10 right-0 bg-slate-900 text-white px-3 py-1 rounded-lg text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
          Dr. Surgly
        </div>
      </button>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 w-full max-w-md h-[600px] bg-slate-900 border border-purple-500/30 rounded-2xl shadow-2xl flex flex-col z-50 overflow-hidden">
      <div className="bg-gradient-to-r from-purple-500 to-pink-500 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
            <Stethoscope className="w-6 h-6 text-white" />
          </div>
          <div>
            <div className="text-white font-bold">Dr. Surgly</div>
            <div className="text-white/80 text-xs flex items-center gap-1">
              <span className="w-2 h-2 bg-green-400 rounded-full"></span>
              Online
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsOpen(false)}
            className="w-8 h-8 hover:bg-white/10 rounded-lg flex items-center justify-center transition"
          >
            <Minimize2 className="w-5 h-5 text-white" />
          </button>
          <button
            onClick={() => setIsOpen(false)}
            className="w-8 h-8 hover:bg-white/10 rounded-lg flex items-center justify-center transition"
          >
            <X className="w-5 h-5 text-white" />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                message.sender === 'user'
                  ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white'
                  : 'bg-slate-800 text-gray-100'
              }`}
            >
              <p className="text-sm">{message.content}</p>
              <p className="text-xs opacity-70 mt-1">
                {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
          </div>
        ))}

        {isTyping && (
          <div className="flex justify-start">
            <div className="bg-slate-800 rounded-2xl px-4 py-3">
              <div className="flex gap-1">
                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></span>
                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-100"></span>
                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-200"></span>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      <div className="px-6 py-3 border-t border-slate-800">
        <div className="flex flex-wrap gap-2 mb-3">
          {quickActions.map((action) => (
            <button
              key={action.value}
              onClick={() => handleQuickAction(action.value)}
              className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-gray-300 text-sm rounded-full transition"
            >
              {action.label}
            </button>
          ))}
        </div>

        <div className="flex gap-2">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Type your message..."
            className="flex-1 px-4 py-3 bg-slate-800 text-white rounded-xl border border-slate-700 focus:border-purple-500 focus:outline-none"
          />
          <button
            onClick={() => handleSend()}
            disabled={!inputValue.trim()}
            className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl flex items-center justify-center hover:shadow-lg transition disabled:opacity-50"
          >
            <Send className="w-5 h-5 text-white" />
          </button>
        </div>
      </div>
    </div>
  );
}
