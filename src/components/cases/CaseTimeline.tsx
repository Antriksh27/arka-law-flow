import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, FileText, Gavel, Users, Clock, AlertCircle } from 'lucide-react';
interface CaseTimelineProps {
  caseId: string;
}
export const CaseTimeline: React.FC<CaseTimelineProps> = ({
  caseId
}) => {
  // Mock timeline data - in real implementation, this would come from the database
  const timelineEvents = [{
    id: 1,
    date: '2024-01-15',
    title: 'Case Filed',
    description: 'Initial case filing submitted to court',
    type: 'filing',
    icon: FileText,
    status: 'completed'
  }, {
    id: 2,
    date: '2024-01-20',
    title: 'First Hearing Scheduled',
    description: 'Initial hearing date set for January 30, 2024',
    type: 'hearing',
    icon: Calendar,
    status: 'completed'
  }, {
    id: 3,
    date: '2024-01-30',
    title: 'First Hearing',
    description: 'Arguments presented, next hearing scheduled',
    type: 'hearing',
    icon: Gavel,
    status: 'completed'
  }, {
    id: 4,
    date: '2024-02-15',
    title: 'Document Submission',
    description: 'Additional evidence submitted to court',
    type: 'document',
    icon: FileText,
    status: 'completed'
  }, {
    id: 5,
    date: '2024-03-01',
    title: 'Next Hearing',
    description: 'Scheduled for final arguments',
    type: 'hearing',
    icon: Calendar,
    status: 'upcoming'
  }];
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-700';
      case 'upcoming':
        return 'bg-blue-100 text-blue-700';
      case 'pending':
        return 'bg-yellow-100 text-yellow-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };
  return <div className="space-y-6">
      {/* Timeline Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5" />
            Smart Timeline
          </CardTitle>
        </CardHeader>
        
      </Card>

      {/* Timeline Events */}
      <div className="relative">
        {/* Timeline Line */}
        <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-gray-200"></div>

        {timelineEvents.map((event, index) => {
        const IconComponent = event.icon;
        return <div key={event.id} className="relative flex items-start gap-6 pb-8">
              {/* Timeline Dot */}
              <div className={`relative z-10 w-16 h-16 rounded-full flex items-center justify-center ${event.status === 'completed' ? 'bg-green-100' : event.status === 'upcoming' ? 'bg-blue-100' : 'bg-gray-100'}`}>
                <IconComponent className={`w-6 h-6 ${event.status === 'completed' ? 'text-green-600' : event.status === 'upcoming' ? 'text-blue-600' : 'text-gray-600'}`} />
              </div>

              {/* Event Card */}
              <Card className="flex-1">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h3 className="font-semibold text-gray-900">{event.title}</h3>
                      <p className="text-sm text-gray-500">
                        {new Date(event.date).toLocaleDateString('en-US', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                      </p>
                    </div>
                    <Badge className={getStatusColor(event.status)}>
                      {event.status}
                    </Badge>
                  </div>
                  <p className="text-gray-700">{event.description}</p>
                </CardContent>
              </Card>
            </div>;
      })}
      </div>

      {/* Timeline Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                <Gavel className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Hearings Completed</p>
                <p className="text-2xl font-bold text-gray-900">3</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                <Calendar className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Days Since Filing</p>
                <p className="text-2xl font-bold text-gray-900">45</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center">
                <AlertCircle className="w-5 h-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Upcoming Events</p>
                <p className="text-2xl font-bold text-gray-900">1</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>;
};