// src/pages/NutritionistDashboard.tsx
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { lazy, Suspense, useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { DashboardLayout } from '@/components/layout';
import { NUTRITIONIST_NAV } from '@/config/nutritionistNav';
import { changePassword } from '@/services/api';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import '../styles/nutritionist.css';

// Lazy load all nutritionist dashboard components
const DashboardHome = lazy(() => import('@/components/nutritionist/NutritionistHome'));
const AppointmentsPage = lazy(() => import('@/components/nutritionist/NutritionistAppointments'));
const AvailabilityPage = lazy(() => import('@/components/nutritionist/NutritionistAvailability'));
const PatientsPage = lazy(() => import('@/components/nutritionist/NutritionistPatients'));
const MealPlansPage = lazy(() => import('@/components/nutritionist/NutritionistMealPlans'));
const MessagesPage = lazy(() => import('@/components/nutritionist/NutritionistMessages'));
const NutritionistProfile = lazy(() => import('@/components/nutritionist/NutritionistProfile'));

const RouteLoader = () => (
  <div className="flex justify-center py-12">
    <div className="h-8 w-8 animate-spin rounded-full border-4 border-orange-500 border-t-transparent" />
  </div>
);

const sections = NUTRITIONIST_NAV.map((section) => ({
  title: section.title,
  items: section.items.map((item) => ({
    id: item.id,
    label: item.label,
    icon: item.icon,
    path: item.path,
  })),
}));

export default function NutritionistDashboard() {
  const { user, loading, refreshUser } = useAuth();
  const navigate = useNavigate();
  const [showForcePassword, setShowForcePassword] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (loading) return;
    if (!user || user.role !== 'NUTRITIONIST') {
      navigate('/auth');
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    if (user?.mustChangePassword) {
      setShowForcePassword(true);
    }
  }, [user]);

  const handlePasswordChange = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      toast.error('All fields are required');
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }
    if (newPassword.length < 8) {
      toast.error('Password must be at least 8 characters');
      return;
    }
    setSubmitting(true);
    try {
      await changePassword(currentPassword, newPassword);
      toast.success('Password updated successfully');
      setShowForcePassword(false);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      await refreshUser?.(); // Refresh user so mustChangePassword is cleared
    } catch (err) {
      toast.error((err as Error).message || 'Failed to change password');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-muted">
        <p className="text-muted-foreground">Loading…</p>
      </div>
    );
  }

  const initial = user.fullName?.[0]?.toUpperCase() ?? 'N';

  return (
    <>
      {/* Force password change modal — blocks entire UI */}
      <Dialog open={showForcePassword} onOpenChange={() => {}}>
        <DialogContent className="sm:max-w-md" onPointerDownOutside={(e) => e.preventDefault()}>
          <DialogHeader>
            <DialogTitle>🔐 Change Your Password</DialogTitle>
            <DialogDescription>
              Your account requires a password change before you can continue using the dashboard.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Current Password</Label>
              <Input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Enter your temporary password"
              />
            </div>
            <div className="space-y-2">
              <Label>New Password</Label>
              <Input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Min. 8 characters"
              />
            </div>
            <div className="space-y-2">
              <Label>Confirm New Password</Label>
              <Input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-enter new password"
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              onClick={handlePasswordChange}
              disabled={submitting}
              className="w-full"
            >
              {submitting ? 'Updating…' : 'Update Password'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <DashboardLayout
        title="Nutritionist Dashboard"
        sections={sections}
        userName={user.fullName}
        userRole={user.role === 'ADMIN' ? 'ADMIN' : 'NUTRITIONIST'}
        userAvatar={initial}
      >
        <Suspense fallback={<RouteLoader />}>
          <Routes>
            <Route index element={<DashboardHome />} />
            <Route path="appointments" element={<AppointmentsPage />} />
            <Route path="availability" element={<AvailabilityPage />} />
            <Route path="patients" element={<PatientsPage />} />
            <Route path="patients/:patientId" element={<PatientsPage />} />
            <Route path="nutrition-plans" element={<MealPlansPage />} />
            <Route path="messages" element={<MessagesPage />} />
            <Route path="profile" element={<NutritionistProfile />} />
            <Route path="*" element={<Navigate to="/nutritionist" replace />} />
          </Routes>
        </Suspense>
      </DashboardLayout>
    </>
  );
}