import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useClientAuth } from '@/contexts/ClientAuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Loader2, Search, FileText, Calendar, Building2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';

const ClientCases: React.FC = () => {
  const { client } = useClientAuth();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');

  const { data: cases, isLoading } = useQuery({
    queryKey: ['client-cases', client?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('cases')
        .select('id, case_title, cnr_number, case_number, status, next_hearing_date, court_name, created_at')
        .eq('client_id', client?.id || '')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!client?.id,
  });

  const filteredCases = cases?.filter(
    (c) =>
      c.case_title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.cnr_number?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.case_number?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getStatusColor = (status: string | null) => {
    if (status === 'pending') return 'bg-amber-100 text-amber-800 border-amber-300';
    if (status === 'disposed') return 'bg-purple-100 text-purple-800 border-purple-300';
    return 'bg-gray-100 text-gray-800 border-gray-300';
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold">My Cases</h1>
          <p className="text-muted-foreground mt-1">
            View all your legal cases and their current status
          </p>
        </div>
        <div className="text-sm text-muted-foreground">
          Total Cases: <span className="font-semibold text-foreground">{cases?.length || 0}</span>
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search by case title, CNR number, or case number..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Cases Grid */}
      {filteredCases && filteredCases.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredCases.map((caseItem) => (
            <Card
              key={caseItem.id}
              className="cursor-pointer hover:shadow-lg transition-all hover:border-primary/50"
              onClick={() => navigate(`/client/cases/${caseItem.id}`)}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-2">
                  <FileText className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                  <Badge className={getStatusColor(caseItem.status)}>
                    {caseItem.status || 'Unknown'}
                  </Badge>
                </div>
                <CardTitle className="text-base line-clamp-2 mt-2">
                  {caseItem.case_title}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                {caseItem.cnr_number && (
                  <div className="flex items-start gap-2">
                    <span className="text-muted-foreground font-medium min-w-[60px]">CNR:</span>
                    <span className="text-foreground font-mono text-xs break-all">
                      {caseItem.cnr_number}
                    </span>
                  </div>
                )}
                {caseItem.case_number && (
                  <div className="flex items-start gap-2">
                    <span className="text-muted-foreground font-medium min-w-[60px]">Case No:</span>
                    <span className="text-foreground">{caseItem.case_number}</span>
                  </div>
                )}
                {caseItem.court_name && (
                  <div className="flex items-start gap-2">
                    <Building2 className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
                    <span className="text-muted-foreground text-xs line-clamp-2">
                      {caseItem.court_name}
                    </span>
                  </div>
                )}
                {caseItem.next_hearing_date && (
                  <div className="flex items-center gap-2 pt-2 border-t">
                    <Calendar className="w-4 h-4 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">
                      Next Hearing: {format(new Date(caseItem.next_hearing_date), 'dd MMM yyyy')}
                    </span>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FileText className="w-12 h-12 text-muted-foreground/50 mb-4" />
            <h3 className="text-lg font-medium mb-2">No cases found</h3>
            <p className="text-sm text-muted-foreground text-center max-w-sm">
              {searchQuery
                ? 'No cases match your search criteria. Try different keywords.'
                : 'No cases are currently associated with your account.'}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ClientCases;