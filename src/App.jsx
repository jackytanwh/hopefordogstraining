import './App.css'
import { Toaster } from "@/components/ui/toaster"
import { useEffect } from 'react';
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import VisualEditAgent from '@/lib/VisualEditAgent'
import NavigationTracker from '@/lib/NavigationTracker'
import { pagesConfig } from './pages.config'
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import PromoCodes from './pages/PromoCodes';
import Unsubscribe from './pages/Unsubscribe';
import BookingSystem from './pages/BookingSystem';
import BookingCalendar from './pages/BookingCalendar';
import ClientContacts from './pages/ClientContacts';
import ReportsStats from './pages/ReportsStats';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import ProtectedRoute from '@/components/ProtectedRoute';
import AdminRoute from '@/components/AdminRoute';
import Login from '@/pages/Login';
import Register from '@/pages/Register';
import ForgotPassword from '@/pages/ForgotPassword';
import ResetPassword from '@/pages/ResetPassword';

const { Pages, Layout, mainPage } = pagesConfig;
const mainPageKey = mainPage ?? Object.keys(Pages)[0];
const MainPage = mainPageKey ? Pages[mainPageKey] : <></>;

// Admin-only pages: non-admin users are redirected to the Client Booking Portal
const ADMIN_PAGES = ["AdminBookings", "BookingCalendar", "GroupClassScheduleSettings", "Clients", "ClientDetail", "AddClient", "EditClient", "BookingDetail", "Home"];

const LayoutWrapper = ({ children, currentPageName }) => Layout ?
  <Layout currentPageName={currentPageName}>{children}</Layout>
  : <>{children}</>;

const AuthenticatedApp = () => {
  return (
    <Routes>
      {/* Public auth routes */}
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />

      {/* Public booking routes (no login required) */}
      <Route path="/unsubscribe" element={<Unsubscribe />} />

      {/* Protected app routes */}
      <Route element={<ProtectedRoute unauthenticatedElement={<Navigate to="/login" replace />} />}>
        <Route path="/" element={<LayoutWrapper currentPageName="BookingSystem"><BookingSystem /></LayoutWrapper>} />
        {Object.entries(Pages).map(([path, Page]) => (
          <Route
            key={path}
            path={`/${path}`}
            element={
              ADMIN_PAGES.includes(path) ? (
                <AdminRoute>
                  <LayoutWrapper currentPageName={path}>
                    <Page />
                  </LayoutWrapper>
                </AdminRoute>
              ) : (
                <LayoutWrapper currentPageName={path}>
                  <Page />
                </LayoutWrapper>
              )
            }
          />
        ))}
        <Route path="/PromoCodes" element={<AdminRoute><LayoutWrapper currentPageName="PromoCodes"><PromoCodes /></LayoutWrapper></AdminRoute>} />
        <Route path="/ClientContacts" element={<AdminRoute><LayoutWrapper currentPageName="ClientContacts"><ClientContacts /></LayoutWrapper></AdminRoute>} />
        <Route path="/ReportsStats" element={<AdminRoute><LayoutWrapper currentPageName="ReportsStats"><ReportsStats /></LayoutWrapper></AdminRoute>} />
      </Route>

      <Route path="*" element={<PageNotFound />} />
    </Routes>
  );
};


function App() {

  return (
    <AuthProvider>
      <QueryClientProvider client={queryClientInstance}>
        <Router>
          <NavigationTracker />
          <AuthenticatedApp />
        </Router>
        <Toaster />
        <VisualEditAgent />
      </QueryClientProvider>
    </AuthProvider>
  )
}

export default App