import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, FileText, Calendar, CheckSquare, StickyNote } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { formatDistanceToNow } from 'date-fns';

interface CaseSidebarProps {
  caseId: string;
  onAddDocument?: () => void;
  onScheduleHearing?: () => void;
  onCreateTask?: () => void;
  onAddNote?: () => void;
}

export const CaseSidebar: React.FC<CaseSidebarProps> = ({
  caseId,
  onAddDocument,
  onScheduleHearing,
  onCreateTask,
  onAddNote
}) => {
  const { data: recentActivity } = useQuery({
    queryKey: ['case-recent-activity', caseId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('case_activities')
        .select('description, created_at, created_by, profiles(full_name)')
        .eq('case_id', caseId)
        .order('created_at', { ascending: false })
        .limit(5);
      
      if (error) throw error;
      return data;
    }
  });

  return (
    <div className="space-y-6">
      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Quick Actions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {onAddDocument && (
            <Button variant="outline" className="w-full justify-start" onClick={onAddDocument}>
              <FileText className="w-4 h-4 mr-2" />
              Add Document
            </Button>
          )}
          {onScheduleHearing && (
            <Button variant="outline" className="w-full justify-start" onClick={onScheduleHearing}>
              <Calendar className="w-4 h-4 mr-2" />
              Schedule Hearing
            </Button>
          )}
          {onCreateTask && (
            <Button variant="outline" className="w-full justify-start" onClick={onCreateTask}>
              <CheckSquare className="w-4 h-4 mr-2" />
              Create Task
            </Button>
          )}
          {onAddNote && (
            <Button variant="outline" className="w-full justify-start" onClick={onAddNote}>
              <StickyNote className="w-4 h-4 mr-2" />
              Add Note
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          {recentActivity && recentActivity.length > 0 ? (
            <div className="space-y-4">
              {recentActivity.map((activity, index) => (
                <div key={index} className="flex items-start gap-3">
                  <div className="w-2 h-2 rounded-full bg-blue-500 mt-2"></div>
                  <div className="flex-1 space-y-1">
                    <p className="text-sm text-foreground">{activity.description}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(activity.created_at), { addSuffix: true })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No recent activity</p>
          )}
        </CardContent>
      </Card>

      {/* Quick Stats */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Quick Stats</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Documents</span>
            <span className="text-sm font-semibold">-</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Hearings</span>
            <span className="text-sm font-semibold">-</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Tasks</span>
            <span className="text-sm font-semibold">-</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Notes</span>
            <span className="text-sm font-semibold">-</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
