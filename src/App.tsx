import { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { Layout } from "@/components/Layout";
import ProtectedRoute from "@/components/ProtectedRoute";
import RoleBasedRedirect from "@/components/RoleBasedRedirect";
import NotificationService from "@/services/notificationService";

// Lazy load pages for better performance
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Properties = lazy(() => import("./pages/Properties"));
const Tenants = lazy(() => import("./pages/Tenants"));
const RentManagement = lazy(() => import("./pages/RentManagement"));
const Expenses = lazy(() => import("./pages/Expenses"));
const Policies = lazy(() => import("./pages/Policies"));
const Settings = lazy(() => import("./pages/Settings"));
const Login = lazy(() => import("./pages/Login"));
const Signup = lazy(() => import("./pages/Signup"));
const TenantDashboard = lazy(() => import("./pages/TenantDashboard"));
const AdminPayments = lazy(() => import("./pages/AdminPayments"));
const AdminNotifications = lazy(() => import("./pages/AdminNotifications"));
const TaxAccountability = lazy(() => import("./pages/TaxAccountability"));
const Unauthorized = lazy(() => import("./pages/Unauthorized"));
const NotFound = lazy(() => import("./pages/NotFound"));

// Loading component
const PageLoader = () => (
  <div className="flex items-center justify-center min-h-screen">
    <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600"></div>
  </div>
);

const queryClient = new QueryClient();

// Initialize notification service
NotificationService.initializeNotificationChecking();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <AuthProvider>
        <BrowserRouter>
          <Suspense fallback={<PageLoader />}>
            <Routes>
              {/* Public routes */}
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<Signup />} />
              <Route path="/unauthorized" element={<Unauthorized />} />
            
            {/* Role-based redirect for root path */}
            <Route path="/" element={<RoleBasedRedirect />} />
            
            {/* Protected admin routes */}
            <Route path="/admin/dashboard" element={
              <ProtectedRoute requiredRole="admin">
                <Layout><Dashboard /></Layout>
              </ProtectedRoute>
            } />
            <Route path="/properties" element={
              <ProtectedRoute requiredRole="admin">
                <Layout><Properties /></Layout>
              </ProtectedRoute>
            } />
            <Route path="/tenants" element={
              <ProtectedRoute requiredRole="admin">
                <Layout><Tenants /></Layout>
              </ProtectedRoute>
            } />
            <Route path="/rent" element={
              <ProtectedRoute requiredRole="admin">
                <Layout><RentManagement /></Layout>
              </ProtectedRoute>
            } />
            <Route path="/expenses" element={
              <ProtectedRoute requiredRole="admin">
                <Layout><Expenses /></Layout>
              </ProtectedRoute>
            } />
            <Route path="/admin/payments" element={
              <ProtectedRoute requiredRole="admin">
                <Layout><AdminPayments /></Layout>
              </ProtectedRoute>
            } />
            <Route path="/admin/notifications" element={
              <ProtectedRoute requiredRole="admin">
                <Layout><AdminNotifications /></Layout>
              </ProtectedRoute>
            } />
            <Route path="/admin/tax" element={
              <ProtectedRoute requiredRole="admin">
                <Layout><TaxAccountability /></Layout>
              </ProtectedRoute>
            } />
            <Route path="/settings" element={
              <ProtectedRoute requiredRole="admin">
                <Layout><Settings /></Layout>
              </ProtectedRoute>
            } />
            <Route path="/policies" element={
              <ProtectedRoute requiredRole="admin">
                <Layout><Policies /></Layout>
              </ProtectedRoute>
            } />
            
            {/* Protected tenant routes */}
            <Route path="/tenant/dashboard" element={
              <ProtectedRoute requiredRole="tenant">
                <TenantDashboard />
              </ProtectedRoute>
            } />
            
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
