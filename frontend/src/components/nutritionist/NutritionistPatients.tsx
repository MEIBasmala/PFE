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
} from "@/components/ui";
import { Search, ArrowLeft, User } from "lucide-react";

export default function NutritionistPatients() {
  const navigate = useNavigate();
  const { patientId } = useParams<{ patientId: string }>();
  const [patients, setPatients] = useState<PatientProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  // Fetch patients on mount
  useEffect(() => {
    nutritionistPatientsApi
      .my()
      .then((r) => setPatients(r.patients ?? []))
      .catch((e) => setError(e instanceof Error ? e.message : "Failed to load"))
      .finally(() => setLoading(false));
  }, []);

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

  // Loading state
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
          <User className="mx-auto mb-3 h-8 w-8 opacity-40" />
          <p>No patients assigned yet.</p>
        </CardContent>
      </Card>
    );
  }

  // Helper to get patient display name
  const getPatientName = (p: PatientProfile) => p.user.fullName ?? `Patient #${p.id}`;
  const getPatientEmail = (p: PatientProfile) => p.user.email ?? "";

  const isMobile = typeof window !== "undefined" && window.innerWidth < 768;
  const showList = !patientId || (isMobile && !patientId);
  const showDetails = patientId && selectedPatient;

  return (
    <div className="space-y-4">
      {/* Search bar (visible only in list mode on mobile, always on desktop) */}
      {(showList || !isMobile) && (
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search patients by name or email..."
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
              <CardTitle className="text-base">Patients</CardTitle>
            </CardHeader>
            <ScrollArea className="h-[calc(100vh-250px)]">
              <div className="space-y-0.5 p-2">
                {filteredPatients.length === 0 ? (
                  <div className="py-8 text-center text-sm text-muted-foreground">
                    No matching patients.
                  </div>
                ) : (
                  filteredPatients.map((p) => {
                    const isActive = selectedPatient?.id === p.id;
                    return (
                      <button
                        key={p.id}
                        onClick={() => handleSelectPatient(p.id)}
                        className={`flex w-full items-center gap-3 rounded-lg p-2 text-left transition-colors ${
                          isActive
                            ? "bg-primary/10"
                            : "hover:bg-muted"
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
        {showDetails && selectedPatient ? (
          <Card>
            <CardHeader className="flex flex-row items-center gap-2 space-y-0 border-b pb-3">
              {isMobile && (
                <Button variant="ghost" size="icon" onClick={handleBackToList}>
                  <ArrowLeft className="h-4 w-4" />
                </Button>
              )}
              <Avatar className="h-10 w-10">
                <AvatarFallback className="bg-primary text-primary-foreground">
                  {getPatientName(selectedPatient)[0]?.toUpperCase() || "P"}
                </AvatarFallback>
              </Avatar>
              <div>
                <CardTitle>{getPatientName(selectedPatient)}</CardTitle>
                <div className="text-xs text-muted-foreground">
                  {getPatientEmail(selectedPatient)}
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4 pt-4">
              {/* Stats grid */}
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                <StatCard label="Age" value={selectedPatient.age?.toString() ?? "—"} />
                <StatCard label="Height" value={selectedPatient.height ? `${selectedPatient.height} cm` : "—"} />
                <StatCard label="Weight" value={selectedPatient.weight ? `${selectedPatient.weight} kg` : "—"} />
                <StatCard label="Goal Weight" value={selectedPatient.goalWeight ? `${selectedPatient.goalWeight} kg` : "—"} />
              </div>

              {/* Goals */}
              {selectedPatient.goals && selectedPatient.goals.length > 0 && (
                <div>
                  <h4 className="mb-2 text-sm font-semibold">Goals</h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedPatient.goals.map((goal, i) => (
                      <Badge key={i} variant="secondary">
                        {goal}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Allergies */}
              {selectedPatient.allergies && selectedPatient.allergies.length > 0 && (
                <div>
                  <h4 className="mb-2 text-sm font-semibold">Allergies</h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedPatient.allergies.map((allergy, i) => (
                      <Badge key={i} variant="destructive" className="bg-destructive/10 text-destructive">
                        {allergy}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ) : (
          patientId &&
          !selectedPatient && (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                Patient not found.
              </CardContent>
            </Card>
          )
        )}

        {/* Empty state when no patient selected on desktop */}
        {!patientId && !isMobile && (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              <User className="mx-auto mb-3 h-8 w-8 opacity-40" />
              <p>Select a patient from the list to view details.</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

// Helper stat card component
function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border bg-muted/30 p-3 text-center">
      <div className="text-xs uppercase text-muted-foreground">{label}</div>
      <div className="text-base font-semibold">{value}</div>
    </div>
  );
}