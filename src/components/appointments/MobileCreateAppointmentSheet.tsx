import React, { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '../ui/sheet';
import { X, UserPlus, Users, Clock, MapPin, Video, Phone, Calendar, ChevronRight, User, Briefcase, FileText } from 'lucide-react';
import { format } from 'date-fns';
import TimeUtils from '@/lib/timeUtils';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';
import { Badge } from '../ui/badge';
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
interface User {
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
  { value: '15', label: '15 min' },
  { value: '30', label: '30 min' },
  { value: '60', label: '1 hour' },
  { value: '90', label: '1.5 hrs' },
  { value: '120', label: '2 hours' },
];

const TYPE_OPTIONS = [
  { value: 'in-person', label: 'In-Person', icon: MapPin },
  { value: 'video-call', label: 'Video Call', icon: Video },
  { value: 'call', label: 'Phone', icon: Phone },
];

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
  const [users, setUsers] = useState<User[]>([]);
  const [step, setStep] = useState<'form' | 'date' | 'time' | 'client' | 'lawyer'>('form');
  const [clientSearch, setClientSearch] = useState('');
  const [lawyerSearch, setLawyerSearch] = useState('');
  
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
      // Reset form when opening
      setStep('form');
    }
  }, [open]);

  useEffect(() => {
    if (formData.client_id) {
      fetchCases(formData.client_id);
    } else {
      fetchCases();
    }
  }, [formData.client_id]);

  // Auto-select current user
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

      const { error } = await supabase.from('appointments').insert([appointmentData]);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Appointment created successfully"
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

  const filteredClients = clients.filter(c => 
    c.full_name.toLowerCase().includes(clientSearch.toLowerCase())
  );
  
  const filteredLawyers = users.filter(u => 
    u.full_name.toLowerCase().includes(lawyerSearch.toLowerCase())
  );

  const renderFormView = () => (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto px-4 pb-32">
        {/* Date & Time Section */}
        <div className="py-4 space-y-3">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">When</h3>
          
          {/* Date Selector */}
          <button
            type="button"
            onClick={() => setStep('date')}
            className="w-full flex items-center justify-between p-4 bg-card rounded-2xl border border-border active:scale-[0.98] transition-all"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <Calendar className="w-5 h-5 text-primary" />
              </div>
              <div className="text-left">
                <p className="text-sm text-muted-foreground">Date</p>
                <p className="font-semibold text-foreground">
                  {format(formData.appointment_date, 'EEE, MMM d, yyyy')}
                </p>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-muted-foreground" />
          </button>

          {/* Time Selector */}
          <button
            type="button"
            onClick={() => setStep('time')}
            className="w-full flex items-center justify-between p-4 bg-card rounded-2xl border border-border active:scale-[0.98] transition-all"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <Clock className="w-5 h-5 text-primary" />
              </div>
              <div className="text-left">
                <p className="text-sm text-muted-foreground">Time</p>
                <p className={cn("font-semibold", formData.appointment_time ? "text-foreground" : "text-muted-foreground")}>
                  {formData.appointment_time 
                    ? format(new Date(`2000-01-01T${formData.appointment_time}`), 'h:mm a')
                    : 'Select time'
                  }
                </p>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-muted-foreground" />
          </button>

          {/* Duration & Type Row */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">Duration</Label>
              <Select 
                value={formData.duration_minutes.toString()} 
                onValueChange={v => handleInputChange('duration_minutes', parseInt(v))}
              >
                <SelectTrigger className="h-12 rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {DURATION_OPTIONS.map(opt => (
                    <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Meeting Type Chips */}
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Meeting Type</Label>
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
                      "flex-1 flex items-center justify-center gap-2 py-3 px-3 rounded-xl border transition-all active:scale-95",
                      isActive 
                        ? "bg-primary text-primary-foreground border-primary" 
                        : "bg-card border-border text-foreground"
                    )}
                  >
                    <Icon className="w-4 h-4" />
                    <span className="text-sm font-medium">{opt.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* People Section */}
        <div className="py-4 border-t border-border space-y-3">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Who</h3>
          
          {/* Client Selector */}
          <button
            type="button"
            onClick={() => setStep('client')}
            className="w-full flex items-center justify-between p-4 bg-card rounded-2xl border border-border active:scale-[0.98] transition-all"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <User className="w-5 h-5 text-primary" />
              </div>
              <div className="text-left">
                <p className="text-sm text-muted-foreground">Client <span className="text-destructive">*</span></p>
                <p className={cn("font-semibold", selectedClient ? "text-foreground" : "text-muted-foreground")}>
                  {selectedClient?.full_name || 'Select client'}
                </p>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-muted-foreground" />
          </button>

          {/* Lawyer Selector */}
          <button
            type="button"
            onClick={() => setStep('lawyer')}
            className="w-full flex items-center justify-between p-4 bg-card rounded-2xl border border-border active:scale-[0.98] transition-all"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-accent flex items-center justify-center">
                <Briefcase className="w-5 h-5 text-accent-foreground" />
              </div>
              <div className="text-left">
                <p className="text-sm text-muted-foreground">Assigned To <span className="text-destructive">*</span></p>
                <p className={cn("font-semibold", selectedLawyer ? "text-foreground" : "text-muted-foreground")}>
                  {selectedLawyer?.full_name || 'Select lawyer'}
                </p>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-muted-foreground" />
          </button>

          {/* Case Selector (optional) */}
          {cases.length > 0 && (
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">Related Case (Optional)</Label>
              <Select 
                value={formData.case_id || "__none__"} 
                onValueChange={v => handleInputChange('case_id', v === "__none__" ? "" : v)}
              >
                <SelectTrigger className="h-12 rounded-xl">
                  <SelectValue placeholder="Select case" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">No case</SelectItem>
                  {cases.map(c => (
                    <SelectItem key={c.id} value={c.id}>{c.case_title}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>

        {/* Notes Section */}
        <div className="py-4 border-t border-border space-y-3">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Notes</h3>
          <Textarea
            value={formData.notes}
            onChange={e => handleInputChange('notes', e.target.value)}
            placeholder="Add notes, agenda, or discussion points..."
            className="min-h-[100px] rounded-xl resize-none"
          />
        </div>
      </div>

      {/* Fixed Bottom Action */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-background border-t border-border safe-area-pb">
        <Button 
          onClick={handleSubmit} 
          disabled={loading || !formData.appointment_time || !formData.client_id || !formData.lawyer_id}
          className="w-full h-14 rounded-2xl text-base font-semibold"
        >
          {loading ? 'Creating...' : 'Create Appointment'}
        </Button>
      </div>
    </div>
  );

  const renderDatePicker = () => (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <button onClick={() => setStep('form')} className="p-2 -ml-2">
          <X className="w-5 h-5" />
        </button>
        <h3 className="font-semibold">Select Date</h3>
        <div className="w-9" />
      </div>
      <div className="flex-1 flex items-start justify-center pt-4">
        <CalendarComponent
          mode="single"
          selected={formData.appointment_date}
          onSelect={(date) => {
            if (date) {
              handleInputChange('appointment_date', date);
              setStep('form');
            }
          }}
          disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
          className="rounded-xl border-0"
        />
      </div>
    </div>
  );

  const renderTimePicker = () => (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <button onClick={() => setStep('form')} className="p-2 -ml-2">
          <X className="w-5 h-5" />
        </button>
        <h3 className="font-semibold">Select Time</h3>
        <div className="w-9" />
      </div>
      <div className="flex-1 overflow-y-auto p-4">
        <div className="grid grid-cols-3 gap-2">
          {TIME_SLOTS.map(time => {
            const isSelected = formData.appointment_time === time;
            return (
              <button
                key={time}
                onClick={() => {
                  handleInputChange('appointment_time', time);
                  setStep('form');
                }}
                className={cn(
                  "py-3 px-4 rounded-xl text-sm font-medium transition-all active:scale-95",
                  isSelected 
                    ? "bg-primary text-primary-foreground" 
                    : "bg-card border border-border text-foreground"
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
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <button onClick={() => setStep('form')} className="p-2 -ml-2">
          <X className="w-5 h-5" />
        </button>
        <h3 className="font-semibold">Select Client</h3>
        <div className="w-9" />
      </div>
      <div className="p-4 border-b border-border">
        <Input
          placeholder="Search clients..."
          value={clientSearch}
          onChange={e => setClientSearch(e.target.value)}
          className="h-12 rounded-xl"
        />
      </div>
      <div className="flex-1 overflow-y-auto">
        {filteredClients.map(client => (
          <button
            key={client.id}
            onClick={() => {
              handleInputChange('client_id', client.id);
              setClientSearch('');
              setStep('form');
            }}
            className={cn(
              "w-full flex items-center gap-3 px-4 py-4 border-b border-border active:bg-accent transition-colors",
              formData.client_id === client.id && "bg-accent/50"
            )}
          >
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <span className="text-sm font-semibold text-primary">
                {client.full_name.split(' ').map(n => n[0]).join('').slice(0, 2)}
              </span>
            </div>
            <span className="font-medium text-foreground">{client.full_name}</span>
          </button>
        ))}
      </div>
    </div>
  );

  const renderLawyerPicker = () => (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <button onClick={() => setStep('form')} className="p-2 -ml-2">
          <X className="w-5 h-5" />
        </button>
        <h3 className="font-semibold">Select Lawyer</h3>
        <div className="w-9" />
      </div>
      <div className="p-4 border-b border-border">
        <Input
          placeholder="Search team members..."
          value={lawyerSearch}
          onChange={e => setLawyerSearch(e.target.value)}
          className="h-12 rounded-xl"
        />
      </div>
      <div className="flex-1 overflow-y-auto">
        {filteredLawyers.map(lawyer => (
          <button
            key={lawyer.id}
            onClick={() => {
              handleInputChange('lawyer_id', lawyer.id);
              setLawyerSearch('');
              setStep('form');
            }}
            className={cn(
              "w-full flex items-center justify-between px-4 py-4 border-b border-border active:bg-accent transition-colors",
              formData.lawyer_id === lawyer.id && "bg-accent/50"
            )}
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-accent flex items-center justify-center">
                <span className="text-sm font-semibold text-accent-foreground">
                  {lawyer.full_name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                </span>
              </div>
              <div className="text-left">
                <p className="font-medium text-foreground">{lawyer.full_name}</p>
                <p className="text-sm text-muted-foreground capitalize">{lawyer.role}</p>
              </div>
            </div>
            {formData.lawyer_id === lawyer.id && (
              <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                <svg className="w-3 h-3 text-primary-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
              </div>
            )}
          </button>
        ))}
      </div>
    </div>
  );

  return (
    <Sheet open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <SheetContent side="bottom" className="h-[95vh] rounded-t-3xl p-0">
        <SheetHeader className="px-4 py-4 border-b border-border">
          <div className="flex items-center justify-between">
            <SheetTitle className="text-lg font-semibold">New Appointment</SheetTitle>
            <button onClick={onClose} className="p-2 -mr-2 rounded-full hover:bg-accent">
              <X className="w-5 h-5" />
            </button>
          </div>
        </SheetHeader>
        
        <div className="h-[calc(95vh-60px)]">
          {step === 'form' && renderFormView()}
          {step === 'date' && renderDatePicker()}
          {step === 'time' && renderTimePicker()}
          {step === 'client' && renderClientPicker()}
          {step === 'lawyer' && renderLawyerPicker()}
        </div>
      </SheetContent>
    </Sheet>
  );
};
