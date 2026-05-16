// src/config/adminNav.ts

export const ADMIN_NAV = [
  {
    title: "Main",
    items: [
      { id: "dashboard", path: "/admin", label: "Dashboard", icon: "dashboard" },      
      { id: "analytics", path: "/admin/analytics", label: "Chatbot Analytics", icon: "chart-line" }, 
    ],
  },
  {
    title: "Management",
    items: [
      { id: "patients", path: "/admin/patients", label: "Clients", icon: "users" },         
      { id: "nutritionists", path: "/admin/nutritionists", label: "Nutritionists", icon: "stethoscope" }, 
      { id: "inquiries", path: "/admin/inquiries", label: "Inquiries", icon: "envelope" },    
      { id: "blog", path: "/admin/blog", label: "Blog", icon: "newspaper" },                   
      { id: "subscription", path: "/admin/subscriptions", label: "Subscription", icon: "credit-card" }, 
    ],
  },
  {
    title: "Insights",
    items: [
      { id: "audit-logs", path: "/admin/audit-logs", label: "Audit Logs", icon: "file-alt" },  
    ],
  },
];