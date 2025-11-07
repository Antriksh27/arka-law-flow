
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { MoreHorizontal, Plus, Calendar, FileText, StickyNote, Briefcase, Edit, Trash2, Users, Mail } from 'lucide-react';
import { AssignToCaseDialog } from './AssignToCaseDialog';
import { CreateAppointmentDialog } from '@/components/appointments/CreateAppointmentDialog';
import { UploadDocumentForClientDialog } from '@/components/documents/UploadDocumentForClientDialog';
import { CreateNoteDialog } from '@/components/notes/CreateNoteDialog';
import { EditClientDialog } from './EditClientDialog';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { useDialog } from '@/hooks/use-dialog';
import { EngagementLetterDialog } from './EngagementLetterDialog';

interface ClientQuickActionsProps {
  clientId: string;
  clientName: string;
  onAction: () => void;
}

export const ClientQuickActions: React.FC<ClientQuickActionsProps> = ({
  clientId,
  clientName,
  onAction
}) => {
  const [showAssignDialog, setShowAssignDialog] = useState(false);
  const [showAppointmentDialog, setShowAppointmentDialog] = useState(false);
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [showNoteDialog, setShowNoteDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showEngagementLetterDialog, setShowEngagementLetterDialog] = useState(false);
  const [clientData, setClientData] = useState<any>(null);
  const { openDialog } = useDialog();

  const fetchClientData = async () => {
    try {
      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .eq('id', clientId)
        .single();
      
      if (error) throw error;
      setClientData(data);
      setShowEditDialog(true);
    } catch (error) {
      console.error('Error fetching client data:', error);
      toast({
        title: "Error",
        description: "Failed to load client data",
        variant: "destructive"
      });
    }
  };

  const handleDeleteClient = async () => {
    try {
      const { error } = await supabase.from('clients').delete().eq('id', clientId);
      if (error) throw error;
      
      toast({
        title: "Success",
        description: "Client deleted successfully"
      });
      onAction();
      setShowDeleteDialog(false);
    } catch (error) {
      console.error('Error deleting client:', error);
      toast({
        title: "Error",
        description: "Failed to delete client",
        variant: "destructive"
      });
    }
  };

  return (
    <>
      <div className="flex items-center gap-3">
        <Button 
          size="sm" 
          className="bg-slate-800 hover:bg-slate-700 text-white"
          onClick={() => setShowAssignDialog(true)}
        >
          <Plus className="w-4 h-4 mr-2" />
          Link to Case
        </Button>
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="border-gray-200">
              <MoreHorizontal className="w-4 h-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56 bg-white border border-gray-200 rounded-xl shadow-sm">
            <DropdownMenuItem 
              className="hover:bg-gray-50 cursor-pointer"
              onClick={() => openDialog(<CreateAppointmentDialog />)}
            >
              <Calendar className="w-4 h-4 mr-3 text-gray-400" />
              <span>Schedule Appointment</span>
            </DropdownMenuItem>
            <DropdownMenuItem 
              className="hover:bg-gray-50 cursor-pointer"
              onClick={() => setShowUploadDialog(true)}
            >
              <FileText className="w-4 h-4 mr-3 text-gray-400" />
              <span>Upload Document</span>
            </DropdownMenuItem>
            <DropdownMenuItem 
              className="hover:bg-gray-50 cursor-pointer"
              onClick={() => setShowNoteDialog(true)}
            >
              <StickyNote className="w-4 h-4 mr-3 text-gray-400" />
              <span>Add Note</span>
            </DropdownMenuItem>
            <DropdownMenuItem 
              className="hover:bg-gray-50 cursor-pointer"
              onClick={() => setShowEngagementLetterDialog(true)}
            >
              <Mail className="w-4 h-4 mr-3 text-gray-400" />
              <span>Generate Engagement Letter</span>
            </DropdownMenuItem>
            <DropdownMenuItem 
              className="hover:bg-gray-50 cursor-pointer"
              onClick={() => setShowAssignDialog(true)}
            >
              <Briefcase className="w-4 h-4 mr-3 text-gray-400" />
              <span>Link to Case</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator className="bg-gray-200" />
            <DropdownMenuItem 
              className="hover:bg-gray-50 cursor-pointer"
              onClick={fetchClientData}
            >
              <Edit className="w-4 h-4 mr-3 text-gray-400" />
              <span>Edit Client</span>
            </DropdownMenuItem>
            <DropdownMenuItem 
              className="hover:bg-red-50 text-red-600 cursor-pointer"
              onClick={() => setShowDeleteDialog(true)}
            >
              <Trash2 className="w-4 h-4 mr-3 text-red-400" />
              <span>Delete Client</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <AssignToCaseDialog
        open={showAssignDialog}
        onOpenChange={setShowAssignDialog}
        clientId={clientId}
        clientName={clientName}
      />

      <UploadDocumentForClientDialog
        open={showUploadDialog}
        onClose={() => {
          setShowUploadDialog(false);
          onAction();
        }}
        clientId={clientId}
        onUploadSuccess={() => {
          setShowUploadDialog(false);
          onAction();
        }}
      />

      <CreateNoteDialog
        open={showNoteDialog}
        onClose={() => {
          setShowNoteDialog(false);
          onAction();
        }}
        clientId={clientId}
      />

      {clientData && (
        <EditClientDialog
          open={showEditDialog}
          onOpenChange={setShowEditDialog}
          client={clientData}
          onSuccess={() => {
            setShowEditDialog(false);
            onAction();
          }}
        />
      )}

      <EngagementLetterDialog
        open={showEngagementLetterDialog}
        onClose={() => {
          setShowEngagementLetterDialog(false);
          onAction();
        }}
        clientId={clientId}
        clientName={clientName}
      />

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Client</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete {clientName}? This action cannot be undone and will permanently remove the client and all associated data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteClient}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete Client
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
