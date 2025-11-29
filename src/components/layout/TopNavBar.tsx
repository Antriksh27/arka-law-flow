import { Home, Users, UserPlus, Briefcase, Calendar, Gavel, StickyNote, CheckSquare, FileText, Receipt, UsersRound, MessageSquare } from "lucide-react";
import { MenuBar } from "@/components/ui/glow-menu";
import { useLocation, useNavigate } from "react-router-dom";

const navigationItems = [
  {
    label: "Dashboard",
    href: "/",
    icon: Home,
    gradient: "radial-gradient(circle, rgba(59,130,246,0.15) 0%, rgba(37,99,235,0.06) 50%, rgba(29,78,216,0) 100%)",
    iconColor: "text-blue-500",
  },
  {
    label: "Contacts",
    href: "/contacts",
    icon: Users,
    gradient: "radial-gradient(circle, rgba(249,115,22,0.15) 0%, rgba(234,88,12,0.06) 50%, rgba(194,65,12,0) 100%)",
    iconColor: "text-orange-500",
  },
  {
    label: "Clients",
    href: "/clients",
    icon: UserPlus,
    gradient: "radial-gradient(circle, rgba(34,197,94,0.15) 0%, rgba(22,163,74,0.06) 50%, rgba(21,128,61,0) 100%)",
    iconColor: "text-green-500",
  },
  {
    label: "Cases",
    href: "/cases",
    icon: Briefcase,
    gradient: "radial-gradient(circle, rgba(239,68,68,0.15) 0%, rgba(220,38,38,0.06) 50%, rgba(185,28,28,0) 100%)",
    iconColor: "text-red-500",
  },
  {
    label: "Appointments",
    href: "/appointments",
    icon: Calendar,
    gradient: "radial-gradient(circle, rgba(168,85,247,0.15) 0%, rgba(147,51,234,0.06) 50%, rgba(126,34,206,0) 100%)",
    iconColor: "text-purple-500",
  },
  {
    label: "Hearings",
    href: "/hearings",
    icon: Gavel,
    gradient: "radial-gradient(circle, rgba(236,72,153,0.15) 0%, rgba(219,39,119,0.06) 50%, rgba(190,24,93,0) 100%)",
    iconColor: "text-pink-500",
  },
  {
    label: "Notes",
    href: "/notes",
    icon: StickyNote,
    gradient: "radial-gradient(circle, rgba(234,179,8,0.15) 0%, rgba(202,138,4,0.06) 50%, rgba(161,98,7,0) 100%)",
    iconColor: "text-yellow-600",
  },
  {
    label: "Tasks",
    href: "/tasks",
    icon: CheckSquare,
    gradient: "radial-gradient(circle, rgba(14,165,233,0.15) 0%, rgba(2,132,199,0.06) 50%, rgba(3,105,161,0) 100%)",
    iconColor: "text-sky-500",
  },
  {
    label: "Documents",
    href: "/documents",
    icon: FileText,
    gradient: "radial-gradient(circle, rgba(20,184,166,0.15) 0%, rgba(13,148,136,0.06) 50%, rgba(15,118,110,0) 100%)",
    iconColor: "text-teal-500",
  },
  {
    label: "Team",
    href: "/team",
    icon: UsersRound,
    gradient: "radial-gradient(circle, rgba(99,102,241,0.15) 0%, rgba(79,70,229,0.06) 50%, rgba(67,56,202,0) 100%)",
    iconColor: "text-indigo-500",
  },
  {
    label: "Chat",
    href: "/chat",
    icon: MessageSquare,
    gradient: "radial-gradient(circle, rgba(6,182,212,0.15) 0%, rgba(8,145,178,0.06) 50%, rgba(14,116,144,0) 100%)",
    iconColor: "text-cyan-500",
  },
];

export function TopNavBar() {
  const location = useLocation();
  const navigate = useNavigate();

  const activeItem = navigationItems.find(
    (item) => item.href === location.pathname
  )?.label;

  const handleItemClick = (label: string) => {
    const item = navigationItems.find((item) => item.label === label);
    if (item) {
      navigate(item.href);
    }
  };

  return (
    <div className="hidden sm:flex h-16 bg-background border-b border-border/40 shadow-sm items-center justify-center px-6 overflow-x-auto">
      <MenuBar
        items={navigationItems}
        activeItem={activeItem}
        onItemClick={handleItemClick}
        className="w-auto max-w-full"
      />
    </div>
  );
}
