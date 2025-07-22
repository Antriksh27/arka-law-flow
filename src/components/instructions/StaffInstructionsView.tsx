import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CheckCircle, Clock, AlertCircle, User, Calendar, Search, Filter, CheckCheck, CircleDot, PlayCircle, Timer, MessageCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { InstructionDetailDialog } from '@/components/instructions/InstructionDetailDialog';

interface Instruction {
  id: string;
  message: string;
  priority: string;
  status: string;
  deadline: string | null;
  created_at: string;
  lawyer_id: string;
  staff_id: string | null;
  case_id: string | null;
  case_title?: string;
  lawyer_name?: string;
}

const StaffInstructionsView = () => {
  const [instructions, setInstructions] = useState<Instruction[]>([]);
  const [filteredInstructions, setFilteredInstructions] = useState<Instruction[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [selectedInstruction, setSelectedInstruction] = useState<Instruction | null>(null);
  const [showDetailDialog, setShowDetailDialog] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  const loadInstructions = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('instructions')
        .select(`
          id,
          message,
          priority,
          status,
          deadline,
          created_at,
          lawyer_id,
          staff_id,
          case_id
        `)
        .eq('staff_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Get lawyer names and case titles
      const instructionsWithDetails = await Promise.all(
        (data || []).map(async (instruction) => {
          let lawyer_name = '';
          let case_title = '';

          if (instruction.lawyer_id) {
            const { data: lawyerData } = await supabase
              .from('profiles')
              .select('full_name')
              .eq('id', instruction.lawyer_id)
              .single();
            lawyer_name = lawyerData?.full_name || '';
          }

          if (instruction.case_id) {
            const { data: caseData } = await supabase
              .from('cases')
              .select('case_title')
              .eq('id', instruction.case_id)
              .single();
            case_title = caseData?.case_title || '';
          }

          return {
            ...instruction,
            lawyer_name,
            case_title,
          };
        })
      );

      setInstructions(instructionsWithDetails);
      setFilteredInstructions(instructionsWithDetails);
    } catch (error) {
      console.error('Error loading instructions:', error);
      toast({
        title: "Error",
        description: "Failed to load instructions",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const updateInstructionStatus = async (instructionId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('instructions')
        .update({ status: newStatus })
        .eq('id', instructionId);

      if (error) throw error;

      setInstructions(prev => 
        prev.map(instruction => 
          instruction.id === instructionId 
            ? { ...instruction, status: newStatus }
            : instruction
        )
      );

      toast({
        title: "Success",
        description: "Status updated successfully",
      });
    } catch (error) {
      console.error('Error updating status:', error);
      toast({
        title: "Error",
        description: "Failed to update status",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    loadInstructions();

    // Set up real-time subscription for instructions assigned to this staff member
    const channel = supabase
      .channel('staff-instructions')
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
            loadInstructions();
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
  }, [user?.id]);

  // Filter instructions based on search and filters
  useEffect(() => {
    let filtered = instructions;

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(instruction =>
        instruction.message.toLowerCase().includes(searchQuery.toLowerCase()) ||
        instruction.lawyer_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        instruction.case_title?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(instruction => instruction.status === statusFilter);
    }

    // Priority filter
    if (priorityFilter !== 'all') {
      filtered = filtered.filter(instruction => instruction.priority === priorityFilter);
    }

    setFilteredInstructions(filtered);
  }, [instructions, searchQuery, statusFilter, priorityFilter]);

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'error';
      case 'high': return 'warning';
      case 'medium': return 'default';
      case 'low': return 'outline';
      default: return 'default';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCheck className="h-4 w-4 text-green-600" />;
      case 'in_progress': return <PlayCircle className="h-4 w-4 text-blue-600" />;
      case 'accepted': return <CircleDot className="h-4 w-4 text-yellow-600" />;
      case 'pending': return <Timer className="h-4 w-4 text-gray-400" />;
      default: return <Timer className="h-4 w-4 text-gray-400" />;
    }
  };

  const getStatusStats = () => {
    const stats = {
      pending: instructions.filter(i => i.status === 'pending').length,
      accepted: instructions.filter(i => i.status === 'accepted').length,
      in_progress: instructions.filter(i => i.status === 'in_progress').length,
      completed: instructions.filter(i => i.status === 'completed').length,
    };
    return stats;
  };

  const isOverdue = (deadline: string | null) => {
    if (!deadline) return false;
    return new Date(deadline) < new Date();
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-8 bg-gray-200 rounded w-1/2"></div>
              </CardContent>
            </Card>
          ))}
        </div>
        <Card>
          <CardContent className="p-6">
            <div className="text-center">Loading your instructions...</div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const stats = getStatusStats();

  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Pending</p>
                <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
              </div>
              <Timer className="h-8 w-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">In Progress</p>
                <p className="text-2xl font-bold text-blue-600">{stats.in_progress}</p>
              </div>
              <PlayCircle className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Completed</p>
                <p className="text-2xl font-bold text-green-600">{stats.completed}</p>
              </div>
              <CheckCheck className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total</p>
                <p className="text-2xl font-bold">{instructions.length}</p>
              </div>
              <AlertCircle className="h-8 w-8 text-gray-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filter Instructions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search instructions, lawyers, or cases..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="accepted">Accepted</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={priorityFilter} onValueChange={setPriorityFilter}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Filter by priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Priority</SelectItem>
                <SelectItem value="urgent">Urgent</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="low">Low</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Instructions List */}
      <Card>
        <CardHeader>
          <CardTitle>
            My Instructions ({filteredInstructions.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {filteredInstructions.length === 0 ? (
            <div className="text-center py-12">
              <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-lg font-medium text-muted-foreground mb-2">
                {instructions.length === 0 ? 'No instructions yet' : 'No matching instructions'}
              </p>
              <p className="text-sm text-muted-foreground">
                {instructions.length === 0 
                  ? 'You haven\'t received any instructions yet.' 
                  : 'Try adjusting your search or filter criteria.'
                }
              </p>
            </div>
          ) : (
            <Tabs defaultValue="cards" className="w-full">
              <TabsList className="mb-4">
                <TabsTrigger value="cards">Card View</TabsTrigger>
                <TabsTrigger value="list">List View</TabsTrigger>
              </TabsList>
              
              <TabsContent value="cards" className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {filteredInstructions.map((instruction) => (
                    <Card key={instruction.id} className={`${isOverdue(instruction.deadline) && instruction.status !== 'completed' ? 'border-red-200 bg-red-50' : ''}`}>
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between gap-2">
                          <div className="space-y-1 flex-1">
                            <Badge variant={getPriorityColor(instruction.priority)} className="text-xs">
                              {instruction.priority}
                            </Badge>
                            {isOverdue(instruction.deadline) && instruction.status !== 'completed' && (
                              <Badge variant="error" className="text-xs ml-1">
                                Overdue
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-1">
                            {getStatusIcon(instruction.status)}
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="pt-0">
                        <div className="space-y-3">
                          <p className="text-sm leading-relaxed">{instruction.message}</p>
                          
                          <div className="space-y-2 text-xs text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <User className="h-3 w-3" />
                              <span>From: {instruction.lawyer_name}</span>
                            </div>
                            
                            {instruction.deadline && (
                              <div className="flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                <span className={isOverdue(instruction.deadline) && instruction.status !== 'completed' ? 'text-red-600 font-medium' : ''}>
                                  Due: {formatDate(instruction.deadline)}
                                </span>
                              </div>
                            )}
                            
                            {instruction.case_title && (
                              <div className="text-xs">
                                <span className="font-medium">Case:</span> {instruction.case_title}
                              </div>
                            )}
                            
                            <div className="text-xs">
                              Received: {formatDate(instruction.created_at)}
                            </div>
                          </div>
                          
                           <div className="pt-2 flex gap-2">
                             <Button
                               variant="outline"
                               size="sm"
                               onClick={() => {
                                 setSelectedInstruction(instruction);
                                 setShowDetailDialog(true);
                               }}
                               className="flex-1"
                             >
                               <MessageCircle className="w-4 h-4 mr-2" />
                               View Details
                             </Button>
                             <Select
                               value={instruction.status}
                               onValueChange={(value) => updateInstructionStatus(instruction.id, value)}
                             >
                               <SelectTrigger className="w-24">
                                 <SelectValue />
                               </SelectTrigger>
                               <SelectContent>
                                 <SelectItem value="pending">Pending</SelectItem>
                                 <SelectItem value="accepted">Accepted</SelectItem>
                                 <SelectItem value="in_progress">In Progress</SelectItem>
                                 <SelectItem value="completed">Completed</SelectItem>
                               </SelectContent>
                             </Select>
                           </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </TabsContent>
              
              <TabsContent value="list">
                <div className="space-y-2">
                  {filteredInstructions.map((instruction) => (
                    <Card key={instruction.id} className={`${isOverdue(instruction.deadline) && instruction.status !== 'completed' ? 'border-red-200 bg-red-50' : ''}`}>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between gap-4">
                          <div className="flex-1 space-y-1">
                            <div className="flex items-center gap-2">
                              {getStatusIcon(instruction.status)}
                              <span className="font-medium text-sm">{instruction.message}</span>
                              <Badge variant={getPriorityColor(instruction.priority)} className="text-xs">
                                {instruction.priority}
                              </Badge>
                              {isOverdue(instruction.deadline) && instruction.status !== 'completed' && (
                                <Badge variant="error" className="text-xs">
                                  Overdue
                                </Badge>
                              )}
                            </div>
                            <div className="flex items-center gap-4 text-xs text-muted-foreground">
                              <span>From: {instruction.lawyer_name}</span>
                              {instruction.deadline && (
                                <span className={isOverdue(instruction.deadline) && instruction.status !== 'completed' ? 'text-red-600 font-medium' : ''}>
                                  Due: {formatDate(instruction.deadline)}
                                </span>
                              )}
                              {instruction.case_title && <span>Case: {instruction.case_title}</span>}
                            </div>
                          </div>
                          
                           <div className="flex items-center gap-2">
                             <Button
                               variant="outline"
                               size="sm"
                               onClick={() => {
                                 setSelectedInstruction(instruction);
                                 setShowDetailDialog(true);
                               }}
                             >
                               <MessageCircle className="w-4 h-4" />
                             </Button>
                             <Select
                               value={instruction.status}
                               onValueChange={(value) => updateInstructionStatus(instruction.id, value)}
                             >
                               <SelectTrigger className="w-[130px]">
                                 <SelectValue />
                               </SelectTrigger>
                               <SelectContent>
                                 <SelectItem value="pending">Pending</SelectItem>
                                 <SelectItem value="accepted">Accepted</SelectItem>
                                 <SelectItem value="in_progress">In Progress</SelectItem>
                                 <SelectItem value="completed">Completed</SelectItem>
                               </SelectContent>
                             </Select>
                           </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </TabsContent>
            </Tabs>
          )}
        </CardContent>
      </Card>

      {/* Instruction Detail Dialog */}
      <InstructionDetailDialog
        instruction={selectedInstruction}
        isOpen={showDetailDialog}
        onClose={() => setShowDetailDialog(false)}
        onUpdate={loadInstructions}
      />
    </div>
  );
};

export default StaffInstructionsView;