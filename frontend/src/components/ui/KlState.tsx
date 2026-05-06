import { AlertTriangle } from 'lucide-react';

interface SkeletonProps {
  className?: string;
}

export function KlSkeleton({ className = "h-4 w-full" }: SkeletonProps) {
  return (
    <div
      className={[
        "kl-skeleton rounded-md",
        "bg-gradient-to-r from-[hsl(var(--gray-bg))] via-[hsl(var(--gray-line))] to-[hsl(var(--gray-bg))]",
        "bg-[length:200%_100%]",
        "animate-[shimmer_1.6s_ease-in-out_infinite]",
        className,
      ].join(' ')}
    />
  );
}

export function KlError({ message }: { message: string }) {
  return (
    <div
      className={[
        "kl-card text-center",
        "rounded-lg border border-[hsl(var(--error)/0.3)]",
        "bg-[hsl(var(--error-light))] p-6",
      ].join(' ')}
      role="alert"
    >
      <div className="flex items-center justify-center gap-2 mb-2">
        <AlertTriangle size={16} className="text-[hsl(var(--error))]" />
        <span className="font-syne font-bold text-sm text-[hsl(var(--error))]">
          Something went wrong
        </span>
      </div>
      <p className="text-sm text-[hsl(var(--error)/0.8)]">{message}</p>
    </div>
  );
}