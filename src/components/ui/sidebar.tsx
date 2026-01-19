import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";
import { X, Home, Users, UserPlus, Briefcase, Calendar, Gavel, StickyNote, CheckSquare, FileText, LogOut, MessageSquare, Settings, UserCircle, UsersRound, ChevronRight } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Link } from "react-router-dom";
import { useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";

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

interface MobileSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export function MobileSidebar({
  isOpen,
  onClose
}: MobileSidebarProps) {
  const pathname = useLocation().pathname;
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate("/login");
  };

  const handleLinkClick = () => {
    onClose();
  };

  return (
    <>
      {/* Backdrop Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 md:hidden animate-fade-in backdrop-blur-sm" 
          onClick={onClose} 
        />
      )}

      {/* Sidebar */}
      <div className={cn(
        "fixed top-0 left-0 h-full w-80 bg-slate-900 shadow-2xl z-50 transform transition-transform duration-300 ease-out md:hidden",
        isOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-white/10 bg-slate-800/50 pt-safe">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-white">Menu</span>
            </div>
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={onClose} 
              className="text-white/60 hover:text-white hover:bg-white/10 h-11 w-11 rounded-xl active:scale-95 transition-transform"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>

          {/* Navigation */}
          <ScrollArea className="flex-1 py-3">
            <nav className="px-3 space-y-1">
              {navigationItems.map((item, index) => {
                const isActive = item.url === "/" ? pathname === "/" : pathname?.startsWith(item.url);
                return (
                  <Link 
                    key={item.title} 
                    to={item.url} 
                    onClick={handleLinkClick} 
                    className={cn(
                      "flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all duration-200 min-h-[48px]",
                      "active:scale-[0.98]",
                      isActive 
                        ? "bg-white text-slate-900 font-medium" 
                        : "text-white hover:bg-white/10"
                    )}
                    style={{
                      animationDelay: isOpen ? `${index * 30}ms` : '0ms'
                    }}
                  >
                    <item.icon className={cn(
                      "h-5 w-5 flex-shrink-0",
                      isActive ? "text-slate-900" : "text-white"
                    )} />
                    <span className={cn("flex-1", isActive ? "text-slate-900" : "text-white")}>{item.title}</span>
                    {isActive && <ChevronRight className="h-4 w-4 text-slate-900" />}
                  </Link>
                );
              })}
            </nav>
            <Separator className="my-4 mx-3 bg-white/10" />
            <div className="px-3">
              <Link 
                to="/settings" 
                onClick={handleLinkClick} 
                className={cn(
                  "flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all duration-200 min-h-[48px]",
                  "active:scale-[0.98]",
                  pathname === "/settings" 
                    ? "bg-white text-slate-900 font-medium" 
                    : "text-white hover:bg-white/10"
                )}
              >
                <Settings className={cn(
                  "h-5 w-5 flex-shrink-0",
                  pathname === "/settings" ? "text-slate-900" : "text-white"
                )} />
                <span className={cn("flex-1", pathname === "/settings" ? "text-slate-900" : "text-white")}>Settings</span>
                {pathname === "/settings" && <ChevronRight className="h-4 w-4 text-slate-900" />}
              </Link>
            </div>
          </ScrollArea>

          {/* Footer - User Account */}
          <div className="border-t border-white/10 p-4 bg-slate-800/30">
            <DropdownMenu>
              <DropdownMenuTrigger className="w-full">
                <div className="flex items-center gap-3 p-3 rounded-xl hover:bg-white/10 transition-colors min-h-[56px] active:scale-[0.98]">
                  <Avatar className="h-10 w-10 ring-2 ring-white/20">
                    <AvatarFallback className="bg-white text-slate-900 font-medium">
                      {user?.email?.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 text-left min-w-0">
                    <p className="text-sm font-medium text-white truncate">
                      {user?.email?.split("@")[0]}
                    </p>
                    <p className="text-xs text-white/60 truncate">
                      {user?.email}
                    </p>
                  </div>
                </div>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-64 bg-slate-900 border-white/10">
                <DropdownMenuItem asChild className="flex items-center gap-2 py-3 text-white hover:bg-white/10 focus:bg-white/10 focus:text-white">
                  <Link to="/profile" onClick={handleLinkClick}>
                    <UserCircle className="h-4 w-4" /> Profile
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator className="bg-white/10" />
                <DropdownMenuItem 
                  className="flex items-center gap-2 cursor-pointer text-red-400 py-3 hover:bg-white/10 focus:bg-white/10 focus:text-red-400" 
                  onClick={handleSignOut}
                >
                  <LogOut className="h-4 w-4" /> Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </>
  );
}