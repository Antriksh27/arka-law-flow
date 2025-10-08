import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card } from '@/components/ui/card';
import { RefreshCw, Calendar, FileText, Scale, ListTodo, StickyNote, File } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';

const CaseDetail = () => {
  const { id } = useParams<{ id: string }>();
  const [activeTab, setActiveTab] = useState('overview');
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch case data
  const { data: caseData, isLoading } = useQuery({
    queryKey: ['case-detail', id],
    queryFn: async () => {
      if (!id) throw new Error('Case ID is required');
      
      const { data, error } = await supabase
        .from('cases')
        .select('*')
        .eq('id', id)
        .single();
      
      if (error) throw error;
      return data;
    },
    enabled: !!id
  });

  // Fetch hearings
  const { data: hearings } = useQuery({
    queryKey: ['case-hearings', id],
    queryFn: async () => {
      const { data } = await supabase
        .from('hearings')
        .select('*')
        .eq('case_id', id)
        .order('hearing_date', { ascending: false });
      return data || [];
    },
    enabled: !!id
  });

  // Fetch documents (from case_activities)
  const { data: documents } = useQuery({
    queryKey: ['case-documents', id],
    queryFn: async () => {
      const { data } = await supabase
        .from('case_activities')
        .select('*')
        .eq('case_id', id)
        .eq('activity_type', 'document_reference')
        .order('created_at', { ascending: false });
      return data || [];
    },
    enabled: !!id
  });

  // Fetch orders
  const { data: orders } = useQuery({
    queryKey: ['case-orders', id],
    queryFn: async () => {
      const { data } = await supabase
        .from('case_activities')
        .select('*')
        .eq('case_id', id)
        .eq('activity_type', 'order_received')
        .order('created_at', { ascending: false });
      return data || [];
    },
    enabled: !!id
  });

  // Fetch notes
  const { data: notes } = useQuery({
    queryKey: ['case-notes', id],
    queryFn: async () => {
      const { data } = await supabase
        .from('notes')
        .select('*')
        .eq('case_id', id)
        .order('created_at', { ascending: false });
      return data || [];
    },
    enabled: !!id
  });

  // Fetch tasks
  const { data: tasks } = useQuery({
    queryKey: ['case-tasks', id],
    queryFn: async () => {
      const { data } = await supabase
        .from('tasks')
        .select('*')
        .eq('case_id', id)
        .order('due_date', { ascending: true });
      return data || [];
    },
    enabled: !!id
  });

  const refreshMutation = useMutation({
    mutationFn: async () => {
      // Placeholder for refresh logic - would call Legalkart API
      await new Promise(resolve => setTimeout(resolve, 1000));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['case-detail', id] });
      toast({ title: "Case data refreshed successfully" });
    },
  });

  const formatDate = (date: string | null) => {
    if (!date) return '-';
    try {
      return format(new Date(date), 'dd-MM-yyyy');
    } catch {
      return '-';
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, string> = {
      open: 'bg-green-100 text-green-800',
      closed: 'bg-gray-100 text-gray-800',
      in_court: 'bg-blue-100 text-blue-800',
      on_hold: 'bg-yellow-100 text-yellow-800',
    };
    return variants[status] || variants.open;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="max-w-7xl mx-auto space-y-4 animate-pulse">
          <div className="h-16 bg-muted rounded-lg"></div>
          <div className="h-96 bg-muted rounded-lg"></div>
        </div>
      </div>
    );
  }

  if (!caseData) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-lg text-muted-foreground">Case not found</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto p-6">
        <div className="grid grid-cols-12 gap-6">
          {/* Sidebar */}
          <aside className="col-span-12 lg:col-span-3">
            <Card className="p-6 space-y-4">
              <h2 className="text-lg font-semibold">Case Summary</h2>
              <div className="space-y-3 text-sm">
                <div>
                  <p className="text-muted-foreground">Case Title:</p>
                  <p className="font-medium">{caseData.case_title || caseData.title}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Case Number:</p>
                  <p className="font-medium">{caseData.case_number || '-'}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Status:</p>
                  <Badge className={getStatusBadge(caseData.status || 'open')}>
                    {caseData.status || 'Open'}
                  </Badge>
                </div>
                <div>
                  <p className="text-muted-foreground">Court Name:</p>
                  <p className="font-medium">{caseData.court_name || caseData.court || '-'}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Last Updated:</p>
                  <p className="font-medium">{formatDate(caseData.updated_at)}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Next Hearing:</p>
                  <p className="font-medium">{formatDate(caseData.next_hearing_date)}</p>
                </div>
              </div>
            </Card>
          </aside>

          {/* Main Content */}
          <main className="col-span-12 lg:col-span-9 space-y-6">
            {/* Header */}
            <div className="flex items-start justify-between">
              <div>
                <h1 className="text-3xl font-bold">{caseData.case_title || caseData.title}</h1>
                <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                  <span>Status: <span className={`font-medium ${caseData.status === 'open' ? 'text-green-600' : ''}`}>{caseData.status || 'Open'}</span></span>
                  {caseData.next_hearing_date && (
                    <span>Hearing Date: <span className="font-medium">{formatDate(caseData.next_hearing_date)}</span></span>
                  )}
                </div>
              </div>
              <Button onClick={() => refreshMutation.mutate()} disabled={refreshMutation.isPending}>
                <RefreshCw className={`mr-2 h-4 w-4 ${refreshMutation.isPending ? 'animate-spin' : ''}`} />
                Refresh Case Data
              </Button>
            </div>

            {/* Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList>
                <TabsTrigger value="overview">Case Details</TabsTrigger>
                <TabsTrigger value="documents">Documents</TabsTrigger>
                <TabsTrigger value="hearings">Hearings</TabsTrigger>
                <TabsTrigger value="orders">Orders</TabsTrigger>
                <TabsTrigger value="notes">Notes</TabsTrigger>
                <TabsTrigger value="tasks">Tasks</TabsTrigger>
              </TabsList>

              {/* Overview Tab */}
              <TabsContent value="overview" className="space-y-6">
                <Card className="p-6">
                  <h3 className="text-xl font-semibold mb-4">Case Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div>
                      <p className="text-sm text-muted-foreground">Case Number</p>
                      <p className="font-medium">{caseData.case_number || '-'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Court Name</p>
                      <p className="font-medium">{caseData.court_name || caseData.court || '-'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Case Type</p>
                      <p className="font-medium capitalize">{caseData.case_type || '-'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Filing Date</p>
                      <p className="font-medium">{formatDate(caseData.filing_date)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Registration Date</p>
                      <p className="font-medium">{formatDate(caseData.registration_date)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Status</p>
                      <Badge className={getStatusBadge(caseData.status || 'open')}>
                        {caseData.status || 'Open'}
                      </Badge>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">CNR Number</p>
                      <p className="font-medium">{caseData.cnr_number || '-'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Judge Name</p>
                      <p className="font-medium">{caseData.coram || '-'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Stage</p>
                      <p className="font-medium">{caseData.stage || '-'}</p>
                    </div>
                    {caseData.filing_number && (
                      <div className="md:col-span-3">
                        <p className="text-sm text-muted-foreground">Filing Number & Year</p>
                        <p className="font-medium">{caseData.filing_number}</p>
                      </div>
                    )}
                  </div>
                </Card>

                {(caseData.acts?.length > 0 || caseData.under_act) && (
                  <Card className="p-6">
                    <h3 className="text-xl font-semibold mb-4">Acts & Sections</h3>
                    <div className="flex flex-wrap gap-2">
                      {caseData.acts?.map((act: string, i: number) => (
                        <Badge key={i} className="bg-blue-100 text-blue-800">
                          {act}
                        </Badge>
                      ))}
                      {caseData.under_act && !caseData.acts?.includes(caseData.under_act) && (
                        <Badge className="bg-blue-100 text-blue-800">
                          {caseData.under_act}
                        </Badge>
                      )}
                    </div>
                  </Card>
                )}

                <Card className="p-6">
                  <h3 className="text-xl font-semibold mb-4">Parties Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h4 className="font-semibold mb-2">Petitioners</h4>
                      <p className="text-sm">{caseData.petitioner || '-'}</p>
                      {caseData.petitioner_advocate && (
                        <div className="mt-2">
                          <p className="text-xs text-muted-foreground">Advocate</p>
                          <p className="text-sm">{caseData.petitioner_advocate}</p>
                        </div>
                      )}
                    </div>
                    <div>
                      <h4 className="font-semibold mb-2">Respondents</h4>
                      <p className="text-sm">{caseData.respondent || '-'}</p>
                      {caseData.respondent_advocate && (
                        <div className="mt-2">
                          <p className="text-xs text-muted-foreground">Advocate</p>
                          <p className="text-sm">{caseData.respondent_advocate}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </Card>
              </TabsContent>

              {/* Documents Tab */}
              <TabsContent value="documents">
                <Card className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xl font-semibold">Case Documents</h3>
                  </div>
                  {documents && documents.length > 0 ? (
                    <div className="space-y-4">
                      <div className="grid grid-cols-12 gap-4 text-sm font-medium text-muted-foreground pb-2 border-b">
                        <div className="col-span-5">Document Name</div>
                        <div className="col-span-3">Date</div>
                        <div className="col-span-2">Type</div>
                        <div className="col-span-2"></div>
                      </div>
                      {documents.map((doc: any) => (
                        <div key={doc.id} className="grid grid-cols-12 gap-4 items-center text-sm py-2 border-b">
                          <div className="col-span-5">{doc.metadata?.document_name || doc.description}</div>
                          <div className="col-span-3">{formatDate(doc.metadata?.document_date || doc.created_at)}</div>
                          <div className="col-span-2">{doc.metadata?.document_type || '-'}</div>
                          <div className="col-span-2">
                            {doc.metadata?.document_url && (
                              <Button size="sm" variant="link" asChild>
                                <a href={doc.metadata.document_url} target="_blank" rel="noopener noreferrer">
                                  View
                                </a>
                              </Button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-muted-foreground text-center py-8">No documents available</p>
                  )}
                </Card>
              </TabsContent>

              {/* Hearings Tab */}
              <TabsContent value="hearings" className="space-y-6">
                {hearings && hearings.filter(h => new Date(h.hearing_date) >= new Date()).length > 0 && (
                  <Card className="p-6 border-primary">
                    <h3 className="text-xl font-semibold mb-4">Upcoming Hearing</h3>
                    {hearings.filter(h => new Date(h.hearing_date) >= new Date()).slice(0, 1).map((hearing: any) => (
                      <div key={hearing.id}>
                        <p className="text-sm text-primary mb-2">
                          Next Hearing: {format(new Date(hearing.hearing_date), 'MMMM dd, yyyy, hh:mm a')}
                        </p>
                        <h4 className="text-2xl font-bold mb-3">{hearing.hearing_type || 'General Hearing'}</h4>
                        {hearing.notes && <p className="text-muted-foreground">{hearing.notes}</p>}
                      </div>
                    ))}
                  </Card>
                )}

                <Card className="p-6">
                  <h3 className="text-xl font-semibold mb-4">Past Hearings</h3>
                  {hearings && hearings.length > 0 ? (
                    <div className="space-y-4">
                      <div className="grid grid-cols-12 gap-4 text-sm font-medium text-muted-foreground pb-2 border-b">
                        <div className="col-span-3">Date</div>
                        <div className="col-span-4">Stage</div>
                        <div className="col-span-5">Purpose</div>
                      </div>
                      {hearings.map((hearing: any) => (
                        <div key={hearing.id} className="grid grid-cols-12 gap-4 text-sm py-2 border-b">
                          <div className="col-span-3">{formatDate(hearing.hearing_date)}</div>
                          <div className="col-span-4">{hearing.status || '-'}</div>
                          <div className="col-span-5">{hearing.hearing_type || hearing.notes || '-'}</div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-muted-foreground text-center py-8">No hearings recorded</p>
                  )}
                </Card>
              </TabsContent>

              {/* Orders Tab */}
              <TabsContent value="orders">
                <Card className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xl font-semibold">Case Orders</h3>
                  </div>
                  {orders && orders.length > 0 ? (
                    <div className="space-y-4">
                      <div className="grid grid-cols-12 gap-4 text-sm font-medium text-muted-foreground pb-2 border-b">
                        <div className="col-span-2">Date</div>
                        <div className="col-span-8">Title/Description</div>
                        <div className="col-span-2">Order PDF</div>
                      </div>
                      {orders.map((order: any) => (
                        <div key={order.id} className="grid grid-cols-12 gap-4 items-center text-sm py-3 border-b">
                          <div className="col-span-2">{formatDate(order.metadata?.order_date || order.created_at)}</div>
                          <div className="col-span-8">{order.metadata?.order_description || order.description}</div>
                          <div className="col-span-2">
                            {order.metadata?.order_url && (
                              <Button size="sm" variant="link" asChild>
                                <a href={order.metadata.order_url} target="_blank" rel="noopener noreferrer">
                                  View PDF
                                </a>
                              </Button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-muted-foreground text-center py-8">No orders available</p>
                  )}
                </Card>
              </TabsContent>

              {/* Notes Tab */}
              <TabsContent value="notes">
                <Card className="p-6">
                  <h3 className="text-xl font-semibold mb-4">Case Notes</h3>
                  {notes && notes.length > 0 ? (
                    <div className="space-y-4">
                      {notes.map((note: any) => (
                        <Card key={note.id} className="p-4">
                          <div className="flex items-start justify-between mb-2">
                            <h4 className="font-semibold">{note.title}</h4>
                            <span className="text-xs text-muted-foreground">{formatDate(note.created_at)}</span>
                          </div>
                          <p className="text-sm text-muted-foreground">{note.content}</p>
                        </Card>
                      ))}
                    </div>
                  ) : (
                    <p className="text-muted-foreground text-center py-8">No notes available</p>
                  )}
                </Card>
              </TabsContent>

              {/* Tasks Tab */}
              <TabsContent value="tasks">
                <Card className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xl font-semibold">Tasks</h3>
                  </div>
                  {tasks && tasks.length > 0 ? (
                    <div className="space-y-4">
                      <div className="grid grid-cols-12 gap-4 text-sm font-medium text-muted-foreground pb-2 border-b">
                        <div className="col-span-4">Task</div>
                        <div className="col-span-3">Due Date</div>
                        <div className="col-span-3">Assignee</div>
                        <div className="col-span-2">Status</div>
                      </div>
                      {tasks.map((task: any) => (
                        <div key={task.id} className="grid grid-cols-12 gap-4 items-center text-sm py-2 border-b">
                          <div className="col-span-4">{task.title}</div>
                          <div className="col-span-3">{formatDate(task.due_date)}</div>
                          <div className="col-span-3">{task.assigned_to_name || '-'}</div>
                          <div className="col-span-2">
                            <Badge className={
                              task.status === 'completed' ? 'bg-green-100 text-green-800' :
                              task.status === 'in_progress' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-gray-100 text-gray-800'
                            }>
                              {task.status}
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-muted-foreground text-center py-8">No tasks assigned</p>
                  )}
                </Card>
              </TabsContent>
            </Tabs>
          </main>
        </div>
      </div>
    </div>
  );
};

export default CaseDetail;
