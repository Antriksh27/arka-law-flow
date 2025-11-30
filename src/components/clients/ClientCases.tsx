import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { Eye, Link, User, Calendar } from 'lucide-react';
import { TimeUtils } from '@/lib/timeUtils';
import { AssignToCaseDialog } from './AssignToCaseDialog';
import { useIsMobile } from '@/hooks/use-mobile';

interface ClientCasesProps {
  clientId: string;
}

export const ClientCases: React.FC<ClientCasesProps> = ({ clientId }) => {
  const isMobile = useIsMobile();
  const [showLinkDialog, setShowLinkDialog] = useState(false);
  const navigate = useNavigate();
  const { data: client } = useQuery({
    queryKey: ['client', clientId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('clients')
        .select('full_name')
        .eq('id', clientId)
        .single();
      if (error) throw error;
      return data;
    }
  });
  const { data: cases = [], isLoading } = useQuery({
    queryKey: ['client-cases', clientId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('cases')
        .select(`
          *,
          assigned_to:profiles!cases_assigned_to_fkey(full_name)
        `)
        .eq('client_id', clientId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    }
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open':
        return 'bg-blue-100 text-blue-800';
      case 'in_court':
        return 'bg-yellow-100 text-yellow-800';
      case 'on_hold':
        return 'bg-orange-100 text-orange-800';
      case 'closed':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (isLoading) {
    return (
      <Card className="bg-white rounded-2xl shadow-sm">
        <CardContent className="p-6">
          <div className="text-center text-gray-500">Loading cases...</div>
        </CardContent>
      </Card>
    );
  }

  if (isMobile) {
    return (
      <>
        <Card className="bg-white rounded-2xl shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="text-base font-semibold">Cases</CardTitle>
            <Button 
              size="sm" 
              className="bg-primary hover:bg-primary/90 h-9"
              onClick={() => setShowLinkDialog(true)}
            >
              <Link className="w-4 h-4 mr-1" />
              Link
            </Button>
          </CardHeader>
          <CardContent className="px-3 pb-3">
            {cases.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <p className="text-sm">No cases found</p>
              </div>
            ) : (
              <div className="space-y-2">
                {cases.map((case_item) => (
                  <Card 
                    key={case_item.id} 
                    className="active:scale-95 transition-transform"
                    onClick={() => navigate(`/cases/${case_item.id}`)}
                  >
                    <CardContent className="p-3">
                      <div className="font-medium text-sm text-gray-900 mb-2">
                        {case_item.case_title?.replace(/\bVersus\b/g, 'Vs')}
                      </div>
                      <div className="flex items-center gap-2 flex-wrap mb-2">
                        <Badge 
                          variant="default" 
                          className={`${getStatusColor(case_item.status)} text-xs`}
                        >
                          {case_item.status?.replace('_', ' ')}
                        </Badge>
                      </div>
                      <div className="space-y-1">
                        {case_item.assigned_to && (
                          <div className="flex items-center gap-1 text-xs text-gray-600">
                            <User className="w-3 h-3" />
                            {case_item.assigned_to.full_name}
                          </div>
                        )}
                        <div className="flex items-center gap-1 text-xs text-gray-500">
                          <Calendar className="w-3 h-3" />
                          {TimeUtils.formatDate(case_item.created_at)}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
        
        <AssignToCaseDialog 
          open={showLinkDialog}
          onOpenChange={setShowLinkDialog}
          clientId={clientId}
          clientName={client?.full_name || ''}
        />
      </>
    );
  }

  return (
    <Card className="bg-white rounded-2xl shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-xl font-semibold">Cases</CardTitle>
        <Button 
          size="sm" 
          className="bg-primary hover:bg-primary/90"
          onClick={() => setShowLinkDialog(true)}
        >
          <Link className="w-4 h-4 mr-2" />
          Link Case
        </Button>
      </CardHeader>
      <CardContent>
        {cases.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            No cases found for this client
          </div>
        ) : (
          <div className="space-y-4">
            {cases.map((case_item) => (
              <div key={case_item.id} className="border rounded-lg p-4 hover:bg-gray-50">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="font-medium text-gray-900 mb-2">
                      {case_item.case_title?.replace(/\bVersus\b/g, 'Vs')}
                    </h3>
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      <Badge 
                        variant="default" 
                        className={getStatusColor(case_item.status)}
                      >
                        {case_item.status?.replace('_', ' ')}
                      </Badge>
                      {case_item.assigned_to && (
                        <span>Assigned to: {case_item.assigned_to.full_name}</span>
                      )}
                      <span>
                        Created: {TimeUtils.formatDate(case_item.created_at)}
                      </span>
                    </div>
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => navigate(`/cases/${case_item.id}`)}
                  >
                    <Eye className="w-4 h-4 mr-1" />
                    View
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
      
      <AssignToCaseDialog 
        open={showLinkDialog}
        onOpenChange={setShowLinkDialog}
        clientId={clientId}
        clientName={client?.full_name || ''}
      />
    </Card>
  );
};
