import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useDialog } from '@/hooks/use-dialog';
import { EditAppointmentDialog } from './EditAppointmentDialog';
import RescheduleAppointmentDialog from '../reception/RescheduleAppointmentDialog';
import { ConvertToClientDialog } from './ConvertToClientDialog';
import { ConvertContactToClientDialog } from '../reception/ConvertContactToClientDialog';
import { format, parseISO } from 'date-fns';
import { Calendar, Clock, User, MapPin, FileText, Edit, RotateCcw, X, UserPlus, Users, Plus } from 'lucide-react';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';

interface ViewAppointmentDialogProps {
  appointment: {
    id: string;
    title: string | null;
    appointment_date: string | null;
    appointment_time: string | null;
    status: string | null;
    type: string | null;
    lawyer_id: string | null;
    lawyer_name: string | null;
    location: string | null;
    notes: string | null;
    client_name?: string;
    client_id?: string | null;
    case_id?: string | null;
    duration_minutes?: number;
  };
}

export const ViewAppointmentDialog: React.FC<ViewAppointmentDialogProps> = ({
  appointment,
}) => {
  console.log('🎯 ViewAppointmentDialog: Full appointment object:', appointment);
  console.log('🎯 ViewAppointmentDialog: Client name specifically:', appointment.client_name);
  
  const { closeDialog, openDialog } = useDialog();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { firmId, role } = useAuth();

  // Fetch contact data by client name if available
  const { data: contactData, isLoading: contactLoading, error: contactError } = useQuery({
    queryKey: ['contact-by-name', appointment.client_name, firmId],
    queryFn: async () => {
      console.log('🔍 ViewAppointmentDialog: Query function called with:', {
        client_name: appointment.client_name,
        firmId: firmId,
        enabled: !!appointment.client_name && !!firmId
      });
      
      if (!appointment.client_name || !firmId) {
        console.log('❌ ViewAppointmentDialog: No client_name or firmId - skipping query');
        return null;
      }
      
      console.log('🔍 ViewAppointmentDialog: Executing contact search for:', appointment.client_name);
      
      // First try exact match
      console.log('🔍 Trying exact match...');
      const { data: exactData, error: exactError } = await supabase
        .from('contacts')
        .select('*')
        .eq('firm_id', firmId)
        .eq('name', appointment.client_name.trim());
      
      console.log('🔍 Exact match result:', { data: exactData, error: exactError });
      
      if (exactData && exactData.length > 0) {
        console.log('✅ Found contact with exact match:', exactData[0]);
        return exactData[0];
      }
      
      // Try case-insensitive search  
      console.log('🔍 Trying fuzzy match...');
      const { data: fuzzyData, error: fuzzyError } = await supabase
        .from('contacts')
        .select('*')
        .eq('firm_id', firmId)
        .ilike('name', `%${appointment.client_name.trim()}%`);
      
      console.log('🔍 Fuzzy match result:', { data: fuzzyData, error: fuzzyError });
      
      if (fuzzyData && fuzzyData.length > 0) {
        console.log('✅ Found contact with fuzzy match:', fuzzyData[0]);
        return fuzzyData[0];
      }
      
      console.log('❌ No contact found for name:', appointment.client_name);
      return null;
    },
    enabled: !!appointment.client_name && !!firmId && appointment.client_name !== 'Unknown Client',
  });

  console.log('🔍 Contact query state:', { contactData, contactLoading, contactError });

  const cancelMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from('appointments')
        .update({ status: 'cancelled' })
        .eq('id', appointment.id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Appointment cancelled successfully"
      });
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
      queryClient.invalidateQueries({ queryKey: ['appointments-timeline'] });
      closeDialog();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to cancel appointment",
        variant: "destructive"
      });
    }
  });

  const handleEdit = () => {
    closeDialog();
    // Convert the appointment to match EditAppointmentDialog's expected format
    const editAppointment = {
      id: appointment.id,
      title: appointment.title || '',
      appointment_date: appointment.appointment_date || '',
      appointment_time: appointment.appointment_time || '',
      duration_minutes: appointment.duration_minutes || 60,
      client_id: appointment.client_id,
      lawyer_id: appointment.lawyer_id || '',
      case_id: appointment.case_id,
      location: appointment.location || 'in_person',
      notes: appointment.notes || '',
      status: appointment.status || 'upcoming'
    };
    
    openDialog(
      <EditAppointmentDialog 
        appointment={editAppointment} 
        onSuccess={() => {
          queryClient.invalidateQueries({ queryKey: ['appointments'] });
          queryClient.invalidateQueries({ queryKey: ['appointments-timeline'] });
        }} 
      />
    );
  };

  const handleReschedule = () => {
    const rescheduleDialog = (
      <RescheduleAppointmentDialog 
        open={true}
        onOpenChange={(open) => {
          if (!open) {
            closeDialog();
          }
        }}
        appointment={{
          id: appointment.id,
          client_name: appointment.client_name || '',
          appointment_date: appointment.appointment_date || '',
          appointment_time: appointment.appointment_time || '',
          lawyer_id: appointment.lawyer_id || '',
          lawyer_name: appointment.lawyer_name || '',
          duration_minutes: appointment.duration_minutes || 60,
          client_id: appointment.client_id,
          case_id: appointment.case_id,
          title: appointment.title,
          location: appointment.location,
          notes: appointment.notes,
          firm_id: null, // Will be fetched in the dialog
          created_by_user_id: null,
          type: appointment.type
        }}
      />
    );
    
    closeDialog();
    // Small delay to ensure dialog close completes before opening new one
    setTimeout(() => {
      openDialog(rescheduleDialog);
    }, 100);
  };

  const handleConvertToClient = () => {
    console.log('🚀 ViewAppointmentDialog: handleConvertToClient called');
    console.log('👤 Appointment details:', {
      id: appointment.id,
      client_name: appointment.client_name,
      title: appointment.title,
      notes: appointment.notes
    });
    console.log('📄 Available contactData:', contactData);
    
    closeDialog();
    
    // Create contact data from appointment if no existing contact found
    const contactToConvert = contactData ? {
      ...contactData,
      // Ensure all required fields exist
      referred_by_name: contactData.referred_by_name || '',
      referred_by_phone: contactData.referred_by_phone || ''
    } : {
      id: `temp-${Date.now()}`,
      name: appointment.client_name || 'Unknown Client',
      email: '',
      phone: '',
      notes: appointment.notes || '',
      address_line_1: '',
      address_line_2: '',
      pin_code: '',
      state_id: null,
      district_id: null,
      visit_purpose: appointment.title || 'Appointment consultation',
      referred_by_name: '',
      referred_by_phone: '',
      firm_id: firmId,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      created_by: null,
      last_visited_at: new Date().toISOString()
    };
    
    console.log('📝 Final contact data being passed to dialog:', contactToConvert);
    
    openDialog(
      <ConvertContactToClientDialog
        contact={contactToConvert}
        open={true}
        onOpenChange={(open) => {
          if (!open) {
            closeDialog();
          }
        }}
      />
    );
  };

  const handleConvertContactToClient = () => {
    closeDialog();
    
    // Use actual contact data if found, otherwise create a minimal contact object
    const contactToConvert = contactData || {
      id: 'temp-id',
      name: appointment.client_name || '',
      email: '',
      phone: '',
      notes: '',
      address_line_1: '',
      address_line_2: '',
      pin_code: '',
      state_id: '',
      district_id: '',
      visit_purpose: ''
    };
    
    console.log('ViewAppointmentDialog: Converting contact with data:', contactToConvert);
    
    openDialog(
      <ConvertContactToClientDialog
        contact={contactToConvert}
        open={true}
        onOpenChange={(open) => {
          if (!open) {
            closeDialog();
          }
        }}
      />
    );
  };

  const handleCancel = () => {
    if (window.confirm('Are you sure you want to cancel this appointment?')) {
      cancelMutation.mutate();
    }
  };

  const getStatusColor = (status: string | null) => {
    switch (status?.toLowerCase()) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      case 'upcoming':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (date: string | null) => {
    if (!date) return 'No date';
    return format(parseISO(date), 'EEEE, MMMM d, yyyy');
  };

  const formatTime = (time: string | null) => {
    if (!time) return 'No time';
    return format(parseISO(`2000-01-01T${time}`), 'h:mm a');
  };

  return (
    <Dialog open={true} onOpenChange={(open) => !open && closeDialog()}>
      <DialogContent className="max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto p-6">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold text-gray-900">
            Appointment Details
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Title */}
          <div>
            <h3 className="text-lg font-medium text-gray-900">
              {appointment.title || 'Untitled Appointment'}
            </h3>
            {appointment.status && (
              <Badge className={`mt-2 ${getStatusColor(appointment.status)}`}>
                {appointment.status}
              </Badge>
            )}
          </div>

          {/* Date & Time */}
          <div className="grid grid-cols-1 gap-4">
            <div className="flex items-center gap-3">
              <Calendar className="h-5 w-5 text-gray-500" />
              <div>
                <p className="text-sm font-medium text-gray-700">Date</p>
                <p className="text-sm text-gray-600">{formatDate(appointment.appointment_date)}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Clock className="h-5 w-5 text-gray-500" />
              <div>
                <p className="text-sm font-medium text-gray-700">Time</p>
                <p className="text-sm text-gray-600">{formatTime(appointment.appointment_time)}</p>
              </div>
            </div>
          </div>

          {/* Client */}
          {appointment.client_name && (
            <div className="flex items-center gap-3">
              <User className="h-5 w-5 text-gray-500" />
              <div>
                <p className="text-sm font-medium text-gray-700">Client</p>
                <p className="text-sm text-gray-600">{appointment.client_name}</p>
              </div>
            </div>
          )}

          {/* Assigned Lawyer */}
          {appointment.lawyer_name && (
            <div className="flex items-center gap-3">
              <User className="h-5 w-5 text-gray-500" />
              <div>
                <p className="text-sm font-medium text-gray-700">Assigned Lawyer</p>
                <p className="text-sm text-gray-600">{appointment.lawyer_name}</p>
              </div>
            </div>
          )}

          {/* Type */}
          {appointment.type && (
            <div>
              <p className="text-sm font-medium text-gray-700">Type</p>
              <p className="text-sm text-gray-600 capitalize">{appointment.type.replace('_', ' ')}</p>
            </div>
          )}

          {/* Location */}
          {appointment.location && (
            <div className="flex items-center gap-3">
              <MapPin className="h-5 w-5 text-gray-500" />
              <div>
                <p className="text-sm font-medium text-gray-700">Location</p>
                <p className="text-sm text-gray-600">{appointment.location}</p>
              </div>
            </div>
          )}

          {/* Notes */}
          {appointment.notes && (
            <div className="flex items-start gap-3">
              <FileText className="h-5 w-5 text-gray-500 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-gray-700">Notes</p>
                <p className="text-sm text-gray-600 whitespace-pre-wrap">{appointment.notes}</p>
              </div>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-2 pt-6 border-t">
          <Button
            variant="outline"
            onClick={handleEdit}
            className="flex-1"
          >
            <Edit className="h-4 w-4 mr-2" />
            Edit
          </Button>
          <Button
            variant="outline"
            onClick={handleReschedule}
            className="flex-1"
          >
            <RotateCcw className="h-4 w-4 mr-2" />
            Reschedule
          </Button>
          <Button
            variant="outline"
            onClick={handleCancel}
            disabled={cancelMutation.isPending}
            className="flex-1"
          >
            <X className="h-4 w-4 mr-2" />
            {cancelMutation.isPending ? 'Cancelling...' : 'Cancel'}
          </Button>
          {appointment.client_name && !appointment.client_id && contactData && (role === 'lawyer' || role === 'junior') && (
            <Button
              onClick={handleConvertContactToClient}
              className="flex-1"
            >
              <Users className="h-4 w-4 mr-2" />
              Convert Contact
            </Button>
          )}
          {appointment.client_name && !appointment.client_id && !contactData && (role === 'lawyer' || role === 'junior') && (
            <Button
              onClick={handleConvertToClient}
              className="flex-1"
            >
              <UserPlus className="h-4 w-4 mr-2" />
              Convert to Client
            </Button>
          )}
          <Button
            variant="secondary"
            onClick={handleConvertToClient}
            className="flex-1"
          >
            <UserPlus className="h-4 w-4 mr-2" />
            Convert to Client
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
