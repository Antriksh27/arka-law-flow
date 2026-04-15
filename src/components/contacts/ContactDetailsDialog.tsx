import React from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { User, Building, Mail, Phone, MapPin, FileText, Calendar, UserCheck, UserPlus, Edit, Trash2, X } from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';
import { useIsMobile } from '@/hooks/use-mobile';
import { useContext } from 'react';
import { DialogContentContext, useDialog } from '@/hooks/use-dialog';
import { MobileDialogHeader } from '@/components/ui/mobile-dialog-header';
import { ScrollArea } from '@/components/ui/scroll-area';

interface ContactDetailsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  contact: any;
  onConvertToClient?: (contact: any) => void;
  onEditContact?: (contact: any) => void;
  onDeleteContact?: (contact: any) => void;
}

export const ContactDetailsDialog: React.FC<ContactDetailsDialogProps> = ({
  open,
  onOpenChange,
  contact,
  onConvertToClient,
  onEditContact,
  onDeleteContact
}) => {
  const { closeDialog } = useDialog();
  const isInsideDialog = useContext(DialogContentContext);
  const handleClose = isInsideDialog ? closeDialog : () => onOpenChange?.(false);
  const isMobile = useIsMobile();

  if (!contact) return null;

  const handleConvertToClient = () => {
    handleClose();
    onConvertToClient?.(contact);
  };

  const handleEdit = () => {
    handleClose();
    onEditContact?.(contact);
  };

  const handleDelete = () => {
    handleClose();
    onDeleteContact?.(contact);
  };

  const fullFormView = (
    <div className="flex flex-col h-full bg-slate-50">
      <MobileDialogHeader
        title="Contact Details"
        subtitle={contact.organization || "Individual"}
        onClose={handleClose}
        icon={
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-violet-600 flex items-center justify-center shadow-lg">
            <span className="text-white font-semibold text-base">
              {contact.name?.charAt(0)?.toUpperCase()}
            </span>
          </div>
        }
        showBorder
      />

      <ScrollArea className="flex-1">
        <div className="px-4 py-4 space-y-4">
          {/* Main Info Card */}
          <div className="bg-white rounded-2xl shadow-sm p-4 border border-border/50">
            <h2 className="text-xl font-bold text-slate-900 mb-1">{contact.name}</h2>
            {contact.organization && (
              <div className="flex items-center gap-1.5 text-slate-500 text-sm font-medium">
                <Building className="w-4 h-4" />
                <span>{contact.organization}</span>
              </div>
            )}
          </div>

          {/* Contact Information Card */}
          <div className="bg-white rounded-2xl shadow-sm p-4 space-y-3 border border-border/50">
            <div className="flex items-center gap-3 mb-1">
              <div className="w-8 h-8 rounded-lg bg-sky-50 flex items-center justify-center">
                <Phone className="w-4 h-4 text-sky-500" />
              </div>
              <span className="font-bold text-slate-700 text-sm">Contact Information</span>
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100">
                <Mail className="w-4 h-4 text-slate-400" />
                <div className="flex-1">
                  <p className="text-[10px] uppercase font-bold text-slate-400 mb-0.5 tracking-wider">Email</p>
                  <p className="text-sm font-semibold text-slate-700">
                    {contact.email || <span className="text-slate-300">Not provided</span>}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100">
                <Phone className="w-4 h-4 text-slate-400" />
                <div className="flex-1">
                  <p className="text-[10px] uppercase font-bold text-slate-400 mb-0.5 tracking-wider">Phone</p>
                  <p className="text-sm font-semibold text-slate-700">
                    {contact.phone || <span className="text-slate-300">Not provided</span>}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Address Card */}
          <div className="bg-white rounded-2xl shadow-sm p-4 space-y-3 border border-border/50">
            <div className="flex items-center gap-3 mb-1">
              <div className="w-8 h-8 rounded-lg bg-rose-50 flex items-center justify-center">
                <MapPin className="w-4 h-4 text-rose-500" />
              </div>
              <span className="font-bold text-slate-700 text-sm">Address & Location</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                <p className="text-[10px] uppercase font-bold text-slate-400 mb-0.5 tracking-wider">Address Line 1</p>
                <p className="text-sm font-semibold text-slate-700">
                  {contact.address_line_1 || <span className="text-slate-300">Not provided</span>}
                </p>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                <p className="text-[10px] uppercase font-bold text-slate-400 mb-0.5 tracking-wider">Address Line 2</p>
                <p className="text-sm font-semibold text-slate-700">
                  {contact.address_line_2 || <span className="text-slate-300">Not provided</span>}
                </p>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                <p className="text-[10px] uppercase font-bold text-slate-400 mb-0.5 tracking-wider">State & District</p>
                <p className="text-sm font-semibold text-slate-700">
                  {contact.states?.name ? `${contact.states.name}${contact.districts?.name ? `, ${contact.districts.name}` : ''}` : <span className="text-slate-300">Not provided</span>}
                </p>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                <p className="text-[10px] uppercase font-bold text-slate-400 mb-0.5 tracking-wider">PIN Code</p>
                <p className="text-sm font-semibold text-slate-700">
                  {contact.pin_code || <span className="text-slate-300">Not provided</span>}
                </p>
              </div>
            </div>
          </div>

          {/* Referral Information Card */}
          <div className="bg-white rounded-2xl shadow-sm p-4 space-y-3 border border-border/50">
            <div className="flex items-center gap-3 mb-1">
              <div className="w-8 h-8 rounded-lg bg-violet-50 flex items-center justify-center">
                <UserCheck className="w-4 h-4 text-violet-500" />
              </div>
              <span className="font-bold text-slate-700 text-sm">Referral Information</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                <p className="text-[10px] uppercase font-bold text-slate-400 mb-0.5 tracking-wider">Referred By</p>
                <p className="text-sm font-semibold text-slate-700">
                  {contact.referred_by_name || <span className="text-slate-300">Not provided</span>}
                </p>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                <p className="text-[10px] uppercase font-bold text-slate-400 mb-0.5 tracking-wider">Referrer Phone</p>
                <p className="text-sm font-semibold text-slate-700">
                  {contact.referred_by_phone || <span className="text-slate-300">Not provided</span>}
                </p>
              </div>
            </div>
          </div>

          {/* Notes Card */}
          <div className="bg-white rounded-2xl shadow-sm p-4 space-y-3 border border-border/50">
            <div className="flex items-center gap-3 mb-1">
              <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center">
                <FileText className="w-4 h-4 text-amber-500" />
              </div>
              <span className="font-bold text-slate-700 text-sm">Notes</span>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
              <p className="text-sm text-slate-700 whitespace-pre-wrap font-medium leading-relaxed">
                {contact.notes || <span className="text-slate-400 font-normal italic">No notes added</span>}
              </p>
            </div>
          </div>

          {/* Activity Timeline Card */}
          <div className="bg-white rounded-2xl shadow-sm p-4 border border-border/50 pb-8">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center">
                <Calendar className="w-4 h-4 text-slate-500" />
              </div>
              <span className="font-bold text-slate-700 text-sm">Activity Timeline</span>
            </div>

            <div className="space-y-4 relative before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-[2px] before:bg-slate-100">
              <div className="flex gap-4 relative">
                <div className="w-[24px] h-[24px] rounded-full bg-slate-100 border-4 border-white z-10" />
                <div className="flex-1 pt-0.5">
                  <p className="text-xs font-bold text-slate-900">Contact Created</p>
                  <p className="text-[10px] text-slate-500 font-medium">
                    {format(new Date(contact.created_at), 'PPP p')}
                  </p>
                </div>
              </div>
              {contact.updated_at && (
                <div className="flex gap-4 relative">
                  <div className="w-[24px] h-[24px] rounded-full bg-violet-100 border-4 border-white z-10" />
                  <div className="flex-1 pt-0.5">
                    <p className="text-xs font-bold text-slate-900">Last Updated</p>
                    <p className="text-[10px] text-slate-500 font-medium">
                      {format(new Date(contact.updated_at), 'PPP p')}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </ScrollArea>

      {/* Footer Actions */}
      <div className="p-4 bg-white/80 backdrop-blur-lg border-t border-slate-100 flex flex-col gap-3">
        <div className="flex gap-3">
          {onEditContact && (
            <Button 
              variant="outline" 
              onClick={handleEdit} 
              className="flex-1 rounded-full h-12 font-semibold text-slate-600 border-slate-200 hover:bg-slate-50"
            >
              <Edit className="mr-2 h-4 w-4" />
              Edit
            </Button>
          )}
          {onDeleteContact && (
            <Button
              variant="outline"
              onClick={handleDelete}
              className="flex-1 rounded-full h-12 font-semibold text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </Button>
          )}
        </div>
        {onConvertToClient && (
          <Button 
            onClick={handleConvertToClient} 
            className="w-full rounded-full h-12 font-bold bg-violet-600 hover:bg-violet-700 text-white shadow-lg shadow-violet-500/20"
          >
            <UserPlus className="mr-2 h-4 w-4" />
            Convert to Client
          </Button>
        )}
      </div>
    </div>
  );

  if (isInsideDialog) {
    return fullFormView;
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent hideCloseButton className="sm:max-w-2xl p-0 gap-0 overflow-hidden max-h-[90vh] rounded-3xl">
        {fullFormView}
      </DialogContent>
    </Dialog>
  );
};
