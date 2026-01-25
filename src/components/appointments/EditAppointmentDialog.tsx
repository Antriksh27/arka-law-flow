import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
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
import { X, UserPlus, Users, Type, Calendar, Clock, MapPin, FileText, User, Briefcase } from 'lucide-react';
import { format } from 'date-fns';
import TimeUtils from '@/lib/timeUtils';
import { supabase } from '@/integrations/supabase/client';
import { useDialog } from '@/hooks/use-dialog';
import { toast } from 'sonner';
import { SmartBookingCalendar } from '@/components/appointments/SmartBookingCalendar';
import { ClientSelector } from '@/components/appointments/ClientSelector';
import { CaseSelector } from '@/components/appointments/CaseSelector';
import { useAuth } from '@/contexts/AuthContext';
import { MobileDialogHeader } from '@/components/ui/mobile-dialog-header';

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
  
  const [formData, setFormData] = useState({
    title: appointment.title || '',
    appointment_date: TimeUtils.toISTDate(appointment.appointment_date) || TimeUtils.nowDate(),
    appointment_time: appointment.appointment_time || '',
    duration_minutes: appointment.duration_minutes || 60,
    client_id: appointment.client_id || '',
    lawyer_id: appointment.lawyer_id || '',
    case_id: appointment.case_id || '',
    location: appointment.location || 'in_person', 
    notes: appointment.notes || '',
    status: appointment.status || 'upcoming'
  });

  useEffect(() => {
    fetchCases();
    fetchUsers();
    fetchAdditionalLawyers();
  }, []);

  const fetchAdditionalLawyers = async () => {
    const { data, error } = await (supabase as any)
      .from('appointment_lawyers')
      .select('lawyer_id')
      .eq('appointment_id', appointment.id);
    
    if (error) {
      console.error('Error fetching additional lawyers:', error);
      return;
    }
    
    const lawyerIds = (data || []).map((row: any) => row.lawyer_id);
    setAdditionalLawyers(lawyerIds);
    setOriginalAdditionalLawyers(lawyerIds);
  };

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
      const updateData = {
        title: formData.title,
        appointment_date: TimeUtils.formatDateInput(formData.appointment_date),
        appointment_time: formData.appointment_time,
        duration_minutes: Number(formData.duration_minutes),
        client_id: formData.client_id || null,
        lawyer_id: formData.lawyer_id,
        case_id: formData.case_id || null,
        location: formData.location,
        notes: formData.notes,
        status: formData.status
      };

      const { error } = await supabase
        .from('appointments')
        .update(updateData)
        .eq('id', appointment.id);

      if (error) throw error;

      const currentLawyers = additionalLawyers.filter(id => id !== formData.lawyer_id);
      const originalLawyers = originalAdditionalLawyers.filter(id => id !== formData.lawyer_id);
      
      const lawyersToRemove = originalLawyers.filter(id => !currentLawyers.includes(id));
      const lawyersToAdd = currentLawyers.filter(id => !originalLawyers.includes(id));

      if (lawyersToRemove.length > 0) {
        await (supabase as any)
          .from('appointment_lawyers')
          .delete()
          .eq('appointment_id', appointment.id)
          .in('lawyer_id', lawyersToRemove);
      }

      if (lawyersToAdd.length > 0) {
        const newRecords = lawyersToAdd.map(lawyerId => ({
          appointment_id: appointment.id,
          lawyer_id: lawyerId,
          added_by: user?.id
        }));
        await (supabase as any).from('appointment_lawyers').insert(newRecords);
        
        await sendNotificationsToNewLawyers(
          lawyersToAdd,
          formData.title,
          TimeUtils.formatDateInput(formData.appointment_date),
          formData.appointment_time
        );
      }

      toast.success(
        lawyersToAdd.length > 0 
          ? `Appointment updated and ${lawyersToAdd.length} team member(s) notified`
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
      <DialogContent hideCloseButton className="sm:max-w-2xl p-0 gap-0 overflow-hidden">
        <div className="flex flex-col h-full max-h-[90vh] bg-muted">
          <MobileDialogHeader
            title="Edit Appointment"
            subtitle="Update appointment details"
            onClose={closeDialog}
          />
          
          {/* Content */}
          <div className="flex-1 overflow-y-auto px-6 py-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Title Card */}
              <div className="bg-background rounded-2xl shadow-sm overflow-hidden">
                <div className="p-4">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center">
                      <Type className="w-5 h-5 text-emerald-500" />
                    </div>
                    <div>
                      <Label className="text-sm font-semibold text-foreground">Title</Label>
                      <p className="text-xs text-muted-foreground">Appointment title</p>
                    </div>
                  </div>
                  <Input
                    value={formData.title}
                    onChange={(e) => handleInputChange('title', e.target.value)}
                    placeholder="Appointment title"
                    required
                    className="bg-muted border-input rounded-xl h-11"
                  />
                </div>
              </div>

              {/* Assigned Team Card */}
              <div className="bg-background rounded-2xl shadow-sm overflow-hidden">
                <div className="p-4">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-xl bg-violet-50 flex items-center justify-center">
                      <Users className="w-5 h-5 text-violet-500" />
                    </div>
                    <div>
                      <Label className="text-sm font-semibold text-foreground">Assigned Team</Label>
                      <p className="text-xs text-muted-foreground">Who should attend?</p>
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    <div>
                      <Label className="text-xs text-muted-foreground mb-1 block">Primary Assignee *</Label>
                      <Select
                        value={formData.lawyer_id}
                        onValueChange={(value) => handleInputChange('lawyer_id', value)}
                        required
                      >
                        <SelectTrigger className="bg-muted border-input rounded-xl h-11">
                          <SelectValue placeholder="Select user" />
                        </SelectTrigger>
                        <SelectContent className="bg-background border-border rounded-xl">
                          {users.map((user) => (
                            <SelectItem key={user.id} value={user.id}>
                              {user.full_name} {user.role && <span className="text-muted-foreground">({user.role})</span>}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Additional Lawyers */}
                    <div className="pt-3 border-t border-border">
                      <Label className="text-xs text-muted-foreground mb-2 block">Additional Team Members</Label>
                      
                      {additionalLawyers.filter(id => id !== formData.lawyer_id).length > 0 && (
                        <div className="flex flex-wrap gap-2 mb-3">
                          {additionalLawyers.map(lawyerId => {
                            const lawyer = users.find(u => u.id === lawyerId);
                            if (!lawyer || lawyerId === formData.lawyer_id) return null;
                            return (
                              <Badge 
                                key={lawyerId} 
                                variant="outline" 
                                className="flex items-center gap-1 pl-3 pr-1 py-1.5 bg-violet-50 border-violet-200 rounded-full"
                              >
                                {lawyer.full_name}
                                <button
                                  type="button"
                                  onClick={() => handleRemoveLawyer(lawyerId)}
                                  className="ml-1 rounded-full p-0.5 hover:bg-violet-100 transition-colors"
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
                          <SelectTrigger className="bg-muted border-input rounded-xl h-10">
                            <div className="flex items-center gap-2 text-muted-foreground">
                              <UserPlus className="h-4 w-4" />
                              <span>Add team member...</span>
                            </div>
                          </SelectTrigger>
                          <SelectContent className="bg-background border-border rounded-xl">
                            {getAvailableLawyers().map(user => (
                              <SelectItem key={user.id} value={user.id}>
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
                </div>
              </div>

              {/* Schedule Card */}
              <div className="bg-background rounded-2xl shadow-sm overflow-hidden">
                <div className="p-4">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center">
                      <Calendar className="w-5 h-5 text-amber-500" />
                    </div>
                    <div>
                      <Label className="text-sm font-semibold text-foreground">Schedule</Label>
                      <p className="text-xs text-muted-foreground">Date and time</p>
                    </div>
                  </div>
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
                </div>
              </div>
              
              {/* Details Card */}
              <div className="bg-background rounded-2xl shadow-sm overflow-hidden">
                <div className="p-4 space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <Clock className="w-4 h-4 text-muted-foreground" />
                        <Label className="text-sm font-medium text-foreground">Duration</Label>
                      </div>
                      <div className="bg-muted border border-input rounded-xl px-3 py-2.5 text-foreground">
                        {formData.duration_minutes} minutes
                      </div>
                    </div>
                    
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <MapPin className="w-4 h-4 text-muted-foreground" />
                        <Label className="text-sm font-medium text-foreground">Type</Label>
                      </div>
                      <Select
                        value={formData.location}
                        onValueChange={(value) => handleInputChange('location', value)}
                      >
                        <SelectTrigger className="bg-muted border-input rounded-xl h-11">
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                        <SelectContent className="bg-background border-border rounded-xl">
                          {locationTypeOptions.map(opt => (
                            <SelectItem key={opt.value} value={opt.value}>
                              {opt.label}
                            </SelectItem>
                          ))}
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 pt-3 border-t border-border">
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <User className="w-4 h-4 text-muted-foreground" />
                        <Label className="text-sm font-medium text-foreground">Client</Label>
                      </div>
                      <ClientSelector
                        value={formData.client_id}
                        onValueChange={(value) => handleInputChange('client_id', value)}
                        placeholder="Select client"
                      />
                    </div>

                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <Briefcase className="w-4 h-4 text-muted-foreground" />
                        <Label className="text-sm font-medium text-foreground">Status</Label>
                      </div>
                      <Select
                        value={formData.status}
                        onValueChange={(value) => handleInputChange('status', value)}
                      >
                        <SelectTrigger className="bg-muted border-input rounded-xl h-11">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-background border-border rounded-xl">
                          <SelectItem value="upcoming">Upcoming</SelectItem>
                          <SelectItem value="completed">Completed</SelectItem>
                          <SelectItem value="cancelled">Cancelled</SelectItem>
                          <SelectItem value="rescheduled">Rescheduled</SelectItem>
                          <SelectItem value="pending">Pending</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              </div>

              {/* Case & Notes Card */}
              <div className="bg-background rounded-2xl shadow-sm overflow-hidden">
                <div className="p-4 space-y-4">
                  <div>
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 rounded-xl bg-sky-50 flex items-center justify-center">
                        <Briefcase className="w-5 h-5 text-sky-500" />
                      </div>
                      <div>
                        <Label className="text-sm font-semibold text-foreground">Related Case</Label>
                        <p className="text-xs text-muted-foreground">Optional</p>
                      </div>
                    </div>
                    <CaseSelector
                      value={formData.case_id}
                      onValueChange={(value) => handleInputChange('case_id', value)}
                      placeholder="Select case (optional)"
                      clientId={formData.client_id}
                    />
                  </div>
                  
                  <div className="pt-4 border-t border-border">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 rounded-xl bg-rose-50 flex items-center justify-center">
                        <FileText className="w-5 h-5 text-rose-500" />
                      </div>
                      <div>
                        <Label className="text-sm font-semibold text-foreground">Notes</Label>
                        <p className="text-xs text-muted-foreground">Additional details</p>
                      </div>
                    </div>
                    <Textarea
                      value={formData.notes}
                      onChange={(e) => handleInputChange('notes', e.target.value)}
                      placeholder="Additional notes or agenda items..."
                      rows={3}
                      className="bg-muted border-input rounded-xl resize-none"
                    />
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="pt-4 sticky bottom-0 bg-muted pb-2">
                <div className="flex gap-3 justify-end">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={closeDialog}
                    className="rounded-full px-6 border-input"
                  >
                    Cancel
                  </Button>
                  <Button 
                    type="submit" 
                    className="rounded-full px-6"
                    disabled={loading}
                  >
                    {loading ? 'Updating...' : 'Update Appointment'}
                  </Button>
                </div>
              </div>
            </form>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
