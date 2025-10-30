import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import LandingPage from './components/LandingPage';
import Login from './components/Login';
import SignUp from './components/SignUp';
import Dashboard from './components/Dashboard';
import Validator from './components/Validator';
import AdDoctor from './components/AdDoctor';
import LockedFeature from './components/LockedFeature';
import Pricing from './components/Pricing';
import Settings from './components/Settings';
import DrSurglyChat from './components/DrSurglyChat';
import AdminBanner from './components/AdminBanner';
import AdminFacebookStatusWrapper from './components/AdminFacebookStatusWrapper';
import About from './pages/About';
import Terms from './pages/Terms';
import Privacy from './pages/Privacy';
import Refund from './pages/Refund';
import Contact from './pages/Contact';
import DataDeletionStatus from './pages/DataDeletionStatus';
import DataDeletionInstructions from './pages/DataDeletionInstructions';
import Admin from './pages/Admin';
import Suspended from './pages/Suspended';
import ResetPassword from './pages/ResetPassword';
import FacebookCallback from './pages/FacebookCallback';
import CreativeInsights from './pages/CreativeInsights';
import Reports from './pages/Reports';
import ProtectedAdminRoute from './components/ProtectedAdminRoute';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-light-primary dark:bg-dark-primary">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent-blue"></div>
          <div className="text-accent-blue font-medium">Loading...</div>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (user.is_active === false) {
    return <Navigate to="/suspended" replace />;
  }

  return <>{children}</>;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<SignUp />} />
      <Route path="/pricing" element={<Pricing />} />
      <Route path="/auth/facebook/callback" element={<FacebookCallback />} />

      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/validator"
        element={
          <ProtectedRoute>
            <Validator />
          </ProtectedRoute>
        }
      />
      <Route
        path="/doctor"
        element={
          <ProtectedRoute>
            <AdDoctor />
          </ProtectedRoute>
        }
      />
      <Route
        path="/budget-guard"
        element={
          <ProtectedRoute>
            <LockedFeature
              title="Budget Guard"
              description="Real-time budget monitoring with predictive alerts. Never overspend again."
              icon="🛡️"
              features={[
                'Custom alert rules (spend, CPA, ROAS thresholds)',
                'Real-time notifications',
                'Budget scaling simulator',
                'Automatic pause recommendations',
                'Multi-campaign monitoring',
              ]}
            />
          </ProtectedRoute>
        }
      />
      <Route
        path="/competitor"
        element={
          <ProtectedRoute>
            <LockedFeature
              title="Competitor Intelligence"
              description="See what's working for competitors. Analyze their active ads and learn from their strategies."
              icon="🔍"
              features={[
                'Search competitor ads',
                'AI analysis of winning strategies',
                'Track competitor changes',
                'Creative pattern recognition',
                'Targeting insights',
              ]}
            />
          </ProtectedRoute>
        }
      />
      <Route
        path="/audience"
        element={
          <ProtectedRoute>
            <LockedFeature
              title="Audience Lab"
              description="AI-powered targeting recommendations. Build better audiences with data-driven insights."
              icon="👥"
              features={[
                'Interest stacking suggestions',
                'Audience overlap analyzer',
                'Lookalike audience builder',
                'Demographic optimization',
                'Estimated engagement rates',
              ]}
            />
          </ProtectedRoute>
        }
      />
      <Route
        path="/creative"
        element={
          <ProtectedRoute>
            <CreativeInsights />
          </ProtectedRoute>
        }
      />
      <Route
        path="/copy"
        element={
          <ProtectedRoute>
            <LockedFeature
              title="Copy Optimizer"
              description="AI-scored copy with improvement suggestions. Get 12-point analysis and AI-generated variations."
              icon="📝"
              features={[
                '12-dimension copy scoring',
                'AI-generated variations',
                'Psychological principles applied',
                'Power word suggestions',
                'CTA optimization',
              ]}
            />
          </ProtectedRoute>
        }
      />
      <Route
        path="/pixel"
        element={
          <ProtectedRoute>
            <LockedFeature
              title="Pixel Health Monitor"
              description="Track pixel events and catch issues instantly. Real-time event tracking status with debugging tools."
              icon="📡"
              features={[
                'Real-time event tracking status',
                'Event firing logs and debugging',
                'Match quality scores',
                'Setup guides for common issues',
                'Advanced matching optimization',
              ]}
            />
          </ProtectedRoute>
        }
      />
      <Route
        path="/reports"
        element={
          <ProtectedRoute>
            <Reports />
          </ProtectedRoute>
        }
      />
      <Route
        path="/settings"
        element={
          <ProtectedRoute>
            <Settings />
          </ProtectedRoute>
        }
      />
      <Route path="/about" element={<About />} />
      <Route path="/terms" element={<Terms />} />
      <Route path="/privacy" element={<Privacy />} />
      <Route path="/refund" element={<Refund />} />
      <Route path="/contact" element={<Contact />} />
      <Route path="/data-deletion-status" element={<DataDeletionStatus />} />
      <Route path="/data-deletion-instructions" element={<DataDeletionInstructions />} />
      <Route path="/suspended" element={<Suspended />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route
        path="/admin"
        element={
          <ProtectedRoute>
            <ProtectedAdminRoute>
              <Admin />
            </ProtectedAdminRoute>
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ThemeProvider>
          <AdminBanner />
          <AppRoutes />
          <DrSurglyChat />
          <AdminFacebookStatusWrapper />
        </ThemeProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
