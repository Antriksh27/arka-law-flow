import { Home, Users, UserPlus, Briefcase, Calendar, Gavel, StickyNote, CheckSquare, FileText, Receipt, UsersRound, MessageSquare } from "lucide-react";
import { SlideTabs } from "@/components/ui/slide-tabs";

const navigationItems = [
  {
    label: "Dashboard",
    href: "/",
    icon: Home,
    gradient: "radial-gradient(circle, rgba(234,179,8,0.4) 0%, rgba(234,179,8,0.2) 50%, rgba(234,179,8,0) 100%)",
    iconColor: "text-slate-900",
  },
  {
    label: "Contacts",
    href: "/contacts",
    icon: Users,
    gradient: "radial-gradient(circle, rgba(234,179,8,0.4) 0%, rgba(234,179,8,0.2) 50%, rgba(234,179,8,0) 100%)",
    iconColor: "text-slate-900",
  },
  {
    label: "Clients",
    href: "/clients",
    icon: UserPlus,
    gradient: "radial-gradient(circle, rgba(234,179,8,0.4) 0%, rgba(234,179,8,0.2) 50%, rgba(234,179,8,0) 100%)",
    iconColor: "text-slate-900",
  },
  {
    label: "Cases",
    href: "/cases",
    icon: Briefcase,
    gradient: "radial-gradient(circle, rgba(234,179,8,0.4) 0%, rgba(234,179,8,0.2) 50%, rgba(234,179,8,0) 100%)",
    iconColor: "text-slate-900",
  },
  {
    label: "Appointments",
    href: "/appointments",
    icon: Calendar,
    gradient: "radial-gradient(circle, rgba(234,179,8,0.4) 0%, rgba(234,179,8,0.2) 50%, rgba(234,179,8,0) 100%)",
    iconColor: "text-slate-900",
  },
  {
    label: "Hearings",
    href: "/hearings",
    icon: Gavel,
    gradient: "radial-gradient(circle, rgba(234,179,8,0.4) 0%, rgba(234,179,8,0.2) 50%, rgba(234,179,8,0) 100%)",
    iconColor: "text-slate-900",
  },
  {
    label: "Notes",
    href: "/notes",
    icon: StickyNote,
    gradient: "radial-gradient(circle, rgba(234,179,8,0.4) 0%, rgba(234,179,8,0.2) 50%, rgba(234,179,8,0) 100%)",
    iconColor: "text-slate-900",
  },
  {
    label: "Tasks",
    href: "/tasks",
    icon: CheckSquare,
    gradient: "radial-gradient(circle, rgba(234,179,8,0.4) 0%, rgba(234,179,8,0.2) 50%, rgba(234,179,8,0) 100%)",
    iconColor: "text-slate-900",
  },
  {
    label: "Documents",
    href: "/documents",
    icon: FileText,
    gradient: "radial-gradient(circle, rgba(234,179,8,0.4) 0%, rgba(234,179,8,0.2) 50%, rgba(234,179,8,0) 100%)",
    iconColor: "text-slate-900",
  },
  {
    label: "Invoices",
    href: "/invoices",
    icon: Receipt,
    gradient: "radial-gradient(circle, rgba(234,179,8,0.4) 0%, rgba(234,179,8,0.2) 50%, rgba(234,179,8,0) 100%)",
    iconColor: "text-slate-900",
  },
  {
    label: "Team",
    href: "/team",
    icon: UsersRound,
    gradient: "radial-gradient(circle, rgba(234,179,8,0.4) 0%, rgba(234,179,8,0.2) 50%, rgba(234,179,8,0) 100%)",
    iconColor: "text-slate-900",
  },
  {
    label: "Chat",
    href: "/chat",
    icon: MessageSquare,
    gradient: "radial-gradient(circle, rgba(234,179,8,0.4) 0%, rgba(234,179,8,0.2) 50%, rgba(234,179,8,0) 100%)",
    iconColor: "text-slate-900",
  },
];

export function TopNavBar() {
  return (
    <div className="hidden sm:flex h-16 bg-slate-900 border-b border-white/20 shadow-sm items-center justify-center px-4">
      <SlideTabs items={navigationItems} />
    </div>
  );
}
