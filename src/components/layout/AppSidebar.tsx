import { Home, Users, UserPlus, Briefcase, Calendar, Gavel, StickyNote, CheckSquare, FileText, Receipt, UsersRound, MessageSquare } from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useLocation } from "react-router-dom";
import { Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarGroupLabel, SidebarMenu, SidebarMenuButton, SidebarMenuItem, useSidebar, SidebarHeader, SidebarFooter } from "@/components/ui/sidebar";
import { useEffect, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
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
  const { user } = useAuth();

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
      className="bg-slate-900 border-r border-white/10 shadow-2xl z-50 sm:hidden"
      side="left"
    >
      <SidebarHeader className="border-b border-white/10 h-20 flex items-center justify-center">
        <div className="flex items-center justify-center">
          <img src="/lovable-uploads/89ea18cf-8c73-4793-9dcc-1a192855a630.png" alt="HRU Legal" className="h-12 w-auto" />
        </div>
      </SidebarHeader>

      <SidebarContent className="bg-slate-900">
        <SidebarGroup>
          {open && <SidebarGroupLabel className="text-xs font-medium text-white/70 uppercase tracking-wider px-3 py-2">
              Navigation
            </SidebarGroupLabel>}
          <SidebarGroupContent>
            <SidebarMenu className="space-y-2 px-2">
              {navigationItems.map(item => {
              const active = isActive(item.url);
              return <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild isActive={active} tooltip={item.title}>
                      <NavLink to={item.url} end={item.url === "/"} className={`
                          nav-link flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all duration-200 w-full
                          ${active 
                            ? 'active bg-gradient-to-r from-yellow-500/20 to-yellow-600/20 border border-yellow-500/50 font-medium shadow-[0_0_20px_rgba(234,179,8,0.3)]' 
                            : 'hover:bg-white/5 border border-transparent hover:border-white/20'}
                        `} activeClassName="">
                        <item.icon className={`h-5 w-5 flex-shrink-0 ${active ? 'text-white' : 'text-slate-50'}`} />
                        {open && <span className={`text-sm font-medium ${active ? 'text-white' : 'text-slate-50'}`}>{item.title}</span>}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>;
            })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-white/10 p-4">
        {open && user && (
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-400 to-pink-400 flex items-center justify-center text-white font-semibold">
              {user.email?.charAt(0).toUpperCase()}
            </div>
            <div>
              <p className="font-semibold text-white text-sm">{user.email?.split('@')[0]}</p>
              <p className="text-xs text-gray-400">User</p>
            </div>
          </div>
        )}
      </SidebarFooter>
    </Sidebar>;
}