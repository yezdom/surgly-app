# SURGLY - AI-Powered Facebook Ads Doctor Platform

A production-ready SaaS platform that prevents Facebook ad failures before users waste money.

## Features Built

### Core Features
- **Pre-Launch Validator**: AI-powered analysis of ad campaigns before spending
- **Ad Doctor**: 8-point health diagnostics for live campaigns (locked feature demo)
- **Dashboard**: Account overview with key metrics and health scores
- **Authentication**: Email/password signup and login with Supabase
- **Theme System**: Dark/light mode toggle with persistence
- **Plan System**: Trial/Starter/Pro/Agency tiers with locked features

### Pages Included
- Landing Page with hero, features, and pricing teaser
- Login/Signup pages with split-screen design
- Dashboard with stats and quick actions
- Pre-Launch Validator with form and results page
- Pricing page with monthly/annual toggle
- Locked feature pages for premium features
- Protected routes for authenticated users

### Database Schema
Complete Supabase schema with:
- Users with trial tracking
- Ad accounts, campaigns, ads
- Analyses and AI responses
- Feature usage tracking
- Subscriptions
- Row Level Security enabled on all tables

### Design System
- Custom Tailwind config with brand colors
- Dark mode: #0A0E27 (primary), #131842 (secondary), #1E293B (tertiary)
- Light mode: White/gray tones
- Accent colors: Blue (#4F46E5), Purple (#8B5CF6)
- Inter font family
- Responsive design with mobile support

## Tech Stack
- React 18 + TypeScript
- Vite for build tooling
- React Router for routing
- Tailwind CSS for styling
- Supabase for database and auth
- Lucide React for icons
- Framer Motion for animations (ready to use)
- Recharts for data visualization (ready to use)

## Getting Started

1. Install dependencies:
```bash
npm install
```

2. Environment variables are already configured in `.env`

3. Run development server:
```bash
npm run dev
```

4. Build for production:
```bash
npm run build
```

## User Flow

1. **Landing Page** → Sign up for free 3-day trial
2. **Sign Up** → Create account (no credit card required)
3. **Dashboard** → View account overview
4. **Pre-Launch Validator** → Analyze ad before spending
5. **Locked Features** → Upgrade prompts for premium features
6. **Pricing Page** → Choose plan and start trial

## Database

All tables created with Row Level Security:
- Users authenticate via Supabase Auth
- Data automatically scoped to authenticated user
- Trial period tracked (3 days from signup)
- Plan limits enforced at application level

## Next Steps for Full Production

To complete the platform:
1. Implement OpenAI API integration for real AI analysis
2. Add Facebook Marketing API integration
3. Implement Stripe billing integration
4. Add email notifications via Resend
5. Build remaining features (Budget Guard, Competitor Intel, etc.)
6. Add AI chatbot widget
7. Implement settings pages
8. Add real campaign data syncing

## Notes

- All locked features show upgrade prompts
- Trial countdown displays in header when active
- Theme preference persists across sessions
- Mock data used for validator results (replace with real AI)
- Build is production-ready and optimized
