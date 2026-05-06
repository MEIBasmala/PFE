// src/components/shared/ProfileCard.tsx
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface ProfileCardProps {
  name: string;
  email: string;
  role: "PATIENT" | "NUTRITIONIST";
  stats?: { label: string; value: string | number }[];
}

export function ProfileCard({ name, email, role, stats = [] }: ProfileCardProps) {
  const initial = name?.[0]?.toUpperCase() || "U";

  return (
    <Card className="sticky top-4 text-center overflow-hidden">
      {/* Gradient top accent */}
      <div className="h-16 bg-gradient-to-br from-[hsl(var(--green-light))] to-[hsl(var(--orange-20))]" />
      <CardContent className="pt-0 pb-6 px-6">
        {/* Avatar overlapping the gradient */}
        <div className="-mt-8 flex justify-center mb-3">
          <Avatar className="h-16 w-16 ring-4 ring-[hsl(var(--pure-white))]">
            <AvatarFallback className="bg-[hsl(var(--orange))] text-white text-xl font-bold">
              {initial}
            </AvatarFallback>
          </Avatar>
        </div>

        <h3 className="font-syne text-lg font-bold text-[hsl(var(--text-dark))]">
          {name || "—"}
        </h3>
        <p className="text-sm text-[hsl(var(--text-m))] mt-0.5">{email || "—"}</p>

        <Badge variant="outline" className="mt-2 capitalize">
          {role.toLowerCase()}
        </Badge>

        {stats.length > 0 && (
          <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
            {stats.map((stat, i) => (
              <div
                key={i}
                className="rounded-md bg-[hsl(var(--gray-bg))] px-3 py-2 border border-[hsl(var(--gray-line))]"
              >
                <div className="font-syne font-bold text-base text-[hsl(var(--text-dark))]">
                  {stat.value}
                </div>
                <div className="text-xs text-[hsl(var(--text-l))] font-medium uppercase tracking-wide mt-0.5">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}