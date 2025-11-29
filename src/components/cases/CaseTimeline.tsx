import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Timeline } from '@/components/ui/timeline';
import { Calendar, FileText, Gavel, Clock } from 'lucide-react';

interface CaseTimelineProps {
  caseId: string;
}

export const CaseTimeline: React.FC<CaseTimelineProps> = ({ caseId }) => {
  // Mock timeline data - in real implementation, this would come from the database
  const timelineItems = [
    {
      date: '2024-01-15',
      title: 'Case Filed',
      description: 'Initial case filing submitted to court',
      icon: <FileText className="h-3 w-3" />,
    },
    {
      date: '2024-01-20',
      title: 'First Hearing Scheduled',
      description: 'Initial hearing date set for January 30, 2024',
      icon: <Calendar className="h-3 w-3" />,
    },
    {
      date: '2024-01-30',
      title: 'First Hearing',
      description: 'Arguments presented, next hearing scheduled',
      icon: <Gavel className="h-3 w-3" />,
    },
    {
      date: '2024-02-15',
      title: 'Document Submission',
      description: 'Additional evidence submitted to court',
      icon: <FileText className="h-3 w-3" />,
    },
    {
      date: '2024-03-01',
      title: 'Next Hearing',
      description: 'Scheduled for final arguments',
      icon: <Calendar className="h-3 w-3" />,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Timeline Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5" />
            Smart Timeline
          </CardTitle>
        </CardHeader>
      </Card>

      {/* Timeline Component */}
      <Timeline
        items={timelineItems}
        initialCount={5}
        showMoreText="Load More"
        showLessText="Show Less"
        dotClassName="bg-gradient-to-b from-background to-muted ring-1 ring-border"
        lineClassName="border-l border-border"
      />

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
                <Clock className="w-5 h-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Upcoming Events</p>
                <p className="text-2xl font-bold text-gray-900">1</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
