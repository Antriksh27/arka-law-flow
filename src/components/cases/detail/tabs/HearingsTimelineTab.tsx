import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar, FileText, AlertCircle } from 'lucide-react';
import { CaseHearings } from '../../CaseHearings';
import { CaseTimeline } from '../../CaseTimeline';
import { LegalkartOrdersTable } from '../../legalkart/LegalkartOrdersTable';
import { LegalkartObjectionsTable } from '../../legalkart/LegalkartObjectionsTable';
import { LegalkartHistoryTable } from '../../legalkart/LegalkartHistoryTable';

interface HearingsTimelineTabProps {
  caseId: string;
  onScheduleHearing?: () => void;
}

export const HearingsTimelineTab: React.FC<HearingsTimelineTabProps> = ({ caseId, onScheduleHearing }) => {
  return (
    <div className="space-y-6">
      <Tabs defaultValue="hearings" className="space-y-6">
        <TabsList className="bg-gray-100">
          <TabsTrigger value="hearings">
            <Calendar className="w-4 h-4 mr-2" />
            Hearings
          </TabsTrigger>
          <TabsTrigger value="timeline">
            <Calendar className="w-4 h-4 mr-2" />
            Timeline
          </TabsTrigger>
          <TabsTrigger value="orders">
            <FileText className="w-4 h-4 mr-2" />
            Orders
          </TabsTrigger>
          <TabsTrigger value="objections">
            <AlertCircle className="w-4 h-4 mr-2" />
            Objections
          </TabsTrigger>
          <TabsTrigger value="history">
            <Calendar className="w-4 h-4 mr-2" />
            Hearing History
          </TabsTrigger>
        </TabsList>

        <TabsContent value="hearings">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Case Hearings</CardTitle>
                {onScheduleHearing && (
                  <button
                    onClick={onScheduleHearing}
                    className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                  >
                    + Schedule Hearing
                  </button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <CaseHearings caseId={caseId} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="timeline">
          <Card>
            <CardHeader>
              <CardTitle>Case Timeline</CardTitle>
              <p className="text-sm text-muted-foreground">
                Chronological view of all case events
              </p>
            </CardHeader>
            <CardContent>
              <CaseTimeline caseId={caseId} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="orders">
          <Card>
            <CardHeader>
              <CardTitle>Court Orders</CardTitle>
              <p className="text-sm text-muted-foreground">
                Orders issued by the court
              </p>
            </CardHeader>
            <CardContent>
              <LegalkartOrdersTable caseId={caseId} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="objections">
          <Card>
            <CardHeader>
              <CardTitle>Objections</CardTitle>
              <p className="text-sm text-muted-foreground">
                Case objections and their status
              </p>
            </CardHeader>
            <CardContent>
              <LegalkartObjectionsTable caseId={caseId} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history">
          <Card>
            <CardHeader>
              <CardTitle>Hearing History</CardTitle>
              <p className="text-sm text-muted-foreground">
                Complete history of all hearings
              </p>
            </CardHeader>
            <CardContent>
              <LegalkartHistoryTable caseId={caseId} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};
