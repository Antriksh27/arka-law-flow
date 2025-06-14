
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
import { Calendar } from '../ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import { CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { useDialog } from '@/hooks/use-dialog';
import { toast } from 'sonner';

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
}

export const CreateAppointmentDialog: React.FC = () => {
  const { closeDialog } = useDialog();
  const [loading, setLoading] = useState(false);
  const [clients, setClients] = useState<Client[]>([]);
  const [cases, setCases] = useState<Case[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  
  const [formData, setFormData] = useState({
    appointment_date: new Date(),
    appointment_time: '',
    duration_minutes: 60,
    client_id: '',
    lawyer_id: '',
    case_id: '',
    notes: '',
    status: 'upcoming',
    type: 'in-person' as 'in-person' | 'other' | 'call' | 'video-call'
  });

  useEffect(() => {
    fetchClients();
    fetchCases();
    fetchUsers();
  }, []);

  const fetchClients = async () => {
    const { data } = await supabase
      .from('clients')
      .select('id, full_name')
      .order('full_name');
    setClients(data || []);
  };

  const fetchCases = async () => {
    const { data } = await supabase
      .from('cases')
      .select('id, case_title, case_number')
      .order('case_title');
    setCases(data || []);
  };

  const fetchUsers = async () => {
    const { data } = await supabase
      .from('profiles')
      .select('id, full_name')
      .in('role', ['admin', 'lawyer', 'paralegal'])
      .order('full_name');
    setUsers(data || []);
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Get current user's firm_id
      const { data: currentUser } = await supabase.auth.getUser();
      if (!currentUser.user) throw new Error('Not authenticated');

      const { data: firmData } = await supabase
        .from('law_firm_members')
        .select('law_firm_id')
        .eq('user_id', currentUser.user.id)
        .single();

      const appointmentData = {
        title: generateTitle(),
        appointment_date: typeof formData.appointment_date === 'string' 
          ? formData.appointment_date 
          : format(formData.appointment_date, 'yyyy-MM-dd'),
        appointment_time: formData.appointment_time,
        duration_minutes: Number(formData.duration_minutes),
        client_id: formData.client_id || null,
        lawyer_id: formData.lawyer_id,
        case_id: formData.case_id || null,
        notes: formData.notes,
        status: formData.status,
        type: formData.type,
        firm_id: firmData?.law_firm_id,
        created_by: currentUser.user.id
      };

      const { error } = await supabase
        .from('appointments')
        .insert([appointmentData]);

      if (error) throw error;

      toast.success('Appointment created successfully');
      closeDialog();
    } catch (error) {
      console.error('Error creating appointment:', error);
      toast.error('Failed to create appointment');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: keyof typeof formData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <Dialog open onOpenChange={closeDialog}>
      <DialogContent className="max-w-2xl max-h-[90vh] bg-white border-gray-200 overflow-hidden">
        <DialogHeader className="pb-4">
          <DialogTitle className="text-xl font-semibold text-gray-900">Create New Appointment</DialogTitle>
        </DialogHeader>
        
        <div className="overflow-y-auto px-1 max-h-[calc(90vh-120px)]">
          <form onSubmit={handleSubmit} className="space-y-4 pr-3">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-900">Date *</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start text-left bg-white border-gray-300 text-gray-900 hover:bg-gray-50">
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {formData.appointment_date ? format(
                        typeof formData.appointment_date === 'string' 
                          ? new Date(formData.appointment_date) 
                          : formData.appointment_date, 
                        'PPP'
                      ) : 'Select date'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0 bg-white border-gray-300">
                    <Calendar
                      mode="single"
                      selected={typeof formData.appointment_date === 'string' 
                        ? new Date(formData.appointment_date) 
                        : formData.appointment_date}
                      onSelect={(date) => handleInputChange('appointment_date', date || new Date())}
                      initialFocus
                      className="bg-white"
                    />
                  </PopoverContent>
                </Popover>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="appointment_time" className="text-sm font-medium text-gray-900">Time</Label>
                <Input
                  id="appointment_time"
                  type="time"
                  value={formData.appointment_time}
                  onChange={(e) => handleInputChange('appointment_time', e.target.value)}
                  required
                  className="bg-white border-gray-300 text-gray-900 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="duration_minutes" className="text-sm font-medium text-gray-900">Duration (minutes)</Label>
                <Select
                  value={formData.duration_minutes.toString()}
                  onValueChange={(value) => handleInputChange('duration_minutes', parseInt(value))}
                >
                  <SelectTrigger className="bg-white border-gray-300 text-gray-900 focus:ring-blue-500 focus:border-blue-500">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-white border-gray-300">
                    <SelectItem value="30" className="text-gray-900">30 minutes</SelectItem>
                    <SelectItem value="60" className="text-gray-900">1 hour</SelectItem>
                    <SelectItem value="90" className="text-gray-900">1.5 hours</SelectItem>
                    <SelectItem value="120" className="text-gray-900">2 hours</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="type" className="text-sm font-medium text-gray-900">Type</Label>
                <Select
                  value={formData.type}
                  onValueChange={(value) => handleInputChange('type', value as 'in-person' | 'other' | 'call' | 'video-call')}
                >
                  <SelectTrigger className="bg-white border-gray-300 text-gray-900 focus:ring-blue-500 focus:border-blue-500">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-white border-gray-300">
                    <SelectItem value="in-person" className="text-gray-900">In-Person Meeting</SelectItem>
                    <SelectItem value="video-call" className="text-gray-900">Video Call</SelectItem>
                    <SelectItem value="call" className="text-gray-900">Phone Call</SelectItem>
                    <SelectItem value="other" className="text-gray-900">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="client_id" className="text-sm font-medium text-gray-900">Client</Label>
                <Select
                  value={formData.client_id}
                  onValueChange={(value) => handleInputChange('client_id', value)}
                >
                  <SelectTrigger className="bg-white border-gray-300 text-gray-900 focus:ring-blue-500 focus:border-blue-500">
                    <SelectValue placeholder="Select client" />
                  </SelectTrigger>
                  <SelectContent className="bg-white border-gray-300">
                    {clients.map((client) => (
                      <SelectItem key={client.id} value={client.id} className="text-gray-900">
                        {client.full_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="lawyer_id" className="text-sm font-medium text-gray-900">Assigned To *</Label>
                <Select
                  value={formData.lawyer_id}
                  onValueChange={(value) => handleInputChange('lawyer_id', value)}
                  required
                >
                  <SelectTrigger className="bg-white border-gray-300 text-gray-900 focus:ring-blue-500 focus:border-blue-500">
                    <SelectValue placeholder="Select user" />
                  </SelectTrigger>
                  <SelectContent className="bg-white border-gray-300">
                    {users.map((user) => (
                      <SelectItem key={user.id} value={user.id} className="text-gray-900">
                        {user.full_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="case_id" className="text-sm font-medium text-gray-900">Related Case (Optional)</Label>
              <Select
                value={formData.case_id}
                onValueChange={(value) => handleInputChange('case_id', value)}
              >
                <SelectTrigger className="bg-white border-gray-300 text-gray-900 focus:ring-blue-500 focus:border-blue-500">
                  <SelectValue placeholder="Select case" />
                </SelectTrigger>
                <SelectContent className="bg-white border-gray-300">
                  {cases.map((case_) => (
                    <SelectItem key={case_.id} value={case_.id} className="text-gray-900">
                      {case_.case_title} ({case_.case_number})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="notes" className="text-sm font-medium text-gray-900">Notes</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => handleInputChange('notes', e.target.value)}
                placeholder="Additional notes or agenda items..."
                rows={3}
                className="bg-white border-gray-300 text-gray-900 focus:ring-blue-500 focus:border-blue-500 resize-none"
              />
            </div>

            <div className="flex justify-end gap-3 pt-4 sticky bottom-0 bg-white border-t border-gray-200 pb-2">
              <Button 
                type="button" 
                variant="outline" 
                onClick={closeDialog} 
                className="bg-white border-gray-300 text-gray-900 hover:bg-gray-50"
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                className="bg-blue-600 hover:bg-blue-700 text-white border-blue-600"
                disabled={loading}
              >
                {loading ? 'Creating...' : 'Create Appointment'}
              </Button>
            </div>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
};
