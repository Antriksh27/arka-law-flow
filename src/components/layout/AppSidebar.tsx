import { 
  Home, 
  Users, 
  UserPlus, 
  Briefcase, 
  Calendar, 
  Gavel, 
  StickyNote, 
  CheckSquare, 
  FileText, 
  Receipt, 
  UsersRound, 
  MessageSquare 
} from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useLocation } from "react-router-dom";

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
  SidebarHeader,
  SidebarFooter,
} from "@/components/ui/sidebar";

const navigationItems = [
  { title: "Dashboard", url: "/", icon: Home },
  { title: "Contacts", url: "/contacts", icon: Users },
  { title: "Clients", url: "/clients", icon: UserPlus },
  { title: "Cases", url: "/cases", icon: Briefcase },
  { title: "Appointments", url: "/appointments", icon: Calendar },
  { title: "Hearings", url: "/hearings", icon: Gavel },
  { title: "Notes", url: "/notes", icon: StickyNote },
  { title: "Tasks", url: "/tasks", icon: CheckSquare },
  { title: "Documents", url: "/documents", icon: FileText },
  { title: "Invoices", url: "/invoices", icon: Receipt },
  { title: "Team", url: "/team", icon: UsersRound },
  { title: "Chat", url: "/chat", icon: MessageSquare },
];

export function AppSidebar() {
  const { open } = useSidebar();
  const location = useLocation();

  const isActive = (path: string) => {
    if (path === "/") {
      return location.pathname === "/";
    }
    return location.pathname.startsWith(path);
  };

  const isExpanded = navigationItems.some((item) => isActive(item.url));

  return (
    <Sidebar collapsible="icon" className="border-r border-border">
      <SidebarHeader className="border-b border-border p-4">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Gavel className="h-5 w-5" />
          </div>
          {open && <span className="font-semibold text-lg">HRU Legal</span>}
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navigationItems.map((item) => {
                const active = isActive(item.url);
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton 
                      asChild 
                      isActive={active}
                      tooltip={item.title}
                    >
                      <NavLink 
                        to={item.url} 
                        end={item.url === "/"}
                        className="flex items-center gap-3"
                      >
                        <item.icon className="h-4 w-4" />
                        <span>{item.title}</span>
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-border p-4">
        {open && (
          <p className="text-xs text-muted-foreground">
            © 2024 HRU Legal
          </p>
        )}
      </SidebarFooter>
    </Sidebar>
  );
}
