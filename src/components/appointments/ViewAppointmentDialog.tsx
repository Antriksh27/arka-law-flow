import React, { useState, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useDialog } from '@/hooks/use-dialog';
import { EditAppointmentDialog } from './EditAppointmentDialog';
import RescheduleAppointmentDialog from '../reception/RescheduleAppointmentDialog';
import { ConvertToClientDialog } from './ConvertToClientDialog';
import { ConvertToClientDialog as ConvertContactDialog } from '@/components/contacts/ConvertToClientDialog';
import { parseISO } from 'date-fns';
import { TimeUtils } from '@/lib/timeUtils';
import { Calendar, Clock, User, MapPin, FileText, Edit, RotateCcw, X, UserPlus, Users, Trash } from 'lucide-react';
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

// Helper to extract additional lawyers from notes
const extractAdditionalLawyersFromNotes = (notes: string | null): string[] => {
  if (!notes) return [];
  const match = notes.match(/^Additional Lawyers: (.+?)(?:\n|$)/);
  if (match) {
    return match[1].split(', ').map(name => name.trim());
  }
  return [];
};

// Helper to get clean notes without additional lawyers line
const getCleanNotes = (notes: string | null): string => {
  if (!notes) return '';
  return notes.replace(/^Additional Lawyers: .+?\n\n?/, '').trim();
};

export const ViewAppointmentDialog: React.FC<ViewAppointmentDialogProps> = ({
  appointment,
}) => {
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  
  // Extract client name from title if client_name is null
  const extractedClientName = appointment.client_name || 
    (appointment.title?.includes(' with ') 
      ? appointment.title.split(' with ')[1]?.trim() 
      : null) ||
    (appointment.notes?.startsWith('Contact: ')
      ? appointment.notes.replace('Contact: ', '').trim()
      : null);
  
  // Extract additional lawyers from notes
  const additionalLawyerNames = useMemo(() => 
    extractAdditionalLawyersFromNotes(appointment.notes),
    [appointment.notes]
  );
  
  // Get clean notes without the additional lawyers line
  const cleanNotes = useMemo(() => 
    getCleanNotes(appointment.notes),
    [appointment.notes]
  );
  
  const { closeDialog, openDialog } = useDialog();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { firmId, role } = useAuth();

  // Fetch contact data by client name if available
  const { data: contactData, isLoading: contactLoading, error: contactError } = useQuery({
    queryKey: ['contact-by-name', extractedClientName, firmId],
    queryFn: async () => {
      if (!extractedClientName || !firmId) {
        return null;
      }
      
      // First try exact match
      const { data: exactData, error: exactError } = await supabase
        .from('contacts')
        .select('*')
        .eq('firm_id', firmId)
        .eq('name', extractedClientName.trim());
      
      if (exactData && exactData.length > 0) {
        return exactData[0];
      }
      
      // Try case-insensitive search  
      const { data: fuzzyData, error: fuzzyError } = await supabase
        .from('contacts')
        .select('*')
        .eq('firm_id', firmId)
        .ilike('name', `%${extractedClientName.trim()}%`);
      
      if (fuzzyData && fuzzyData.length > 0) {
        return fuzzyData[0];
      }
      
      return null;
    },
    enabled: !!extractedClientName && !!firmId && extractedClientName !== 'Unknown Client',
  });

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

  const deleteMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from('appointments')
        .delete()
        .eq('id', appointment.id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Appointment deleted successfully"
      });
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
      queryClient.invalidateQueries({ queryKey: ['appointments-timeline'] });
      closeDialog();
    },
    onError: (error) => {
      console.error('Delete appointment error:', error);
      toast({
        title: "Error",
        description: `Failed to delete appointment: ${error.message}`,
        variant: "destructive"
      });
    }
  });

  const handleEdit = () => {
    closeDialog();
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
          firm_id: null,
          created_by_user_id: null,
          type: appointment.type
        }}
      />
    );
    
    closeDialog();
    setTimeout(() => {
      openDialog(rescheduleDialog);
    }, 100);
  };

  const handleConvertToClient = () => {
    closeDialog();
    
    const contactToConvert = contactData ? {
      ...contactData,
      referred_by_name: contactData.referred_by_name || '',
      referred_by_phone: contactData.referred_by_phone || ''
    } : {
      id: `temp-${Date.now()}`,
      name: extractedClientName || 'Unknown Client',
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
    
    openDialog(
      <ConvertContactDialog
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

  const handleDeleteClick = () => {
    setDeleteConfirmOpen(true);
  };

  const handleDeleteConfirm = () => {
    deleteMutation.mutate();
    setDeleteConfirmOpen(false);
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
    return TimeUtils.formatDate(parseISO(date), 'EEEE, MMMM d, yyyy');
  };

  const formatTime = (time: string | null) => {
    if (!time) return 'No time';
    return TimeUtils.formatTime(`2000-01-01T${time}`, 'h:mm a');
  };

  return (
    <Dialog open={true} onOpenChange={(open) => !open && closeDialog()}>
      <DialogContent className="max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto p-6">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold text-foreground">
            Appointment Details
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Title */}
          <div>
            <h3 className="text-lg font-medium text-foreground">
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
              <Calendar className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium text-foreground">Date</p>
                <p className="text-sm text-muted-foreground">{formatDate(appointment.appointment_date)}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Clock className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium text-foreground">Time</p>
                <p className="text-sm text-muted-foreground">{formatTime(appointment.appointment_time)}</p>
              </div>
            </div>
          </div>

          {/* Client */}
          {appointment.client_name && (
            <div className="flex items-center gap-3">
              <User className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium text-foreground">Client</p>
                <p className="text-sm text-muted-foreground">{appointment.client_name}</p>
              </div>
            </div>
          )}

          {/* Assigned Lawyers Section */}
          <div className="flex items-start gap-3">
            <Users className="h-5 w-5 text-muted-foreground mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-medium text-foreground">Assigned Team</p>
              <div className="mt-2 space-y-2">
                {/* Primary Lawyer */}
                {appointment.lawyer_name && (
                  <div className="flex items-center gap-2">
                    <Badge variant="default" className="bg-primary/10 text-primary border-primary/20">
                      Primary
                    </Badge>
                    <span className="text-sm text-muted-foreground">{appointment.lawyer_name}</span>
                  </div>
                )}
                
                {/* Additional Lawyers */}
                {additionalLawyerNames.length > 0 && (
                  <div className="flex flex-wrap items-center gap-2">
                    {additionalLawyerNames.map((name, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <Badge variant="outline" className="bg-accent">
                          {name}
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
                
                {!appointment.lawyer_name && additionalLawyerNames.length === 0 && (
                  <p className="text-sm text-muted-foreground">No team members assigned</p>
                )}
              </div>
            </div>
          </div>

          {/* Type */}
          {appointment.type && (
            <div>
              <p className="text-sm font-medium text-foreground">Type</p>
              <p className="text-sm text-muted-foreground capitalize">{appointment.type.replace('_', ' ')}</p>
            </div>
          )}

          {/* Location */}
          {appointment.location && (
            <div className="flex items-center gap-3">
              <MapPin className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium text-foreground">Location</p>
                <p className="text-sm text-muted-foreground">{appointment.location}</p>
              </div>
            </div>
          )}

          {/* Notes - showing clean notes without additional lawyers line */}
          {cleanNotes && (
            <div className="flex items-start gap-3">
              <FileText className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div>
                <p className="text-sm font-medium text-foreground">Notes</p>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">{cleanNotes}</p>
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
          <Button
            variant="destructive"
            onClick={handleDeleteClick}
            disabled={deleteMutation.isPending}
            className="flex-1"
          >
            <Trash className="h-4 w-4 mr-2" />
            {deleteMutation.isPending ? 'Deleting...' : 'Delete'}
          </Button>
          {extractedClientName && !appointment.client_id && (role === 'lawyer' || role === 'junior') && (
            <Button
              onClick={handleConvertToClient}
              className="flex-1"
            >
              <UserPlus className="h-4 w-4 mr-2" />
              Convert to Client
            </Button>
          )}
        </div>
      </DialogContent>
      
      <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Appointment</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this appointment? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm} className="bg-red-600 hover:bg-red-700">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Dialog>
  );
};
