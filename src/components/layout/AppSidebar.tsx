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

  return (
    <Sidebar 
      collapsible="icon" 
      className="bg-white border-r border-[#E5E7EB] shadow-sm z-50"
    >
      <SidebarHeader className="border-b border-[#E5E7EB] p-4 bg-white">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#1E3A8A] text-white shadow-sm">
            <Gavel className="h-5 w-5" />
          </div>
          {open && (
            <span className="font-semibold text-lg text-[#111827]">
              HRU Legal
            </span>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent className="bg-white">
        <SidebarGroup>
          {open && (
            <SidebarGroupLabel className="text-xs font-medium text-[#6B7280] uppercase tracking-wider px-3 py-2">
              Navigation
            </SidebarGroupLabel>
          )}
          <SidebarGroupContent>
            <SidebarMenu className="space-y-1 px-2">
              {navigationItems.map((item) => {
                const active = isActive(item.url);
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton 
                      asChild 
                      isActive={active}
                      tooltip={item.title}
                      className={`
                        flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200
                        ${active 
                          ? 'bg-[#E0E7FF] text-[#1E3A8A] font-medium shadow-sm' 
                          : 'text-[#111827] hover:bg-[#F9FAFB] hover:text-[#1E3A8A]'
                        }
                      `}
                    >
                      <NavLink 
                        to={item.url} 
                        end={item.url === "/"}
                        className="flex items-center gap-3 w-full"
                      >
                        <item.icon className="h-5 w-5 flex-shrink-0" />
                        {open && <span className="text-sm">{item.title}</span>}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-[#E5E7EB] p-4 bg-white">
        {open && (
          <p className="text-xs text-[#6B7280]">
            © 2024 HRU Legal
          </p>
        )}
      </SidebarFooter>
    </Sidebar>
  );
}
