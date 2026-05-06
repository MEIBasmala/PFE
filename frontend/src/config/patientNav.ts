// src/config/patientNav.ts
export const PATIENT_NAV = [
  {
    title: "Track",
    items: [
      { id: "dashboard", label: "Home", icon: "home", path: "/patient" },
      { id: "ai", label: "AI Tracker", icon: "camera", path: "/patient/ai" },
    ],
  },
  {
    title: "Plan",
    items: [
      { id: "nutrition-plans", label: "Meal Plan", icon: "utensils", path: "/patient/nutrition-plans" },
      { id: "recipes", label: "Recipe Library", icon: "book-open", path: "/patient/recipes" },
    ],
  },

  {
    title: "Connect",
    items: [
      { id: "consultations", label: "Consultations", icon: "video", path: "/patient/consultations" },
      { id: "messages", label: "Messages", icon: "comment-dots", path: "/patient/messages" },
    ],
  },
  {
    title: "Learn",
    items: [
      { id: "blog", label: "Blog", icon: "newspaper", path: "/patient/blog" },
    ],
  },
  {
    title: "Account",
    items: [
      { id: "subscription", label: "Subscription", icon: "credit-card", path: "/patient/subscription" },
      { id: "support", label: "Support", icon: "headset", path: "/patient/support" },
    ],
  },
];