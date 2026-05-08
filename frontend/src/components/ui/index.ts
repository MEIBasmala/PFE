// src/components/ui/index.ts

// ─── Accordion ─────────────────────────────────────────────
export {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from './accordion';

// ─── Alert ────────────────────────────────────────────────
export { Alert, AlertTitle, AlertDescription } from './alert';

// ─── Alert Dialog ─────────────────────────────────────────
export {
  AlertDialog,
  AlertDialogPortal,
  AlertDialogOverlay,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogAction,
  AlertDialogCancel,
} from './alert-dialog';

// ─── Aspect Ratio ─────────────────────────────────────────
export { AspectRatio } from './aspect-ratio';

// ─── Avatar ───────────────────────────────────────────────
export { Avatar, AvatarImage, AvatarFallback } from './avatar';

// ─── Badge ────────────────────────────────────────────────
export { Badge, badgeVariants } from './badge';

// ─── Breadcrumb ───────────────────────────────────────────
export {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
  BreadcrumbEllipsis,
} from './breadcrumb';

// ─── Button ───────────────────────────────────────────────
export { Button, buttonVariants } from './button';

// ─── Calendar ─────────────────────────────────────────────
export { Calendar } from './calendar';

// ─── Card ─────────────────────────────────────────────────
export {
  Card,
  CardHeader,
  CardFooter,
  CardTitle,
  CardDescription,
  CardContent,
} from './card';

// ─── Carousel ─────────────────────────────────────────────
export {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselPrevious,
  CarouselNext,
  type CarouselApi,
} from './carousel';

// ─── Chart (Recharts) ─────────────────────────────────────
export {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
  ChartStyle,
} from './chart';

// ─── Checkbox ─────────────────────────────────────────────
export { Checkbox } from './checkbox';

// ─── Collapsible ──────────────────────────────────────────
export { Collapsible, CollapsibleTrigger, CollapsibleContent } from './collapsible';

// ─── Command (cmd-k) ──────────────────────────────────────
export {
  Command,
  CommandDialog,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandShortcut,
  CommandSeparator,
} from './command';

// ─── Confirm Dialog ───────────────────────────────────────
export { default as ConfirmDialog } from './ConfirmDialog';

// ─── Context Menu ─────────────────────────────────────────
export {
  ContextMenu,
  ContextMenuTrigger,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuCheckboxItem,
  ContextMenuRadioItem,
  ContextMenuLabel,
  ContextMenuSeparator,
  ContextMenuShortcut,
  ContextMenuGroup,
  ContextMenuPortal,
  ContextMenuSub,
  ContextMenuSubContent,
  ContextMenuSubTrigger,
  ContextMenuRadioGroup,
} from './context-menu';

// ─── Dialog ───────────────────────────────────────────────
export {
  Dialog,
  DialogPortal,
  DialogOverlay,
  DialogClose,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
} from './dialog';

// ─── Drawer (Vaul) ────────────────────────────────────────
export {
  Drawer,
  DrawerPortal,
  DrawerOverlay,
  DrawerTrigger,
  DrawerClose,
  DrawerContent,
  DrawerHeader,
  DrawerFooter,
  DrawerTitle,
  DrawerDescription,
} from './drawer';

// ─── Dropdown Menu ────────────────────────────────────────
export {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuCheckboxItem,
  DropdownMenuRadioItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuGroup,
  DropdownMenuPortal,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuRadioGroup,
} from './dropdown-menu';

// ─── Form (react-hook-form) ───────────────────────────────
export {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormDescription,
  FormMessage,
  useFormField,
} from './form';

// ─── Hover Card ───────────────────────────────────────────
export { HoverCard, HoverCardTrigger, HoverCardContent } from './hover-card';

// ─── Input ────────────────────────────────────────────────
export { Input } from './input';

// ─── Input OTP ────────────────────────────────────────────
export { InputOTP, InputOTPGroup, InputOTPSlot, InputOTPSeparator } from './input-otp';

// ─── KhabirLens custom state components ───────────────────
export { KlSkeleton, KlError } from './KlState';

// ─── Label ────────────────────────────────────────────────
export { Label } from './label';

// ─── Menubar ──────────────────────────────────────────────
export {
  Menubar,
  MenubarMenu,
  MenubarTrigger,
  MenubarContent,
  MenubarItem,
  MenubarSeparator,
  MenubarLabel,
  MenubarCheckboxItem,
  MenubarRadioGroup,
  MenubarRadioItem,
  MenubarPortal,
  MenubarSubContent,
  MenubarSubTrigger,
  MenubarGroup,
  MenubarSub,
  MenubarShortcut,
} from './menubar';

// ─── Messages UI (full chat component) ────────────────────
export { default as MessagesUI } from './MessagesUI';

// ─── Navigation Menu ──────────────────────────────────────
export {
  navigationMenuTriggerStyle,
  NavigationMenu,
  NavigationMenuList,
  NavigationMenuItem,
  NavigationMenuContent,
  NavigationMenuTrigger,
  NavigationMenuLink,
  NavigationMenuIndicator,
  NavigationMenuViewport,
} from './navigation-menu';

// ─── Notification Dropdown ────────────────────────────────
export { default as NotificationDropdown } from './NotificationDropdown';

// ─── Pagination ───────────────────────────────────────────
export {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from './pagination';

// ─── Popover ──────────────────────────────────────────────
export { Popover, PopoverTrigger, PopoverContent } from './popover';

// ─── Profile Card ─────────────────────────────────────────
export { ProfileCard } from './ProfileCard';

// ─── Progress ─────────────────────────────────────────────
export { Progress } from './progress';

// ─── Radio Group ──────────────────────────────────────────
export { RadioGroup, RadioGroupItem } from './radio-group';

// ─── Resizable Panels ─────────────────────────────────────
export { ResizablePanelGroup, ResizablePanel, ResizableHandle } from './resizable';

// ─── Scroll Area ──────────────────────────────────────────
export { ScrollArea, ScrollBar } from './scroll-area';

// ─── Scroll to Top Button ─────────────────────────────────
export { default as ScrollToTop } from './ScrollToTop';

// ─── Select ───────────────────────────────────────────────
export {
  Select,
  SelectGroup,
  SelectValue,
  SelectTrigger,
  SelectContent,
  SelectLabel,
  SelectItem,
  SelectSeparator,
  SelectScrollUpButton,
  SelectScrollDownButton,
} from './select';

// ─── Separator ────────────────────────────────────────────
export { Separator } from './separator';

// ─── Sheet ────────────────────────────────────────────────
export {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetOverlay,
  SheetPortal,
  SheetTitle,
  SheetTrigger,
} from './sheet';

// ─── Sidebar ──────────────────────────────────────────────
export {
  Sidebar,
  SidebarContent,
  SidebarTrigger,
  SidebarProvider,
  SidebarInset,
  SidebarHeader,
  SidebarFooter,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarMenuAction,
  SidebarMenuBadge,
  SidebarMenuSkeleton,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarRail,
  SidebarSeparator,
  useSidebar,
} from './sidebar';

// ─── Skeleton ─────────────────────────────────────────────
export { Skeleton } from './skeleton';

// ─── Slider ───────────────────────────────────────────────
export { Slider } from './slider';

// ─── Sonner Toaster ───────────────────────────────────────
export { Toaster as SonnerToaster, toast as sonnerToast } from './sonner';

// ─── Switch ───────────────────────────────────────────────
export { Switch } from './switch';

// ─── Table ────────────────────────────────────────────────
export {
  Table,
  TableHeader,
  TableBody,
  TableFooter,
  TableHead,
  TableRow,
  TableCell,
  TableCaption,
} from './table';

// ─── Tabs ─────────────────────────────────────────────────
export { Tabs, TabsList, TabsTrigger, TabsContent } from './tabs';

// ─── Textarea ─────────────────────────────────────────────
export { Textarea } from './textarea';

// ─── Toast (Radix) ────────────────────────────────────────
export {
  ToastProvider,
  ToastViewport,
  Toast,
  ToastTitle,
  ToastDescription,
  ToastClose,
  ToastAction,
  type ToastProps,
  type ToastActionElement,
} from './toast';

// ─── Toaster (Radix toast provider wrapper) ───────────────
export { Toaster as RadixToaster } from './toaster';

// ─── Toggle ───────────────────────────────────────────────
export { Toggle, toggleVariants } from './toggle';

// ─── Toggle Group ─────────────────────────────────────────
export { ToggleGroup, ToggleGroupItem } from './toggle-group';

// ─── Tooltip ──────────────────────────────────────────────
export { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from './tooltip';

// ─── useToast hook (sonner / radix) ───────────────────────
export { useToast, toast } from './use-toast';

// ─── Scroll Reveal Components ─────────────────────────────
export { default as AnimateOnScroll, StaggerContainer } from './AnimateOnScroll';