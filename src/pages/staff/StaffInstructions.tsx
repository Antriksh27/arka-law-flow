import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Search,
  MessageSquareText,
  Calendar,
  User,
  AlertTriangle,
  CheckCircle,
  Clock,
  Eye,
  Play,
  CheckSquare
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

interface Instruction {
  id: string;
  message: string;
  priority: string;
  status: string;
  deadline: string;
  created_at: string;
  lawyer_id: string;
  staff_id: string;
  case_id: string;
  case_title?: string;
  lawyer_name?: string;
}

const StaffInstructions = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [instructions, setInstructions] = useState<Instruction[]>([]);
  const [filteredInstructions, setFilteredInstructions] = useState<Instruction[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [selectedInstruction, setSelectedInstruction] = useState<Instruction | null>(null);
  const [showDetailDialog, setShowDetailDialog] = useState(false);
  const [responseText, setResponseText] = useState('');

  useEffect(() => {
    fetchInstructions();

    // Set up real-time subscription for instructions
    const channel = supabase
      .channel('staff-instructions-realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'instructions',
          filter: `staff_id=eq.${user?.id}`
        },
        (payload) => {
          console.log('Real-time instruction change:', payload);
          
          if (payload.eventType === 'DELETE') {
            // Remove deleted instruction
            setInstructions(prev => prev.filter(inst => inst.id !== payload.old.id));
            toast({
              title: "Instruction Deleted",
              description: "An instruction was removed by the lawyer",
              variant: "destructive",
            });
          } else {
            // Reload all instructions for INSERT and UPDATE
            fetchInstructions();
            if (payload.eventType === 'UPDATE') {
              toast({
                title: "Instruction Updated",
                description: "An instruction has been modified",
              });
            } else if (payload.eventType === 'INSERT') {
              toast({
                title: "New Instruction",
                description: "You have received a new instruction",
              });
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  useEffect(() => {
    filterInstructions();
  }, [instructions, searchQuery, statusFilter, priorityFilter]);

  const fetchInstructions = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('instructions')
        .select('*')
        .or(`staff_id.eq.${user.id},staff_id.is.null`)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Enhance with lawyer names and case titles
      const enhancedInstructions = await Promise.all(
        (data || []).map(async (instruction) => {
          const [profile, caseData] = await Promise.all([
            supabase.from('profiles').select('full_name').eq('id', instruction.lawyer_id).single(),
            instruction.case_id ? supabase.from('cases').select('case_title').eq('id', instruction.case_id).single() : null
          ]);

          return {
            ...instruction,
            case_title: caseData?.data?.case_title || null,
            lawyer_name: profile?.data?.full_name || 'Unknown'
          };
        })
      );

      setInstructions(enhancedInstructions);
    } catch (error) {
      console.error('Error fetching instructions:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterInstructions = () => {
    let filtered = instructions;

    if (searchQuery) {
      filtered = filtered.filter(
        (instruction) =>
          instruction.message?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          instruction.case_title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          instruction.lawyer_name?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter((instruction) => instruction.status === statusFilter);
    }

    if (priorityFilter !== 'all') {
      filtered = filtered.filter((instruction) => instruction.priority === priorityFilter);
    }

    setFilteredInstructions(filtered);
  };

  const handleUpdateStatus = async (instructionId: string, newStatus: string) => {
    try {
      const updates: any = { 
        status: newStatus,
        updated_at: new Date().toISOString()
      };

      // If accepting for the first time, assign to current user
      if (newStatus === 'accepted' && !selectedInstruction?.staff_id) {
        updates.staff_id = user?.id;
      }

      const { error } = await supabase
        .from('instructions')
        .update(updates)
        .eq('id', instructionId);

      if (error) throw error;

      toast({
        title: "Success",
        description: `Instruction marked as ${newStatus.replace('_', ' ')}`,
      });

      fetchInstructions();
      
      if (selectedInstruction) {
        setSelectedInstruction({ ...selectedInstruction, status: newStatus });
      }
    } catch (error) {
      console.error('Error updating instruction status:', error);
      toast({
        title: "Error",
        description: "Failed to update instruction status",
        variant: "destructive",
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'error';
      case 'accepted': return 'default';
      case 'in_progress': return 'default';
      case 'completed': return 'success';
      default: return 'outline';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'error';
      case 'high': return 'error';
      case 'medium': return 'default';
      case 'low': return 'success';
      default: return 'outline';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <AlertTriangle className="w-4 h-4" />;
      case 'accepted': return <Play className="w-4 h-4" />;
      case 'in_progress': return <Clock className="w-4 h-4" />;
      case 'completed': return <CheckCircle className="w-4 h-4" />;
      default: return <MessageSquareText className="w-4 h-4" />;
    }
  };

  const isOverdue = (deadline: string) => {
    if (!deadline) return false;
    return new Date(deadline) < new Date();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-muted-foreground">Loading instructions...</div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Instructions Inbox</h1>
          <p className="text-muted-foreground">
            Manage instructions and requests from lawyers
          </p>
        </div>
        <div className="flex items-center gap-4">
          <Badge variant="error">
            {instructions.filter(i => i.status === 'pending').length} Pending
          </Badge>
          <Badge variant="default">
            {instructions.filter(i => i.status === 'in_progress').length} In Progress
          </Badge>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Instructions</CardTitle>
            <MessageSquareText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{instructions.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <AlertTriangle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {instructions.filter(i => i.status === 'pending').length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">In Progress</CardTitle>
            <Clock className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {instructions.filter(i => i.status === 'in_progress').length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
            <CheckCircle className="h-4 w-4 text-secondary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {instructions.filter(i => i.status === 'completed').length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Search instructions..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="accepted">Accepted</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
              </SelectContent>
            </Select>

            <Select value={priorityFilter} onValueChange={setPriorityFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Priorities</SelectItem>
                <SelectItem value="urgent">Urgent</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="low">Low</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Instructions Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Instructions ({filteredInstructions.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Message</TableHead>
                  <TableHead>From</TableHead>
                  <TableHead>Case</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Deadline</TableHead>
                  <TableHead>Received</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredInstructions.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                      No instructions found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredInstructions.map((instruction) => (
                    <TableRow key={instruction.id} className={isOverdue(instruction.deadline) ? 'bg-destructive/5' : ''}>
                      <TableCell className="max-w-xs">
                        <div className="truncate">
                          {instruction.message.length > 100 
                            ? instruction.message.substring(0, 100) + '...'
                            : instruction.message
                          }
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <User className="w-4 h-4 text-muted-foreground" />
                          {instruction.lawyer_name}
                        </div>
                      </TableCell>
                      <TableCell>
                        {instruction.case_title || <span className="text-muted-foreground">No case</span>}
                      </TableCell>
                      <TableCell>
                        <Badge variant={getPriorityColor(instruction.priority)}>
                          {instruction.priority}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getStatusIcon(instruction.status)}
                          <Badge variant={getStatusColor(instruction.status)}>
                            {instruction.status.replace('_', ' ')}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell>
                        {instruction.deadline ? (
                          <div className={`flex items-center gap-1 ${isOverdue(instruction.deadline) ? 'text-destructive' : ''}`}>
                            <Calendar className="w-4 h-4" />
                            {new Date(instruction.deadline).toLocaleDateString()}
                            {isOverdue(instruction.deadline) && <span className="text-xs">(Overdue)</span>}
                          </div>
                        ) : (
                          <span className="text-muted-foreground">No deadline</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Calendar className="w-4 h-4 text-muted-foreground" />
                          {new Date(instruction.created_at).toLocaleDateString()}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedInstruction(instruction);
                              setShowDetailDialog(true);
                            }}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          
                          {instruction.status === 'pending' && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleUpdateStatus(instruction.id, 'accepted')}
                            >
                              Accept
                            </Button>
                          )}
                          
                          {instruction.status === 'accepted' && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleUpdateStatus(instruction.id, 'in_progress')}
                            >
                              Start
                            </Button>
                          )}
                          
                          {instruction.status === 'in_progress' && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleUpdateStatus(instruction.id, 'completed')}
                            >
                              Complete
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Instruction Detail Dialog */}
      <Dialog open={showDetailDialog} onOpenChange={setShowDetailDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Instruction Details</DialogTitle>
          </DialogHeader>
          
          {selectedInstruction && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium mb-2">From</h4>
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-muted-foreground" />
                    {selectedInstruction.lawyer_name}
                  </div>
                </div>
                <div>
                  <h4 className="font-medium mb-2">Case</h4>
                  <div>{selectedInstruction.case_title || 'No specific case'}</div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <h4 className="font-medium mb-2">Priority</h4>
                  <Badge variant={getPriorityColor(selectedInstruction.priority)}>
                    {selectedInstruction.priority}
                  </Badge>
                </div>
                <div>
                  <h4 className="font-medium mb-2">Status</h4>
                  <Badge variant={getStatusColor(selectedInstruction.status)}>
                    {selectedInstruction.status.replace('_', ' ')}
                  </Badge>
                </div>
                <div>
                  <h4 className="font-medium mb-2">Deadline</h4>
                  <div className={isOverdue(selectedInstruction.deadline) ? 'text-destructive' : ''}>
                    {selectedInstruction.deadline 
                      ? new Date(selectedInstruction.deadline).toLocaleDateString()
                      : 'No deadline'
                    }
                    {isOverdue(selectedInstruction.deadline) && (
                      <span className="text-xs block">(Overdue)</span>
                    )}
                  </div>
                </div>
              </div>

              <div>
                <h4 className="font-medium mb-2">Message</h4>
                <div className="bg-muted/50 p-3 rounded-lg">
                  {selectedInstruction.message}
                </div>
              </div>

              <div>
                <h4 className="font-medium mb-2">Received</h4>
                <div className="text-sm text-muted-foreground">
                  {new Date(selectedInstruction.created_at).toLocaleString()}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2 pt-4 border-t">
                {selectedInstruction.status === 'pending' && (
                  <Button
                    onClick={() => handleUpdateStatus(selectedInstruction.id, 'accepted')}
                    className="flex-1"
                  >
                    Accept Instruction
                  </Button>
                )}
                
                {selectedInstruction.status === 'accepted' && (
                  <Button
                    onClick={() => handleUpdateStatus(selectedInstruction.id, 'in_progress')}
                    className="flex-1"
                  >
                    Start Working
                  </Button>
                )}
                
                {selectedInstruction.status === 'in_progress' && (
                  <Button
                    onClick={() => handleUpdateStatus(selectedInstruction.id, 'completed')}
                    className="flex-1"
                  >
                    Mark as Completed
                  </Button>
                )}
                
                <Button variant="outline" onClick={() => setShowDetailDialog(false)}>
                  Close
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default StaffInstructions;