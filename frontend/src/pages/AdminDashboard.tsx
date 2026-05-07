// src/pages/AdminDashboard.tsx

import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { lazy, Suspense } from 'react';
import {DashboardLayout} from '@/components/layout';
import { useAuth } from '@/contexts/AuthContext';
import { ADMIN_NAV } from '@/config/adminNav';

const AdminHome = lazy(() => import('@/components/admin/AdminHome'));
const AdminPatients = lazy(() => import('@/components/admin/AdminPatients'));
const AdminNutritionists = lazy(() => import('@/components/admin/AdminNutritionists'));
const AdminInquiries = lazy(() => import('@/components/admin/AdminInquiries'));
const AdminAuditLogs = lazy(() => import('@/components/admin/AdminAuditLogs'));
const AdminAnalytics = lazy(() => import('@/components/admin/AdminAnalytics'));
const AdminSubscriptions = lazy(() => import('@/components/admin/AdminSubscriptions'));
const AdminBlog = lazy(() => import('@/components/admin/AdminBlog'));

const RouteLoader = () => (
  <div className="flex justify-center py-12">
    <div className="h-8 w-8 animate-spin rounded-full border-4 border-kl-orange border-t-transparent" />
  </div>
);



const sections = ADMIN_NAV.map((section) => ({
  title: section.title,
  items: section.items.map((item) => ({
    id: item.id,
    label: item.label,
    icon: item.icon,
    path: item.path,
  })),
}));

export default function AdminDashboard() {
  const { user } = useAuth();

  return (
    <DashboardLayout
      title="Admin Dashboard"
      sections={sections}
      userName={user?.fullName || 'Admin'}
      userRole="ADMIN"
      userAvatar={ user?.fullName?.[0]?.toUpperCase() || 'A'}
    >
      <Suspense fallback={<RouteLoader />}>
        <Routes>
          <Route index element={<AdminHome />} />
          <Route path="patients" element={<AdminPatients />} />
          <Route path="nutritionists" element={<AdminNutritionists />} />
          <Route path="inquiries" element={<AdminInquiries />} />
          <Route path="analytics" element={<AdminAnalytics />} />
          <Route path="subscriptions" element={<AdminSubscriptions />} />
          <Route path="blog" element={<AdminBlog />} />
          <Route path="audit-logs" element={<AdminAuditLogs />} />
          <Route path="*" element={<Navigate to="/admin" replace />} />
        </Routes>
      </Suspense>
    </DashboardLayout>
  );
}