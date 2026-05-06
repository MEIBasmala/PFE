// src/pages/NutritionistDashboard.tsx
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { lazy, Suspense, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { DashboardLayout } from '@/components/layout';
import { NUTRITIONIST_NAV } from '@/config/nutritionistNav';
import '../styles/nutritionist.css';

// Lazy load all nutritionist dashboard components
const DashboardHome = lazy(() => import('@/components/nutritionist/NutritionistHome'));
const AppointmentsPage = lazy(() => import('@/components/nutritionist/NutritionistAppointments'));
const AvailabilityPage = lazy(() => import('@/components/nutritionist/NutritionistAvailability'));
const PatientsPage = lazy(() => import('@/components/nutritionist/NutritionistPatients')); // Combined list + detail
const MealPlansPage = lazy(() => import('@/components/nutritionist/NutritionistMealPlans'));
const MessagesPage = lazy(() => import('@/components/nutritionist/NutritionistMessages'));
const RecipeLibrary = lazy(() => import('@/components/nutritionist/NutritionistRecipes'));
const NutritionistProfile = lazy(() => import('@/components/nutritionist/NutritionistProfile'));

// Loading fallback for route transitions
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
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (loading) return;
    if (!user || (user.role !== 'NUTRITIONIST' && user.role !== 'ADMIN')) {
      navigate('/auth');
    }
  }, [user, loading, navigate]);

  if (loading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-muted">
        <p className="text-muted-foreground">Loading…</p>
      </div>
    );
  }

  const initial = user.fullName?.[0]?.toUpperCase() ?? 'N';

  return (
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
          <Route path="recipes" element={<RecipeLibrary />} />
          <Route path="profile" element={<NutritionistProfile />} />
          <Route path="*" element={<Navigate to="/nutritionist" replace />} />
        </Routes>
      </Suspense>
    </DashboardLayout>
  );
}