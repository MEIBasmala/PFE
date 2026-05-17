// src/pages/PatientDashboard.tsx
import { Routes, Route, Navigate, useNavigate } from "react-router-dom";
import { lazy, Suspense, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { DashboardLayout } from "@/components/layout";
import { PATIENT_NAV } from "@/config/patientNav";
import { SubscriptionProvider } from "@/contexts/SubscriptionContext";
import { DiaryProvider } from "@/contexts/DiaryContext";
import "../styles/patient.css";

const PatientHome = lazy(() => import("@/components/patient/PatientHome"));
const PatientAITracker = lazy(
  () => import("@/components/patient/PatientAITracker"),
);
const PatientChatbot = lazy(
  () => import("@/components/patient/PatientChatbot"),
); 
const PatientMealPlan = lazy(
  () => import("@/components/patient/PatientNutritionPlan"),
);
const RecipeLibrary = lazy(() => import("@/components/patient/RecipeLibrary"));
const PatientConsultations = lazy(
  () => import("@/components/patient/PatientConsultations"),
);
const PatientSubscription = lazy(
  () => import("@/components/patient/PatientSubscription"),
);
const PatientBlog = lazy(() => import("@/components/patient/PatientBlog"));
const PatientBlogPost = lazy(
  () => import("@/components/patient/PatientBlogPost"),
);
const Messages = lazy(() => import("@/components/patient/PatientMessages"));
const Support = lazy(() => import("@/components/patient/PatientSupport"));
const PatientProfile = lazy(() => import("@/components/patient/PatientProfile"));
const RouteLoader = () => (
  <div className="flex justify-center py-12">
    <div className="h-8 w-8 animate-spin rounded-full border-4 border-kl-orange border-t-transparent" />
  </div>
);

const sections = PATIENT_NAV.map((section) => ({
  title: section.title,
  items: section.items.map((item) => ({
    id: item.id,
    label: item.label,
    icon: item.icon,
    path: item.path,
  })),
}));

export default function PatientDashboard() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (loading) return;
    if (!user || user.role !== "PATIENT") navigate("/auth");
  }, [user, loading, navigate]);

  if (loading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        Loading…
      </div>
    );
  }

  const initial = user.fullName?.[0]?.toUpperCase() ?? "P";

  return (
    <DashboardLayout
      title=""
      sections={sections}
      userName={user.fullName}
      userRole="PATIENT"
      userAvatar={initial}
    >
      <DiaryProvider>
        <SubscriptionProvider>
          
          <Suspense fallback={<RouteLoader />}>
          <PatientChatbot />
            <Routes>
              <Route index element={<PatientHome />} />
              <Route path="ai" element={<PatientAITracker />} />
              <Route path="nutrition-plans" element={<PatientMealPlan />} />
              <Route path="recipes" element={<RecipeLibrary />} />
              <Route path="consultations" element={<PatientConsultations />} />
              <Route path="subscription" element={<PatientSubscription />} />
              <Route path="blog" element={<PatientBlog />} />
              <Route path="blog/:id" element={<PatientBlogPost />} />
              <Route path="messages" element={<Messages />} />
              <Route path="support" element={<Support />} />
              <Route path="profile" element={<PatientProfile />} />
              <Route path="*" element={<Navigate to="/patient" replace />} />
            </Routes>
          </Suspense>
        </SubscriptionProvider>
      </DiaryProvider>
    </DashboardLayout>
  );
}
