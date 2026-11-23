import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/authStore';

// Public Layout & Pages
import { Navbar } from './components/layout/Navbar';
import { Footer } from './components/layout/Footer';
import { LandingPage } from './pages/LandingPage';
import { AboutPage } from './pages/AboutPage';
import { HowItWorksPage } from './pages/HowItWorksPage';
import { ImpactPage } from './pages/ImpactPage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { TermsPrivacyPage } from './pages/TermsPrivacyPage';

// Dashboards
import { DashboardLayout } from './components/layout/DashboardLayout';
import { AdminDashboard } from './dashboards/admin/AdminDashboard';
import { DonorDashboard } from './dashboards/donor/DonorDashboard';
import { NGODashboard } from './dashboards/ngo/NGODashboard';
import { VolunteerDashboard } from './dashboards/volunteer/VolunteerDashboard';
import { BeneficiaryDashboard } from './dashboards/beneficiary/BeneficiaryDashboard';

// Route Guard component
const ProtectedRoute: React.FC<{ allowedRoles?: string[]; children: React.ReactElement }> = ({
  allowedRoles,
  children,
}) => {
  const { user, isAuthenticated } = useAuthStore();

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }

  return children;
};

// Public Layout Wrapper
const PublicLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="flex flex-col min-h-screen bg-[#072B2B]">
    <Navbar />
    <main className="flex-1">{children}</main>
    <Footer />
  </div>
);

export const App: React.FC = () => {
  return (
    <Routes>
      {/* Public Pages */}
      <Route path="/" element={<PublicLayout><LandingPage /></PublicLayout>} />
      <Route path="/about" element={<PublicLayout><AboutPage /></PublicLayout>} />
      <Route path="/how-it-works" element={<PublicLayout><HowItWorksPage /></PublicLayout>} />
      <Route path="/impact" element={<PublicLayout><ImpactPage /></PublicLayout>} />
      <Route path="/terms" element={<PublicLayout><TermsPrivacyPage /></PublicLayout>} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />

      {/* Role-Protected Dashboards */}
      <Route element={<DashboardLayout />}>
        <Route
          path="/admin"
          element={
            <ProtectedRoute allowedRoles={['ADMIN']}>
              <AdminDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/donor"
          element={
            <ProtectedRoute allowedRoles={['DONOR']}>
              <DonorDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/ngo"
          element={
            <ProtectedRoute allowedRoles={['NGO']}>
              <NGODashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/volunteer"
          element={
            <ProtectedRoute allowedRoles={['VOLUNTEER']}>
              <VolunteerDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/beneficiary"
          element={
            <ProtectedRoute allowedRoles={['BENEFICIARY']}>
              <BeneficiaryDashboard />
            </ProtectedRoute>
          }
        />
      </Route>

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

export default App;
