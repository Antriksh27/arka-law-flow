import React, { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { Sheet, SheetContent } from '../ui/sheet';
import { X, UserPlus, Users, Clock, MapPin, Video, Phone, Calendar, ChevronRight, User, Briefcase, FileText, Check, ArrowLeft, Search } from 'lucide-react';
import { format } from 'date-fns';
import TimeUtils from '@/lib/timeUtils';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { Calendar as CalendarComponent } from '../ui/calendar';

interface Client {
  id: string;
  full_name: string;
}
interface Case {
  id: string;
  case_title: string;
  case_number: string;
}
interface TeamMember {
  id: string;
  full_name: string;
  role: string;
}

interface MobileCreateAppointmentSheetProps {
  open: boolean;
  onClose: () => void;
  preSelectedDate?: Date;
  preSelectedClientId?: string;
  onSuccess?: () => void;
}

const TIME_SLOTS = [
  '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
  '12:00', '12:30', '13:00', '13:30', '14:00', '14:30',
  '15:00', '15:30', '16:00', '16:30', '17:00', '17:30', '18:00'
];

const DURATION_OPTIONS = [
  { value: 15, label: '15m' },
  { value: 30, label: '30m' },
  { value: 60, label: '1h' },
  { value: 90, label: '1.5h' },
  { value: 120, label: '2h' },
];

const TYPE_OPTIONS = [
  { value: 'in-person', label: 'In-Person', icon: MapPin },
  { value: 'video-call', label: 'Video', icon: Video },
  { value: 'call', label: 'Phone', icon: Phone },
];

type StepType = 'form' | 'date' | 'time' | 'client' | 'lawyer' | 'add-team' | 'case';

export const MobileCreateAppointmentSheet: React.FC<MobileCreateAppointmentSheetProps> = ({
  open,
  onClose,
  preSelectedDate,
  preSelectedClientId,
  onSuccess,
}) => {
  const { firmId, user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [clients, setClients] = useState<Client[]>([]);
  const [cases, setCases] = useState<Case[]>([]);
  const [users, setUsers] = useState<TeamMember[]>([]);
  const [step, setStep] = useState<StepType>('form');
  const [clientSearch, setClientSearch] = useState('');
  const [lawyerSearch, setLawyerSearch] = useState('');
  const [additionalLawyers, setAdditionalLawyers] = useState<string[]>([]);
  const [teamSearch, setTeamSearch] = useState('');
  const [caseSearch, setCaseSearch] = useState('');
  
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
    if (open) {
      fetchClients();
      fetchUsers();
      setStep('form');
      setAdditionalLawyers([]);
    }
  }, [open]);

  useEffect(() => {
    if (formData.client_id) {
      fetchCases(formData.client_id);
    } else {
      fetchCases();
    }
  }, [formData.client_id]);

  useEffect(() => {
    if (user?.id && users.length > 0 && !formData.lawyer_id) {
      const currentUserInList = users.find(u => u.id === user.id);
      if (currentUserInList) {
        setFormData(prev => ({ ...prev, lawyer_id: user.id }));
      }
    }
  }, [user?.id, users]);

  const fetchClients = async () => {
    const { data } = await supabase.from('clients').select('id, full_name').order('full_name');
    setClients(data || []);
  };

  const fetchCases = async (clientId?: string) => {
    let query = supabase.from('cases').select('id, case_title, case_number');
    if (clientId) {
      query = query.eq('client_id', clientId);
    }
    const { data } = await query.order('case_title');
    setCases(data || []);
  };

  const fetchUsers = async () => {
    const { data } = await supabase
      .from('team_members')
      .select('user_id, full_name, role')
      .in('role', ['admin', 'lawyer', 'junior'])
      .eq('firm_id', firmId);
    
    setUsers((data || []).map(u => ({
      id: u.user_id,
      full_name: u.full_name,
      role: u.role
    })));
  };

  const generateTitle = () => {
    const client = clients.find(c => c.id === formData.client_id);
    const case_ = cases.find(c => c.id === formData.case_id);
    const typeMap = {
      'in-person': 'In-Person Meeting',
      'video-call': 'Video Call',
      'call': 'Phone Call',
      'other': 'Appointment'
    };
    let title = typeMap[formData.type];
    if (client) {
      title = `${title} with ${client.full_name}`;
    }
    if (case_) {
      title = `${title} - ${case_.case_title}`;
    }
    return title;
  };

  const handleSubmit = async () => {
    if (!formData.appointment_time || !formData.client_id || !formData.lawyer_id) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      const title = generateTitle();
      const appointmentData = {
        title,
        appointment_date: typeof formData.appointment_date === 'string' 
          ? formData.appointment_date 
          : TimeUtils.formatDateInput(formData.appointment_date),
        appointment_time: formData.appointment_time,
        duration_minutes: Number(formData.duration_minutes),
        client_id: formData.client_id,
        lawyer_id: formData.lawyer_id,
        case_id: formData.case_id || null,
        notes: formData.notes,
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

      if (newAppointment?.id && additionalLawyers.length > 0) {
        const lawyersToSave = additionalLawyers.filter(id => id !== formData.lawyer_id);
        if (lawyersToSave.length > 0) {
          const lawyerRecords = lawyersToSave.map(lawyerId => ({
            appointment_id: newAppointment.id,
            lawyer_id: lawyerId,
            added_by: user?.id
          }));
          await (supabase as any).from('appointment_lawyers').insert(lawyerRecords);

          const notifications = lawyersToSave.map(lawyerId => ({
            recipient_id: lawyerId,
            title: 'New Appointment Assignment',
            message: `You have been added to an appointment: "${title}" on ${format(formData.appointment_date, 'MMM dd, yyyy')} at ${formData.appointment_time}`,
            category: 'appointments',
            notification_type: 'appointment' as const,
            action_url: `/appointments`,
            reference_id: newAppointment.id,
            priority: 'normal',
            read: false
          }));
          await supabase.from('notifications').insert(notifications);
        }
      }

      const addedCount = additionalLawyers.filter(id => id !== formData.lawyer_id).length;
      toast({
        title: "Success",
        description: addedCount > 0 
          ? `Appointment created and ${addedCount} team member(s) notified`
          : "Appointment created successfully"
      });
      onSuccess?.();
      onClose();
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
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const selectedClient = clients.find(c => c.id === formData.client_id);
  const selectedLawyer = users.find(u => u.id === formData.lawyer_id);
  const selectedCase = cases.find(c => c.id === formData.case_id);

  const filteredClients = clients.filter(c => 
    c.full_name.toLowerCase().includes(clientSearch.toLowerCase())
  );
  
  const filteredLawyers = users.filter(u => 
    u.full_name.toLowerCase().includes(lawyerSearch.toLowerCase())
  );

  const availableTeamMembers = users.filter(u => 
    u.id !== formData.lawyer_id && 
    !additionalLawyers.includes(u.id) &&
    u.full_name.toLowerCase().includes(teamSearch.toLowerCase())
  );

  const filteredCases = cases.filter(c => 
    c.case_title.toLowerCase().includes(caseSearch.toLowerCase()) ||
    (c.case_number && c.case_number.toLowerCase().includes(caseSearch.toLowerCase()))
  );

  const handleAddTeamMember = (lawyerId: string) => {
    if (!additionalLawyers.includes(lawyerId)) {
      setAdditionalLawyers(prev => [...prev, lawyerId]);
    }
    setTeamSearch('');
    setStep('form');
  };

  const handleRemoveTeamMember = (lawyerId: string) => {
    setAdditionalLawyers(prev => prev.filter(id => id !== lawyerId));
  };

  const goBack = () => {
    setStep('form');
    setClientSearch('');
    setLawyerSearch('');
    setTeamSearch('');
    setCaseSearch('');
  };

  // Shared picker header component
  const PickerHeader = ({ title }: { title: string }) => (
    <div className="flex items-center gap-3 px-4 py-4 border-b border-border bg-background sticky top-0 z-10">
      <button 
        onClick={goBack} 
        className="w-9 h-9 flex items-center justify-center rounded-full bg-muted active:scale-95 transition-transform"
      >
        <ArrowLeft className="w-5 h-5 text-foreground" />
      </button>
      <h3 className="text-lg font-semibold text-foreground">{title}</h3>
    </div>
  );

  // Shared search input component
  const SearchInput = ({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder: string }) => (
    <div className="px-4 py-3 border-b border-border bg-muted/30">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder={placeholder}
          value={value}
          onChange={e => onChange(e.target.value)}
          className="h-11 pl-10 rounded-xl bg-background border-border"
          autoFocus
        />
      </div>
    </div>
  );

  // Avatar component
  const Avatar = ({ name }: { name: string }) => (
    <div className="w-11 h-11 rounded-full flex items-center justify-center shrink-0 bg-muted">
      <span className="text-sm font-semibold text-foreground">
        {name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
      </span>
    </div>
  );

  const renderFormView = () => (
    <div className="flex flex-col h-full bg-muted/30">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 bg-background border-b border-border">
        <h2 className="text-xl font-bold text-foreground">New Appointment</h2>
        <button 
          onClick={onClose} 
          className="w-9 h-9 flex items-center justify-center rounded-full bg-muted active:scale-95 transition-transform"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto pb-28">
        {/* Date & Time Card */}
        <div className="m-4 bg-background rounded-2xl overflow-hidden shadow-sm border border-border">
          <button
            type="button"
            onClick={() => setStep('date')}
            className="w-full flex items-center gap-4 p-4 active:bg-muted/50 transition-colors border-b border-border"
          >
            <div className="w-11 h-11 rounded-xl bg-muted flex items-center justify-center">
              <Calendar className="w-5 h-5 text-foreground" />
            </div>
            <div className="flex-1 text-left">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Date</p>
              <p className="text-base font-semibold text-foreground mt-0.5">
                {format(formData.appointment_date, 'EEEE, MMM d')}
              </p>
            </div>
            <ChevronRight className="w-5 h-5 text-muted-foreground" />
          </button>

          <button
            type="button"
            onClick={() => setStep('time')}
            className="w-full flex items-center gap-4 p-4 active:bg-muted/50 transition-colors"
          >
            <div className="w-11 h-11 rounded-xl bg-muted flex items-center justify-center">
              <Clock className="w-5 h-5 text-foreground" />
            </div>
            <div className="flex-1 text-left">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Time</p>
              <p className={cn("text-base font-semibold mt-0.5", formData.appointment_time ? "text-foreground" : "text-muted-foreground")}>
                {formData.appointment_time 
                  ? format(new Date(`2000-01-01T${formData.appointment_time}`), 'h:mm a')
                  : 'Select time'
                }
              </p>
            </div>
            <ChevronRight className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>

        {/* Duration Chips */}
        <div className="px-4 mb-4">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2.5">Duration</p>
          <div className="flex gap-2">
            {DURATION_OPTIONS.map(opt => (
              <button
                key={opt.value}
                type="button"
                onClick={() => handleInputChange('duration_minutes', opt.value)}
                className={cn(
                  "flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all active:scale-95",
                  formData.duration_minutes === opt.value 
                    ? "bg-foreground text-background" 
                    : "bg-background border border-border text-foreground"
                )}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Meeting Type */}
        <div className="px-4 mb-4">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2.5">Type</p>
          <div className="flex gap-2">
            {TYPE_OPTIONS.map(opt => {
              const Icon = opt.icon;
              const isActive = formData.type === opt.value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => handleInputChange('type', opt.value)}
                  className={cn(
                    "flex-1 flex flex-col items-center gap-2 py-3 px-2 rounded-xl transition-all active:scale-95",
                    isActive 
                      ? "bg-foreground text-background" 
                      : "bg-background border border-border text-foreground"
                  )}
                >
                  <div className={cn(
                    "w-9 h-9 rounded-full flex items-center justify-center",
                    isActive ? "bg-background/20" : "bg-muted"
                  )}>
                    <Icon className={cn("w-4 h-4", isActive ? "text-background" : "text-foreground")} />
                  </div>
                  <span className="text-xs font-medium">{opt.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* People Card */}
        <div className="m-4 bg-background rounded-2xl overflow-hidden shadow-sm border border-border">
          <p className="px-4 pt-4 pb-2 text-xs font-semibold text-muted-foreground uppercase tracking-wide">People</p>
          
          {/* Client */}
          <button
            type="button"
            onClick={() => setStep('client')}
            className="w-full flex items-center gap-4 p-4 active:bg-muted/50 transition-colors border-b border-border"
          >
            {selectedClient ? (
              <Avatar name={selectedClient.full_name} />
            ) : (
              <div className="w-11 h-11 rounded-full bg-muted flex items-center justify-center">
                <User className="w-5 h-5 text-muted-foreground" />
              </div>
            )}
            <div className="flex-1 text-left">
              <p className="text-xs font-medium text-muted-foreground">Client <span className="text-destructive">*</span></p>
              <p className={cn("text-base font-semibold mt-0.5", selectedClient ? "text-foreground" : "text-muted-foreground")}>
                {selectedClient?.full_name || 'Select client'}
              </p>
            </div>
            <ChevronRight className="w-5 h-5 text-muted-foreground" />
          </button>

          {/* Lawyer */}
          <button
            type="button"
            onClick={() => setStep('lawyer')}
            className="w-full flex items-center gap-4 p-4 active:bg-muted/50 transition-colors border-b border-border"
          >
            {selectedLawyer ? (
              <Avatar name={selectedLawyer.full_name} />
            ) : (
              <div className="w-11 h-11 rounded-full bg-muted flex items-center justify-center">
                <Briefcase className="w-5 h-5 text-muted-foreground" />
              </div>
            )}
            <div className="flex-1 text-left">
              <p className="text-xs font-medium text-muted-foreground">Assigned To <span className="text-destructive">*</span></p>
              <p className={cn("text-base font-semibold mt-0.5", selectedLawyer ? "text-foreground" : "text-muted-foreground")}>
                {selectedLawyer?.full_name || 'Select lawyer'}
              </p>
            </div>
            <ChevronRight className="w-5 h-5 text-muted-foreground" />
          </button>

          {/* Additional Team */}
          <div className="p-4">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-medium text-muted-foreground">Additional Team</p>
              <button
                type="button"
                onClick={() => setStep('add-team')}
                className="flex items-center gap-1.5 text-xs font-semibold text-primary active:opacity-70"
              >
                <UserPlus className="w-3.5 h-3.5" />
                Add
              </button>
            </div>
            
            {additionalLawyers.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {additionalLawyers.map(lawyerId => {
                  const lawyer = users.find(u => u.id === lawyerId);
                  if (!lawyer) return null;
                  return (
                    <div 
                      key={lawyerId} 
                      className="flex items-center gap-2 bg-muted rounded-full pl-1 pr-2 py-1"
                    >
                      <Avatar name={lawyer.full_name} />
                      
                      <span className="text-sm font-medium text-foreground">{lawyer.full_name.split(' ')[0]}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveTeamMember(lawyerId)}
                        className="w-5 h-5 rounded-full bg-muted-foreground/20 flex items-center justify-center"
                      >
                        <X className="w-3 h-3 text-muted-foreground" />
                      </button>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No additional team members</p>
            )}
          </div>
        </div>

        {/* Case Card */}
        <div className="mx-4 bg-background rounded-2xl overflow-hidden shadow-sm border border-border">
          <button
            type="button"
            onClick={() => setStep('case')}
            className="w-full flex items-center gap-4 p-4 active:bg-muted/50 transition-colors"
          >
            <div className="w-11 h-11 rounded-xl bg-muted flex items-center justify-center">
              <FileText className="w-5 h-5 text-foreground" />
            </div>
            <div className="flex-1 text-left min-w-0">
              <p className="text-xs font-medium text-muted-foreground">Related Case</p>
              <p className={cn("text-base font-semibold mt-0.5 truncate", selectedCase ? "text-foreground" : "text-muted-foreground")}>
                {selectedCase ? selectedCase.case_title : 'None (optional)'}
              </p>
              {selectedCase?.case_number && (
                <p className="text-xs text-muted-foreground truncate">{selectedCase.case_number}</p>
              )}
            </div>
            <ChevronRight className="w-5 h-5 text-muted-foreground shrink-0" />
          </button>
        </div>

        {/* Notes */}
        <div className="m-4">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2.5">Notes</p>
          <Textarea
            value={formData.notes}
            onChange={e => handleInputChange('notes', e.target.value)}
            placeholder="Add notes, agenda, or discussion points..."
            className="min-h-[100px] rounded-xl resize-none bg-background border-border"
          />
        </div>
      </div>

      {/* Fixed Bottom Action */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-background/95 backdrop-blur-sm border-t border-border safe-area-pb">
        <Button 
          onClick={handleSubmit} 
          disabled={loading || !formData.appointment_time || !formData.client_id || !formData.lawyer_id}
          className="w-full h-14 rounded-2xl text-base font-bold shadow-lg"
        >
          {loading ? 'Creating...' : 'Create Appointment'}
        </Button>
      </div>
    </div>
  );

  const renderDatePicker = () => (
    <div className="flex flex-col h-full bg-background">
      <PickerHeader title="Select Date" />
      <div className="flex-1 flex items-start justify-center pt-6 px-4">
        <CalendarComponent
          mode="single"
          selected={formData.appointment_date}
          onSelect={(date) => {
            if (date) {
              handleInputChange('appointment_date', date);
              goBack();
            }
          }}
          disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
          className="rounded-2xl border border-border shadow-sm"
        />
      </div>
    </div>
  );

  const renderTimePicker = () => (
    <div className="flex flex-col h-full bg-background">
      <PickerHeader title="Select Time" />
      <div className="flex-1 overflow-y-auto p-4">
        <div className="grid grid-cols-3 gap-2">
          {TIME_SLOTS.map(time => {
            const isSelected = formData.appointment_time === time;
            return (
              <button
                key={time}
                onClick={() => {
                  handleInputChange('appointment_time', time);
                  goBack();
                }}
                className={cn(
                  "py-4 rounded-xl text-sm font-semibold transition-all active:scale-95",
                  isSelected 
                    ? "bg-foreground text-background shadow-lg" 
                    : "bg-muted text-foreground"
                )}
              >
                {format(new Date(`2000-01-01T${time}`), 'h:mm a')}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );

  const renderClientPicker = () => (
    <div className="flex flex-col h-full bg-background">
      <PickerHeader title="Select Client" />
      <SearchInput value={clientSearch} onChange={setClientSearch} placeholder="Search clients..." />
      <div className="flex-1 overflow-y-auto">
        {filteredClients.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
            <User className="w-12 h-12 mb-3 opacity-30" />
            <p className="text-sm">No clients found</p>
          </div>
        ) : (
          filteredClients.map(client => {
            const isSelected = formData.client_id === client.id;
            return (
              <button
                key={client.id}
                onClick={() => {
                  handleInputChange('client_id', client.id);
                  goBack();
                }}
                className={cn(
                  "w-full flex items-center gap-4 px-4 py-4 border-b border-border active:bg-muted/50 transition-colors bg-background",
                  isSelected && "bg-primary/5"
                )}
              >
                <Avatar name={client.full_name} />
                <span className="flex-1 text-left font-medium text-foreground">{client.full_name}</span>
                {isSelected && (
                  <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center">
                    <Check className="w-4 h-4 text-primary-foreground" />
                  </div>
                )}
              </button>
            );
          })
        )}
      </div>
    </div>
  );

  const renderLawyerPicker = () => (
    <div className="flex flex-col h-full bg-background">
      <PickerHeader title="Assigned To" />
      <SearchInput value={lawyerSearch} onChange={setLawyerSearch} placeholder="Search team members..." />
      <div className="flex-1 overflow-y-auto">
        {filteredLawyers.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
            <Briefcase className="w-12 h-12 mb-3 opacity-30" />
            <p className="text-sm">No team members found</p>
          </div>
        ) : (
          filteredLawyers.map(lawyer => {
            const isSelected = formData.lawyer_id === lawyer.id;
            return (
              <button
                key={lawyer.id}
                onClick={() => {
                  handleInputChange('lawyer_id', lawyer.id);
                  goBack();
                }}
                className={cn(
                  "w-full flex items-center gap-4 px-4 py-4 border-b border-border active:bg-muted/50 transition-colors bg-background",
                  isSelected && "bg-muted/50"
                )}
              >
                <Avatar name={lawyer.full_name} />
                <div className="flex-1 text-left">
                  <p className="font-medium text-foreground">{lawyer.full_name}</p>
                  <p className="text-sm text-muted-foreground capitalize">{lawyer.role}</p>
                </div>
                {isSelected && (
                  <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center">
                    <Check className="w-4 h-4 text-primary-foreground" />
                  </div>
                )}
              </button>
            );
          })
        )}
      </div>
    </div>
  );

  const renderAddTeamPicker = () => (
    <div className="flex flex-col h-full bg-background">
      <PickerHeader title="Add Team Member" />
      <SearchInput value={teamSearch} onChange={setTeamSearch} placeholder="Search team members..." />
      <div className="flex-1 overflow-y-auto">
        {availableTeamMembers.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
            <Users className="w-12 h-12 mb-3 opacity-30" />
            <p className="text-sm">No more team members to add</p>
          </div>
        ) : (
          availableTeamMembers.map(lawyer => (
            <button
              key={lawyer.id}
              onClick={() => handleAddTeamMember(lawyer.id)}
              className="w-full flex items-center gap-4 px-4 py-4 border-b border-border active:bg-muted/50 transition-colors bg-background"
            >
              <Avatar name={lawyer.full_name} />
              <div className="flex-1 text-left">
                <p className="font-medium text-foreground">{lawyer.full_name}</p>
                <p className="text-sm text-muted-foreground capitalize">{lawyer.role}</p>
              </div>
              <UserPlus className="w-5 h-5 text-primary" />
            </button>
          ))
        )}
      </div>
    </div>
  );

  const renderCasePicker = () => (
    <div className="flex flex-col h-full bg-background">
      <PickerHeader title="Related Case" />
      <SearchInput value={caseSearch} onChange={setCaseSearch} placeholder="Search by title or number..." />
      <div className="flex-1 overflow-y-auto">
        {/* No case option */}
        <button
          onClick={() => {
            handleInputChange('case_id', '');
            goBack();
          }}
          className={cn(
            "w-full flex items-center gap-4 px-4 py-4 border-b border-border active:bg-muted/50 transition-colors bg-background",
            !formData.case_id && "bg-muted/50"
          )}
        >
          <div className="w-11 h-11 rounded-xl bg-muted flex items-center justify-center">
            <X className="w-5 h-5 text-muted-foreground" />
          </div>
          <span className="flex-1 text-left font-medium text-foreground">No case</span>
          {!formData.case_id && (
            <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center">
              <Check className="w-4 h-4 text-primary-foreground" />
            </div>
          )}
        </button>

        {filteredCases.length === 0 && caseSearch ? (
          <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
            <FileText className="w-12 h-12 mb-3 opacity-30" />
            <p className="text-sm">No cases found</p>
          </div>
        ) : (
          filteredCases.map(caseItem => {
            const isSelected = formData.case_id === caseItem.id;
            return (
              <button
                key={caseItem.id}
                onClick={() => {
                  handleInputChange('case_id', caseItem.id);
                  goBack();
                }}
                className={cn(
                  "w-full flex items-center gap-4 px-4 py-4 border-b border-border active:bg-muted/50 transition-colors bg-background",
                  isSelected && "bg-muted/50"
                )}
              >
                <div className="w-11 h-11 rounded-xl bg-muted flex items-center justify-center">
                  <FileText className="w-5 h-5 text-foreground" />
                </div>
                <div className="flex-1 text-left min-w-0">
                  <p className="font-medium text-foreground truncate">{caseItem.case_title}</p>
                  {caseItem.case_number && (
                    <p className="text-sm text-muted-foreground truncate">{caseItem.case_number}</p>
                  )}
                </div>
                {isSelected && (
                  <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center shrink-0">
                    <Check className="w-4 h-4 text-primary-foreground" />
                  </div>
                )}
              </button>
            );
          })
        )}
      </div>
    </div>
  );

  return (
    <Sheet open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <SheetContent side="bottom" className="h-[95vh] rounded-t-3xl p-0 overflow-hidden">
        <div className="h-full">
          {step === 'form' && renderFormView()}
          {step === 'date' && renderDatePicker()}
          {step === 'time' && renderTimePicker()}
          {step === 'client' && renderClientPicker()}
          {step === 'lawyer' && renderLawyerPicker()}
          {step === 'add-team' && renderAddTeamPicker()}
          {step === 'case' && renderCasePicker()}
        </div>
      </SheetContent>
    </Sheet>
  );
};
