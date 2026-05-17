export const NUTRITIONIST_NAV = [
  {
    title: "Main",
    items: [
      { id: "dashboard", label: "Overview", icon: "chart-line", path: "/nutritionist" },
      { id: "patients", label: "My Clients", icon: "users", path: "/nutritionist/patients" },
      { id: "appointments", label: "Appointments", icon: "calendar-alt", path: "/nutritionist/appointments" },
      { id: "messages", label: "Messages", icon: "comments", path: "/nutritionist/messages" },
    ],
  },
  {
    title: "Client Management",
    items: [
      { id: "nutrition-plans", label: "Nutrition Plans", icon: "utensils", path: "/nutritionist/nutrition-plans" },
    ],
  },
  {
    title: "Account",
    items: [
      { id: "availability", label: "Availability", icon: "clock", path: "/nutritionist/availability" },
    ],
  },
];