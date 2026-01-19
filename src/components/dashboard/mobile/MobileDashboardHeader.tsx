import React from 'react';
import { useNavigate } from 'react-router-dom';
import { MessageCircle, Bell } from 'lucide-react';

interface MobileDashboardHeaderProps {
  userName: string;
}

export const MobileDashboardHeader: React.FC<MobileDashboardHeaderProps> = ({ userName }) => {
  const navigate = useNavigate();
  const firstName = userName.split(' ')[0];

  return (
    <header className="bg-white border-b border-slate-200 px-4 py-4 safe-area-top">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-muted-foreground">Welcome back,</p>
          <h1 className="text-xl font-bold text-foreground">{firstName}</h1>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate('/messages')}
            className="relative p-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 active:scale-95 transition-all"
            aria-label="Messages"
          >
            <MessageCircle className="w-5 h-5 text-slate-700" />
          </button>
          <button
            onClick={() => navigate('/notifications')}
            className="relative p-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 active:scale-95 transition-all"
            aria-label="Notifications"
          >
            <Bell className="w-5 h-5 text-slate-700" />
            {/* Notification dot - can be made dynamic */}
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" />
          </button>
        </div>
      </div>
    </header>
  );
};
