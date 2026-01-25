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
import { CreateNoteMultiModal } from '@/components/notes/CreateNoteMultiModal';
import { CreateTaskDialog } from '@/components/tasks/CreateTaskDialog';
import { parseISO } from 'date-fns';
import { TimeUtils } from '@/lib/timeUtils';
import { Calendar, Clock, User, MapPin, FileText, Edit, RotateCcw, X, UserPlus, Users, Trash, StickyNote, CheckSquare } from 'lucide-react';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { getAppointmentStatusColor } from '@/lib/statusColors';
import { MobileDialogHeader } from '@/components/ui/mobile-dialog-header';

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
    daily_serial_number?: number;
  };
}

export const ViewAppointmentDialog: React.FC<ViewAppointmentDialogProps> = ({
  appointment,
}) => {
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [showNoteDialog, setShowNoteDialog] = useState(false);
  const [showTaskDialog, setShowTaskDialog] = useState(false);
  
  // Extract client name from title if client_name is null
  const extractedClientName = appointment.client_name || 
    (appointment.title?.includes(' with ') 
      ? appointment.title.split(' with ')[1]?.trim() 
      : null) ||
    (appointment.notes?.startsWith('Contact: ')
      ? appointment.notes.replace('Contact: ', '').trim()
      : null);
  
  // Fetch additional lawyers from junction table (using any type since table is newly created)
  const { data: additionalLawyersData } = useQuery({
    queryKey: ['appointment-lawyers', appointment.id],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from('appointment_lawyers')
        .select(`
          lawyer_id,
          team_members!appointment_lawyers_lawyer_id_fkey(full_name)
        `)
        .eq('appointment_id', appointment.id);
      
      if (error) {
        console.error('Error fetching additional lawyers:', error);
        return [];
      }
      
      return data || [];
    }
  });

  const additionalLawyerNames = useMemo(() => 
    (additionalLawyersData || []).map((row: any) => row.team_members?.full_name).filter(Boolean),
    [additionalLawyersData]
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
    const colors = getAppointmentStatusColor(status?.toLowerCase() || '');
    return `${colors.bg} ${colors.text}`;
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
      <DialogContent hideCloseButton className="sm:max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col p-0 gap-0">
        {/* Mobile-friendly Header with Close Button */}
        <div className="sticky top-0 z-10 bg-white border-b border-slate-100 px-4 py-3 sm:px-6 sm:py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {appointment.daily_serial_number && (
              <div className="bg-gradient-to-br from-primary/90 to-primary text-primary-foreground rounded-xl px-3 py-2 text-center min-w-[52px] shadow-sm">
                <div className="text-[8px] font-semibold uppercase tracking-wider opacity-80">Token</div>
                <div className="text-lg font-bold leading-none">{appointment.daily_serial_number}</div>
              </div>
            )}
            <div>
              <h2 className="text-lg font-semibold text-slate-900">Appointment Details</h2>
              {appointment.status && (
                <Badge className={`mt-1 ${getStatusColor(appointment.status)}`}>
                  {appointment.status}
                </Badge>
              )}
            </div>
          </div>
          <button 
            onClick={() => closeDialog()}
            className="p-2 rounded-full hover:bg-slate-100 active:scale-95 transition-all"
          >
            <X className="h-5 w-5 text-slate-500" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto px-4 py-4 sm:px-6 bg-muted">
          <div className="space-y-4">
            {/* Title Card */}
            <div className="bg-white rounded-2xl shadow-sm p-4">
              <h3 className="text-base font-medium text-slate-900">
                {appointment.title || 'Untitled Appointment'}
              </h3>
            </div>

            {/* Date, Time & Location Card */}
            <div className="bg-white rounded-2xl shadow-sm p-4 space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-sky-50 flex items-center justify-center">
                  <Calendar className="h-4 w-4 text-sky-500" />
                </div>
                <div className="flex-1">
                  <p className="text-xs text-slate-500">Date</p>
                  <p className="text-sm font-medium text-slate-900">{formatDate(appointment.appointment_date)}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-violet-50 flex items-center justify-center">
                  <Clock className="h-4 w-4 text-violet-500" />
                </div>
                <div className="flex-1">
                  <p className="text-xs text-slate-500">Time</p>
                  <p className="text-sm font-medium text-slate-900">{formatTime(appointment.appointment_time)}</p>
                </div>
              </div>
              {appointment.location && (
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-emerald-50 flex items-center justify-center">
                    <MapPin className="h-4 w-4 text-emerald-500" />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs text-slate-500">Location</p>
                    <p className="text-sm font-medium text-slate-900">{appointment.location}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Client & Team Card */}
            <div className="bg-white rounded-2xl shadow-sm p-4 space-y-3">
              {appointment.client_name && (
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-amber-50 flex items-center justify-center">
                    <User className="h-4 w-4 text-amber-500" />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs text-slate-500">Client</p>
                    <p className="text-sm font-medium text-slate-900">{appointment.client_name}</p>
                  </div>
                </div>
              )}

              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-xl bg-rose-50 flex items-center justify-center">
                  <Users className="h-4 w-4 text-rose-500" />
                </div>
                <div className="flex-1">
                  <p className="text-xs text-slate-500">Assigned Team</p>
                  <div className="mt-1.5 flex flex-wrap gap-1.5">
                    {appointment.lawyer_name && (
                      <Badge variant="default" className="bg-primary/10 text-primary border-primary/20 text-xs">
                        {appointment.lawyer_name}
                      </Badge>
                    )}
                    {additionalLawyerNames.map((name, index) => (
                      <Badge key={index} variant="outline" className="bg-accent text-xs">
                        {name}
                      </Badge>
                    ))}
                    {!appointment.lawyer_name && additionalLawyerNames.length === 0 && (
                      <span className="text-sm text-slate-400">No team members assigned</span>
                    )}
                  </div>
                </div>
              </div>

              {appointment.type && (
                <div className="flex items-center gap-3 pt-2 border-t border-slate-100">
                  <p className="text-xs text-slate-500">Type:</p>
                  <p className="text-sm font-medium text-slate-900 capitalize">{appointment.type.replace('_', ' ')}</p>
                </div>
              )}
            </div>

            {/* Notes Card */}
            {appointment.notes && (
              <div className="bg-white rounded-2xl shadow-sm p-4">
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center">
                    <FileText className="h-4 w-4 text-slate-500" />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs text-slate-500 mb-1">Notes</p>
                    <p className="text-sm text-slate-700 whitespace-pre-wrap">{appointment.notes}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Fixed Bottom Action Bar */}
        <div className="sticky bottom-0 bg-white/95 backdrop-blur-sm border-t border-slate-100 p-3 sm:p-4">
          <div className="grid grid-cols-3 gap-2">
            <Button
              variant="outline"
              onClick={() => setShowNoteDialog(true)}
              className="rounded-xl text-xs h-9 flex flex-col items-center justify-center gap-0.5 py-1"
              size="sm"
            >
              <StickyNote className="h-4 w-4" />
              <span className="text-[10px]">Note</span>
            </Button>
            <Button
              variant="outline"
              onClick={() => setShowTaskDialog(true)}
              className="rounded-xl text-xs h-9 flex flex-col items-center justify-center gap-0.5 py-1"
              size="sm"
            >
              <CheckSquare className="h-4 w-4" />
              <span className="text-[10px]">Task</span>
            </Button>
            <Button
              variant="outline"
              onClick={handleEdit}
              className="rounded-xl text-xs h-9 flex flex-col items-center justify-center gap-0.5 py-1"
              size="sm"
            >
              <Edit className="h-4 w-4" />
              <span className="text-[10px]">Edit</span>
            </Button>
            <Button
              variant="outline"
              onClick={handleReschedule}
              className="rounded-xl text-xs h-9 flex flex-col items-center justify-center gap-0.5 py-1"
              size="sm"
            >
              <RotateCcw className="h-4 w-4" />
              <span className="text-[10px]">Reschedule</span>
            </Button>
            <Button
              variant="outline"
              onClick={handleCancel}
              disabled={cancelMutation.isPending}
              className="rounded-xl text-xs h-9 flex flex-col items-center justify-center gap-0.5 py-1"
              size="sm"
            >
              <X className="h-4 w-4" />
              <span className="text-[10px]">{cancelMutation.isPending ? 'Cancelling' : 'Cancel'}</span>
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteClick}
              disabled={deleteMutation.isPending}
              className="rounded-xl text-xs h-9 flex flex-col items-center justify-center gap-0.5 py-1"
              size="sm"
            >
              <Trash className="h-4 w-4" />
              <span className="text-[10px]">{deleteMutation.isPending ? 'Deleting' : 'Delete'}</span>
            </Button>
            {extractedClientName && !appointment.client_id && (role === 'lawyer' || role === 'junior') && (
              <Button
                onClick={handleConvertToClient}
                className="rounded-xl text-xs h-9 flex flex-col items-center justify-center gap-0.5 py-1 col-span-3"
                size="sm"
              >
                <UserPlus className="h-4 w-4" />
                <span className="text-[10px]">Convert to Client</span>
              </Button>
            )}
          </div>
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

      {/* Note Dialog - Links to client or contact from appointment */}
      <CreateNoteMultiModal
        open={showNoteDialog}
        onClose={() => setShowNoteDialog(false)}
        clientId={appointment.client_id || undefined}
        contactId={contactData?.id || undefined}
      />

      {/* Task Dialog - Links to client or contact from appointment */}
      <CreateTaskDialog
        open={showTaskDialog}
        onClose={() => setShowTaskDialog(false)}
        clientId={appointment.client_id || undefined}
        contactId={contactData?.id || undefined}
      />
    </Dialog>
  );
};
