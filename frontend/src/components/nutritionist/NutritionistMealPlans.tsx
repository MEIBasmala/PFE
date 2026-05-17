import { useEffect, useState } from "react";
import { toast } from "sonner";
import { nutritionistPatientsApi, nutritionistMealPlansApi } from "@/services/api";
import type { PatientProfile } from "@/types/api";
import { getToken } from "@/services/api/client";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import {
  FileText,
  Upload,
  Trash2,
  Users,
  CalendarDays,
  File,
  Utensils,
} from "lucide-react";

// Types for PDF plan (as returned by backend)
interface PdfMealPlan {
  id: number;
  patientId: number;
  patientName: string;
  title: string;
  notes: string | null;
  pdfUrl: string;
  uploadedAt: string;
  assignedAt: string;
}

export default function NutritionistMealPlans() {
  // Data
  const [patients, setPatients] = useState<PatientProfile[]>([]);
  const [pdfPlans, setPdfPlans] = useState<PdfMealPlan[]>([]);
  const [loading, setLoading] = useState(true);

  // PDF form
  const [pdfPatientId, setPdfPatientId] = useState<number>(0);
  const [pdfTitle, setPdfTitle] = useState("");
  const [pdfNotes, setPdfNotes] = useState("");
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
  // ── Load all data ──────────────────────────────────────────────────────────
  const load = async () => {
    setLoading(true);
    try {
      const [patientsRes, pdfRes] = await Promise.all([
        nutritionistPatientsApi.my(),
        fetch(`${BASE_URL}/nutrition-plans/pdf-plans`, {
          headers: { Authorization: `Bearer ${getToken()}` },
        }).then(res => res.json())
      ]);
      setPatients(patientsRes.patients ?? []);
      if (pdfRes.success) setPdfPlans(pdfRes.plans ?? []);
    } catch (err) {
      toast.error("Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  // ── Submit PDF plan ───────────────────────────────────────────────────────
  const submitPdfPlan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pdfPatientId) { toast.error("Select a client"); return; }
    if (!pdfFile) { toast.error("Select a PDF file"); return; }
    if (pdfFile.type !== "application/pdf") { toast.error("File must be a PDF"); return; }
    if (pdfFile.size > 10 * 1024 * 1024) { toast.error("Max size 10MB"); return; }

    setUploading(true);
    const formData = new FormData();
    formData.append("patientId", String(pdfPatientId));
    formData.append("title", pdfTitle.trim() || "Meal Plan PDF");
    if (pdfNotes.trim()) formData.append("notes", pdfNotes.trim());
    formData.append("pdfFile", pdfFile);

    try {
      const token = getToken();
      const res = await fetch(`${BASE_URL}/nutrition-plans/upload-pdf`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Upload failed");
      toast.success("PDF nutrition plan uploaded");
      setPdfPatientId(0);
      setPdfTitle("");
      setPdfNotes("");
      setPdfFile(null);
      load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to upload PDF");
    } finally {
      setUploading(false);
    }
  };

  // ── Delete any plan ───────────────────────────────────────────────────────
  const removePlan = async (id: number) => {
    try {
      await nutritionistMealPlansApi.remove(id);
      toast.success("Plan deleted");
      load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to delete");
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-6">
        {/* Left side: PDF upload form */}
        <form onSubmit={submitPdfPlan} className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText size={18} /> Upload PDF Meal Plan
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1.5">
                <Label>Client *</Label>
                <Select value={pdfPatientId ? String(pdfPatientId) : ""} onValueChange={(v) => setPdfPatientId(Number(v))}>
                  <SelectTrigger><SelectValue placeholder="Select a client…" /></SelectTrigger>
                  <SelectContent>
                    {patients.map(p => (
                      <SelectItem key={p.id} value={String(p.id)}>{p.user?.fullName ?? `Client #${p.id}`}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Plan title</Label>
                <Input value={pdfTitle} placeholder="e.g. Ketogenic Diet Plan" onChange={e => setPdfTitle(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label>Notes (optional)</Label>
                <textarea
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm resize-none"
                  rows={2}
                  value={pdfNotes}
                  placeholder="Additional instructions…"
                  onChange={e => setPdfNotes(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label>PDF File *</Label>
                <div className="flex items-center gap-2">
                  <Input
                    type="file"
                    accept="application/pdf"
                    onChange={e => setPdfFile(e.target.files?.[0] || null)}
                    className="flex-1"
                  />
                  {pdfFile && <Badge variant="secondary">{pdfFile.name}</Badge>}
                </div>
                <p className="text-xs text-muted-foreground">Max 10MB, PDF only.</p>
              </div>
            </CardContent>
            <CardFooter>
              <Button type="submit" disabled={uploading || !pdfFile || !pdfPatientId}>
                {uploading ? "Uploading…" : "Upload & Assign"} <Upload size={14} className="ml-2" />
              </Button>
            </CardFooter>
          </Card>
        </form>

        {/* Right side: active PDF plans list */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Utensils size={16} /> Active Plans <Badge variant="secondary">{pdfPlans.length}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading && <p className="text-center py-4 text-sm">Loading…</p>}
              {!loading && pdfPlans.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <CalendarDays size={28} className="mx-auto mb-2 opacity-30" />
                  <p className="text-sm">No plans yet. Upload one above.</p>
                </div>
              )}
              <ScrollArea className="h-[520px] pr-2">
                <div className="space-y-3">
                  {pdfPlans.map(p => (
                    <div key={`pdf-${p.id}`} className="rounded-xl border p-3">
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="font-bold text-sm flex items-center gap-1">
                            <File size={12} /> {p.title}
                          </div>
                          <div className="text-xs text-muted-foreground">👤 {p.patientName}</div>
                          <div className="text-xs text-muted-foreground">
                            📅 Uploaded {new Date(p.uploadedAt).toLocaleDateString()}
                          </div>
                        </div>
                        <div className="flex gap-1">
                          <Button variant="outline" size="sm" asChild>
                            <a href={p.pdfUrl} target="_blank" rel="noopener noreferrer">
                              <FileText size={13} />
                            </a>
                          </Button>
                          <Button variant="destructive" size="sm" onClick={() => removePlan(p.id)}>
                            <Trash2 size={13} />
                          </Button>
                        </div>
                      </div>
                      {p.notes && <div className="mt-2 text-xs text-muted-foreground">{p.notes}</div>}
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}