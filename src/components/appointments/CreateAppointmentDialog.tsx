
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
    title: '',
    appointment_date: '',
    appointment_time: '',
    duration_minutes: 60,
    client_id: '',
    lawyer_id: '',
    case_id: '',
    location: 'in_person',
    notes: '',
    status: 'upcoming'
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
        ...formData,
        firm_id: firmData?.law_firm_id,
        created_by: currentUser.user.id,
        duration_minutes: Number(formData.duration_minutes)
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

  return (
    <Dialog open onOpenChange={closeDialog}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Create New Appointment</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Appointment title"
                required
              />
            </div>
            
            <div>
              <Label htmlFor="appointment_date">Date</Label>
              <Input
                id="appointment_date"
                type="date"
                value={formData.appointment_date}
                onChange={(e) => setFormData({ ...formData, appointment_date: e.target.value })}
                required
              />
            </div>
            
            <div>
              <Label htmlFor="appointment_time">Time</Label>
              <Input
                id="appointment_time"
                type="time"
                value={formData.appointment_time}
                onChange={(e) => setFormData({ ...formData, appointment_time: e.target.value })}
                required
              />
            </div>
            
            <div>
              <Label htmlFor="duration_minutes">Duration (minutes)</Label>
              <Select
                value={formData.duration_minutes.toString()}
                onValueChange={(value) => setFormData({ ...formData, duration_minutes: parseInt(value) })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="30">30 minutes</SelectItem>
                  <SelectItem value="60">1 hour</SelectItem>
                  <SelectItem value="90">1.5 hours</SelectItem>
                  <SelectItem value="120">2 hours</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="client_id">Client</Label>
              <Select
                value={formData.client_id}
                onValueChange={(value) => setFormData({ ...formData, client_id: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select client" />
                </SelectTrigger>
                <SelectContent>
                  {clients.map((client) => (
                    <SelectItem key={client.id} value={client.id}>
                      {client.full_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="lawyer_id">Assigned To</Label>
              <Select
                value={formData.lawyer_id}
                onValueChange={(value) => setFormData({ ...formData, lawyer_id: value })}
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select user" />
                </SelectTrigger>
                <SelectContent>
                  {users.map((user) => (
                    <SelectItem key={user.id} value={user.id}>
                      {user.full_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="case_id">Related Case (Optional)</Label>
              <Select
                value={formData.case_id}
                onValueChange={(value) => setFormData({ ...formData, case_id: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select case" />
                </SelectTrigger>
                <SelectContent>
                  {cases.map((case_) => (
                    <SelectItem key={case_.id} value={case_.id}>
                      {case_.case_title} ({case_.case_number})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="location">Location</Label>
              <Select
                value={formData.location}
                onValueChange={(value) => setFormData({ ...formData, location: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="in_person">Office / In-Person</SelectItem>
                  <SelectItem value="online">Video Call</SelectItem>
                  <SelectItem value="phone">Phone Call</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="col-span-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Additional notes or agenda items..."
                rows={3}
              />
            </div>
          </div>
          
          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={closeDialog}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Creating...' : 'Create Appointment'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
