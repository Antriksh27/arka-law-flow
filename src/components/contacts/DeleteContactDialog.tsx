import React, { useContext } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Trash2, Building, Mail, Phone, AlertTriangle, Loader2 } from 'lucide-react';
import { DialogContentContext, useDialog } from '@/hooks/use-dialog';
import { MobileDialogHeader } from '@/components/ui/mobile-dialog-header';
import { ScrollArea } from '@/components/ui/scroll-area';

interface DeleteContactDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  contact: any;
}

export const DeleteContactDialog = ({ open, onOpenChange, contact }: DeleteContactDialogProps) => {
  const { closeDialog } = useDialog();
  const isInsideDialog = useContext(DialogContentContext);
  const handleClose = isInsideDialog ? closeDialog : () => onOpenChange?.(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const deleteContactMutation = useMutation({
    mutationFn: async () => {
      if (!contact?.id) {
        throw new Error('Contact ID is required');
      }

      const { error } = await supabase
        .from('contacts')
        .delete()
        .eq('id', contact.id);

      if (error) {
        console.error('Error deleting contact:', error);
        throw error;
      }
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: `${contact.name} has been deleted successfully.`,
      });
      queryClient.invalidateQueries({ queryKey: ['contacts'] });
      handleClose();
    },
    onError: (error: any) => {
      console.error('Error deleting contact:', error);
      toast({
        title: "Error",
        description: "Failed to delete contact. Please try again.",
        variant: "destructive",
      });
    },
  });

  if (!contact) return null;

  const fullFormView = (
    <div className="flex flex-col h-full bg-slate-50">
      <MobileDialogHeader
        title="Delete Contact"
        subtitle={contact.name}
        onClose={handleClose}
        icon={<Trash2 className="w-5 h-5 text-red-500" />}
        showBorder
      />

      {/* Content */}
      <ScrollArea className="flex-1">
        <div className="px-4 py-4 space-y-4">
          {/* Contact Preview Card */}
          <div className="bg-white rounded-2xl shadow-sm p-4 border border-border/50">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-xl bg-red-50 flex items-center justify-center border border-red-100">
                <span className="text-red-600 font-bold text-lg">
                  {contact.name?.charAt(0)?.toUpperCase()}
                </span>
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-slate-900">{contact.name}</h3>
                {contact.organization && (
                  <div className="flex items-center gap-1.5 text-[11px] text-slate-500 font-bold uppercase tracking-wider mt-0.5">
                    <Building className="h-3 w-3" />
                    {contact.organization}
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-2">
              {contact.email && (
                <div className="flex items-center gap-2 text-xs text-slate-600 p-2.5 bg-slate-50 rounded-xl border border-slate-100">
                  <Mail className="h-4 w-4 text-slate-400" />
                  {contact.email}
                </div>
              )}
              {contact.phone && (
                <div className="flex items-center gap-2 text-xs text-slate-600 p-2.5 bg-slate-50 rounded-xl border border-slate-100">
                  <Phone className="h-4 w-4 text-slate-400" />
                  {contact.phone}
                </div>
              )}
            </div>
          </div>

          {/* Warning Card */}
          <div className="bg-red-50/50 border border-red-100 rounded-2xl p-4">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-red-100 flex items-center justify-center flex-shrink-0">
                <AlertTriangle className="w-4 h-4 text-red-600" />
              </div>
              <div>
                <p className="font-bold text-red-800 text-sm">Action cannot be undone</p>
                <p className="text-[11px] text-red-700 mt-1 font-medium leading-relaxed">
                  Permanently remove all information for this contact from your legal management system.
                </p>
              </div>
            </div>
          </div>
        </div>
      </ScrollArea>

      {/* Footer */}
      <div className="p-4 bg-white/80 backdrop-blur-lg border-t border-slate-100 flex gap-3">
        <Button
          type="button"
          variant="outline"
          onClick={handleClose}
          className="flex-1 rounded-full h-12 font-semibold text-slate-600 border-slate-200 hover:bg-slate-50"
        >
          Cancel
        </Button>
        <Button
          type="button"
          variant="destructive"
          onClick={() => deleteContactMutation.mutate()}
          disabled={deleteContactMutation.isPending}
          className="flex-1 rounded-full h-12 font-bold shadow-lg"
        >
          {deleteContactMutation.isPending ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Wait
            </>
          ) : (
            'Delete'
          )}
        </Button>
      </div>
    </div>
  );

  if (isInsideDialog) {
    return fullFormView;
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md p-0 gap-0 overflow-hidden max-h-[85vh] rounded-3xl">
        {fullFormView}
      </DialogContent>
    </Dialog>
  );
};
