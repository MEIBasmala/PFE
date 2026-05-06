// src/App.tsx
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { lazy, Suspense } from "react";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/contexts/AuthContext";
import { PrivateRoute } from "./pages/PrivateRoute";
import { useAuth } from "@/contexts/AuthContext";

// Lazy load all page components
const Index = lazy(() => import("./pages/Index"));
const About = lazy(() => import("./pages/About"));
const Contact = lazy(() => import("./pages/Contact"));
const Auth = lazy(() => import("./pages/Auth"));
const PatientOnboarding = lazy(() => import("./pages/PatientOnboarding"));
const PatientDashboard = lazy(() => import("./pages/PatientDashboard"));
const NutritionistDashboard = lazy(() => import("./pages/NutritionistDashboard"));
const AdminDashboard = lazy(() => import("./pages/AdminDashboard"));
const NotFound = lazy(() => import("./pages/NotFound"));

const PageLoader = () => (
  <div className="flex min-h-screen items-center justify-center bg-cream-bg">
    <div className="text-center">
      <div className="mb-4 h-8 w-8 animate-spin rounded-full border-4 border-kl-orange border-t-transparent mx-auto" />
      <p className="text-muted-foreground">Loading...</p>
    </div>
  </div>
);

// Redirects already-logged-in users away from /auth to their dashboard
const AuthRoute = ({ children }: { children: JSX.Element }) => {
  const { isAuthenticated, user, loading } = useAuth();
  if (loading) return <PageLoader />;
  if (isAuthenticated && user) {
    const routes: Record<string, string> = {
      PATIENT: '/patient',
      NUTRITIONIST: '/nutritionist',
      ADMIN: '/admin',
    };
    return <Navigate to={routes[user.role] ?? '/'} replace />;
  }
  return children;
};

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter future={{ v7_relativeSplatPath: true, v7_startTransition: true }}>
          <Suspense fallback={<PageLoader />}>
            <Routes>
              {/* Public routes */}
              <Route path="/" element={<Index />} />
              <Route path="/about" element={<About />} />
              <Route path="/contact" element={<Contact />} />

              {/* Auth routes — redirect to dashboard if already logged in */}
              <Route path="/auth" element={<AuthRoute><Auth /></AuthRoute>} />
              <Route path="/reset-password" element={<AuthRoute><Auth /></AuthRoute>} />

              {/* Patient-only routes */}
              <Route
                path="/onboarding"
                element={
                  <PrivateRoute roles={['PATIENT']}>
                    <PatientOnboarding />
                  </PrivateRoute>
                }
              />
              <Route
                path="/patient/*"
                element={
                  <PrivateRoute roles={['PATIENT']}>
                    <PatientDashboard />
                  </PrivateRoute>
                }
              />

              {/* Nutritionist-only routes */}
              <Route
                path="/nutritionist/*"
                element={
                  <PrivateRoute roles={['NUTRITIONIST']}>
                    <NutritionistDashboard />
                  </PrivateRoute>
                }
              />

              {/* Admin-only routes */}
              <Route
                path="/admin/*"
                element={
                  <PrivateRoute roles={['ADMIN']}>
                    <AdminDashboard />
                  </PrivateRoute>
                }
              />

              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;