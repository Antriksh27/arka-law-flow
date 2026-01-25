import { Calendar, Video, Phone, MapPin, Clock } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { TimeUtils } from '@/lib/timeUtils';
import { useNavigate } from 'react-router-dom';

interface Appointment {
  id: string;
  start_time: string;
  client_name: string;
  meeting_type: string;
  status: string;
  purpose?: string;
  daily_serial_number?: number;
}

interface TodayAppointmentsCardProps {
  appointments: Appointment[];
  isLoading: boolean;
}

export const TodayAppointmentsCard = ({ appointments, isLoading }: TodayAppointmentsCardProps) => {
  const navigate = useNavigate();

  const getTypeIcon = (type: string) => {
    if (type === 'virtual' || type === 'video_call') return <Video className="w-4 h-4" />;
    if (type === 'phone_call') return <Phone className="w-4 h-4" />;
    return <MapPin className="w-4 h-4" />;
  };

  const getStatusColor = (status: string) => {
    if (status === 'completed') return 'bg-green-100 text-green-800';
    if (status === 'cancelled') return 'bg-slate-100 text-slate-800';
    return 'bg-blue-100 text-blue-800';
  };

  return (
    <Card className="bg-white border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-medium flex items-center gap-2">
            <Calendar className="w-5 h-5 text-primary" />
            Today's Appointments
          </CardTitle>
          <Button variant="link" size="sm" className="text-primary" onClick={() => navigate('/appointments')}>
            View Calendar
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-20 w-full" />)}
          </div>
        ) : appointments.length === 0 ? (
          <div className="text-center py-8">
            <Calendar className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-sm text-slate-500">No appointments scheduled for today</p>
            <Button variant="outline" size="sm" className="mt-3" onClick={() => navigate('/appointments')}>
              Schedule Appointment
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {appointments.slice(0, 5).map((appt) => (
              <div key={appt.id} className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                <div className="flex items-start justify-between mb-2">
                  {appt.daily_serial_number && (
                    <div className="flex-shrink-0 relative mr-3">
                      <div className="bg-gradient-to-br from-primary/90 to-primary text-primary-foreground rounded-lg px-2.5 py-1.5 text-center min-w-[44px] shadow-sm border border-primary/20">
                        <div className="text-[8px] font-semibold uppercase tracking-widest opacity-80">Token</div>
                        <div className="text-sm font-bold leading-none">{appt.daily_serial_number}</div>
                      </div>
                    </div>
                  )}
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-sm">{appt.client_name}</span>
                      <Badge className={getStatusColor(appt.status)}>
                        {appt.status}
                      </Badge>
                    </div>
                    {appt.purpose && <p className="text-xs text-slate-600">{appt.purpose}</p>}
                  </div>
                </div>
                <div className="flex items-center gap-3 text-xs text-slate-500">
                  <div className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {TimeUtils.formatTime(appt.start_time)}
                  </div>
                  <div className="flex items-center gap-1">
                    {getTypeIcon(appt.meeting_type)}
                    {appt.meeting_type.replace('_', ' ')}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
