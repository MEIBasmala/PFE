import { cn } from "@/lib/utils";

function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "rounded-md bg-gradient-to-r",
        "from-[hsl(var(--gray-bg))] via-[hsl(var(--gray-line))] to-[hsl(var(--gray-bg))]",
        "bg-[length:200%_100%]",
        "animate-[shimmer_1.6s_ease-in-out_infinite]",
        className,
      )}
      {...props}
    />
  );
}

// shimmer keyframe — add to your global CSS / tailwind config:
// @keyframes shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }

export { Skeleton };