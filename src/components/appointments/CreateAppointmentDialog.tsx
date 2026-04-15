import React, { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { UserPlus, Users, X, Calendar as CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import TimeUtils from '@/lib/timeUtils';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';
import { SmartBookingCalendar } from '@/components/appointments/SmartBookingCalendar';
import { ClientSelector } from '@/components/appointments/ClientSelector';
import { CaseSelector } from '@/components/appointments/CaseSelector';
import { Badge } from '../ui/badge';
import { bg, border } from '@/lib/colors';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { useIsMobile } from '@/hooks/use-mobile';
import { useDialog, DialogContentContext } from '@/hooks/use-dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useContext } from 'react';
import { MobileDialogHeader } from '@/components/ui/mobile-dialog-header';

interface Client {
  id: string;
  full_name: string;
}
interface Case {
  id: string;
  case_title: string;
  case_number: string;
}
interface User {
  id: string;
  full_name: string;
  role: string;
}
interface CreateAppointmentDialogProps {
  preSelectedDate?: Date;
  preSelectedClientId?: string;
  open?: boolean;
  onClose?: () => void;
}

export const CreateAppointmentDialog: React.FC<CreateAppointmentDialogProps> = ({
  preSelectedDate,
  preSelectedClientId,
  open = true,
  onClose,
}) => {
  const {
    firmId,
    user
  } = useAuth();
  const { closeDialog } = useDialog();
  const isInsideDialog = useContext(DialogContentContext);
  const handleClose = isInsideDialog ? closeDialog : onClose;
  const [loading, setLoading] = useState(false);
  const [clients, setClients] = useState<Client[]>([]);
  const [cases, setCases] = useState<Case[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [additionalLawyers, setAdditionalLawyers] = useState<string[]>([]);
  const [formData, setFormData] = useState({
    appointment_date: preSelectedDate || TimeUtils.nowDate(),
    appointment_time: '',
    duration_minutes: 60,
    client_id: preSelectedClientId || '',
    lawyer_id: '',
    case_id: '',
    notes: '',
    status: 'upcoming',
    type: 'in-person' as 'in-person' | 'other' | 'call' | 'video-call'
  });


  useEffect(() => {
    fetchClients();
    fetchCases(preSelectedClientId);
    fetchUsers();
  }, []);

  // Fetch cases when client changes
  useEffect(() => {
    if (formData.client_id) {
      fetchCases(formData.client_id);
      // Reset case selection when client changes
      setFormData(prev => ({
        ...prev,
        case_id: ''
      }));
    } else {
      fetchCases(); // Show all cases when no client selected
    }
  }, [formData.client_id]);

  // Auto-select current user if they are a lawyer
  useEffect(() => {
    if (user?.id && users.length > 0) {
      const currentUserInList = users.find(u => u.id === user.id);
      if (currentUserInList && !formData.lawyer_id) {
        setFormData(prev => ({
          ...prev,
          lawyer_id: user.id
        }));
      }
    }
  }, [user?.id, users, formData.lawyer_id]);

  const fetchClients = async () => {
    const {
      data
    } = await supabase.from('clients').select('id, full_name').order('full_name');
    setClients(data || []);
  };

  const fetchCases = async (clientId?: string) => {
    let query = supabase.from('cases').select('id, case_title, case_number');
    if (clientId) {
      query = query.eq('client_id', clientId);
    }
    const {
      data
    } = await query.order('case_title');
    setCases(data || []);
  };

  const fetchUsers = async () => {
    const {
      data,
      error
    } = await supabase.from('team_members').select(`
        user_id,
        full_name,
        role
      `).in('role', ['admin', 'lawyer', 'junior']).eq('firm_id', firmId);
    console.log('Fetching lawyers:', {
      data,
      error,
      firmId
    });
    if (error) {
      console.error('Error fetching lawyers:', error);
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
    setUsers(sortedData.map(user => ({
      id: user.user_id,
      full_name: user.full_name,
      role: user.role
    })));
  };

  const generateTitle = async () => {
    const client = clients.find(c => c.id === formData.client_id);
    const case_ = cases.find(c => c.id === formData.case_id);
    const typeMap = {
      'in-person': 'In-Person Meeting',
      'video-call': 'Video Call',
      'call': 'Phone Call',
      'other': 'Appointment'
    };
    let title = typeMap[formData.type];
    let personName = '';
    if (client) {
      personName = client.full_name;
    } else if (formData.client_id) {
      // Check if it's a contact
      const {
        data: contactData
      } = await supabase.from('contacts').select('name').eq('id', formData.client_id).single();
      if (contactData) {
        personName = contactData.name;
      }
    }
    if (personName) {
      title = `${title} with ${personName}`;
    }
    if (case_) {
      title = `${title} - ${case_.case_title}`;
    }
    return title;
  };

  const saveAdditionalLawyers = async (appointmentId: string) => {
    const lawyersToSave = additionalLawyers.filter(id => id !== formData.lawyer_id);
    
    if (lawyersToSave.length === 0) return;

    const lawyerRecords = lawyersToSave.map(lawyerId => ({
      appointment_id: appointmentId,
      lawyer_id: lawyerId,
      added_by: user?.id
    }));

    // Using any type since appointment_lawyers table is newly created and types aren't regenerated yet
    const { error } = await (supabase as any).from('appointment_lawyers').insert(lawyerRecords);
    
    if (error) {
      console.error('Error saving additional lawyers:', error);
      throw error;
    }
  };

  const sendNotificationsToLawyers = async (appointmentId: string, title: string, appointmentDate: string, appointmentTime: string) => {
    const lawyersToNotify = additionalLawyers.filter(id => id !== formData.lawyer_id);
    
    if (lawyersToNotify.length === 0) return;

    const primaryLawyer = users.find(u => u.id === formData.lawyer_id);
    const formattedDate = format(new Date(appointmentDate), 'MMM dd, yyyy');
    
    const notifications = lawyersToNotify.map(lawyerId => ({
      recipient_id: lawyerId,
      title: 'New Appointment Assignment',
      message: `You have been added to an appointment: "${title}" on ${formattedDate} at ${appointmentTime}${primaryLawyer ? ` with ${primaryLawyer.full_name}` : ''}`,
      category: 'appointments',
      notification_type: 'appointment' as const,
      action_url: `/appointments`,
      reference_id: appointmentId,
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
      // Determine if selected ID is a client or contact
      const isClient = clients.some(client => client.id === formData.client_id);
      const title = await generateTitle();

      // Get contact name if it's a contact
      let contactName = '';
      if (!isClient && formData.client_id) {
        const {
          data: contactData
        } = await supabase.from('contacts').select('name').eq('id', formData.client_id).single();
        if (contactData) {
          contactName = contactData.name;
        }
      }

      // Build notes - no longer include additional lawyers in notes
      let finalNotes = formData.notes;
      if (contactName) {
        finalNotes = formData.notes ? `Contact: ${contactName}\n\n${formData.notes}` : `Contact: ${contactName}`;
      }

      const appointmentData = {
        title,
        appointment_date: typeof formData.appointment_date === 'string' ? formData.appointment_date : TimeUtils.formatDateInput(formData.appointment_date),
        appointment_time: formData.appointment_time,
        duration_minutes: Number(formData.duration_minutes),
        client_id: isClient ? formData.client_id : null,
        lawyer_id: formData.lawyer_id,
        case_id: formData.case_id || null,
        notes: finalNotes,
        status: formData.status,
        type: formData.type,
        firm_id: firmId,
        created_by: user?.id,
        created_at: TimeUtils.createTimestamp()
      };

      const { data: newAppointment, error } = await supabase
        .from('appointments')
        .insert([appointmentData])
        .select('id')
        .single();

      if (error) throw error;

      // Save additional lawyers to junction table and send notifications
      if (newAppointment?.id) {
        await saveAdditionalLawyers(newAppointment.id);
        await sendNotificationsToLawyers(
          newAppointment.id,
          title,
          typeof formData.appointment_date === 'string' ? formData.appointment_date : TimeUtils.formatDateInput(formData.appointment_date),
          formData.appointment_time
        );
      }

      const addedCount = additionalLawyers.filter(id => id !== formData.lawyer_id).length;
      toast({
        title: "Success",
        description: addedCount > 0 
          ? `Appointment created and ${addedCount} team member(s) notified`
          : "Appointment created successfully"
      });
      handleClose();
    } catch (error) {
      console.error('Error creating appointment:', error);
      toast({
        title: "Error",
        description: "Failed to create appointment",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: keyof typeof formData, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleAddLawyer = (lawyerId: string) => {
    if (!additionalLawyers.includes(lawyerId)) {
      setAdditionalLawyers(prev => [...prev, lawyerId]);
    }
  };

  const handleRemoveLawyer = (lawyerId: string) => {
    setAdditionalLawyers(prev => prev.filter(id => id !== lawyerId));
  };

  // Get available lawyers for additional selection (exclude already selected)
  const getAvailableLawyers = () => {
    return users.filter(u => 
      u.id !== formData.lawyer_id && 
      !additionalLawyers.includes(u.id)
    );
  };

  // Check if required fields are filled
  const isFormValid = () => {
    return formData.appointment_date && formData.appointment_time && formData.client_id && formData.lawyer_id;
  };

  const formContent = (
    <div className="flex flex-col h-full bg-slate-50">
      <MobileDialogHeader
        title="New Appointment"
        subtitle="Schedule a consultation with a client"
        onClose={handleClose}
        icon={<CalendarIcon className="w-5 h-5 text-sky-500" />}
        showBorder
      />

      <ScrollArea className="flex-1">
        <div className="px-6 py-6 space-y-6">
          <form id="create-appointment-form" onSubmit={handleSubmit} className="space-y-6">
            {/* Appointment Details Card */}
            <div className="bg-white rounded-2xl shadow-sm overflow-hidden border border-slate-200/60">
              <div className="p-4 border-b border-slate-100 bg-slate-50/50">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-sky-50 flex items-center justify-center">
                    <CalendarIcon className="w-4 h-4 text-sky-500" />
                  </div>
                  <span className="font-semibold text-slate-700">Schedule</span>
                </div>
              </div>
              <div className="p-4 bg-white">
                <SmartBookingCalendar
                  selectedLawyer={formData.lawyer_id || null}
                  selectedDate={formData.appointment_date instanceof Date ? formData.appointment_date : new Date(formData.appointment_date)}
                  selectedTime={formData.appointment_time}
                  hideLawyerPicker={true}
                  onTimeSlotSelect={(date, time, duration) => {
                    setFormData(prev => ({
                      ...prev,
                      appointment_date: date,
                      appointment_time: time,
                      duration_minutes: duration
                    }));
                  }}
                />
              </div>
            </div>

            {/* Client & Case Details Card */}
            <div className="bg-white rounded-2xl shadow-sm overflow-hidden border border-slate-200/60">
              <div className="p-4 border-b border-slate-100 bg-slate-50/50">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-violet-50 flex items-center justify-center">
                    <UserPlus className="w-4 h-4 text-violet-500" />
                  </div>
                  <span className="font-semibold text-slate-700">Client & Case</span>
                </div>
              </div>
              <div className="p-4 space-y-4 bg-white">
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-slate-600">Select Client *</Label>
                  <ClientSelector
                    value={formData.client_id}
                    onValueChange={(val) => handleInputChange('client_id', val)}
                    placeholder="Search and select client..."
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium text-slate-600">Assign to Case (Optional)</Label>
                  <CaseSelector
                    value={formData.case_id}
                    onValueChange={(val) => handleInputChange('case_id', val)}
                    clientId={formData.client_id}
                    placeholder="Search and select case..."
                  />
                </div>
              </div>
            </div>

            {/* Assignment Details Card */}
            <div className="bg-white rounded-2xl shadow-sm overflow-hidden border border-slate-200/60">
              <div className="p-4 border-b border-slate-100 bg-slate-50/50">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center">
                    <Users className="w-4 h-4 text-emerald-500" />
                  </div>
                  <span className="font-semibold text-slate-700">Assignment</span>
                </div>
              </div>
              <div className="p-4 space-y-4 bg-white">
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-slate-600">Primary Lawyer *</Label>
                  <Select
                    value={formData.lawyer_id}
                    onValueChange={(val) => handleInputChange('lawyer_id', val)}
                  >
                    <SelectTrigger className="rounded-xl h-11 bg-slate-50 border-slate-200">
                      <SelectValue placeholder="Select primary lawyer" />
                    </SelectTrigger>
                    <SelectContent>
                      {users.map((u) => (
                        <SelectItem key={u.id} value={u.id}>
                          {u.full_name} ({u.role})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-3">
                  <Label className="text-sm font-medium text-slate-600">Additional Team Members</Label>
                  <Select onValueChange={handleAddLawyer}>
                    <SelectTrigger className="rounded-xl h-11 bg-slate-50 border-slate-200">
                      <SelectValue placeholder="Add more team members..." />
                    </SelectTrigger>
                    <SelectContent>
                      {getAvailableLawyers().map((u) => (
                        <SelectItem key={u.id} value={u.id}>
                          {u.full_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  {additionalLawyers.length > 0 && (
                    <div className="flex flex-wrap gap-2 pt-1">
                      {additionalLawyers.map((lawyerId) => {
                        const lawyer = users.find(u => u.id === lawyerId);
                        if (!lawyer) return null;
                        return (
                          <Badge
                            key={lawyerId}
                            variant="default"
                            className="pl-3 pr-1 py-1 rounded-full bg-slate-100 text-slate-700 border-none group"
                          >
                            <span className="mr-1">{lawyer.full_name}</span>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => handleRemoveLawyer(lawyerId)}
                              className="h-5 w-5 p-0 rounded-full hover:bg-slate-200 text-slate-400 group-hover:text-slate-600"
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          </Badge>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Additional Info Card */}
            <div className="bg-white rounded-2xl shadow-sm overflow-hidden border border-slate-200/60">
              <div className="p-4 border-b border-slate-100 bg-slate-50/50">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-orange-50 flex items-center justify-center">
                    <CalendarIcon className="w-4 h-4 text-orange-500" />
                  </div>
                  <span className="font-semibold text-slate-700">Additional Details</span>
                </div>
              </div>
              <div className="p-4 space-y-4 bg-white">
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-slate-600">Visit Type</Label>
                  <Select
                    value={formData.type}
                    onValueChange={(val: any) => handleInputChange('type', val)}
                  >
                    <SelectTrigger className="rounded-xl h-11 bg-slate-50 border-slate-200">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="in-person">In-Person Meeting</SelectItem>
                      <SelectItem value="video-call">Video Call</SelectItem>
                      <SelectItem value="call">Phone Call</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium text-slate-600">Internal Notes</Label>
                  <Textarea
                    placeholder="Add private notes for the team..."
                    value={formData.notes}
                    onChange={(e) => handleInputChange('notes', e.target.value)}
                    className="rounded-xl min-h-[100px] bg-slate-50 border-slate-200 resize-none"
                  />
                </div>
              </div>
            </div>
          </form>
        </div>
      </ScrollArea>

      {/* Footer Actions */}
      <div className="px-6 py-4 border-t border-slate-100 bg-white shadow-[0_-1px_3px_rgba(0,0,0,0.05)]">
        <div className="flex gap-3">

          <Button 
            type="submit" 
            form="create-appointment-form"
            disabled={loading || !isFormValid()} 
            className="flex-1 rounded-full h-12 bg-slate-800 hover:bg-slate-700 text-white shadow-lg"
          >
            {loading ? 'Creating...' : 'Create Appointment'}
          </Button>
        </div>
      </div>
    </div>
  );

  // If inside global dialog, just return the content
  if (isInsideDialog) {
    return formContent;
  }

  // Desktop & Mobile: Dialog
  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent 
        hideCloseButton 
        className="sm:max-w-[600px] p-0 gap-0 overflow-hidden h-[95vh] sm:h-auto"
      >
        {formContent}
      </DialogContent>
    </Dialog>
  );
};
