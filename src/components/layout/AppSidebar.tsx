import { Home, Users, UserPlus, Briefcase, Calendar, Gavel, StickyNote, CheckSquare, FileText, Receipt, UsersRound, MessageSquare } from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useLocation } from "react-router-dom";
import { Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarGroupLabel, SidebarMenu, SidebarMenuButton, SidebarMenuItem, useSidebar, SidebarHeader, SidebarFooter } from "@/components/ui/sidebar";
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
export function AppSidebar() {
  const {
    open
  } = useSidebar();
  const location = useLocation();
  const isActive = (path: string) => {
    if (path === "/") {
      return location.pathname === "/";
    }
    return location.pathname.startsWith(path);
  };
  return <Sidebar collapsible="icon" className="bg-slate-900 border-r border-slate-700 shadow-sm z-50">
      <SidebarHeader className="border-b border-slate-700 p-4 bg-slate-900">
        <div className="flex items-center bg-slate-900">
          <img src="/lovable-uploads/89ea18cf-8c73-4793-9dcc-1a192855a630.png" alt="HRU Legal" className={open ? "h-12 w-auto" : "h-9 w-9 object-contain"} />
        </div>
      </SidebarHeader>

      <SidebarContent className="bg-slate-900">
        <SidebarGroup>
          {open && <SidebarGroupLabel className="text-xs font-medium text-slate-400 uppercase tracking-wider px-3 py-2">
              Navigation
            </SidebarGroupLabel>}
          <SidebarGroupContent>
            <SidebarMenu className="space-y-1 px-2">
              {navigationItems.map(item => {
              const active = isActive(item.url);
              return <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild isActive={active} tooltip={item.title}>
                      <NavLink 
                        to={item.url} 
                        end={item.url === "/"} 
                        className={`
                          flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 w-full
                          ${active ? 'bg-white/10 text-white font-medium shadow-sm' : 'text-slate-300 hover:bg-white/5 hover:text-white'}
                        `}
                        activeClassName=""
                      >
                        <item.icon className="h-5 w-5 flex-shrink-0" />
                        {open && <span className="text-sm">{item.title}</span>}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>;
            })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-slate-700 p-4 bg-slate-900">
        {open && <p className="text-xs text-slate-400">
            © 2024 HRU Legal
          </p>}
      </SidebarFooter>
    </Sidebar>;
}