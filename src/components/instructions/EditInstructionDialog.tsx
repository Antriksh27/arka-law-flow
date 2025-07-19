import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface Instruction {
  id: string;
  message: string;
  priority: string;
  status: string;
  deadline: string | null;
  staff_id: string | null;
  case_id: string | null;
  staff_name?: string;
  case_title?: string;
}

interface EditInstructionDialogProps {
  instruction: Instruction;
  open: boolean;
  onClose: () => void;
  onUpdate: (updatedInstruction: Instruction) => void;
}

interface StaffMember {
  id: string;
  full_name: string;
  role: string;
}

interface Case {
  id: string;
  case_title: string;
}

export const EditInstructionDialog: React.FC<EditInstructionDialogProps> = ({
  instruction,
  open,
  onClose,
  onUpdate,
}) => {
  const [formData, setFormData] = useState({
    message: instruction.message,
    priority: instruction.priority,
    status: instruction.status,
    deadline: instruction.deadline || '',
    staff_id: instruction.staff_id || 'unassigned',
    case_id: instruction.case_id || 'none',
  });
  const [staffMembers, setStaffMembers] = useState<StaffMember[]>([]);
  const [cases, setCases] = useState<Case[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (open) {
      loadStaffMembers();
      loadCases();
    }
  }, [open]);

  const loadStaffMembers = async () => {
    try {
      const { data, error } = await supabase
        .from('team_members')
        .select(`
          user_id,
          role
        `)
        .in('role', ['office_staff', 'paralegal', 'junior']);

      if (error) throw error;

      const userIds = data?.map(member => member.user_id) || [];
      if (userIds.length === 0) return;

      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, full_name')
        .in('id', userIds);

      if (profilesError) throw profilesError;

      const formattedStaff = data
        ?.map(member => {
          const profile = profiles?.find(p => p.id === member.user_id);
          return profile ? {
            id: profile.id,
            full_name: profile.full_name,
            role: member.role
          } : null;
        })
        .filter(Boolean) as StaffMember[] || [];

      setStaffMembers(formattedStaff);
    } catch (error) {
      console.error('Error loading staff members:', error);
    }
  };

  const loadCases = async () => {
    try {
      const { data, error } = await supabase
        .from('cases')
        .select('id, case_title')
        .limit(50);

      if (error) throw error;
      setCases(data || []);
    } catch (error) {
      console.error('Error loading cases:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data, error } = await supabase
        .from('instructions')
        .update({
          message: formData.message,
          priority: formData.priority,
          status: formData.status,
          deadline: formData.deadline || null,
          staff_id: formData.staff_id === 'unassigned' ? null : formData.staff_id,
          case_id: formData.case_id === 'none' ? null : formData.case_id,
        })
        .eq('id', instruction.id)
        .select()
        .single();

      if (error) throw error;

      // Get updated staff and case names
      let staff_name = '';
      let case_title = '';

      if (formData.staff_id && formData.staff_id !== 'unassigned') {
        const staffMember = staffMembers.find(s => s.id === formData.staff_id);
        staff_name = staffMember?.full_name || '';
      }

      if (formData.case_id && formData.case_id !== 'none') {
        const caseData = cases.find(c => c.id === formData.case_id);
        case_title = caseData?.case_title || '';
      }

      onUpdate({
        ...data,
        staff_name,
        case_title,
      });

      toast({
        title: "Success",
        description: "Instruction updated successfully",
      });
    } catch (error) {
      console.error('Error updating instruction:', error);
      toast({
        title: "Error",
        description: "Failed to update instruction",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Edit Instruction</DialogTitle>
          <DialogDescription>
            Update the instruction details below.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="message">Task Message</Label>
            <Textarea
              id="message"
              value={formData.message}
              onChange={(e) => setFormData(prev => ({ ...prev, message: e.target.value }))}
              placeholder="Enter the task description"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="priority">Priority</Label>
              <Select
                value={formData.priority}
                onValueChange={(value) => setFormData(prev => ({ ...prev, priority: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="urgent">Urgent</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select
                value={formData.status}
                onValueChange={(value) => setFormData(prev => ({ ...prev, status: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
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

          <div className="space-y-2">
            <Label htmlFor="deadline">Deadline</Label>
            <Input
              id="deadline"
              type="date"
              value={formData.deadline}
              onChange={(e) => setFormData(prev => ({ ...prev, deadline: e.target.value }))}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="staff">Staff Member</Label>
            <Select
              value={formData.staff_id}
              onValueChange={(value) => setFormData(prev => ({ ...prev, staff_id: value === 'unassigned' ? '' : value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select staff member" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="unassigned">Unassigned</SelectItem>
                {staffMembers.map((staff) => (
                  <SelectItem key={staff.id} value={staff.id}>
                    {staff.full_name} ({staff.role.replace('_', ' ')})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="case">Related Case</Label>
            <Select
              value={formData.case_id}
              onValueChange={(value) => setFormData(prev => ({ ...prev, case_id: value === 'none' ? '' : value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select case" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No case</SelectItem>
                {cases.map((caseItem) => (
                  <SelectItem key={caseItem.id} value={caseItem.id}>
                    {caseItem.case_title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Updating...' : 'Update Instruction'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};