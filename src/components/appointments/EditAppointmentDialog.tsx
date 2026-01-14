import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import { Badge } from '../ui/badge';
import { X, UserPlus, Users } from 'lucide-react';
import { format } from 'date-fns';
import TimeUtils from '@/lib/timeUtils';
import { supabase } from '@/integrations/supabase/client';
import { useDialog } from '@/hooks/use-dialog';
import { toast } from 'sonner';
import { SmartBookingCalendar } from '@/components/appointments/SmartBookingCalendar';
import { ClientSelector } from '@/components/appointments/ClientSelector';
import { CaseSelector } from '@/components/appointments/CaseSelector';
import { useAuth } from '@/contexts/AuthContext';

interface Appointment {
  id: string;
  title: string;
  appointment_date: string;
  appointment_time: string;
  duration_minutes: number;
  client_id?: string;
  lawyer_id?: string;
  case_id?: string;
  location: 'in_person' | 'online' | 'phone' | string;
  notes?: string;
  status: string;
}

interface EditAppointmentDialogProps {
  appointment: Appointment;
  onSuccess: () => void;
}

interface Case {
  id: string;
  case_title: string;
  case_number: string;
}

interface User {
  id: string;
  full_name: string;
  role?: string;
}

// Helper to extract additional lawyers from notes
const extractAdditionalLawyersFromNotes = (notes: string | undefined): string[] => {
  if (!notes) return [];
  const match = notes.match(/^Additional Lawyers: (.+?)(?:\n|$)/);
  if (match) {
    return match[1].split(', ').map(name => name.trim());
  }
  return [];
};

// Helper to remove additional lawyers line from notes
const removeAdditionalLawyersFromNotes = (notes: string | undefined): string => {
  if (!notes) return '';
  return notes.replace(/^Additional Lawyers: .+?\n\n?/, '').trim();
};

export const EditAppointmentDialog: React.FC<EditAppointmentDialogProps> = ({ 
  appointment, 
  onSuccess 
}) => {
  const { closeDialog } = useDialog();
  const { user, firmId } = useAuth();
  const [loading, setLoading] = useState(false);
  const [cases, setCases] = useState<Case[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [additionalLawyers, setAdditionalLawyers] = useState<string[]>([]);
  const [originalAdditionalLawyers, setOriginalAdditionalLawyers] = useState<string[]>([]);
  
  // Clean notes by removing the additional lawyers line
  const cleanNotes = removeAdditionalLawyersFromNotes(appointment.notes);
  
  const [formData, setFormData] = useState({
    title: appointment.title || '',
    appointment_date: TimeUtils.toISTDate(appointment.appointment_date) || TimeUtils.nowDate(),
    appointment_time: appointment.appointment_time || '',
    duration_minutes: appointment.duration_minutes || 60,
    client_id: appointment.client_id || '',
    lawyer_id: appointment.lawyer_id || '',
    case_id: appointment.case_id || '',
    location: appointment.location || 'in_person', 
    notes: cleanNotes,
    status: appointment.status || 'upcoming'
  });

  useEffect(() => {
    fetchCases();
    fetchUsers();
  }, []);

  // Once users are loaded, map the additional lawyer names to IDs
  useEffect(() => {
    if (users.length > 0 && appointment.notes) {
      const lawyerNames = extractAdditionalLawyersFromNotes(appointment.notes);
      const lawyerIds = lawyerNames
        .map(name => users.find(u => u.full_name === name)?.id)
        .filter((id): id is string => !!id);
      setAdditionalLawyers(lawyerIds);
      setOriginalAdditionalLawyers(lawyerIds);
    }
  }, [users, appointment.notes]);

  const fetchCases = async () => {
    const { data } = await supabase
      .from('cases')
      .select('id, case_title, case_number')
      .order('case_title');
    setCases(data || []);
  };

  const fetchUsers = async () => {
    const { data, error } = await supabase
      .from('team_members')
      .select('user_id, full_name, role')
      .in('role', ['admin', 'lawyer', 'junior'])
      .eq('firm_id', firmId);
    
    if (error) {
      console.error('Error fetching users:', error);
      return;
    }
    
    // Sort to always show "chitrajeet upadhyaya" first
    const sortedData = (data || []).sort((a, b) => {
      const nameA = a.full_name?.toLowerCase() || '';
      const nameB = b.full_name?.toLowerCase() || '';
      
      if (nameA.includes('chitrajeet upadhyaya')) return -1;
      if (nameB.includes('chitrajeet upadhyaya')) return 1;
      return nameA.localeCompare(nameB);
    });
    
    setUsers(sortedData.map(u => ({
      id: u.user_id,
      full_name: u.full_name,
      role: u.role
    })));
  };

  const sendNotificationsToNewLawyers = async (newLawyerIds: string[], title: string, appointmentDate: string, appointmentTime: string) => {
    if (newLawyerIds.length === 0) return;

    const primaryLawyer = users.find(u => u.id === formData.lawyer_id);
    const formattedDate = format(new Date(appointmentDate), 'MMM dd, yyyy');
    
    const notifications = newLawyerIds.map(lawyerId => ({
      recipient_id: lawyerId,
      title: 'Added to Appointment',
      message: `You have been added to an appointment: "${title}" on ${formattedDate} at ${appointmentTime}${primaryLawyer ? ` with ${primaryLawyer.full_name}` : ''}`,
      category: 'appointments',
      notification_type: 'appointment' as const,
      action_url: `/appointments`,
      reference_id: appointment.id,
      priority: 'normal',
      read: false
    }));

    const { error } = await supabase.from('notifications').insert(notifications);
    
    if (error) {
      console.error('Error sending notifications:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Build additional lawyers note line
      const additionalLawyerNames = additionalLawyers
        .filter(id => id !== formData.lawyer_id)
        .map(id => users.find(u => u.id === id)?.full_name)
        .filter(Boolean);
      
      let notesWithLawyers = formData.notes;
      if (additionalLawyerNames.length > 0) {
        const lawyerInfo = `Additional Lawyers: ${additionalLawyerNames.join(', ')}`;
        notesWithLawyers = formData.notes ? `${lawyerInfo}\n\n${formData.notes}` : lawyerInfo;
      }

      const updateData = {
        title: formData.title,
        appointment_date: TimeUtils.formatDateInput(formData.appointment_date),
        appointment_time: formData.appointment_time,
        duration_minutes: Number(formData.duration_minutes),
        client_id: formData.client_id || null,
        lawyer_id: formData.lawyer_id,
        case_id: formData.case_id || null,
        location: formData.location,
        notes: notesWithLawyers,
        status: formData.status
      };

      const { error } = await supabase
        .from('appointments')
        .update(updateData)
        .eq('id', appointment.id);

      if (error) throw error;

      // Find newly added lawyers and notify them
      const newLawyerIds = additionalLawyers.filter(
        id => id !== formData.lawyer_id && !originalAdditionalLawyers.includes(id)
      );
      
      if (newLawyerIds.length > 0) {
        await sendNotificationsToNewLawyers(
          newLawyerIds,
          formData.title,
          TimeUtils.formatDateInput(formData.appointment_date),
          formData.appointment_time
        );
      }

      const notifiedCount = newLawyerIds.length;
      toast.success(
        notifiedCount > 0 
          ? `Appointment updated and ${notifiedCount} team member(s) notified`
          : 'Appointment updated successfully'
      );
      onSuccess();
      closeDialog();
    } catch (error) {
      console.error('Error updating appointment:', error);
      toast.error('Failed to update appointment');
    } finally {
      setLoading(false);
    }
  };
  
  const handleInputChange = (field: keyof typeof formData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleAddLawyer = (lawyerId: string) => {
    if (!additionalLawyers.includes(lawyerId)) {
      setAdditionalLawyers(prev => [...prev, lawyerId]);
    }
  };

  const handleRemoveLawyer = (lawyerId: string) => {
    setAdditionalLawyers(prev => prev.filter(id => id !== lawyerId));
  };

  const getAvailableLawyers = () => {
    return users.filter(u => 
      u.id !== formData.lawyer_id && 
      !additionalLawyers.includes(u.id)
    );
  };

  const locationTypeOptions = [
    { value: 'in_person', label: 'In-Person Meeting' },
    { value: 'online', label: 'Video Call' },
    { value: 'phone', label: 'Phone Call' },
  ];

  return (
    <Dialog open onOpenChange={closeDialog}>
      <DialogContent className="max-w-2xl max-h-[90vh] bg-background border-border overflow-hidden">
        <DialogHeader className="pb-4">
          <DialogTitle className="text-xl font-semibold text-foreground">Edit Appointment</DialogTitle>
        </DialogHeader>
        
        <div className="overflow-y-auto px-1 max-h-[calc(90vh-120px)]">
          <form onSubmit={handleSubmit} className="space-y-4 pr-3">
            <div className="space-y-2">
              <Label htmlFor="title" className="text-sm font-medium text-foreground">Title *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => handleInputChange('title', e.target.value)}
                placeholder="Appointment title"
                required
                className="bg-background border-border text-foreground"
              />
            </div>

            {/* Assigned To Section */}
            <div className="bg-accent/30 rounded-xl p-4 space-y-3 border border-accent/50">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-primary" />
                <Label htmlFor="lawyer_id" className="text-sm font-semibold text-foreground">
                  Assigned Team Members
                </Label>
              </div>
              
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">Primary Assignee *</Label>
                <Select
                  value={formData.lawyer_id}
                  onValueChange={(value) => handleInputChange('lawyer_id', value)}
                  required
                >
                  <SelectTrigger className="bg-background border-border text-foreground">
                    <SelectValue placeholder="Select user" />
                  </SelectTrigger>
                  <SelectContent className="bg-background border-border">
                    {users.map((user) => (
                      <SelectItem key={user.id} value={user.id} className="text-foreground">
                        {user.full_name} {user.role && <span className="text-muted-foreground">({user.role})</span>}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Additional Lawyers */}
              <div className="pt-2 border-t border-border/50">
                <Label className="text-xs text-muted-foreground">Additional Team Members</Label>
                
                {additionalLawyers.filter(id => id !== formData.lawyer_id).length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2 mb-3">
                    {additionalLawyers.map(lawyerId => {
                      const lawyer = users.find(u => u.id === lawyerId);
                      if (!lawyer || lawyerId === formData.lawyer_id) return null;
                      return (
                        <Badge 
                          key={lawyerId} 
                          variant="outline" 
                          className="flex items-center gap-1 pl-2 pr-1 py-1 bg-accent"
                        >
                          {lawyer.full_name}
                          <button
                            type="button"
                            onClick={() => handleRemoveLawyer(lawyerId)}
                            className="ml-1 rounded-full p-0.5 hover:bg-background/50 transition-colors"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </Badge>
                      );
                    })}
                  </div>
                )}
                
                {getAvailableLawyers().length > 0 && (
                  <Select onValueChange={handleAddLawyer} value="">
                    <SelectTrigger className="bg-background border-border text-foreground h-9 mt-2">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <UserPlus className="h-4 w-4" />
                        <span>Add team member...</span>
                      </div>
                    </SelectTrigger>
                    <SelectContent className="bg-background border-border">
                      {getAvailableLawyers().map(user => (
                        <SelectItem key={user.id} value={user.id} className="text-foreground">
                          {user.full_name} {user.role && <span className="text-muted-foreground">({user.role})</span>}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
                
                <p className="text-xs text-muted-foreground mt-2">
                  Newly added team members will receive a notification
                </p>
              </div>
            </div>

            {/* Smart Booking Calendar */}
            <SmartBookingCalendar
              selectedLawyer={formData.lawyer_id || null}
              selectedDate={formData.appointment_date}
              selectedTime={formData.appointment_time}
              hideLawyerPicker
              onTimeSlotSelect={(date, time, duration) => {
                handleInputChange('appointment_date', date);
                handleInputChange('appointment_time', time);
                handleInputChange('duration_minutes', duration);
              }}
            />
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-sm font-medium text-foreground">Duration</Label>
                <div className="rounded-md border border-border bg-background px-3 py-2 text-foreground">
                  {formData.duration_minutes} minutes
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="location" className="text-sm font-medium text-foreground">Type / Location</Label>
                <Select
                  value={formData.location}
                  onValueChange={(value) => handleInputChange('location', value)}
                >
                  <SelectTrigger className="bg-background border-border text-foreground">
                    <SelectValue placeholder="Select type/location" />
                  </SelectTrigger>
                  <SelectContent className="bg-background border-border">
                    {locationTypeOptions.map(opt => (
                      <SelectItem key={opt.value} value={opt.value} className="text-foreground">
                        {opt.label}
                      </SelectItem>
                    ))}
                    <SelectItem value="other" className="text-foreground">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="status" className="text-sm font-medium text-foreground">Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value) => handleInputChange('status', value)}
                >
                  <SelectTrigger className="bg-background border-border text-foreground">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-background border-border">
                    <SelectItem value="upcoming" className="text-foreground">Upcoming</SelectItem>
                    <SelectItem value="completed" className="text-foreground">Completed</SelectItem>
                    <SelectItem value="cancelled" className="text-foreground">Cancelled</SelectItem>
                    <SelectItem value="rescheduled" className="text-foreground">Rescheduled</SelectItem>
                    <SelectItem value="pending" className="text-foreground">Pending</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label className="text-sm font-medium text-foreground">Client / Contact</Label>
                <ClientSelector
                  value={formData.client_id}
                  onValueChange={(value) => handleInputChange('client_id', value)}
                  placeholder="Select client or contact"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="case_id" className="text-sm font-medium text-foreground">Related Case (Optional)</Label>
              <CaseSelector
                value={formData.case_id}
                onValueChange={(value) => handleInputChange('case_id', value)}
                placeholder="Select case (optional)"
                clientId={formData.client_id}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="notes" className="text-sm font-medium text-foreground">Notes</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => handleInputChange('notes', e.target.value)}
                placeholder="Additional notes or agenda items..."
                rows={3}
                className="bg-background border-border text-foreground resize-none"
              />
            </div>

            <div className="flex justify-end gap-3 pt-4 sticky bottom-0 bg-background border-t border-border pb-2">
              <Button 
                type="button" 
                variant="outline" 
                onClick={closeDialog}
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                className="bg-primary hover:bg-primary/90"
                disabled={loading}
              >
                {loading ? 'Updating...' : 'Update Appointment'}
              </Button>
            </div>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
};
