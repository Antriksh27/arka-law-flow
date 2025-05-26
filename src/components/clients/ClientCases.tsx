
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { Eye, Plus } from 'lucide-react';

interface ClientCasesProps {
  clientId: string;
}

export const ClientCases: React.FC<ClientCasesProps> = ({ clientId }) => {
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

  return (
    <Card className="bg-white rounded-2xl shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-xl font-semibold">Cases</CardTitle>
        <Button size="sm" className="bg-primary hover:bg-primary/90">
          <Plus className="w-4 h-4 mr-2" />
          New Case
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
                      {case_item.title}
                    </h3>
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      <Badge 
                        variant="secondary" 
                        className={getStatusColor(case_item.status)}
                      >
                        {case_item.status?.replace('_', ' ')}
                      </Badge>
                      {case_item.assigned_to && (
                        <span>Assigned to: {case_item.assigned_to.full_name}</span>
                      )}
                      <span>
                        Created: {new Date(case_item.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  <Button variant="outline" size="sm">
                    <Eye className="w-4 h-4 mr-1" />
                    View
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
