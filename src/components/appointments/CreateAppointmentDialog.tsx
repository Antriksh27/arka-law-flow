import React, { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Calendar } from '../ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import { CalendarIcon, X, UserPlus, Users } from 'lucide-react';
import { format } from 'date-fns';
import TimeUtils from '@/lib/timeUtils';
import { supabase } from '@/integrations/supabase/client';
import { useDialog } from '@/hooks/use-dialog';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';
import { SmartBookingCalendar } from '@/components/appointments/SmartBookingCalendar';
import { ClientSelector } from '@/components/appointments/ClientSelector';
import { CaseSelector } from '@/components/appointments/CaseSelector';
import { Badge } from '../ui/badge';

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
}
export const CreateAppointmentDialog: React.FC<CreateAppointmentDialogProps> = ({
  preSelectedDate,
  preSelectedClientId
}) => {
  const {
    closeDialog
  } = useDialog();
  const {
    firmId,
    user
  } = useAuth();
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
      closeDialog();
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

  return (
    <div className="flex flex-col h-full bg-slate-50">
      {/* Header */}
      <div className="px-6 py-5 bg-white border-b border-slate-100">
        <h2 className="text-xl font-semibold text-foreground">New Appointment</h2>
        <p className="text-sm text-muted-foreground mt-1">Schedule a meeting with your client</p>
      </div>
      
      {/* Form Content */}
      <div className="flex-1 overflow-y-auto px-6 py-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          
          {/* Primary Assignee Card */}
          <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
            <div className="p-4 border-b border-slate-100">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl bg-violet-50 flex items-center justify-center">
                  <svg className="w-5 h-5 text-violet-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <div>
                  <Label htmlFor="lawyer_id" className="text-sm font-semibold text-foreground">
                    Primary Assignee <span className="text-destructive">*</span>
                  </Label>
                  <p className="text-xs text-muted-foreground">Who will be attending this meeting</p>
                </div>
              </div>
              <Select value={formData.lawyer_id} onValueChange={value => handleInputChange('lawyer_id', value)} required>
                <SelectTrigger className="bg-slate-50 border-slate-200 text-foreground h-11 rounded-xl">
                  <SelectValue placeholder="Select team member" />
                </SelectTrigger>
                <SelectContent className="bg-white border-slate-200 rounded-xl">
                  {users.map(user => (
                    <SelectItem key={user.id} value={user.id} className="text-foreground">
                      {user.full_name} <span className="text-muted-foreground">({user.role})</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Additional Team Members */}
            <div className="p-4 bg-slate-50/50">
              <div className="flex items-center gap-2 mb-3">
                <Users className="h-4 w-4 text-muted-foreground" />
                <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Additional Team Members</Label>
              </div>
              
              {additionalLawyers.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-3">
                  {additionalLawyers.map(lawyerId => {
                    const lawyer = users.find(u => u.id === lawyerId);
                    if (!lawyer || lawyerId === formData.lawyer_id) return null;
                    return (
                      <Badge 
                        key={lawyerId} 
                        variant="outline" 
                        className="flex items-center gap-1 pl-3 pr-1.5 py-1.5 bg-white border-slate-200 rounded-full"
                      >
                        {lawyer.full_name}
                        <button
                          type="button"
                          onClick={() => handleRemoveLawyer(lawyerId)}
                          className="ml-1 rounded-full p-0.5 hover:bg-slate-100 transition-colors"
                        >
                          <X className="h-3 w-3 text-muted-foreground" />
                        </button>
                      </Badge>
                    );
                  })}
                </div>
              )}
              
              {getAvailableLawyers().length > 0 && (
                <Select onValueChange={handleAddLawyer} value="">
                  <SelectTrigger className="bg-white border-slate-200 text-foreground h-10 rounded-xl">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <UserPlus className="h-4 w-4" />
                      <span>Add team member...</span>
                    </div>
                  </SelectTrigger>
                  <SelectContent className="bg-white border-slate-200 rounded-xl">
                    {getAvailableLawyers().map(user => (
                      <SelectItem key={user.id} value={user.id} className="text-foreground">
                        {user.full_name} <span className="text-muted-foreground">({user.role})</span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
              
              <p className="text-xs text-muted-foreground mt-2">
                Added team members will receive a notification
              </p>
            </div>
          </div>

          {/* Schedule Card */}
          <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
            <div className="p-4 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-sky-50 flex items-center justify-center">
                  <svg className="w-5 h-5 text-sky-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-foreground">Schedule</h3>
                  <p className="text-xs text-muted-foreground">Select date and time</p>
                </div>
              </div>
            </div>
            <div className="p-4">
              <SmartBookingCalendar 
                selectedLawyer={formData.lawyer_id || null} 
                selectedDate={typeof formData.appointment_date === 'string' ? new Date(formData.appointment_date) : formData.appointment_date} 
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

          {/* Duration & Type Card */}
          <div className="bg-white rounded-2xl shadow-sm p-4">
            <div className="space-y-4">
              {/* Duration */}
              <div>
                <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2 block">Duration</Label>
                <div className="flex flex-wrap gap-2">
                  {[
                    { value: 30, label: '30 min' },
                    { value: 60, label: '1 hour' },
                    { value: 90, label: '1.5 hrs' },
                    { value: 120, label: '2 hours' },
                  ].map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => handleInputChange('duration_minutes', option.value)}
                      className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                        formData.duration_minutes === option.value
                          ? 'bg-slate-800 text-white'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Meeting Type */}
              <div>
                <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2 block">Meeting Type</Label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { value: 'in-person', label: 'In-Person', icon: '👤', bg: 'bg-emerald-50', activeBg: 'bg-emerald-100', text: 'text-emerald-700' },
                    { value: 'video-call', label: 'Video Call', icon: '📹', bg: 'bg-sky-50', activeBg: 'bg-sky-100', text: 'text-sky-700' },
                    { value: 'call', label: 'Phone Call', icon: '📞', bg: 'bg-amber-50', activeBg: 'bg-amber-100', text: 'text-amber-700' },
                    { value: 'other', label: 'Other', icon: '📋', bg: 'bg-slate-50', activeBg: 'bg-slate-200', text: 'text-slate-700' },
                  ].map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => handleInputChange('type', option.value)}
                      className={`flex items-center gap-3 p-3 rounded-xl border-2 transition-all ${
                        formData.type === option.value
                          ? `${option.activeBg} ${option.text} border-current`
                          : `${option.bg} border-transparent hover:border-slate-200`
                      }`}
                    >
                      <span className="text-lg">{option.icon}</span>
                      <span className="text-sm font-medium">{option.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Client Information Card */}
          <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
            <div className="p-4 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-rose-50 flex items-center justify-center">
                  <svg className="w-5 h-5 text-rose-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-foreground">Client Information</h3>
                  <p className="text-xs text-muted-foreground">Select client and case</p>
                </div>
              </div>
            </div>
            <div className="p-4 space-y-4">
              <div className="space-y-2">
                <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Client/Contact</Label>
                <ClientSelector 
                  value={formData.client_id} 
                  onValueChange={value => handleInputChange('client_id', value)} 
                  placeholder="Select or add client..." 
                  onClientAdded={clientId => {
                    handleInputChange('client_id', clientId);
                  }} 
                />
              </div>
              
              <div className="space-y-2">
                <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Related Case</Label>
                <CaseSelector 
                  value={formData.case_id} 
                  onValueChange={value => handleInputChange('case_id', value)} 
                  placeholder="Select case (optional)" 
                  clientId={formData.client_id} 
                />
              </div>
            </div>
          </div>
          
          {/* Notes Card */}
          <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
            <div className="p-4 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center">
                  <svg className="w-5 h-5 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-foreground">Notes</h3>
                  <p className="text-xs text-muted-foreground">Add agenda or discussion points</p>
                </div>
              </div>
            </div>
            <div className="p-4">
              <Textarea 
                id="notes" 
                value={formData.notes} 
                onChange={e => handleInputChange('notes', e.target.value)} 
                placeholder="Add agenda items, discussion points, or any additional information..." 
                rows={4} 
                className="bg-slate-50 border-slate-200 text-foreground resize-none rounded-xl" 
              />
            </div>
          </div>
        </form>
      </div>

      {/* Footer Actions */}
      <div className="px-6 py-4 border-t border-slate-100 bg-white">
        <div className="flex justify-end gap-3">
          <Button 
            type="button" 
            variant="outline" 
            onClick={closeDialog} 
            className="min-w-[100px] rounded-full border-slate-200"
          >
            Cancel
          </Button>
          <Button 
            type="submit" 
            onClick={handleSubmit} 
            disabled={loading || !isFormValid()} 
            className="min-w-[160px] bg-slate-800 hover:bg-slate-700 text-white rounded-full shadow-lg"
          >
            {loading ? 'Creating...' : 'Create Appointment'}
          </Button>
        </div>
      </div>
    </div>
  );
};
