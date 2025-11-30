import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { X, Home, Users, UserPlus, Briefcase, Calendar, Gavel, StickyNote, CheckSquare, FileText, LogOut, MessageSquare, Settings, UserCircle, UsersRound } from "lucide-react";
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
  const {
    user
  } = useAuth();
  const navigate = useNavigate();
  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate("/login");
  };
  const handleLinkClick = () => {
    onClose();
  };
  return <>
      {/* Backdrop Overlay */}
      {isOpen && <div className="fixed inset-0 bg-black/50 z-40 md:hidden transition-opacity" onClick={onClose} />}

      {/* Sidebar */}
      <div className={cn("fixed top-0 left-0 h-full w-80 bg-white shadow-2xl z-50 transform transition-transform duration-300 ease-in-out md:hidden", isOpen ? "translate-x-0" : "-translate-x-full")}>
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b bg-slate-50">
            <div className="flex items-center gap-2 mx-[83px]">
              <img alt="HRU Legal" className="h-11 w-auto object-cover border-0" src="/lovable-uploads/428565de-3927-43da-90e5-5ea8ad3b12c9.png" />
              
            </div>
            <Button variant="ghost" size="icon" onClick={onClose} className="text-gray-600">
              <X className="h-5 w-5" />
            </Button>
          </div>

          {/* Navigation */}
          <ScrollArea className="flex-1 py-4">
            <nav className="px-3 space-y-1">
              {navigationItems.map(item => {
              const isActive = item.url === "/" ? pathname === "/" : pathname?.startsWith(item.url);
              return <Link key={item.title} to={item.url} onClick={handleLinkClick} className={cn("flex items-center gap-3 px-3 py-3 rounded-lg transition-colors text-sm font-medium", isActive ? "bg-blue-50 text-blue-600" : "text-gray-700 hover:bg-gray-100")}>
                    <item.icon className="h-5 w-5" />
                    <span>{item.title}</span>
                  </Link>;
            })}
            </nav>
            <Separator className="my-4" />
            <div className="px-3">
              <Link to="/settings" onClick={handleLinkClick} className="flex items-center gap-3 px-3 py-3 rounded-lg transition-colors text-sm font-medium text-gray-700 hover:bg-gray-100">
                <Settings className="h-5 w-5" />
                <span>Settings</span>
              </Link>
            </div>
          </ScrollArea>

          {/* Footer - User Account */}
          <div className="border-t p-4">
            <DropdownMenu>
              <DropdownMenuTrigger className="w-full">
                <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-100 transition-colors">
                  <Avatar className="h-10 w-10">
                    <AvatarFallback className="bg-blue-100 text-blue-600">
                      {user?.email?.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 text-left">
                    <p className="text-sm font-medium text-gray-900">
                      {user?.email?.split("@")[0]}
                    </p>
                    <p className="text-xs text-gray-500 truncate">
                      {user?.email}
                    </p>
                  </div>
                </div>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-64">
                <DropdownMenuItem asChild className="flex items-center gap-2">
                  <Link to="/profile" onClick={handleLinkClick}>
                    <UserCircle className="h-4 w-4" /> Profile
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="flex items-center gap-2 cursor-pointer text-red-600" onClick={handleSignOut}>
                  <LogOut className="h-4 w-4" /> Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </>;
}