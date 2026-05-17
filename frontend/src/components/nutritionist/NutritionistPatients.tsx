// src/components/nutritionist/NutritionistPatients.tsx
import { useEffect, useState, useMemo } from "react";
import { nutritionistPatientsApi } from "@/services/api";
import type { PatientProfile } from "@/types/api";
import { useNavigate, useParams } from "react-router-dom";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Avatar,
  AvatarFallback,
  Badge,
  Input,
  Button,
  ScrollArea,
  Skeleton,
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from "@/components/ui";
import {
  Search,
  ArrowLeft,
  User,
  Heart,
  Apple,
  Droplets,
  Moon,
  Coffee,
  Target,
  Activity,
  AlertCircle,
  Star,
  Utensils,
  Ruler,
  Weight,
  Calendar,
  ActivitySquare,
  Info,
  ClipboardList,
  Users,
} from "lucide-react";

export default function NutritionistPatients() {
  const navigate = useNavigate();
  const { patientId } = useParams<{ patientId: string }>();
  const [patients, setPatients] = useState<PatientProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedPatientDetail, setSelectedPatientDetail] = useState<PatientProfile | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  // Fetch patients list on mount
  useEffect(() => {
    nutritionistPatientsApi
      .my()
      .then((r) => setPatients(r.patients ?? []))
      .catch((e) => setError(e instanceof Error ? e.message : "Failed to load"))
      .finally(() => setLoading(false));
  }, []);

  // Fetch full patient details when patientId changes
  useEffect(() => {
    if (!patientId) {
      setSelectedPatientDetail(null);
      return;
    }
    const id = parseInt(patientId, 10);
    setDetailLoading(true);
    nutritionistPatientsApi
      .byId(id)
      .then((r) => setSelectedPatientDetail(r.patient ?? null))
      .catch((e) => console.error("Failed to load patient details", e))
      .finally(() => setDetailLoading(false));
  }, [patientId]);

  const filteredPatients = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return patients;
    return patients.filter(
      (p) =>
        p.user.fullName.toLowerCase().includes(q) ||
        p.user.email.toLowerCase().includes(q)
    );
  }, [patients, searchQuery]);

  const selectedPatient = useMemo(() => {
    if (!patientId) return null;
    const id = parseInt(patientId, 10);
    return patients.find((p) => p.id === id) ?? null;
  }, [patients, patientId]);

  const handleSelectPatient = (id: number) => {
    navigate(`/nutritionist/patients/${id}`);
  };

  const handleBackToList = () => {
    navigate("/nutritionist/patients");
  };

  const getPatientName = (p: PatientProfile) => p.user.fullName ?? `Client #${p.id}`;
  const getPatientEmail = (p: PatientProfile) => p.user.email ?? "";

  const isMobile = typeof window !== "undefined" && window.innerWidth < 768;
  const showList = !patientId || (isMobile && !patientId);
  const showDetails = patientId && selectedPatientDetail;

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Skeleton className="h-10 w-72" />
        </div>
        <div className="grid gap-4 md:grid-cols-[300px_1fr]">
          <div className="space-y-2">
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
          </div>
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-destructive">
          {error}
        </CardContent>
      </Card>
    );
  }

  if (patients.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-muted-foreground">
          <Users className="mx-auto mb-3 h-8 w-8 opacity-40" />
          <p>No clients assigned yet.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Search bar */}
      {(showList || !isMobile) && (
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search clients by name or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
      )}

      <div className="grid gap-5 md:grid-cols-[300px_1fr]">
        {/* Sidebar – patient list */}
        {(showList || !isMobile) && (
          <Card className="overflow-hidden">
            <CardHeader className="border-b p-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Users className="h-4 w-4" />
                Clients
              </CardTitle>
            </CardHeader>
            <ScrollArea className="h-[calc(100vh-250px)]">
              <div className="space-y-0.5 p-2">
                {filteredPatients.length === 0 ? (
                  <div className="py-8 text-center text-sm text-muted-foreground">
                    No matching clients.
                  </div>
                ) : (
                  filteredPatients.map((p) => {
                    const isActive = selectedPatient?.id === p.id;
                    return (
                      <button
                        key={p.id}
                        onClick={() => handleSelectPatient(p.id)}
                        className={`flex w-full items-center gap-3 rounded-lg p-2 text-left transition-colors ${
                          isActive ? "bg-primary/10" : "hover:bg-muted"
                        }`}
                      >
                        <Avatar className="h-9 w-9">
                          <AvatarFallback
                            className={isActive ? "bg-primary text-primary-foreground" : ""}
                          >
                            {getPatientName(p)[0]?.toUpperCase() || "P"}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0 flex-1">
                          <div className="truncate text-sm font-medium">
                            {getPatientName(p)}
                          </div>
                          <div className="truncate text-xs text-muted-foreground">
                            {getPatientEmail(p)}
                          </div>
                        </div>
                      </button>
                    );
                  })
                )}
              </div>
            </ScrollArea>
          </Card>
        )}

        {/* Detail area */}
        {showDetails && selectedPatientDetail ? (
          detailLoading ? (
            <Card>
              <CardContent className="py-8">
                <div className="space-y-2">
                  <Skeleton className="h-8 w-48" />
                  <Skeleton className="h-32 w-full" />
                </div>
              </CardContent>
            </Card>
          ) : (
            <PatientDetailView patient={selectedPatientDetail} onBack={isMobile ? handleBackToList : undefined} />
          )
        ) : patientId && !selectedPatientDetail && !detailLoading ? (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              Client not found.
            </CardContent>
          </Card>
        ) : !patientId && !isMobile ? (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              <User className="mx-auto mb-3 h-8 w-8 opacity-40" />
              <p>Select a client from the list to view details.</p>
            </CardContent>
          </Card>
        ) : null}
      </div>
    </div>
  );
}

// ------------------------------------------------------------
// Detailed view component with tabs (professional icons)
// ------------------------------------------------------------
function PatientDetailView({ patient, onBack }: { patient: PatientProfile; onBack?: () => void }) {
  const [tab, setTab] = useState<"overview" | "measurements" | "lifestyle">("overview");

  const sortedMeasurements = [...(Array.isArray(patient.measurements) ? patient.measurements : [])].sort(
    (a, b) => new Date(b.recordedAt).getTime() - new Date(a.recordedAt).getTime()
  );

  return (
    <Card>
      <CardHeader className="flex flex-row items-center gap-2 space-y-0 border-b pb-3">
        {onBack && (
          <Button variant="ghost" size="icon" onClick={onBack}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
        )}
        <Avatar className="h-10 w-10">
          <AvatarFallback className="bg-primary text-primary-foreground">
            {patient.user.fullName?.[0]?.toUpperCase() || "P"}
          </AvatarFallback>
        </Avatar>
        <div>
          <CardTitle>{patient.user.fullName}</CardTitle>
          <div className="text-xs text-muted-foreground">{patient.user.email}</div>
        </div>
      </CardHeader>

<Tabs value={tab} onValueChange={(v) => setTab(v as any)} className="w-full">
  <div className="px-4 pt-2">
    <TabsList className="w-full sm:w-auto flex sm:inline-flex gap-1">
      <TabsTrigger value="overview" className="flex-1 sm:flex-initial gap-1.5">
        <Info className="h-4 w-4" />
        <span className="hidden sm:inline">Overview</span>
      </TabsTrigger>
      <TabsTrigger value="measurements" className="flex-1 sm:flex-initial gap-1.5">
        <Ruler className="h-4 w-4" />
        <span className="hidden sm:inline">Measurements</span>
      </TabsTrigger>
      <TabsTrigger value="lifestyle" className="flex-1 sm:flex-initial gap-1.5">
        <ActivitySquare className="h-4 w-4" />
        <span className="hidden sm:inline">Lifestyle & Goals</span>
      </TabsTrigger>
    </TabsList>
  </div>
        {/* TAB 1: Overview */}
        <TabsContent value="overview" className="p-4 pt-2">
          <div className="space-y-4">
            {/* Stats grid – responsive */}
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <StatCard icon={Calendar} label="Age" value={patient.age?.toString() ?? "—"} />
              <StatCard icon={Ruler} label="Height" value={patient.height ? `${patient.height} cm` : "—"} />
              <StatCard icon={Weight} label="Weight" value={patient.weight ? `${patient.weight} kg` : "—"} />
              <StatCard icon={Target} label="Goal Weight" value={patient.goalWeight ? `${patient.goalWeight} kg` : "—"} />
            </div>

            {/* Medical History */}
            {patient.medicalHistory && (
              <InfoBlock icon={Heart} title="Medical History" content={patient.medicalHistory} />
            )}
            {/* Conditions */}
            {patient.conditions?.length > 0 && (
              <TagBlock icon={Activity} title="Conditions" items={patient.conditions} variant="secondary" />
            )}
            {/* Allergies */}
            {patient.allergies?.length > 0 && (
              <TagBlock icon={AlertCircle} title="Allergies" items={patient.allergies} variant="destructive" />
            )}
            {/* Daily Calorie Goal */}
            {patient.dailyCalorieGoal && (
              <InfoBlock icon={Target} title="Daily Calorie Goal" content={`${patient.dailyCalorieGoal} kcal`} />
            )}
          </div>
        </TabsContent>

        {/* TAB 2: Body Measurements */}
        <TabsContent value="measurements" className="p-4 pt-2">
          {sortedMeasurements.length === 0 ? (
            <div className="py-8 text-center text-muted-foreground">No measurement records yet.</div>
          ) : (
            <div className="space-y-3">
              {sortedMeasurements.map((m) => (
                <div key={m.id} className="rounded-lg border p-3">
                  <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
                    <Calendar className="h-3.5 w-3.5" />
                    {new Date(m.recordedAt).toLocaleDateString()}
                  </div>
                  <div className="mt-2 grid grid-cols-2 gap-2 text-sm sm:grid-cols-3 md:grid-cols-4">
                    {m.chest && <MeasurementBadge label="Chest" value={`${m.chest} cm`} />}
                    {m.waist && <MeasurementBadge label="Waist" value={`${m.waist} cm`} />}
                    {m.hips && <MeasurementBadge label="Hips" value={`${m.hips} cm`} />}
                    {m.arm && <MeasurementBadge label="Arm" value={`${m.arm} cm`} />}
                    {m.thigh && <MeasurementBadge label="Thigh" value={`${m.thigh} cm`} />}
                    {m.bodyFat && <MeasurementBadge label="Body Fat" value={`${m.bodyFat}%`} />}
                  </div>
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        {/* TAB 3: Lifestyle & Goals */}
        <TabsContent value="lifestyle" className="p-4 pt-2">
          <div className="space-y-4">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {patient.dietaryPref && <InfoBlock icon={Apple} title="Dietary Preference" content={patient.dietaryPref} />}
              {patient.activityLevel && <InfoBlock icon={Activity} title="Activity Level" content={patient.activityLevel} />}
              {patient.waterIntake && <InfoBlock icon={Droplets} title="Water Intake" content={`${patient.waterIntake} glasses/day`} />}
              {patient.sleepHours && <InfoBlock icon={Moon} title="Sleep" content={`${patient.sleepHours} hours/night`} />}
              {patient.mealsPerDay && <InfoBlock icon={Utensils} title="Meals Per Day" content={patient.mealsPerDay} />}
              {patient.caffeine && <InfoBlock icon={Coffee} title="Caffeine Intake" content={patient.caffeine} />}
              {patient.challenges && <InfoBlock icon={Target} title="Challenges" content={patient.challenges} />}
              {patient.motivation && <InfoBlock icon={Star} title="Motivation" content={patient.motivation} />}
            </div>
            {patient.goals?.length > 0 && (
              <TagBlock icon={ClipboardList} title="Health Goals" items={patient.goals} variant="secondary" />
            )}
          </div>
        </TabsContent>
      </Tabs>
    </Card>
  );
}

// ------------------------------------------------------------
// Helper components
// ------------------------------------------------------------
function StatCard({ icon: Icon, label, value }: { icon: any; label: string; value: string }) {
  return (
    <div className="rounded-lg border bg-muted/30 p-3 text-center">
      <Icon className="mx-auto mb-1 h-4 w-4 text-muted-foreground" />
      <div className="text-xs uppercase text-muted-foreground">{label}</div>
      <div className="text-base font-semibold">{value}</div>
    </div>
  );
}

function InfoBlock({ icon: Icon, title, content }: { icon: any; title: string; content: string }) {
  return (
    <div className="flex items-start gap-2 rounded-lg border p-2">
      <Icon className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
      <div>
        <div className="text-xs font-semibold uppercase text-muted-foreground">{title}</div>
        <div className="text-sm">{content}</div>
      </div>
    </div>
  );
}

function TagBlock({ icon: Icon, title, items, variant }: { icon: any; title: string; items: string[]; variant?: "secondary" | "destructive" }) {
  return (
    <div>
      <div className="mb-1 flex items-center gap-1 text-sm font-semibold">
        <Icon className="h-4 w-4" /> {title}
      </div>
      <div className="flex flex-wrap gap-1">
        {items.map((item, i) => (
          <Badge key={i} variant={variant || "secondary"}>{item}</Badge>
        ))}
      </div>
    </div>
  );
}

function MeasurementBadge({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded bg-muted/30 px-2 py-1 text-center text-xs">
      <span className="text-muted-foreground">{label}:</span> {value}
    </div>
  );
}