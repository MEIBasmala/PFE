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
} from "lucide-react";
import { loadStripe } from '@stripe/stripe-js';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { getPackages, createSubscription } from "@/services/api";
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
} from "@/components/ui";

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);

// Helper to get icon component for plan name
const getPlanIcon = (name: string, size = 28, className = "text-primary") => {
  const iconProps = { size, className, strokeWidth: 1.5 };
  const map: Record<string, React.ReactNode> = {
    Starter: <UtensilsCrossed {...iconProps} />,
    Basic: <Sprout {...iconProps} />,
    Premium: <Star {...iconProps} />,
    Pro: <Flame {...iconProps} />,
    Elite: <Crown {...iconProps} />,
    "Ramadan Reset": <Moon {...iconProps} />,
    "Winter Arc": <Snowflake {...iconProps} />,
    "Summer Shred": <Sun {...iconProps} />,
    "Spring Detox": <Flower2 {...iconProps} />,
  };
  return map[name] || <Sparkles {...iconProps} />;
};

// Helper to build structured features list
const getStructuredFeatures = (pkg: Package) => {
  const aiScans = pkg.aiScansPerDay === 999 ? "Unlimited" : `${pkg.aiScansPerDay} per day`;
  const consultations = pkg.consultationsPerMonth === 0 ? "None" : `${pkg.consultationsPerMonth} per month`;
  const mealPlan = pkg.mealPlanType || (pkg.features.includes("meal plans") ? "Personalised meal plans" : "Pre‑built meal plans");

  return [
    { icon: Bot, label: `${aiScans} AI scans` },
    { icon: Video, label: `${consultations} online consultations` },
    { icon: UtensilsCrossed, label: mealPlan },
    { icon: BookOpen, label: "Full recipe library" },
    { icon: ClipboardList, label: "Food diary & tracking" },
    { icon: MessageSquare, label: "AI chatbot assistant" },
  ];
};

export default function PatientSubscription() {
  const { refreshSubscription, packageInfo, plan } = useSubscription();
  const [allPackages, setAllPackages] = useState<Package[]>([]);
  const [loading, setLoading] = useState(true);
  const [history, setHistory] = useState<Payment[]>([]);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [upgrading, setUpgrading] = useState<string | null>(null);
  const [paymentIntentSecret, setPaymentIntentSecret] = useState<string | null>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  const isSeasonal = (pkg: Package) => pkg.isSeasonal === true || !!pkg.duration;
  const standardPackages = allPackages.filter(p => p.id != null && !isSeasonal(p));
  const seasonalPackages = allPackages.filter(p => p.id != null && isSeasonal(p));

  // Sort standard plans by monthly price ascending
  const sortedStandard = [...standardPackages].sort((a, b) => 
    (a.priceMonthly ?? 0) - (b.priceMonthly ?? 0)
  );

  // Sort seasonal plans by one‑time price ascending (use price, fallback)
  const sortedSeasonal = [...seasonalPackages].sort((a, b) => 
    (a.price ?? a.priceMonthly ?? a.priceYearly ?? 0) - 
    (b.price ?? b.priceMonthly ?? b.priceYearly ?? 0)
  );

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const pkgs = await getPackages();
        setAllPackages(Array.isArray(pkgs) ? pkgs : []);
      } catch (err) {
        console.error(err);
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
        console.error(err);
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
    await refreshSubscription();
    const histRes = await getPaymentHistory();
    setHistory(Array.isArray(histRes) ? histRes : []);
  };

  // Standard plan card
  const StandardCard = ({ pkg, isCurrent }: { pkg: Package; isCurrent: boolean }) => {
    const features = getStructuredFeatures(pkg);
    const priceMonthly = pkg.priceMonthly ?? pkg.priceYearly ?? 0;
    return (
      <Card className={`relative overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-lg ${pkg.highlight ? "border-primary ring-2 ring-primary/20" : ""}`}>
        {pkg.highlight && (
          <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-gradient-to-r from-primary to-orange-500 px-3 py-0.5 text-xs font-bold text-white shadow-md whitespace-nowrap">
            🔥 Most Popular
          </div>
        )}
        <CardContent className="p-4">
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
          <ul className="mt-3 space-y-1">
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
            onClick={() => !isCurrent && upgrade(pkg)}
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

  // Seasonal plan card (complete)
  const SeasonalCard = ({ pkg, isCurrent }: { pkg: Package; isCurrent: boolean }) => {
    const allFeatures = getStructuredFeatures(pkg);
    const displayedFeatures = allFeatures.slice(0, 3);
    const extraCount = allFeatures.length - 3;
    const price = pkg.price ?? pkg.priceMonthly ?? pkg.priceYearly ?? 0;

    return (
      <Card className="relative overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-md">
        <CardContent className="p-4">
          <div className="mb-2 flex items-center justify-between">
            <div className="text-3xl">{getPlanIcon(pkg.name, 28)}</div>
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
              <li className="italic text-muted-foreground text-xs">+ {extraCount} more features</li>
            )}
            {pkg.features && pkg.features.length > 0 && (
              <li className="mt-1 italic text-muted-foreground text-xs">
                + {pkg.features.slice(0, 2).join(", ")}
              </li>
            )}
          </ul>
          <Button
            className="mt-4 w-full"
            variant={isCurrent ? "outline" : "default"}
            onClick={() => !isCurrent && upgrade(pkg)}
            disabled={upgrading === pkg.id.toString() || isCurrent}
          >
            {isCurrent
              ? "Current"
              : upgrading === pkg.id.toString()
              ? "Processing..."
              : "Get Offer →"}
          </Button>
          <div className="mt-2 text-center text-[0.6rem] text-muted-foreground">
            One‑time payment, no renewal
          </div>
        </CardContent>
      </Card>
    );
  };

  // Payment modal
  const PaymentModal = ({ open, onClose, onSuccess }: { open: boolean; onClose: () => void; onSuccess: () => void }) => {
    const stripe = useStripe();
    const elements = useElements();
    const [processing, setProcessing] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!stripe || !elements) return;
      setProcessing(true);
      const { error } = await stripe.confirmPayment({
        elements,
        confirmParams: { return_url: window.location.href },
        redirect: 'if_required',
      });
      if (error) {
        toast.error(error.message);
      } else {
        toast.success('Payment successful! Subscription activated.');
        onSuccess();
      }
      setProcessing(false);
    };

    return (
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent className="max-w-[calc(100vw-2rem)] sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Complete Payment</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <PaymentElement />
            <Button type="submit" disabled={!stripe || processing} className="w-full">
              {processing ? 'Processing...' : 'Pay Now'}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    );
  };

  return (
    <>
      {paymentIntentSecret && (
        <Elements stripe={stripePromise} options={{ clientSecret: paymentIntentSecret }}>
          <PaymentModal
            open={showPaymentModal}
            onClose={() => {
              setShowPaymentModal(false);
              setPaymentIntentSecret(null);
            }}
            onSuccess={onPaymentSuccess}
          />
        </Elements>
      )}

      <div className="space-y-8">
        {/* Current plan summary */}
        <Card className="bg-gradient-to-r from-primary/10 to-background">
          <CardContent className="flex flex-wrap items-center justify-between gap-4 p-4">
            <div>
              <div className="text-xs font-bold uppercase tracking-wide text-primary">
                Current plan
              </div>
              <div className="font-syne text-3xl font-extrabold capitalize">{plan}</div>
              <div className="mt-1 text-sm text-muted-foreground">
                {packageInfo?.features?.slice(0, 2).join(" · ") ||
                  "Free tier — upgrade for premium features"}
              </div>
            </div>
            <Badge variant={packageInfo ? "default" : "secondary"}>
              {packageInfo ? "Active" : "Free"}
            </Badge>
          </CardContent>
        </Card>

        {/* Standard Plans (sorted by price) */}
        <div>
          <div className="mb-5 flex items-center gap-3">
            <div className="h-px flex-1 bg-gradient-to-r from-transparent to-primary"></div>
            <h2 className="flex items-center gap-2 font-syne text-2xl font-bold">
              <Sparkles className="h-5 w-5 text-primary" /> Standard Plans
            </h2>
            <div className="h-px flex-1 bg-gradient-to-l from-transparent to-primary"></div>
          </div>
          {loading ? (
            <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
              {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-96 w-full rounded-xl" />)}
            </div>
          ) : sortedStandard.length === 0 ? (
            <p className="py-8 text-center text-muted-foreground">No plans available</p>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {sortedStandard.map(pkg => (
                <StandardCard key={pkg.id} pkg={pkg} isCurrent={packageInfo?.id === pkg.id} />
              ))}
            </div>
          )}
        </div>

        {/* Seasonal Plans (sorted by one‑time price) */}
        {sortedSeasonal.length > 0 && (
          <div className="mt-8">
            <div className="mb-5 flex items-center gap-3">
              <div className="h-px flex-1 bg-gradient-to-r from-transparent via-amber-500 to-primary"></div>
              <h2 className="flex items-center gap-2 bg-gradient-to-r from-primary to-amber-600 bg-clip-text font-syne text-2xl font-bold text-transparent">
                <Sparkles className="h-5 w-5" /> Seasonal & Special Offers
              </h2>
              <div className="h-px flex-1 bg-gradient-to-l from-transparent via-amber-500 to-primary"></div>
            </div>
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {sortedSeasonal.map(pkg => (
                <SeasonalCard key={pkg.id} pkg={pkg} isCurrent={packageInfo?.id === pkg.id} />
              ))}
            </div>
          </div>
        )}

        {/* Payment History */}
        <Card>
          <CardHeader className="flex flex-row items-center gap-2 space-y-0">
            <CreditCard className="h-5 w-5 text-primary" />
            <CardTitle>Payment History</CardTitle>
          </CardHeader>
          <CardContent>
            {historyLoading ? (
              <Skeleton className="h-20 w-full" />
            ) : history.length === 0 ? (
              <p className="text-sm text-muted-foreground">No payments yet.</p>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {history.map(p => (
                      <TableRow key={p.id}>
                        <TableCell className="whitespace-nowrap">
                          {formatShortDate(p.createdAt)}
                        </TableCell>
                        <TableCell>Subscription payment</TableCell>
                        <TableCell>DZD {p.amount}</TableCell>
                        <TableCell>
                          <Badge variant={p.status === "SUCCESS" ? "default" : "secondary"}>
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
    </>
  );
}