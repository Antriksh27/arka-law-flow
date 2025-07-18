import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Search, Eye, Filter, Calendar, User, Briefcase } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface Case {
  id: string;
  case_title: string;
  case_number: string;
  status: string;
  stage: string;
  next_hearing_date: string;
  assigned_to: string;
  client_name: string;
  created_by_name: string;
  priority: string;
  description: string;
  court_name: string;
}

interface CaseDetail {
  case: Case;
  documents: any[];
  tasks: any[];
  instructions: any[];
  notes: any[];
}

const StaffCases = () => {
  const { user } = useAuth();
  const [cases, setCases] = useState<Case[]>([]);
  const [filteredCases, setFilteredCases] = useState<Case[]>([]);
  const [selectedCase, setSelectedCase] = useState<CaseDetail | null>(null);
  const [showCaseDetail, setShowCaseDetail] = useState(false);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [stageFilter, setStageFilter] = useState('all');

  useEffect(() => {
    fetchCases();
  }, [user]);

  useEffect(() => {
    filterCases();
  }, [cases, searchQuery, statusFilter, stageFilter]);

  const fetchCases = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('cases')
        .select('id, case_title, case_number, status, stage, next_hearing_date, assigned_to, client_id, priority, description, court_name, created_by, created_at')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Transform data to match Case interface
      const transformedCases = (data || []).map(caseData => ({
        id: caseData.id,
        case_title: caseData.case_title,
        case_number: caseData.case_number || '',
        status: caseData.status || '',
        stage: caseData.stage || '',
        next_hearing_date: caseData.next_hearing_date || '',
        assigned_to: caseData.assigned_to || '',
        client_name: '', // Will be populated separately if needed
        created_by_name: '', // Will be populated separately if needed
        priority: caseData.priority || '',
        description: caseData.description || '',
        court_name: caseData.court_name || ''
      }));

      setCases(transformedCases);
    } catch (error) {
      console.error('Error fetching cases:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterCases = () => {
    let filtered = cases;

    if (searchQuery) {
      filtered = filtered.filter(
        (c) =>
          c.case_title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          c.case_number?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          c.client_name?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter((c) => c.status === statusFilter);
    }

    if (stageFilter !== 'all') {
      filtered = filtered.filter((c) => c.stage === stageFilter);
    }

    setFilteredCases(filtered);
  };

  const fetchCaseDetails = async (caseId: string) => {
    try {
      // Fetch case details
      const { data: caseData } = await supabase
        .from('cases')
        .select('*')
        .eq('id', caseId)
        .single();

      // Fetch related documents
      const { data: documents } = await supabase
        .from('documents')
        .select('*')
        .eq('case_id', caseId)
        .order('uploaded_at', { ascending: false });

      // Fetch related tasks
      const { data: tasks } = await supabase
        .from('tasks')
        .select('*')
        .eq('case_id', caseId)
        .order('created_at', { ascending: false });

      // Fetch related instructions
      const { data: instructions } = await supabase
        .from('instructions')
        .select('*')
        .eq('case_id', caseId)
        .order('created_at', { ascending: false });

      // Fetch case notes
      const { data: notes } = await supabase
        .from('case_notes')
        .select('*')
        .eq('case_id', caseId)
        .order('created_at', { ascending: false });

      setSelectedCase({
        case: {
          id: caseData.id,
          case_title: caseData.case_title,
          case_number: caseData.case_number || '',
          status: caseData.status || '',
          stage: caseData.stage || '',
          next_hearing_date: caseData.next_hearing_date || '',
          assigned_to: caseData.assigned_to || '',
          client_name: '',
          created_by_name: '',
          priority: caseData.priority || '',
          description: caseData.description || '',
          court_name: caseData.court_name || ''
        },
        documents: documents || [],
        tasks: tasks || [],
        instructions: instructions || [],
        notes: notes || []
      });
      setShowCaseDetail(true);
    } catch (error) {
      console.error('Error fetching case details:', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'open': return 'default';
      case 'in_progress': return 'default';
      case 'pending': return 'error';
      case 'closed': return 'success';
      case 'won': return 'success';
      case 'lost': return 'error';
      default: return 'outline';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority?.toLowerCase()) {
      case 'urgent': return 'error';
      case 'high': return 'error';
      case 'medium': return 'default';
      case 'low': return 'success';
      default: return 'outline';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-muted-foreground">Loading cases...</div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Cases Overview</h1>
          <p className="text-muted-foreground">Monitor and manage case progress</p>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Search cases by title, number, or client..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="open">Open</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="closed">Closed</SelectItem>
              </SelectContent>
            </Select>
            <Select value={stageFilter} onValueChange={setStageFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by stage" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Stages</SelectItem>
                <SelectItem value="filing">Filing</SelectItem>
                <SelectItem value="discovery">Discovery</SelectItem>
                <SelectItem value="hearing">Hearing</SelectItem>
                <SelectItem value="trial">Trial</SelectItem>
                <SelectItem value="appeal">Appeal</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Cases Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Cases ({filteredCases.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Case Number</TableHead>
                  <TableHead>Title</TableHead>
                  <TableHead>Client</TableHead>
                  <TableHead>Assigned Lawyer</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Stage</TableHead>
                  <TableHead>Next Hearing</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCases.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                      No cases found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredCases.map((case_) => (
                    <TableRow key={case_.id}>
                      <TableCell className="font-medium">{case_.case_number}</TableCell>
                      <TableCell>{case_.case_title}</TableCell>
                      <TableCell>{case_.client_name}</TableCell>
                      <TableCell>{case_.created_by_name}</TableCell>
                      <TableCell>
                        <Badge variant={getStatusColor(case_.status)}>
                          {case_.status}
                        </Badge>
                      </TableCell>
                      <TableCell>{case_.stage}</TableCell>
                      <TableCell>
                        {case_.next_hearing_date ? (
                          <div className="flex items-center gap-1">
                            <Calendar className="w-4 h-4 text-muted-foreground" />
                            {new Date(case_.next_hearing_date).toLocaleDateString()}
                          </div>
                        ) : (
                          <span className="text-muted-foreground">Not scheduled</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => fetchCaseDetails(case_.id)}
                        >
                          <Eye className="w-4 h-4 mr-1" />
                          View
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Case Detail Dialog */}
      <Dialog open={showCaseDetail} onOpenChange={setShowCaseDetail}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {selectedCase?.case.case_title} - {selectedCase?.case.case_number}
            </DialogTitle>
          </DialogHeader>
          
          {selectedCase && (
            <Tabs defaultValue="overview" className="w-full">
              <TabsList className="grid w-full grid-cols-5">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="documents">Documents</TabsTrigger>
                <TabsTrigger value="tasks">Tasks</TabsTrigger>
                <TabsTrigger value="instructions">Instructions</TabsTrigger>
                <TabsTrigger value="notes">Notes</TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-medium mb-2">Case Information</h4>
                    <div className="space-y-2 text-sm">
                      <div><strong>Status:</strong> <Badge variant={getStatusColor(selectedCase.case.status)}>{selectedCase.case.status}</Badge></div>
                      <div><strong>Stage:</strong> {selectedCase.case.stage}</div>
                      <div><strong>Court:</strong> {selectedCase.case.court_name}</div>
                      <div><strong>Client:</strong> {selectedCase.case.client_name}</div>
                    </div>
                  </div>
                  <div>
                    <h4 className="font-medium mb-2">Next Hearing</h4>
                    <div className="text-sm">
                      {selectedCase.case.next_hearing_date ? (
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4" />
                          {new Date(selectedCase.case.next_hearing_date).toLocaleDateString()}
                        </div>
                      ) : (
                        <span className="text-muted-foreground">Not scheduled</span>
                      )}
                    </div>
                  </div>
                </div>
                {selectedCase.case.description && (
                  <div>
                    <h4 className="font-medium mb-2">Description</h4>
                    <p className="text-sm text-muted-foreground">{selectedCase.case.description}</p>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="documents" className="space-y-4">
                <div className="text-sm">
                  <strong>Total Documents:</strong> {selectedCase.documents.length}
                </div>
                <div className="space-y-2">
                  {selectedCase.documents.map((doc: any) => (
                    <div key={doc.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <div className="font-medium">{doc.file_name}</div>
                        <div className="text-sm text-muted-foreground">
                          Uploaded: {new Date(doc.uploaded_at).toLocaleDateString()}
                        </div>
                      </div>
                      <Badge variant="outline">{doc.file_type}</Badge>
                    </div>
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="tasks" className="space-y-4">
                <div className="text-sm">
                  <strong>Total Tasks:</strong> {selectedCase.tasks.length}
                </div>
                <div className="space-y-2">
                  {selectedCase.tasks.map((task: any) => (
                    <div key={task.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex-1">
                        <div className="font-medium">{task.title}</div>
                        <div className="text-sm text-muted-foreground">{task.description}</div>
                        {task.due_date && (
                          <div className="text-xs text-muted-foreground mt-1">
                            Due: {new Date(task.due_date).toLocaleDateString()}
                          </div>
                        )}
                      </div>
                      <Badge variant={getStatusColor(task.status)}>{task.status}</Badge>
                    </div>
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="instructions" className="space-y-4">
                <div className="text-sm">
                  <strong>Total Instructions:</strong> {selectedCase.instructions.length}
                </div>
                <div className="space-y-2">
                  {selectedCase.instructions.map((instruction: any) => (
                    <div key={instruction.id} className="p-3 border rounded-lg">
                      <div className="flex items-start justify-between mb-2">
                        <Badge variant={getPriorityColor(instruction.priority)}>{instruction.priority}</Badge>
                        <Badge variant={getStatusColor(instruction.status)}>{instruction.status}</Badge>
                      </div>
                      <div className="text-sm">{instruction.message}</div>
                      <div className="text-xs text-muted-foreground mt-2">
                        Created: {new Date(instruction.created_at).toLocaleDateString()}
                        {instruction.deadline && ` | Deadline: ${new Date(instruction.deadline).toLocaleDateString()}`}
                      </div>
                    </div>
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="notes" className="space-y-4">
                <div className="text-sm">
                  <strong>Total Notes:</strong> {selectedCase.notes.length}
                </div>
                <div className="space-y-2">
                  {selectedCase.notes.map((note: any) => (
                    <div key={note.id} className="p-3 border rounded-lg">
                      <div className="text-sm">{note.content}</div>
                      <div className="text-xs text-muted-foreground mt-2">
                        {new Date(note.created_at).toLocaleDateString()}
                      </div>
                    </div>
                  ))}
                </div>
              </TabsContent>
            </Tabs>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default StaffCases;