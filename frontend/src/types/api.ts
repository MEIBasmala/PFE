// ============================================================
// Primitives
// ============================================================

export type ID = number;
export type ISODateString = string;

export type UserRole = "PATIENT" | "NUTRITIONIST" | "ADMIN";

// Shared type for AI-detected food items (replaces scattered `any`)
export type DetectedFoodItems = Record<string, unknown>;

// ============================================================
// Users
// ============================================================

export interface User {
  id: number;
  fullName: string;
  email: string;
  role: UserRole;
  isActive: boolean;
  createdAt: ISODateString;
  updatedAt: ISODateString;
  avatarUrl?: string;
  phone?: string;
}

export type AuthUser = User;

export interface AuthResponse {
  token: string;
  user: User;
}

// ============================================================
// Patient & Nutritionist
// ============================================================

export interface Patient {
  id: number;
  userId: number;
  age?: number;
  weight?: number;
  height?: number;
  goalWeight?: number;
  dailyCalorieGoal?: number;

  allergies: string[];
  conditions: string[];
  goals: string[];
  activityLevel?: string;
  medicalHistory?: string;
  dietaryPref?: string;
  waterIntake?: number;
  sleepHours?: number;
  mealsPerDay?: string;
  caffeine?: string;
  challenges?: string;
  motivation?: string;
  isProfileComplete?: boolean;
  user: User;
  measurements: Measurement[];
}

// ============================================================
// admin
// ============================================================

export interface DashboardStats {
  totalPatients: number;
  totalNutritionists: number;
  activeSubscriptions: number;
  totalRevenue: number;
}

export interface AuditLog {
  id: number;
  action: string;
  targetType: string;
  targetId: number;
  performedAt: string;
  admin: { user: { fullName: string } };
}

export interface SubscriptionWithUser {
  id: number;
  user: { fullName: string; email: string };
  package: Package;
  startDate: string;
  endDate: string;
  status: SubscriptionStatus;  // reuse the existing enum string type
  amount: number;

}

export interface AnalyticsData {
  totalUsers: number;
  activeUsers: number;
  monthlyRevenue: number;
  premiumConversion: number;
  revenueOverview: { value: number; avgPerDay: number; changePercent: number };
  userGrowth: { total: number; newThisMonth: number; growthPercent: number };
  subscriptionDistribution: { label: string; count: number; pct: number }[];
  recentTransactions: { date: string; user: string; plan: string; amount: string; status: string }[];
}

export interface ChatbotStats {
  overview: { totalMessages: number; activePatients: number; avgResponseTime: number };
  providers: { geminiPercentage: number; ollamaPercentage: number; cachePercentage: number };
  intents: { intent: string; count: number; percentage: number }[];
}
export interface ChatMessage {
  role: 'USER' | 'ASSISTANT';
  content: string;
}

export interface ChatStreamCallbacks {
  onToken: (text: string, provider: string) => void;
  onDone: (fullResponse: string, provider: string, intent: string, duration: number) => void;
  onTyping: () => void;
  onError: (message: string) => void;
}

/**
 * Flattened profile used by frontend components.
 * Fields hoisted from `user` for convenience — no redundant aliases.
 */
export interface PatientProfile extends Patient {
  fullName: string; // from user.fullName
  email: string;    // from user.email
  phone?: string;   // from user.phone
}

export interface Nutritionist {
  id: number;
  userId: number;
  specialization?: string;
  bio?: string;
  user: User;
}

export interface Measurement {
  id: number;
  patientId: number;
  chest?: number;
  waist?: number;
  hips?: number;
  arm?: number;
  thigh?: number;
  bodyFat?: number;
  recordedAt: ISODateString;
}

// ============================================================
// Appointments & Slots
// ============================================================

export type AppointmentStatus = "PENDING" | "CONFIRMED" | "CANCELLED" | "COMPLETED";

export interface Appointment {
  id: number;
  patientId: number;
  nutritionistId: number;
  slotId: number;
  status: AppointmentStatus;
  jitsiLink?: string;
  notes?: string;
  createdAt: ISODateString;
  scheduledAt: ISODateString;
   subscriptionId?: number; 
  durationMinutes: number;
  nutritionist: {
    id: number;
    fullName: string;
    userId?: number; 
  };
}

export interface NutritionistAppointment {
  id: number;
  scheduledAt: string; // YYYY-MM-DD
  time: string;               // HH:MM
  status: AppointmentStatus;
  patientName: string;
  notes?: string;
  jitsiLink?: string;
}

export interface AvailableSlot {
  id: number;
  nutritionistId: number;
  date: ISODateString; // YYYY-MM-DD
  startTime: string;   // HH:mm
  endTime: string;     // HH:mm
  duration: number;
  isBooked: boolean;
}

// ============================================================
// Food & Meals
// ============================================================

/** Lowercase variant used in UI/log contexts */
export type MealCategory = "breakfast" | "lunch" | "dinner" | "snack";

/** Uppercase variant used in plan/database contexts */
export type MealType = "BREAKFAST" | "LUNCH" | "DINNER" | "SNACK";

export interface FoodLog {
  id: number;
  patientId: number;
  imageUrl?: string;
  detectedFoods?: DetectedFoodItems;
  totalCalories?: number;
  confidenceScore?: number;
  estimatedAt: ISODateString;
}

export interface AIEstimation {
  id: number;
  foodLogId: number;
  modelVersion?: string;
  detectedItems?: DetectedFoodItems;
  processingTime?: number;
  warning?: boolean; // optional — not always present
}

/** UI-friendly food log shape (e.g. after upload or manual entry) */
export interface UIFoodLog {
  id: number; // consistent with all other entities (was incorrectly `_id`)
  name: string;
  category: MealCategory;
  calories: number;
  imageUrl?: string;
  source: "ai" | "manual" | "plan"| "recipe";
  loggedAt: ISODateString;
  notes?: string;
}

export interface FoodLogUploadResult {
  log: UIFoodLog;
  scansRemaining?: number;
}

// ============================================================
// Nutrition Plans
// ============================================================

export interface FoodItem {
  id: number;
  mealId: number;
  name: string;
  calories: number;
  protein?: number;
  carbs?: number;
  fat?: number;
  portionSize?: string;
}

export interface Meal {
  id: number;
  planId: number;
  dayNumber: number;
  mealType: MealType; // uses shared MealType enum
  instructions?: string;
  foodItems: FoodItem[];
}

export interface NutritionPlan {
  id: number;
  patientId?: number | null;
  nutritionistId?: number | null;
  startDate?: ISODateString | null;
  endDate?: ISODateString | null;
  status: "DRAFT" | "ACTIVE" | "EXPIRED";
  isTemplate: boolean;
  name?: string | null;
  pdfUrl?: string | null;
  pdfNotes?: string | null;
  meals?: any[];             
  createdAt?: ISODateString;
  updatedAt?: ISODateString;
  patient?: Patient | null;
  nutritionist?: Nutritionist | null;
}

/** Lightweight UI plan (e.g. creation form, drafts without an id yet) */
export interface NutritionPlanDraft {
  id?: number;
  patientId: number;
  title: string;
  startDate: string;
  endDate?: string;
  notes?: string;
}

// UI-friendly meal type (with name, calories, macros)
export interface UIMeal {
  id: number;
  name: string;
  calories: number;
  macros: { protein: number; carbs: number; fat: number };
  mealType: string;
  dayNumber: number;
}

// UI-friendly day structure
export interface UIDay {
  day: number;
  meals: UIMeal[];
}

// UI-friendly plan (with days, title, dailyCalorieTarget)
export interface UIPlan {
  id: number;
  title: string;
  days: { day: number; meals: any[] }[];
  dailyCalorieTarget: number;
  status: string;
  startDate: string;
  endDate: string;
}

export interface Progress {
  id: number;
  patientId: number;
  nutritionistId?: number;
  weight: number;
  goalWeight?: number;
  nutritionistNotes?: string;
  recordedAt: ISODateString;
}

export interface ProgressPhoto {
  id: number;
  patientId: number;
  photoUrl: string;
  month: string;   // YYYY-MM
  notes?: string;
  createdAt: ISODateString;
}

// ============================================================
// Recipes
// ============================================================

export interface Recipe {
  id: string;
  name: string;
  emoji: string;
  kcal: number;
  protein: number;
  carbs: number;
  fat: number;
  category: string;
  tags: string[];
  imageUrl?: string;
  prepTime: string;
  description?: string;
  difficulty?: string;
  ingredients: string[];
  instructions: string[];
}

// ============================================================
// Messaging
// ============================================================

export interface Message {
  id: number;
  senderId: number;
  receiverId: number;
  content: string;
  imageUrl?: string; 
  isRead: boolean;
  sentAt: ISODateString;
  sender: { id: number; fullName: string; role: UserRole };
  receiver: { id: number; fullName: string; role: UserRole };
}

export interface Conversation {
  id: string | number;
  participant: {
    id: number;
    fullName: string;
    role: UserRole;
    avatarUrl?: string;
  };
  lastMessage?: {
    content: string;
    sentAt: ISODateString;
    isRead: boolean;
  };
  unreadCount: number;
}

// ============================================================
// Subscriptions & Payments
// ============================================================
export type SubscriptionStatus = "ACTIVE" | "EXPIRED" | "CANCELLED"; 

export interface Package {
  id: number;
  name: string;
  tier: string;
  priceMonthly?: number;
  priceYearly?: number;
  price?: number;    // seasonal       
  duration?: string;
  currency?: string;
  aiScansPerDay: number;
  consultationsPerMonth: number;
  chatbot: boolean;
  mealPlanType?: string;
  highlight: boolean;
  isSeasonal: boolean;
  features: string[];
}

export interface Subscription {
  id: number;
  patientId: number;
  packageId: number;
  startDate: ISODateString;
  endDate: ISODateString;
  status: SubscriptionStatus;
  stripeSubscriptionId?: string;
  package: Package;
}
export type PaymentStatus = "PENDING" | "SUCCESS" | "FAILED";

export interface Payment {
  id: number;
  subscriptionId: number;
  amount: number;
  currency?: string;
  status: PaymentStatus,
  stripePaymentIntentId?: string;
  createdAt: ISODateString;
}

// ============================================================
// Blog, Inquiries, Notifications
// ============================================================

export interface BlogArticle {
  id: number;
  adminId: number;
  admin?: {
    user: {
      id: number;
      fullName: string;
      email: string;
    };
  };
  title: string;
  content: string;
  category?: string;
  coverImage?: string;
  status: "DRAFT" | "PUBLISHED";
  publishedAt?: ISODateString;
  createdAt: ISODateString;
  likes?: number;
  readMinutes?: number;
  comments?: Comment[];
}


export interface Comment {
  id: number;
  articleId: number;
  patientId: number;
  content: string;
  createdAt: ISODateString;
  patient?: {
    id: number;
    user: {
      id: number;
      fullName: string;
      email: string;
    };
  };
}

export interface Inquiry {
  id: number;
  patientId: number;
  adminId?: number;
  subject: string;
  message: string;
  reply?: string;
  status: "UNREAD" | "PENDING" | "RESOLVED";
  submittedAt: ISODateString;
  repliedAt?: ISODateString;
   patient?: {
    user: {
      id: number;
      fullName: string;
      email: string;
    };
  };
  admin?: {
    user: {
      id: number;
      fullName: string;
    };
  };
}

export interface Notification {
  id: number;
  userId: number;
  type: "PLAN" | "APPOINTMENT" | "PAYMENT" | "MESSAGE";
  message: string;
  isRead: boolean;
  createdAt: ISODateString;
}

//===========================================================
// homepage
// ============================================================
export interface BlogPost {
  id: number;
  title: string;
  category: string;
  excerpt: string;
  author: string;
  date: string;
  readTime: string;
  likes: number;
  comments: number;
  imageUrl?: string;
}

export interface ContactPayload {
  name: string;
  email: string;
  message: string;
}