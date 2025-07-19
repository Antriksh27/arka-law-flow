import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Edit, Trash2, Calendar, User } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { EditInstructionDialog } from './EditInstructionDialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';

interface Instruction {
  id: string;
  message: string;
  priority: string;
  status: string;
  deadline: string | null;
  created_at: string;
  staff_id: string | null;
  case_id: string | null;
  staff_name?: string;
  case_title?: string;
}

const InstructionsTable = () => {
  const [instructions, setInstructions] = useState<Instruction[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingInstruction, setEditingInstruction] = useState<Instruction | null>(null);
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
          staff_id,
          case_id
        `)
        .eq('lawyer_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Get staff names and case titles
      const instructionsWithDetails = await Promise.all(
        (data || []).map(async (instruction) => {
          let staff_name = '';
          let case_title = '';

          if (instruction.staff_id) {
            const { data: staffData } = await supabase
              .from('profiles')
              .select('full_name')
              .eq('id', instruction.staff_id)
              .single();
            staff_name = staffData?.full_name || '';
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
            staff_name,
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

  useEffect(() => {
    loadInstructions();

    // Set up real-time subscription for instructions
    const channel = supabase
      .channel('schema-db-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'instructions',
          filter: `lawyer_id=eq.${user?.id}`
        },
        (payload) => {
          console.log('Real-time change:', payload);
          // Reload instructions when changes occur
          loadInstructions();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id]);

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase
        .from('instructions')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setInstructions(prev => prev.filter(instruction => instruction.id !== id));
      toast({
        title: "Success",
        description: "Instruction deleted successfully",
      });
    } catch (error) {
      console.error('Error deleting instruction:', error);
      toast({
        title: "Error",
        description: "Failed to delete instruction",
        variant: "destructive",
      });
    }
  };

  const handleEdit = (instruction: Instruction) => {
    setEditingInstruction(instruction);
  };

  const handleUpdateInstruction = (updatedInstruction: Instruction) => {
    setInstructions(prev => 
      prev.map(instruction => 
        instruction.id === updatedInstruction.id ? updatedInstruction : instruction
      )
    );
    setEditingInstruction(null);
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'error';
      case 'high': return 'warning';
      case 'medium': return 'default';
      case 'low': return 'outline';
      default: return 'default';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'success';
      case 'in_progress': return 'warning';
      case 'accepted': return 'default';
      case 'pending': return 'outline';
      default: return 'default';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">Loading instructions...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>All Instructions</CardTitle>
        </CardHeader>
        <CardContent>
          {instructions.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No instructions found. Create some using the chat interface above.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Task</TableHead>
                  <TableHead>Staff Member</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Deadline</TableHead>
                  <TableHead>Case</TableHead>
                  <TableHead>Created</TableHead>
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
                      {instruction.staff_name ? (
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4" />
                          {instruction.staff_name}
                        </div>
                      ) : (
                        <span className="text-muted-foreground">Unassigned</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant={getPriorityColor(instruction.priority)}>
                        {instruction.priority}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={getStatusColor(instruction.status)}>
                        {instruction.status.replace('_', ' ')}
                      </Badge>
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
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEdit(instruction)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="outline" size="sm">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete Instruction</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to delete this instruction? This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleDelete(instruction.id)}>
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {editingInstruction && (
        <EditInstructionDialog
          instruction={editingInstruction}
          open={!!editingInstruction}
          onClose={() => setEditingInstruction(null)}
          onUpdate={handleUpdateInstruction}
        />
      )}
    </>
  );
};

export default InstructionsTable;