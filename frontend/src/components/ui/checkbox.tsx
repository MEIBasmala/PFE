import * as React from "react";
import * as CheckboxPrimitive from "@radix-ui/react-checkbox";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

const Checkbox = React.forwardRef<
  React.ElementRef<typeof CheckboxPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof CheckboxPrimitive.Root>
>(({ className, ...props }, ref) => (
  <CheckboxPrimitive.Root
    ref={ref}
    className={cn(
      "peer h-4 w-4 shrink-0 rounded-sm",
      "border-[1.5px] border-[hsl(var(--gray-line))]",
      "bg-[hsl(var(--cream-bg))]",
      "ring-offset-background",
      "transition-all duration-200",
      // Checked state — green brand
      "data-[state=checked]:bg-[hsl(var(--green-light))]",
      "data-[state=checked]:border-[hsl(var(--green))]",
      "data-[state=checked]:text-[hsl(var(--green-dark))]",
      // Hover
      "hover:border-[hsl(var(--green))] hover:shadow-[0_0_0_3px_hsl(var(--green-light))]",
      // Focus
      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
      "disabled:cursor-not-allowed disabled:opacity-50",
      className,
    )}
    {...props}
  >
    <CheckboxPrimitive.Indicator className="flex items-center justify-center text-current">
      <Check className="h-3 w-3 stroke-[3]" />
    </CheckboxPrimitive.Indicator>
  </CheckboxPrimitive.Root>
));
Checkbox.displayName = CheckboxPrimitive.Root.displayName;

export { Checkbox };