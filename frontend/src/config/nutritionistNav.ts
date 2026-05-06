export const NUTRITIONIST_NAV = [
  {
    title: "Main",
    items: [
      { id: "dashboard", label: "Overview", icon: "chart-line", path: "/nutritionist" },
      { id: "patients", label: "My Patients", icon: "users", path: "/nutritionist/patients" },
      { id: "appointments", label: "Appointments", icon: "calendar-alt", path: "/nutritionist/appointments" },
      { id: "messages", label: "Messages", icon: "comments", path: "/nutritionist/messages" },
    ],
  },
  {
    title: "Patient Management",
    items: [
      { id: "nutrition-plans", label: "Create Meal Plan", icon: "utensils", path: "/nutritionist/nutrition-plans" },
      { id: "recipes", label: "Recipes", icon: "book-open", path: "/nutritionist/recipes" },
    ],
  },
  {
    title: "Account",
    items: [
      { id: "availability", label: "Availability", icon: "clock", path: "/nutritionist/availability" },
    ],
  },
];