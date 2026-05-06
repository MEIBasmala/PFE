// src/config/adminNav.ts

export const ADMIN_NAV = [
  {
    title: "Main",
    items: [
      { id: "dashboard", path: "/admin", label: "Dashboard", icon: "dashboard" },        // ✅ FA alias for tachometer-alt
      { id: "analytics", path: "/admin/analytics", label: "Chatbot Analytics", icon: "chart-line" }, // ✅ line chart
    ],
  },
  {
    title: "Management",
    items: [
      { id: "patients", path: "/admin/patients", label: "Patients", icon: "users" },           // ✅ matches patient "users"
      { id: "nutritionists", path: "/admin/nutritionists", label: "Nutritionists", icon: "stethoscope" }, // ✅ works
      { id: "inquiries", path: "/admin/inquiries", label: "Inquiries", icon: "envelope" },     // ✅ works (like messages)
      { id: "blog", path: "/admin/blog", label: "Blog", icon: "newspaper" },                   // ✅ works (patient uses same)
      { id: "subscription", path: "/admin/subscriptions", label: "Subscription", icon: "credit-card" }, // ✅ works
    ],
  },
  {
    title: "Insights",
    items: [
      { id: "audit-logs", path: "/admin/audit-logs", label: "Audit Logs", icon: "file-alt" },  // ✅ works (document)
    ],
  },
];