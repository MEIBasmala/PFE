// src/components/patient/PatientSubscription.tsx
import { useState, useEffect } from "react";
import {
  CreditCard,
  Sparkles,
  Clock,
  UtensilsCrossed,
  Sprout,
  Star,
  Flame,
  Crown,
  Moon,
  Snowflake,
  Sun,
  Flower2,
  Bot,
  Video,
  BookOpen,
  ClipboardList,
  MessageSquare,
  ShieldCheck,
  Gift,
  CheckCircle2,
} from "lucide-react";

import { loadStripe } from "@stripe/stripe-js";
import {
  Elements,
  PaymentElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";
import { getPackages, createSubscription, cancelSubscription } from "@/services/api";
import { createPaymentIntent, getPaymentHistory } from "@/services/api";
import { useSubscription } from "@/contexts/SubscriptionContext";
import { formatShortDate } from "@/lib/date";
import { toast } from "sonner";
import type { Package, Payment } from "@/types/api";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Button,
  Badge,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
  Skeleton,
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogAction,
  AlertDialogCancel,
} from "@/components/ui";
import { logger } from "@/lib/logger";


const STRIPE_KEY = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;
if (!STRIPE_KEY) {
  logger.error('[PatientSubscription] VITE_STRIPE_PUBLISHABLE_KEY is not set');
}
const stripePromise = STRIPE_KEY ? loadStripe(STRIPE_KEY) : Promise.resolve(null);

// ─── Classifiers ──────────────────────────────────────────────────────────────
const isSeasonal = (pkg: Package) => pkg.isSeasonal === true || !!pkg.duration;
const isFree = (pkg: Package) => !isSeasonal(pkg) && (pkg.priceMonthly ?? 0) === 0;
/** Paid, non-seasonal, no consultations — "maintenance / stay-on-track" tier */
const isEssentials = (pkg: Package) =>
  !isSeasonal(pkg) && !isFree(pkg) && pkg.consultationsPerMonth === 0;
const isStandard = (pkg: Package) =>
  !isSeasonal(pkg) && !isFree(pkg) && !isEssentials(pkg);

// ─── Icon map ─────────────────────────────────────────────────────────────────
const getPlanIcon = (name: string, size = 28, className = "text-primary") => {
  const p = { size, className, strokeWidth: 1.5 };
  const map: Record<string, React.ReactNode> = {
    Starter: <UtensilsCrossed {...p} />,
    Basic: <Sprout {...p} />,
    Premium: <Star {...p} />,
    Pro: <Flame {...p} />,
    Elite: <Crown {...p} />,
    "Ramadan Reset": <Moon {...p} />,
    "Winter Arc": <Snowflake {...p} />,
    "Summer Shred": <Sun {...p} />,
    "Spring Detox": <Flower2 {...p} />,
    Essentials: <ShieldCheck {...p} />,
  };
  return map[name] ?? <Sparkles {...p} />;
};

// ─── Structured feature rows ──────────────────────────────────────────────────
const getStructuredFeatures = (pkg: Package) => {
  const aiScans =
    pkg.aiScansPerDay === 999 ? "Unlimited" : `${pkg.aiScansPerDay} per day`;
  const consultations =
    pkg.consultationsPerMonth === 0
      ? "No consultations"
      : `${pkg.consultationsPerMonth} per month`;
  const mealPlan =
    pkg.mealPlanType ||
    (pkg.features.includes("nutrition plans")
      ? "Personalised nutrition plans"
      : "Pre-built nutrition plans");

  return [
    { icon: Bot, label: `${aiScans} AI scans`, dimmed: false },
    { icon: Video, label: consultations, dimmed: pkg.consultationsPerMonth === 0 },
    { icon: UtensilsCrossed, label: mealPlan, dimmed: false },
    { icon: BookOpen, label: "Full recipe library", dimmed: false },
    { icon: ClipboardList, label: "Food diary & tracking", dimmed: false },
    { icon: MessageSquare, label: "AI chatbot assistant", dimmed: false },
  ];
};

// ─── Section heading ──────────────────────────────────────────────────────────
// Defined at module level (not inside the parent) so it is stable across renders.
const SectionHeading = ({
  icon: Icon,
  label,
  gradient = false,
}: {
  icon: React.ElementType;
  label: string;
  gradient?: boolean;
}) => (
  <div className="mb-5 flex items-center gap-3">
    <div className="h-px flex-1 bg-gradient-to-r from-transparent to-primary/40" />
    <h2
      className={`flex items-center gap-2 font-syne text-xl font-bold sm:text-2xl ${gradient
        ? "bg-gradient-to-r from-primary to-amber-600 bg-clip-text text-transparent"
        : ""
        }`}
    >
      <Icon className="h-5 w-5 text-primary" />
      {label}
    </h2>
    <div className="h-px flex-1 bg-gradient-to-l from-transparent to-primary/40" />
  </div>
);

// ─── Standard plan card ───────────────────────────────────────────────────────
const StandardCard = ({
  pkg,
  isCurrent,
  onUpgrade,
  upgrading,
}: {
  pkg: Package;
  isCurrent: boolean;
  onUpgrade: (pkg: Package) => void;
  upgrading: string | null;
}) => {
  const features = getStructuredFeatures(pkg);
  const priceMonthly = pkg.priceMonthly ?? pkg.priceYearly ?? 0;
  return (
    <Card
      className={`relative overflow-visible transition-all duration-300 hover:-translate-y-1 hover:shadow-lg ${pkg.highlight ? "border-primary ring-2 ring-primary/20" : ""
        }`}
    >
      {pkg.highlight && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-gradient-to-r from-primary to-kl-green px-3 py-0.5 text-xs font-bold text-white shadow-md z-50">
          🔥 Most Popular
        </div>
      )}
      <CardContent className="p-4 sm:p-5">
        <div className="mb-2">{getPlanIcon(pkg.name, 28)}</div>
        <h3 className="font-syne text-lg font-bold">{pkg.name}</h3>
        <div className="mt-1">
          <span className="font-dm-serif text-2xl text-primary">{priceMonthly}</span>
          <span className="text-xs text-muted-foreground"> DZD/mo</span>
        </div>
        {pkg.priceYearly && pkg.priceYearly > 0 && (
          <div className="mt-0.5 text-xs text-muted-foreground">
            or {pkg.priceYearly} DZD/year
          </div>
        )}
        <ul className="mt-3 space-y-1.5">
          {features.map((feat, idx) => (
            <li key={idx} className="flex items-center gap-1.5 text-xs">
              <feat.icon className="h-3 w-3 shrink-0 text-primary" />
              <span className="text-muted-foreground">{feat.label}</span>
            </li>
          ))}
        </ul>
        <Button
          className="mt-4 w-full"
          variant={isCurrent ? "outline" : "default"}
          onClick={() => !isCurrent && onUpgrade(pkg)}
          disabled={upgrading === pkg.id.toString() || isCurrent}
        >
          {isCurrent
            ? "✓ Current Plan"
            : upgrading === pkg.id.toString()
              ? "Processing..."
              : `Choose ${pkg.name} →`}
        </Button>
      </CardContent>
    </Card>
  );
};

// ─── Essentials / Maintenance plan card ──────────────────────────────────────
const EssentialsCard = ({
  pkg,
  isCurrent,
  onUpgrade,
  upgrading,
}: {
  pkg: Package;
  isCurrent: boolean;
  onUpgrade: (pkg: Package) => void;
  upgrading: string | null;
}) => {
  const features = getStructuredFeatures(pkg);
  const priceMonthly = pkg.priceMonthly ?? pkg.priceYearly ?? 0;
  return (
    <Card
      className={`relative overflow-hidden border-dashed transition-all duration-300 hover:-translate-y-1 hover:shadow-md ${isCurrent
        ? "border-primary ring-2 ring-primary/20"
        : "border-muted-foreground/30"
        }`}
    >
      <CardContent className="p-4 sm:p-5">
        <div className="mb-2">{getPlanIcon(pkg.name, 28)}</div>
        <h3 className="font-syne text-lg font-bold">{pkg.name}</h3>
        <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
          Keep your progress going — tracking, AI scans & chatbot included. No
          consultations.
        </p>
        <div className="mt-2">
          <span className="font-dm-serif text-2xl text-primary">{priceMonthly}</span>
          <span className="text-xs text-muted-foreground"> DZD/mo</span>
        </div>
        <ul className="mt-3 space-y-1.5">
          {features.map((feat, idx) => (
            <li
              key={idx}
              className={`flex items-center gap-1.5 text-xs ${feat.dimmed ? "opacity-40" : ""
                }`}
            >
              <feat.icon className="h-3 w-3 shrink-0 text-primary" />
              {/* line-through only on the text span, not the icon */}
              <span
                className={`text-muted-foreground ${feat.dimmed ? "line-through" : ""}`}
              >
                {feat.label}
              </span>
            </li>
          ))}
        </ul>
        <Button
          className="mt-4 w-full"
          variant={isCurrent ? "outline" : "secondary"}
          onClick={() => !isCurrent && onUpgrade(pkg)}
          disabled={upgrading === pkg.id.toString() || isCurrent}
        >
          {isCurrent
            ? "✓ Current Plan"
            : upgrading === pkg.id.toString()
              ? "Processing..."
              : `Stay on ${pkg.name} →`}
        </Button>
      </CardContent>
    </Card>
  );
};

// ─── Seasonal plan card ───────────────────────────────────────────────────────
const SeasonalCard = ({
  pkg,
  isCurrent,
  onUpgrade,
  upgrading,
}: {
  pkg: Package;
  isCurrent: boolean;
  onUpgrade: (pkg: Package) => void;
  upgrading: string | null;
}) => {
  const allFeatures = getStructuredFeatures(pkg);
  const displayedFeatures = allFeatures.slice(0, 3);
  const extraCount = allFeatures.length - 3;
  const price = pkg.price ?? pkg.priceMonthly ?? pkg.priceYearly ?? 0;

  return (
    <Card className="relative overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-md">
      <CardContent className="p-4 sm:p-5">
        <div className="mb-2 flex items-center justify-between">
          <div>{getPlanIcon(pkg.name, 28)}</div>
          <Badge variant="secondary" className="gap-1">
            <Clock className="h-3 w-3" /> Limited time
          </Badge>
        </div>
        <h3 className="font-syne text-xl font-bold">{pkg.name}</h3>
        <div className="mt-1">
          <span className="font-dm-serif text-2xl text-primary">{price}</span>
          <span className="text-sm"> DZD</span>
        </div>
        <div className="mt-0.5 text-xs text-muted-foreground">
          {pkg.duration || "Special offer"}
        </div>
        <ul className="mt-3 space-y-1 text-xs">
          {displayedFeatures.map((feat, idx) => (
            <li key={idx} className="flex items-center gap-2">
              <feat.icon className="h-3 w-3 shrink-0 text-primary" />
              <span>{feat.label}</span>
            </li>
          ))}
          {extraCount > 0 && (
            <li className="text-xs italic text-muted-foreground">
              + {extraCount} more features
            </li>
          )}
          {pkg.features && pkg.features.length > 0 && (
            <li className="mt-1 text-xs italic text-muted-foreground">
              + {pkg.features.slice(0, 2).join(", ")}
            </li>
          )}
        </ul>
        <Button
          className="mt-4 w-full"
          variant={isCurrent ? "outline" : "default"}
          onClick={() => !isCurrent && onUpgrade(pkg)}
          disabled={upgrading === pkg.id.toString() || isCurrent}
        >
          {isCurrent
            ? "Current"
            : upgrading === pkg.id.toString()
              ? "Processing..."
              : "Get Offer →"}
        </Button>
        <div className="mt-2 text-center text-[0.6rem] text-muted-foreground">
          One-time payment, no renewal
        </div>
      </CardContent>
    </Card>
  );
};

// ─── Stripe payment form ──────────────────────────────────────────────────────
// Must be a module-level component (not defined inside the parent) so that
// useStripe / useElements hooks are stable and not recreated on every render.
const StripePaymentForm = ({
  onClose,
  onSuccess,
}: {
  onClose: () => void;
  onSuccess: () => void;
}) => {
  const stripe = useStripe();
  const elements = useElements();
  const [processing, setProcessing] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState<'idle' | 'processing' | 'success' | 'error'>('idle');

  if (!stripe) {
    return (
      <Dialog open onOpenChange={onClose}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Payment Unavailable</DialogTitle>
          </DialogHeader>
          <div className="py-4 text-center">
            <p className="text-sm text-destructive mb-2">
              ⚠️ Payment system is not configured.
            </p>
            <p className="text-xs text-muted-foreground">
              Please contact support or try again later.
            </p>
          </div>
          <Button onClick={onClose} className="w-full">
            Close
          </Button>
        </DialogContent>
      </Dialog>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements) return;
    setProcessing(true);
    setPaymentStatus('processing');

    const { error, paymentIntent } = await stripe.confirmPayment({
      elements,
      confirmParams: { return_url: window.location.href },
      redirect: "if_required",
    });

    if (error) {
      toast.error(error.message);
      logger.error('[StripePaymentForm] Payment failed:', error);
      setPaymentStatus('error');
    } else if (paymentIntent) {
      // Payment succeeded immediately (no redirect needed)
      if (paymentIntent.status === 'succeeded') {
        setPaymentStatus('success');
        toast.success("Payment successful! Activating your subscription...");
        onSuccess();
      } else {
        // Payment requires additional action or is processing
        toast.info("Payment is processing. Please wait...");
      }
    }
    setProcessing(false);
  };

  // Show success state
  if (paymentStatus === 'success') {
    return (
      <Dialog open onOpenChange={onClose}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Payment Successful!</DialogTitle>
          </DialogHeader>
          <div className="py-6 text-center space-y-3">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-green-100 text-green-600">
              <CheckCircle2 className="h-6 w-6" />
            </div>
            <p className="text-sm text-muted-foreground">
              Your subscription is being activated. This may take a few seconds...
            </p>
          </div>
          <Button onClick={onClose} className="w-full">
            Done
          </Button>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="flex max-h-[90dvh] w-[calc(100vw-2rem)] max-w-md flex-col overflow-hidden rounded-xl p-0 sm:w-full">
        <DialogHeader className="shrink-0 border-b px-5 py-4">
          <DialogTitle>Complete Payment</DialogTitle>
        </DialogHeader>
        <div className="flex-1 overflow-y-auto px-5 py-4">
          <form id="stripe-payment-form" onSubmit={handleSubmit} className="space-y-4">
            <PaymentElement />
          </form>
        </div>
        <div className="shrink-0 border-t px-5 py-4">
          <Button
            type="submit"
            form="stripe-payment-form"
            disabled={!stripe || processing}
            className="w-full"
          >
            {processing ? "Processing..." : "Pay Now"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
// ─── Main page ────────────────────────────────────────────────────────────────
export default function PatientSubscription() {
  const { refreshSubscription, packageInfo, plan, subscription } = useSubscription();
  const [allPackages, setAllPackages] = useState<Package[]>([]);
  const [loading, setLoading] = useState(true);
  const [history, setHistory] = useState<Payment[]>([]);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [upgrading, setUpgrading] = useState<string | null>(null);
  const [paymentIntentSecret, setPaymentIntentSecret] = useState<string | null>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [activationPending, setActivationPending] = useState(false);

  const freePlan = allPackages.find((p) => isFree(p));
  const sortedEssentials = allPackages
    .filter((p) => p.id != null && isEssentials(p))
    .sort((a, b) => (a.priceMonthly ?? 0) - (b.priceMonthly ?? 0));
  const sortedStandard = allPackages
    .filter((p) => p.id != null && isStandard(p))
    .sort((a, b) => (a.priceMonthly ?? 0) - (b.priceMonthly ?? 0));
  const sortedSeasonal = allPackages
    .filter((p) => p.id != null && isSeasonal(p))
    .sort(
      (a, b) =>
        (a.price ?? a.priceMonthly ?? a.priceYearly ?? 0) -
        (b.price ?? b.priceMonthly ?? b.priceYearly ?? 0)
    );

  // ── Handle Stripe redirect return ─────────────────────────────────
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('payment') === 'success') {
      window.history.replaceState({}, '', window.location.pathname);
      toast.success("Payment successful! Activating your subscription...");
      startPolling();
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const startPolling = () => {
    setActivationPending(true);
    let attempts = 0;
    const maxAttempts = 10;

    const poll = async () => {
      await refreshSubscription();
      attempts++;

      if (attempts >= maxAttempts) {
        setActivationPending(false);
        toast.info("Your payment was received. Refresh the page if your plan hasn't updated.");
        return;
      }

      // Continue polling regardless — let React re-render with fresh context data
      setTimeout(poll, 1000);
    };

    poll();
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const pkgs = await getPackages();
        setAllPackages(Array.isArray(pkgs) ? pkgs : []);
      } catch (err) {
        logger.error(err);
        toast.error("Could not load subscription plans.");
      } finally {
        setLoading(false);
      }
    };
    const loadHistory = async () => {
      setHistoryLoading(true);
      try {
        const res = await getPaymentHistory();
        setHistory(Array.isArray(res) ? res : []);
      } catch (err) {
        logger.error(err);
      } finally {
        setHistoryLoading(false);
      }
    };
    loadData();
    loadHistory();
  }, []);

  const upgrade = async (pkg: Package) => {
    const amount = pkg.isSeasonal
      ? (pkg.price ?? pkg.priceMonthly ?? pkg.priceYearly ?? 0)
      : (pkg.priceMonthly ?? pkg.priceYearly ?? 0);
    setUpgrading(pkg.id.toString());
    try {
      if (!amount || amount <= 0) {
        await createSubscription(pkg.id.toString());
        toast.success(`Subscribed to ${pkg.name}`);
        await refreshSubscription();
        const histRes = await getPaymentHistory();
        setHistory(Array.isArray(histRes) ? histRes : []);
      } else {
        const { clientSecret } = await createPaymentIntent(pkg.id.toString());
        setPaymentIntentSecret(clientSecret);
        setShowPaymentModal(true);
      }
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setUpgrading(null);
    }
  };

  const onPaymentSuccess = async () => {
    setShowPaymentModal(false);
    setPaymentIntentSecret(null);
    toast.success("Payment successful! Activating your subscription...");
    startPolling();
  };

  const [cancelling, setCancelling] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);

  const handleCancel = async () => {
    setCancelling(true);
    try {
      await cancelSubscription(subscription!.id);
      toast.success("Plan cancelled successfully.");
      await refreshSubscription();
      const histRes = await getPaymentHistory();
      setHistory(Array.isArray(histRes) ? histRes : []);
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setCancelling(false);
      setShowCancelConfirm(false);
    }
  };

  // ── Optional: show a global loading banner while polling ───────
  // You can render this somewhere in your JSX if you want visual feedback
  // {activationPending && <div className="...">Activating your plan...</div>}

  return (
    <>
      {paymentIntentSecret && showPaymentModal && (
        <Elements stripe={stripePromise} options={{ clientSecret: paymentIntentSecret }}>
          <StripePaymentForm
            onClose={() => {
              setShowPaymentModal(false);
              setPaymentIntentSecret(null);
            }}
            onSuccess={onPaymentSuccess}
          />
        </Elements>
      )}

      {/* Optional activation banner */}
      {activationPending && (
        <div className="rounded-lg border border-primary/30 bg-primary/10 px-4 py-3 text-center text-sm animate-pulse">
          🔄 Activating your subscription... please wait
        </div>
      )}


      <div className="space-y-8 px-1 sm:px-0">
        {/* ── Current plan summary ─────────────────────────────────────── */}
        <Card className="bg-gradient-to-r from-primary/10 to-background">
          <CardContent className="flex flex-wrap items-center justify-between gap-4 p-4 sm:p-5">
            <div className="min-w-0">
              <div className="text-xs font-bold uppercase tracking-wide text-primary">
                Current plan
              </div>
              <div className="font-syne text-2xl font-extrabold capitalize sm:text-3xl">
                {plan}
              </div>
              <div className="mt-1 text-sm text-muted-foreground">
                {packageInfo?.features?.slice(0, 2).join(" · ") ||
                  "Free tier — upgrade for premium features"}
              </div>
            </div>
            <Badge variant={packageInfo ? "default" : "secondary"}>
              {packageInfo ? "Active" : "Free"}
            </Badge>
            {subscription && subscription.status === "ACTIVE" && (
              <Button
                size="sm"
                variant="ghost"
                className="text-xs text-destructive hover:bg-destructive/10 hover:text-destructive"
                onClick={() => setShowCancelConfirm(true)}
                disabled={cancelling}
              >
                {cancelling ? "Cancelling..." : "Cancel plan"}
              </Button>
            )}
          </CardContent>
        </Card>

        {/* ── Free plan banner ─────────────────────────────────────────── */}
        {freePlan && (
          <div className="rounded-xl border border-dashed border-muted-foreground/30 bg-muted/30 px-4 py-3 sm:px-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Gift className="h-5 w-5 shrink-0 text-muted-foreground" />
                <div>
                  <span className="font-syne font-semibold">{freePlan.name}</span>
                  <span className="ml-2 text-xs text-muted-foreground">
                    Always free — limited features
                  </span>
                </div>
              </div>
              <Button
                size="sm"
                variant="ghost"
                className="shrink-0 text-xs"
                onClick={() => upgrade(freePlan)}
                // Disabled if already on free plan, or if they have any active paid plan
                // (backend will reject it anyway — this avoids a confusing error toast)
                disabled={
                  upgrading === freePlan.id.toString() ||
                  packageInfo?.id === freePlan.id ||
                  !!packageInfo
                }
              >
                {packageInfo?.id === freePlan.id
                  ? "✓ Active"
                  : packageInfo
                    ? "Cancel current plan first"
                    : "Use Free Plan"}
              </Button>
            </div>
          </div>
        )}

        {/* ── Standard Plans ────────────────────────────────────────────── */}
        <div>
          <SectionHeading icon={Sparkles} label="Standard Plans" />
          {loading ? (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {[...Array(3)].map((_, i) => (
                <Skeleton key={i} className="h-96 w-full rounded-xl" />
              ))}
            </div>
          ) : sortedStandard.length === 0 ? (
            <p className="py-8 text-center text-muted-foreground">No plans available</p>
          ) : (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {sortedStandard.map((pkg) => (
                <StandardCard
                  key={pkg.id}
                  pkg={pkg}
                  isCurrent={packageInfo?.id === pkg.id}
                  onUpgrade={upgrade}
                  upgrading={upgrading}
                />
              ))}
            </div>
          )}
        </div>

        {/* ── Essentials / Maintenance Plans ───────────────────────────── */}
        {!loading && sortedEssentials.length > 0 && (
          <div>
            <SectionHeading icon={ShieldCheck} label="Essentials Plans" />
            <p className="-mt-2 mb-4 text-center text-sm text-muted-foreground">
              Already had a plan? Keep your tracking, diary & AI features active — without
              consultations.
            </p>
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {sortedEssentials.map((pkg) => (
                <EssentialsCard
                  key={pkg.id}
                  pkg={pkg}
                  isCurrent={packageInfo?.id === pkg.id}
                  onUpgrade={upgrade}
                  upgrading={upgrading}
                />
              ))}
            </div>
          </div>
        )}

        {/* ── Seasonal & Special Offers ────────────────────────────────── */}
        {!loading && sortedSeasonal.length > 0 && (
          <div>
            <SectionHeading icon={Sparkles} label="Seasonal & Special Offers" gradient />
            <div className="grid grid-cols-2 gap-5 lg:grid-cols-4">
              {sortedSeasonal.map((pkg) => (
                <SeasonalCard
                  key={pkg.id}
                  pkg={pkg}
                  isCurrent={packageInfo?.id === pkg.id}
                  onUpgrade={upgrade}
                  upgrading={upgrading}
                />
              ))}
            </div>
          </div>
        )}

        {/* ── Payment History ───────────────────────────────────────────── */}
        <Card>
          <CardHeader className="flex flex-row items-center gap-2 space-y-0 p-4 sm:p-6">
            <CreditCard className="h-5 w-5 text-primary" />
            <CardTitle>Payment History</CardTitle>
          </CardHeader>
          <CardContent className="p-0 pb-2">
            {historyLoading ? (
              <Skeleton className="mx-4 mb-4 h-20 w-auto rounded-lg" />
            ) : history.length === 0 ? (
              <p className="px-4 pb-4 text-sm text-muted-foreground">No payments yet.</p>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="whitespace-nowrap">Date</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead className="whitespace-nowrap">Amount</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {history.map((p) => (
                      <TableRow key={p.id}>
                        <TableCell className="whitespace-nowrap">
                          {formatShortDate(p.createdAt)}
                        </TableCell>
                        <TableCell>Subscription payment</TableCell>
                        <TableCell className="whitespace-nowrap">DZD {p.amount}</TableCell>
                        <TableCell>
                          <Badge
                            variant={p.status === "SUCCESS" ? "default" : "secondary"}
                          >
                            {p.status}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      <AlertDialog open={showCancelConfirm} onOpenChange={setShowCancelConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel your plan?</AlertDialogTitle>
            <AlertDialogDescription>
              You'll lose access to premium features at the end of your current billing period.
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={cancelling}>Keep plan</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleCancel}
              disabled={cancelling}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {cancelling ? "Cancelling..." : "Yes, cancel plan"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}