import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { PublicLayout } from './components/layout/PublicLayout';
import Home from './pages/Home';
import Login from './pages/auth/Login';
import ForgotPassword from './pages/auth/ForgotPassword';
import ResetPassword from './pages/auth/ResetPassword';
import { Dashboard } from "./pages/admin/Dashboard";
import { CMSManager } from "./pages/admin/CMSManager";
import { CloudManager } from "./pages/admin/CloudManager";
import { AdminScanner } from "./pages/admin/AdminScanner";
import { AdminGalleries, AdminTickets, AdminFinance, AdminSettings } from "./pages/admin/AdminPages";
import { AdminAnalytics } from "./pages/admin/AdminAnalytics";
import { ExperienceHome } from './pages/client/ExperienceHome';
import { GalleryView } from './pages/client/GalleryView';
import { GalleryRedirect } from './pages/client/GalleryRedirect';
import { TicketView } from './pages/client/TicketView';
import { Checkout } from './pages/client/Checkout';
import { EventCheckout } from './pages/client/EventCheckout';
import { Toaster } from 'sonner';
import './index.css';
import Portfolio from './pages/Portfolio';
import ScrollToTop from './components/layout/ScrollToTop';

import { ProtectedRoute } from './components/auth/ProtectedRoute';

function App() {
  return (
    <AuthProvider>
      <Router>
        <ScrollToTop />
        <Routes>
          {/* Public Routes - Landing Page Only */}
          <Route 
            path="/" 
            element={
              <PublicLayout>
                <Home />
              </PublicLayout>
            } 
          />
          <Route 
            path="/portfolio" 
            element={
              <PublicLayout>
                <Portfolio />
              </PublicLayout>
            } 
          />
          <Route path="/checkout" element={<EventCheckout />} />

          {/* Auth Routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />

          {/* Admin Routes - Protected */}
          <Route 
            path="/admin/*" 
            element={
              <ProtectedRoute>
                <Routes>
                  <Route index element={<Dashboard />} />
                  <Route path="estudio" element={<AdminGalleries />} />
                  <Route path="bilheteria" element={<AdminTickets />} />
                  <Route path="validar" element={<AdminScanner />} />
                  <Route path="vitrine" element={<CMSManager />} />
                  <Route path="analytics" element={<AdminAnalytics />} />
                  <Route path="caixa" element={<AdminFinance />} />
                  <Route path="nuvem" element={<CloudManager />} />
                  <Route path="ajustes" element={<AdminSettings />} />
                </Routes>
              </ProtectedRoute>
            } 
          />

          {/* Client Experience Area */}
          <Route path="/cliente/login" element={<Navigate to="/login" replace />} />
          <Route path="/cliente" element={<ExperienceHome />} />
          <Route path="/cliente/galeria/:id" element={<GalleryView />} />
          <Route path="/cliente/checkout/:id" element={<Checkout />} />
          <Route path="/v/:code" element={<GalleryRedirect />} />
          <Route path="/cliente/ingresso/:id" element={<TicketView />} />

          {/* Fallback to Home - Focus total on Landing Page */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        <Toaster 
          position="top-right" 
          expand={false} 
          richColors 
          theme="dark"
          toastOptions={{
            style: {
              background: '#0a0a0a',
              border: '1px solid #1a1a1a',
              color: '#fff',
              fontFamily: 'Inter, sans-serif'
            }
          }}
        />
      </Router>
    </AuthProvider>
  );
}

export default App;
