import { Home, Users, UserPlus, Briefcase, Calendar, Gavel, StickyNote, CheckSquare, FileText, Receipt, UsersRound, MessageSquare } from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
const navigationItems = [{
  title: "Dashboard",
  url: "/",
  icon: Home
}, {
  title: "Contacts",
  url: "/contacts",
  icon: Users
}, {
  title: "Clients",
  url: "/clients",
  icon: UserPlus
}, {
  title: "Cases",
  url: "/cases",
  icon: Briefcase
}, {
  title: "Appointments",
  url: "/appointments",
  icon: Calendar
}, {
  title: "Hearings",
  url: "/hearings",
  icon: Gavel
}, {
  title: "Notes",
  url: "/notes",
  icon: StickyNote
}, {
  title: "Tasks",
  url: "/tasks",
  icon: CheckSquare
}, {
  title: "Documents",
  url: "/documents",
  icon: FileText
}, {
  title: "Invoices",
  url: "/invoices",
  icon: Receipt
}, {
  title: "Team",
  url: "/team",
  icon: UsersRound
}, {
  title: "Chat",
  url: "/chat",
  icon: MessageSquare
}];
export function TopNavBar() {
  const location = useLocation();
  const isActive = (path: string) => {
    if (path === "/") {
      return location.pathname === "/";
    }
    return location.pathname.startsWith(path);
  };
  return <nav className="hidden sm:flex h-12 bg-slate-900 border-b border-white/20 shadow-sm">
      <div className="flex items-center gap-2 px-4 w-full overflow-x-auto scrollbar-hide bg-slate-50">
        {navigationItems.map(item => {
        const Icon = item.icon;
        const active = isActive(item.url);
        return <NavLink key={item.url} to={item.url} end={item.url === "/"} className={cn("flex items-center gap-2 px-4 py-2.5 rounded-md text-sm font-medium transition-all whitespace-nowrap border", active ? "bg-yellow-500 text-slate-900 border-white shadow-[0_0_15px_rgba(234,179,8,0.5)]" : "bg-slate-900 text-white border-white/30 hover:bg-slate-800 hover:border-white/50")} activeClassName="">
              <Icon className="w-4 h-4 flex-shrink-0" />
              <span className="text-slate-50">{item.title}</span>
            </NavLink>;
      })}
      </div>
    </nav>;
}