import React from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { User, Building, Mail, Phone, MapPin, FileText, Calendar, UserCheck, UserPlus, Edit, Trash2, X } from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';
import { useIsMobile } from '@/hooks/use-mobile';

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
  const isMobile = useIsMobile();

  if (!contact) return null;

  const handleConvertToClient = () => {
    onOpenChange(false);
    onConvertToClient?.(contact);
  };

  const handleEdit = () => {
    onOpenChange(false);
    onEditContact?.(contact);
  };

  const handleDelete = () => {
    onOpenChange(false);
    onDeleteContact?.(contact);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent hideCloseButton className="sm:max-w-2xl p-0 gap-0 overflow-hidden">
        <div className="flex flex-col h-full bg-slate-50">
          {/* Header */}
          <div className="flex items-center justify-between p-4 bg-white border-b border-slate-200">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-violet-500 to-violet-600 flex items-center justify-center shadow-lg">
                <span className="text-white font-semibold text-lg">
                  {contact.name?.charAt(0)?.toUpperCase()}
                </span>
              </div>
              <div>
                <h2 className="text-lg font-semibold text-slate-900">{contact.name}</h2>
                {contact.organization && (
                  <div className="flex items-center gap-1.5 text-slate-500 text-sm">
                    <Building className="w-3.5 h-3.5" />
                    <span>{contact.organization}</span>
                  </div>
                )}
              </div>
            </div>
            {isMobile && (
              <Button variant="ghost" size="icon" onClick={() => onOpenChange(false)} className="rounded-full">
                <X className="w-5 h-5" />
              </Button>
            )}
          </div>

          {/* Scrollable Content */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {/* Contact Information Card */}
            <div className="bg-white rounded-2xl shadow-sm p-4 space-y-3">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-8 h-8 rounded-lg bg-sky-50 flex items-center justify-center">
                  <Phone className="w-4 h-4 text-sky-500" />
                </div>
                <span className="font-medium text-slate-700">Contact Information</span>
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
                  <Mail className="w-4 h-4 text-slate-400" />
                  <div className="flex-1">
                    <p className="text-xs text-slate-500 mb-0.5">Email</p>
                    <p className="text-sm font-medium text-slate-700">
                      {contact.email || <span className="text-slate-400">Not provided</span>}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
                  <Phone className="w-4 h-4 text-slate-400" />
                  <div className="flex-1">
                    <p className="text-xs text-slate-500 mb-0.5">Phone</p>
                    <p className="text-sm font-medium text-slate-700">
                      {contact.phone || <span className="text-slate-400">Not provided</span>}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Address Card */}
            <div className="bg-white rounded-2xl shadow-sm p-4 space-y-3">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-8 h-8 rounded-lg bg-rose-50 flex items-center justify-center">
                  <MapPin className="w-4 h-4 text-rose-500" />
                </div>
                <span className="font-medium text-slate-700">Address & Location</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-3 bg-slate-50 rounded-xl">
                  <p className="text-xs text-slate-500 mb-0.5">Address Line 1</p>
                  <p className="text-sm font-medium text-slate-700">
                    {contact.address_line_1 || <span className="text-slate-400">Not provided</span>}
                  </p>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl">
                  <p className="text-xs text-slate-500 mb-0.5">Address Line 2</p>
                  <p className="text-sm font-medium text-slate-700">
                    {contact.address_line_2 || <span className="text-slate-400">Not provided</span>}
                  </p>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl">
                  <p className="text-xs text-slate-500 mb-0.5">State</p>
                  <p className="text-sm font-medium text-slate-700">
                    {contact.states?.name || <span className="text-slate-400">Not provided</span>}
                  </p>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl">
                  <p className="text-xs text-slate-500 mb-0.5">District</p>
                  <p className="text-sm font-medium text-slate-700">
                    {contact.districts?.name || <span className="text-slate-400">Not provided</span>}
                  </p>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl">
                  <p className="text-xs text-slate-500 mb-0.5">PIN Code</p>
                  <p className="text-sm font-medium text-slate-700">
                    {contact.pin_code || <span className="text-slate-400">Not provided</span>}
                  </p>
                </div>
              </div>
            </div>

            {/* Referral Information Card */}
            <div className="bg-white rounded-2xl shadow-sm p-4 space-y-3">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-8 h-8 rounded-lg bg-violet-50 flex items-center justify-center">
                  <UserCheck className="w-4 h-4 text-violet-500" />
                </div>
                <span className="font-medium text-slate-700">Referral Information</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-3 bg-slate-50 rounded-xl">
                  <p className="text-xs text-slate-500 mb-0.5">Referred By (Name)</p>
                  <p className="text-sm font-medium text-slate-700">
                    {contact.referred_by_name || <span className="text-slate-400">Not provided</span>}
                  </p>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl">
                  <p className="text-xs text-slate-500 mb-0.5">Referrer Phone</p>
                  <p className="text-sm font-medium text-slate-700">
                    {contact.referred_by_phone || <span className="text-slate-400">Not provided</span>}
                  </p>
                </div>
              </div>
            </div>

            {/* Notes Card */}
            <div className="bg-white rounded-2xl shadow-sm p-4 space-y-3">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center">
                  <FileText className="w-4 h-4 text-amber-500" />
                </div>
                <span className="font-medium text-slate-700">Notes</span>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl">
                <p className="text-sm text-slate-700 whitespace-pre-wrap">
                  {contact.notes || <span className="text-slate-400">No notes added</span>}
                </p>
              </div>
            </div>

            {/* Timestamps Card */}
            <div className="bg-white rounded-2xl shadow-sm p-4">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center">
                  <Calendar className="w-4 h-4 text-slate-500" />
                </div>
                <span className="font-medium text-slate-700">Activity</span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-slate-50 rounded-xl">
                  <p className="text-xs text-slate-500 mb-0.5">Created</p>
                  <p className="text-sm font-medium text-slate-700">
                    {format(new Date(contact.created_at), 'dd/MM/yyyy HH:mm')}
                  </p>
                </div>
                {contact.updated_at && (
                  <div className="p-3 bg-slate-50 rounded-xl">
                    <p className="text-xs text-slate-500 mb-0.5">Updated</p>
                    <p className="text-sm font-medium text-slate-700">
                      {format(new Date(contact.updated_at), 'dd/MM/yyyy HH:mm')}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="p-4 bg-white border-t border-slate-200">
            <div className="flex flex-col sm:flex-row gap-2">
              <div className="flex gap-2 flex-1">
                {onEditContact && (
                  <Button variant="outline" onClick={handleEdit} className="flex-1 sm:flex-initial rounded-full h-11">
                    <Edit className="mr-2 h-4 w-4" />
                    Edit
                  </Button>
                )}
                {onDeleteContact && (
                  <Button
                    variant="outline"
                    onClick={handleDelete}
                    className="flex-1 sm:flex-initial rounded-full h-11 text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete
                  </Button>
                )}
              </div>
              {onConvertToClient && (
                <Button onClick={handleConvertToClient} className="rounded-full h-11 bg-violet-600 hover:bg-violet-700">
                  <UserPlus className="mr-2 h-4 w-4" />
                  Convert to Client
                </Button>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
