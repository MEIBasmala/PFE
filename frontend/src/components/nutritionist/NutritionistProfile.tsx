import { useEffect, useState } from "react";
import { toast } from "sonner";
import { nutritionistProfileApi, changePassword } from "@/services/api";
import type { Nutritionist } from "@/types/api";
import { useAuth } from "@/contexts/AuthContext";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardFooter,
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
  Label,
  Input,
  Textarea,
  Button,
  Skeleton,
  Progress,
} from "@/components/ui";
import { ProfileCard } from "@/components/ui/ProfileCard";

function getPasswordStrength(password: string): { score: number; label: string } {
  let score = 0;
  if (password.length >= 8) score++;
  if (password.match(/[a-z]/) && password.match(/[A-Z]/)) score++;
  if (password.match(/\d/)) score++;
  if (password.match(/[^a-zA-Z\d]/)) score++;
  const labels = ["Too short", "Weak", "Okay", "Strong", "Excellent"];
  return { score, label: labels[Math.min(score, 4)] };
}

export default function NutritionistProfile() {
  const { user, updateUser } = useAuth();
  const [form, setForm] = useState<Partial<Nutritionist>>({});
  const [specialtiesText, setSpecialtiesText] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const loadProfile = async () => {
      setLoading(true);
      setError(null);
      try {
        const result = await nutritionistProfileApi.get();
        // The backend returns { success: true, profile: Nutritionist }
        const profile = result.profile;
        setForm(profile);
        setSpecialtiesText(profile.specialization ?? "");
      } catch (err) {
        console.error("Failed to load profile:", err);
        setError(err instanceof Error ? err.message : "Failed to load profile");
        toast.error("Failed to load profile");
      } finally {
        setLoading(false);
      }
    };
    loadProfile();
  }, []);

  // ✅ Save with flat payload (matches backend expectations)
  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.user?.fullName?.trim()) {
      toast.error("Full name is required");
      return;
    }
    setSaving(true);
    try {
      const payload = {
        fullName: form.user.fullName,
        email: form.user.email,
        specialization: specialtiesText,
        bio: form.bio,
      };
      const { profile } = await nutritionistProfileApi.update(payload);
      setForm(profile);
      if (user) {
        updateUser({ ...user, fullName: profile.user.fullName, email: profile.user.email });
      }
      toast.success("Profile updated");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Update failed");
    } finally {
      setSaving(false);
    }
  };

  const handleFieldChange = (field: keyof Nutritionist, value: any) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleUserChange = (field: "fullName" | "email", value: string) => {
    setForm((prev) => ({
      ...prev,
      user: {
        ...prev.user!,
        id: prev.user?.id || 0,
        role: "NUTRITIONIST",
        isActive: true,
        createdAt: "",
        updatedAt: "",
        fullName: prev.user?.fullName || "",
        email: prev.user?.email || "",
        [field]: value,
      },
    }));
  };

  if (loading) {
    return (
      <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
        <Skeleton className="h-64 w-full" />
        <div className="space-y-4">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-96 w-full" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Card className="mx-auto max-w-md text-center">
        <CardContent className="py-12">
          <p className="text-destructive">Error: {error}</p>
          <Button variant="outline" className="mt-4" onClick={() => window.location.reload()}>
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  const stats = [
    { label: "Specialization", value: form.specialization || "—" },
    { label: "Patients", value: "—" },
  ];

  return (
    <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
      <ProfileCard
        name={form.user?.fullName || ""}
        email={form.user?.email || ""}
        role="NUTRITIONIST"
        stats={stats}
      />

      <div className="space-y-4">
        <Tabs defaultValue="profile">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="profile">Profile</TabsTrigger>
            <TabsTrigger value="security">Security</TabsTrigger>
          </TabsList>

          <TabsContent value="profile">
            <form onSubmit={save}>
              <Card>
                <CardHeader>
                  <CardTitle>Professional Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Full Name</Label>
                    <Input
                      value={form.user?.fullName ?? ""}
                      onChange={(e) => handleUserChange("fullName", e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Email</Label>
                    <Input
                      type="email"
                      value={form.user?.email ?? ""}
                      onChange={(e) => handleUserChange("email", e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Specialization</Label>
                    <Input
                      value={specialtiesText}
                      onChange={(e) => setSpecialtiesText(e.target.value)}
                      placeholder="e.g., Weight Management, Sports Nutrition"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Bio</Label>
                    <Textarea
                      rows={4}
                      value={form.bio ?? ""}
                      onChange={(e) => handleFieldChange("bio", e.target.value)}
                    />
                  </div>
                </CardContent>
                <CardFooter className="justify-end">
                  <Button type="submit" disabled={saving}>
                    {saving ? "Saving…" : "Save changes"}
                  </Button>
                </CardFooter>
              </Card>
            </form>
          </TabsContent>

          <TabsContent value="security">
            <SecurityPanel />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

// Security panel (unchanged, but ensure changePassword uses correct endpoint)
function SecurityPanel() {
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [saving, setSaving] = useState(false);
  const strength = getPasswordStrength(next);
  const strengthPercent = (strength.score / 4) * 100;

  const submit = async () => {
    if (!current || !next) {
      toast.error("Please fill in all fields");
      return;
    }
    if (next !== confirm) {
      toast.error("New passwords do not match");
      return;
    }
    if (strength.score < 2) {
      toast.error("Password is too weak. Use at least 8 characters with mixed case, numbers, and symbols.");
      return;
    }
    setSaving(true);
    try {
      await changePassword(current, next);
      toast.success("Password updated successfully");
      setCurrent("");
      setNext("");
      setConfirm("");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to change password");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Change Password</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label>Current Password</Label>
          <Input
            type="password"
            value={current}
            onChange={(e) => setCurrent(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label>New Password</Label>
          <Input
            type="password"
            value={next}
            onChange={(e) => setNext(e.target.value)}
          />
          {next && (
            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span>Strength: {strength.label}</span>
                <span>{strength.score}/4</span>
              </div>
              <Progress value={strengthPercent} className="h-1.5" />
              {strength.score < 2 && (
                <p className="text-xs text-destructive">
                  Use at least 8 characters with uppercase, lowercase, number, and symbol.
                </p>
              )}
            </div>
          )}
        </div>
        <div className="space-y-2">
          <Label>Confirm New Password</Label>
          <Input
            type="password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
          />
          {confirm && next !== confirm && (
            <p className="text-xs text-destructive">Passwords do not match</p>
          )}
        </div>
      </CardContent>
      <CardFooter>
        <Button onClick={submit} disabled={saving}>
          {saving ? "Updating…" : "Change Password"}
        </Button>
      </CardFooter>
    </Card>
  );
}