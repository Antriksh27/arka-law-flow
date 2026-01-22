import React from 'react';
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";
import { X, Home, Users, Calendar, LayoutDashboard, MessageSquare, UserPlus, CalendarPlus, LogOut, Settings } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/contexts/AuthContext";

const navigationItems = [
  { title: "Dashboard", url: "/reception/home", icon: Home },
  { title: "Appointments", url: "/reception/appointments", icon: Calendar },
  { title: "Contacts", url: "/reception/contacts", icon: Users },
  { title: "Daily Board", url: "/daily-board", icon: LayoutDashboard },
  { title: "Chat", url: "/chat", icon: MessageSquare },
];

const quickActions = [
  { title: "New Contact", url: "/reception/contacts?action=new", icon: UserPlus },
  { title: "Book Appointment", url: "/reception/appointments?action=new", icon: CalendarPlus },
];

interface ReceptionistMobileSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ReceptionistMobileSidebar({ isOpen, onClose }: ReceptionistMobileSidebarProps) {
  const pathname = useLocation().pathname;
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate("/auth");
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
              <img 
                src="/lovable-uploads/89ea18cf-8c73-4793-9dcc-1a192855a630.png" 
                alt="HRU Legal" 
                className="h-10 w-auto" 
              />
            </div>
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={onClose}
              className="text-white/80 hover:bg-white/10 hover:text-white"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>

          {/* Navigation */}
          <ScrollArea className="flex-1 px-3 py-4">
            <nav className="space-y-1">
              {navigationItems.map((item) => {
                const isActive = pathname === item.url || 
                  (item.url === '/reception/home' && pathname === '/');
                return (
                  <Link
                    key={item.title}
                    to={item.url}
                    onClick={handleLinkClick}
                    className={cn(
                      "flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200",
                      isActive 
                        ? "bg-white text-slate-900 shadow-md" 
                        : "text-white/70 hover:bg-white/10 hover:text-white"
                    )}
                  >
                    <item.icon className="h-5 w-5" />
                    <span>{item.title}</span>
                  </Link>
                );
              })}
            </nav>

            {/* Quick Actions */}
            <div className="mt-6">
              <p className="px-4 text-xs font-semibold text-white/40 uppercase tracking-wider mb-2">
                Quick Actions
              </p>
              <nav className="space-y-1">
                {quickActions.map((action) => (
                  <Link
                    key={action.title}
                    to={action.url}
                    onClick={handleLinkClick}
                    className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-white/70 hover:bg-white/10 hover:text-white transition-all duration-200"
                  >
                    <action.icon className="h-4 w-4" />
                    <span>{action.title}</span>
                  </Link>
                ))}
              </nav>
            </div>
          </ScrollArea>

          <Separator className="bg-white/10" />

          {/* User Section */}
          <div className="p-4 space-y-3">
            <div className="flex items-center gap-3 p-2 rounded-xl bg-white/5">
              <Avatar className="h-10 w-10 border-2 border-white/20">
                <AvatarFallback className="bg-primary text-primary-foreground text-sm">
                  {user?.email?.charAt(0).toUpperCase() || 'U'}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">
                  {user?.email || 'Receptionist'}
                </p>
                <p className="text-xs text-white/50">Receptionist</p>
              </div>
            </div>
            
            <Button
              variant="ghost"
              className="w-full justify-start gap-3 text-white/70 hover:bg-white/10 hover:text-white"
              onClick={() => {
                handleLinkClick();
                navigate('/notifications');
              }}
            >
              <Settings className="h-4 w-4" />
              Settings
            </Button>
            
            <Button
              variant="ghost"
              onClick={handleSignOut}
              className="w-full justify-start gap-3 text-red-400 hover:bg-red-500/10 hover:text-red-300"
            >
              <LogOut className="h-4 w-4" />
              Sign Out
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}
