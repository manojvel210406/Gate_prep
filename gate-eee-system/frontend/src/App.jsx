import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import AppLayout from './components/Layout/AppLayout';

// Pages (lazy-loadable)
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import OnboardingPage from './pages/OnboardingPage';
import DashboardPage from './pages/DashboardPage';
import StudyTrackerPage from './pages/StudyTrackerPage';
import AnalyticsPage from './pages/AnalyticsPage';
import MockTestPage from './pages/MockTestPage';
import AIMentorPage from './pages/AIMentorPage';
import SubjectsPage from './pages/SubjectsPage';
import ErrorsPage from './pages/ErrorsPage';
import RevisionPage from './pages/RevisionPage';
import ProfilePage from './pages/ProfilePage';

// Route guards
function PrivateRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();
  if (loading) return <div className="min-h-screen flex items-center justify-center bg-surface"><div className="text-primary-800 font-display font-semibold text-xl animate-pulse">Loading GATE EEE...</div></div>;
  return isAuthenticated ? children : <Navigate to="/login" replace />;
}

function OnboardingGuard({ children }) {
  const { user } = useAuth();
  if (user && !user.onboardingCompleted) return <Navigate to="/onboarding" replace />;
  return children;
}

function PublicRoute({ children }) {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? <Navigate to="/dashboard" replace /> : children;
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Public routes */}
          <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
          <Route path="/signup" element={<PublicRoute><SignupPage /></PublicRoute>} />

          {/* Onboarding */}
          <Route path="/onboarding" element={<PrivateRoute><OnboardingPage /></PrivateRoute>} />

          {/* Protected app routes */}
          <Route path="/" element={
            <PrivateRoute>
              <OnboardingGuard>
                <AppLayout />
              </OnboardingGuard>
            </PrivateRoute>
          }>
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={<DashboardPage />} />
            <Route path="study" element={<StudyTrackerPage />} />
            <Route path="analytics" element={<AnalyticsPage />} />
            <Route path="test" element={<MockTestPage />} />
            <Route path="mentor" element={<AIMentorPage />} />
            <Route path="subjects" element={<SubjectsPage />} />
            <Route path="errors" element={<ErrorsPage />} />
            <Route path="revision" element={<RevisionPage />} />
            <Route path="profile" element={<ProfilePage />} />
          </Route>

          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
