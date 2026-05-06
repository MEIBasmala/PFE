import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const alertVariants = cva(
  [
    "relative w-full rounded-lg border p-4",
    "[&>svg~*]:pl-7 [&>svg+div]:translate-y-[-3px]",
    "[&>svg]:absolute [&>svg]:left-4 [&>svg]:top-4",
    "transition-all duration-200",
  ].join(" "),
  {
    variants: {
      variant: {
        default: [
          "bg-[hsl(var(--green-light)/0.3)] border-[hsl(var(--green))]",
          "text-[hsl(var(--green-dark))]",
          "[&>svg]:text-[hsl(var(--green-dark))]",
        ].join(" "),
        info: [
          "bg-[hsl(var(--saffron-light))] border-[hsl(var(--saffron))]",
          "text-[#8a6200]",
          "[&>svg]:text-[#8a6200]",
        ].join(" "),
        destructive: [
          "bg-[hsl(var(--error-light))] border-[hsl(var(--error))]",
          "text-[hsl(var(--error))]",
          "[&>svg]:text-[hsl(var(--error))]",
        ].join(" "),
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

const Alert = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & VariantProps<typeof alertVariants>
>(({ className, variant, ...props }, ref) => (
  <div ref={ref} role="alert" className={cn(alertVariants({ variant }), className)} {...props} />
));
Alert.displayName = "Alert";

const AlertTitle = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLHeadingElement>>(
  ({ className, ...props }, ref) => (
    <h5
      ref={ref}
      className={cn("mb-1 font-syne font-bold text-sm leading-none tracking-tight", className)}
      {...props}
    />
  ),
);
AlertTitle.displayName = "AlertTitle";

const AlertDescription = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLParagraphElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("text-sm opacity-90 [&_p]:leading-relaxed", className)} {...props} />
  ),
);
AlertDescription.displayName = "AlertDescription";

export { Alert, AlertTitle, AlertDescription };