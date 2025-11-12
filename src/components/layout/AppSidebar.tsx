import { Home, Users, UserPlus, Briefcase, Calendar, Gavel, StickyNote, CheckSquare, FileText, Receipt, UsersRound, MessageSquare } from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useLocation } from "react-router-dom";
import { Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarGroupLabel, SidebarMenu, SidebarMenuButton, SidebarMenuItem, useSidebar, SidebarHeader, SidebarFooter } from "@/components/ui/sidebar";
import { useEffect, useRef } from "react";
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
    open,
    setOpen
  } = useSidebar();
  const location = useLocation();
  const sidebarRef = useRef<HTMLDivElement>(null);
  const touchStartX = useRef<number>(0);
  const touchEndX = useRef<number>(0);

  const isActive = (path: string) => {
    if (path === "/") {
      return location.pathname === "/";
    }
    return location.pathname.startsWith(path);
  };

  // Swipe-to-close gesture handler
  useEffect(() => {
    const sidebar = sidebarRef.current;
    if (!sidebar || !open) return;

    const handleTouchStart = (e: TouchEvent) => {
      touchStartX.current = e.touches[0].clientX;
    };

    const handleTouchMove = (e: TouchEvent) => {
      touchEndX.current = e.touches[0].clientX;
    };

    const handleTouchEnd = () => {
      // Detect left-to-right swipe (swipe from left edge)
      const swipeDistance = touchEndX.current - touchStartX.current;
      const minSwipeDistance = 50; // Minimum swipe distance in pixels

      // If swiped left (negative distance) more than threshold, close sidebar
      if (swipeDistance < -minSwipeDistance && touchStartX.current < 280) {
        setOpen(false);
      }
    };

    sidebar.addEventListener('touchstart', handleTouchStart);
    sidebar.addEventListener('touchmove', handleTouchMove);
    sidebar.addEventListener('touchend', handleTouchEnd);

    return () => {
      sidebar.removeEventListener('touchstart', handleTouchStart);
      sidebar.removeEventListener('touchmove', handleTouchMove);
      sidebar.removeEventListener('touchend', handleTouchEnd);
    };
  }, [open, setOpen]);
  return <Sidebar 
      ref={sidebarRef}
      collapsible="offcanvas" 
      className="bg-slate-900 border-r border-slate-700 shadow-sm z-50 sm:hidden"
      side="left"
    >
      <SidebarHeader className="border-b border-slate-700 h-16 flex items-center justify-center bg-slate-900">
        <div className="flex items-center justify-center bg-slate-900">
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
                      <NavLink to={item.url} end={item.url === "/"} className={`
                          flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 w-full text-white
                          ${active ? 'bg-white/10 font-medium shadow-sm' : 'hover:bg-white/5'}
                        `} activeClassName="">
                        <item.icon className="h-5 w-5 flex-shrink-0 text-white" />
                        {open && <span className="text-sm text-white font-medium">{item.title}</span>}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>;
            })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-slate-700 p-4 bg-slate-900">
        {open && <p className="text-xs text-slate-400">© 2025 HRU Legal</p>}
      </SidebarFooter>
    </Sidebar>;
}