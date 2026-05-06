// src/pages/PrivateRoute.tsx
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import type { UserRole } from '@/types/api';

interface PrivateRouteProps {
  children: JSX.Element;
  /** Optional: restrict to specific roles. If omitted, any authenticated user passes. */
  roles?: UserRole[];
}

// Shown while AuthContext is restoring user from localStorage / verifying token.
// Prevents the flicker where a logged-in user gets briefly redirected to /auth on hard refresh.
const PageLoader = () => (
  <div className="flex min-h-screen items-center justify-center bg-cream-bg">
    <div className="text-center">
      <div className="mb-4 h-8 w-8 animate-spin rounded-full border-4 border-kl-orange border-t-transparent mx-auto" />
      <p className="text-muted-foreground text-sm">Loading...</p>
    </div>
  </div>
);

export const PrivateRoute = ({ children, roles }: PrivateRouteProps) => {
  const { isAuthenticated, user, loading } = useAuth();

  // Still restoring state — don't make any routing decision yet
  if (loading) return <PageLoader />;

  // Not logged in at all
  if (!isAuthenticated || !user) return <Navigate to="/auth" replace />;

  // Logged in but wrong role for this route
  if (roles && !roles.includes(user.role)) {
    const fallback: Record<UserRole, string> = {
      PATIENT: '/patient',
      NUTRITIONIST: '/nutritionist',
      ADMIN: '/admin',
    };
    return <Navigate to={fallback[user.role] ?? '/auth'} replace />;
  }

  return children;
};