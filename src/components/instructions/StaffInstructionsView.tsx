import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, Clock, AlertCircle, User, Calendar } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface Instruction {
  id: string;
  message: string;
  priority: string;
  status: string;
  deadline: string | null;
  created_at: string;
  lawyer_id: string;
  case_id: string | null;
  case_title?: string;
  lawyer_name?: string;
}

const StaffInstructionsView = () => {
  const [instructions, setInstructions] = useState<Instruction[]>([]);
  const [loading, setLoading] = useState(true);
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
      case 'completed': return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'in_progress': return <Clock className="h-4 w-4 text-blue-600" />;
      case 'accepted': return <AlertCircle className="h-4 w-4 text-yellow-600" />;
      case 'pending': return <Clock className="h-4 w-4 text-gray-400" />;
      default: return <Clock className="h-4 w-4 text-gray-400" />;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">Loading your instructions...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>My Instructions</CardTitle>
      </CardHeader>
      <CardContent>
        {instructions.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No instructions assigned to you yet.
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Task</TableHead>
                <TableHead>From</TableHead>
                <TableHead>Priority</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Deadline</TableHead>
                <TableHead>Case</TableHead>
                <TableHead>Received</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {instructions.map((instruction) => (
                <TableRow key={instruction.id}>
                  <TableCell className="max-w-xs">
                    <div className="truncate" title={instruction.message}>
                      {instruction.message}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4" />
                      {instruction.lawyer_name}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={getPriorityColor(instruction.priority)}>
                      {instruction.priority}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {getStatusIcon(instruction.status)}
                      <span className="capitalize">
                        {instruction.status.replace('_', ' ')}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    {instruction.deadline ? (
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        {formatDate(instruction.deadline)}
                      </div>
                    ) : (
                      <span className="text-muted-foreground">No deadline</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {instruction.case_title ? (
                      <div className="truncate max-w-xs" title={instruction.case_title}>
                        {instruction.case_title}
                      </div>
                    ) : (
                      <span className="text-muted-foreground">No case</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {formatDate(instruction.created_at)}
                  </TableCell>
                  <TableCell>
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
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
};

export default StaffInstructionsView;