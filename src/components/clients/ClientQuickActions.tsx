import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { MoreHorizontal, Plus, Calendar, FileText, StickyNote, Briefcase, Edit, Trash2, Users, Mail, FileSignature } from 'lucide-react';
import { AssignToCaseDialog } from './AssignToCaseDialog';
import { CreateAppointmentDialog } from '@/components/appointments/CreateAppointmentDialog';
import { MobileCreateAppointmentSheet } from '@/components/appointments/MobileCreateAppointmentSheet';
import { UploadDocumentForClientDialog } from '@/components/documents/UploadDocumentForClientDialog';
import { CreateNoteDialog } from '@/components/notes/CreateNoteDialog';
import { EditClientDialog } from './EditClientDialog';
import { DeleteClientDialog } from './DeleteClientDialog';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { SendEmailDialog } from './SendEmailDialog';
import { GenerateEngagementLetterDialog } from './GenerateEngagementLetterDialog';
import { useIsMobile } from '@/hooks/use-mobile';
interface ClientQuickActionsProps {
  clientId: string;
  clientName: string;
  clientEmail?: string;
  onAction: () => void;
}
export const ClientQuickActions: React.FC<ClientQuickActionsProps> = ({
  clientId,
  clientName,
  clientEmail = '',
  onAction
}) => {
  const [showAssignDialog, setShowAssignDialog] = useState(false);
  const [showAppointmentDialog, setShowAppointmentDialog] = useState(false);
  const [showMobileAppointment, setShowMobileAppointment] = useState(false);
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [showNoteDialog, setShowNoteDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showEmailDialog, setShowEmailDialog] = useState(false);
  const [clientData, setClientData] = useState<any>(null);
  const isMobile = useIsMobile();
  const fetchClientData = async () => {
    try {
      const {
        data,
        error
      } = await supabase.from('clients').select('*').eq('id', clientId).single();
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

  const [showEngagementDialog, setShowEngagementDialog] = useState(false);
  return <>
      <div className="flex items-center gap-3">
        
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="border-gray-200">
              <MoreHorizontal className="w-4 h-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56 bg-white border border-gray-200 rounded-xl shadow-sm">
            <DropdownMenuItem 
              className="hover:bg-gray-50 cursor-pointer" 
              onClick={() => {
                if (isMobile) {
                  setShowMobileAppointment(true);
                } else {
                  setShowAppointmentDialog(true);
                }
              }}
            >
              <Calendar className="w-4 h-4 mr-3 text-gray-400" />
              <span>Schedule Appointment</span>
            </DropdownMenuItem>
            <DropdownMenuItem className="hover:bg-gray-50 cursor-pointer" onClick={() => setShowUploadDialog(true)}>
              <FileText className="w-4 h-4 mr-3 text-gray-400" />
              <span>Upload Document</span>
            </DropdownMenuItem>
            <DropdownMenuItem className="hover:bg-gray-50 cursor-pointer" onClick={() => setShowNoteDialog(true)}>
              <StickyNote className="w-4 h-4 mr-3 text-gray-400" />
              <span>Add Note</span>
            </DropdownMenuItem>
            <DropdownMenuItem className="hover:bg-gray-50 cursor-pointer" onClick={() => setShowAssignDialog(true)}>
              <Briefcase className="w-4 h-4 mr-3 text-gray-400" />
              <span>Link to Case</span>
            </DropdownMenuItem>
            <DropdownMenuItem className="hover:bg-gray-50 cursor-pointer" onClick={() => setShowEmailDialog(true)}>
              <Mail className="w-4 h-4 mr-3 text-gray-400" />
              <span>Send Email</span>
            </DropdownMenuItem>
            <DropdownMenuItem className="hover:bg-gray-50 cursor-pointer" onClick={() => setShowEngagementDialog(true)}>
              <FileSignature className="w-4 h-4 mr-3 text-gray-400" />
              <span>Generate Engagement Letter</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator className="bg-gray-200" />
            <DropdownMenuItem className="hover:bg-gray-50 cursor-pointer" onClick={fetchClientData}>
              <Edit className="w-4 h-4 mr-3 text-gray-400" />
              <span>Edit Client</span>
            </DropdownMenuItem>
            <DropdownMenuItem className="hover:bg-red-50 text-red-600 cursor-pointer" onClick={() => setShowDeleteDialog(true)}>
              <Trash2 className="w-4 h-4 mr-3 text-red-400" />
              <span>Delete Client</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <AssignToCaseDialog open={showAssignDialog} onOpenChange={setShowAssignDialog} clientId={clientId} clientName={clientName} />

      <UploadDocumentForClientDialog open={showUploadDialog} onClose={() => {
      setShowUploadDialog(false);
      onAction();
    }} clientId={clientId} onUploadSuccess={() => {
      setShowUploadDialog(false);
      onAction();
    }} />

      <CreateNoteDialog open={showNoteDialog} onClose={() => {
      setShowNoteDialog(false);
      onAction();
    }} clientId={clientId} />

      {clientData && <EditClientDialog open={showEditDialog} onOpenChange={setShowEditDialog} client={clientData} onSuccess={() => {
      setShowEditDialog(false);
      onAction();
    }} />}

      <SendEmailDialog open={showEmailDialog} onClose={() => setShowEmailDialog(false)} clientEmail={clientEmail} clientName={clientName} />

      <DeleteClientDialog
        clientId={clientId}
        clientName={clientName}
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        onSuccess={onAction}
      />

      {showEngagementDialog && (
        <GenerateEngagementLetterDialog
          open={showEngagementDialog}
          onClose={() => setShowEngagementDialog(false)}
          clientId={clientId}
          clientName={clientName}
          clientEmail={clientEmail}
        />
      )}

      <MobileCreateAppointmentSheet
        open={showMobileAppointment}
        onClose={() => setShowMobileAppointment(false)}
        preSelectedClientId={clientId}
        onSuccess={onAction}
      />
      
      {showAppointmentDialog && (
        <CreateAppointmentDialog 
          open={showAppointmentDialog} 
          onClose={() => setShowAppointmentDialog(false)}
          preSelectedClientId={clientId}
        />
      )}
    </>;
};