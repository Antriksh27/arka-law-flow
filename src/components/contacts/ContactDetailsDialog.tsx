import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { User, Building, Mail, Phone, MapPin, FileText, Calendar, UserCheck, UserPlus, Edit, Trash2 } from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';
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
  return <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-full sm:max-w-[700px] max-h-[90vh] overflow-y-auto p-4 sm:p-6">
        <DialogHeader>
          <DialogTitle className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 sm:h-14 sm:w-14 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg flex-shrink-0">
                <span className="text-white font-semibold text-lg sm:text-xl">
                  {contact.name?.charAt(0)?.toUpperCase()}
                </span>
              </div>
              <div>
                <h2 className="text-lg sm:text-2xl font-semibold text-gray-900">{contact.name}</h2>
                {contact.organization && <div className="flex items-center gap-2 text-muted-foreground mt-1">
                    <Building className="h-3 w-3 sm:h-4 sm:w-4" />
                    <span className="text-sm sm:text-base">{contact.organization}</span>
                  </div>}
              </div>
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 sm:space-y-6 pt-4">
          {/* Basic Information */}
          <div className="space-y-3 sm:space-y-4">
            <h3 className="flex items-center gap-2 text-base sm:text-lg font-medium">
              <User className="w-4 h-4 sm:w-5 sm:h-5" />
              Contact Information
            </h3>
            
            <div className="grid grid-cols-1 gap-3 sm:gap-4">
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <Mail className="w-4 h-4 text-muted-foreground" />
                <div className="flex-1">
                  <p className="text-sm font-medium">Email</p>
                  <p className="text-sm text-muted-foreground">
                    {contact.email || <span className="text-gray-400">Not provided</span>}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <Phone className="w-4 h-4 text-muted-foreground" />
                <div className="flex-1">
                  <p className="text-sm font-medium">Phone</p>
                  <p className="text-sm text-muted-foreground">
                    {contact.phone || <span className="text-gray-400">Not provided</span>}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Organization Information */}
          <Separator />
          

          {/* Location Information */}
          <Separator />
          <div className="space-y-3 sm:space-y-4">
            <h3 className="flex items-center gap-2 text-base sm:text-lg font-medium">
              <MapPin className="w-4 h-4 sm:w-5 sm:h-5" />
              Address & Location
            </h3>
            
            <div className="grid grid-cols-1 gap-3 sm:gap-4">
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="text-sm font-medium mb-1">Address Line 1</p>
                <p className="text-sm text-muted-foreground">
                  {contact.address_line_1 || <span className="text-gray-400">Not provided</span>}
                </p>
              </div>
              
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="text-sm font-medium mb-1">Address Line 2</p>
                <p className="text-sm text-muted-foreground">
                  {contact.address_line_2 || <span className="text-gray-400">Not provided</span>}
                </p>
              </div>
              
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="text-sm font-medium mb-1">State</p>
                <p className="text-sm text-muted-foreground">
                  {contact.states?.name || <span className="text-gray-400">Not provided</span>}
                </p>
              </div>
              
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="text-sm font-medium mb-1">District</p>
                <p className="text-sm text-muted-foreground">
                  {contact.districts?.name || <span className="text-gray-400">Not provided</span>}
                </p>
              </div>
              
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="text-sm font-medium mb-1">PIN Code</p>
                <p className="text-sm text-muted-foreground">
                  {contact.pin_code || <span className="text-gray-400">Not provided</span>}
                </p>
              </div>
            </div>
          </div>

          {/* Visit Information */}
          <Separator />
          

          {/* Referral Information */}
          <Separator />
          <div className="space-y-3 sm:space-y-4">
            <h3 className="flex items-center gap-2 text-base sm:text-lg font-medium">
              <UserCheck className="w-4 h-4 sm:w-5 sm:h-5" />
              Referral Information
            </h3>
            
            <div className="grid grid-cols-1 gap-3 sm:gap-4">
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="text-sm font-medium mb-1">Referred By (Name)</p>
                <p className="text-sm text-muted-foreground">
                  {contact.referred_by_name || <span className="text-gray-400">Not provided</span>}
                </p>
              </div>
              
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="text-sm font-medium mb-1">Referrer Phone</p>
                <p className="text-sm text-muted-foreground">
                  {contact.referred_by_phone || <span className="text-gray-400">Not provided</span>}
                </p>
              </div>
            </div>
          </div>

          {/* Notes */}
          <Separator />
          <div className="space-y-3 sm:space-y-4">
            <h3 className="flex items-center gap-2 text-base sm:text-lg font-medium">
              <FileText className="w-4 h-4 sm:w-5 sm:h-5" />
              Notes
            </h3>
            
            <div className="p-3 sm:p-4 bg-gray-50 rounded-lg">
              <p className="text-sm whitespace-pre-wrap">
                {contact.notes || <span className="text-gray-400">No notes added</span>}
              </p>
            </div>
          </div>

          {/* Timestamps */}
          <Separator />
          <div className="grid grid-cols-2 gap-4 text-xs text-gray-500">
            <div>
              <p className="font-medium">Created</p>
              <p>{format(new Date(contact.created_at), 'dd/MM/yyyy HH:mm')}</p>
            </div>
            {contact.updated_at && <div>
                <p className="font-medium">Updated</p>
                <p>{format(new Date(contact.updated_at), 'dd/MM/yyyy HH:mm')}</p>
              </div>}
          </div>
        </div>

        <DialogFooter className="flex-col-reverse sm:flex-row gap-2 pt-4 sticky bottom-0 bg-white pb-2">
          <div className="flex gap-2 w-full sm:w-auto order-2 sm:order-1">
            {onEditContact && <Button variant="outline" onClick={handleEdit} className="flex-1 sm:flex-initial h-11 sm:h-10">
                <Edit className="mr-2 h-4 w-4" />
                <span className="text-sm sm:text-base">Edit</span>
              </Button>}
            {onDeleteContact && <Button variant="outline" onClick={handleDelete} className="flex-1 sm:flex-initial text-red-600 hover:text-red-700 hover:bg-red-50 h-11 sm:h-10">
                <Trash2 className="mr-2 h-4 w-4" />
                <span className="text-sm sm:text-base">Delete</span>
              </Button>}
          </div>
          {onConvertToClient && <Button onClick={handleConvertToClient} className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 h-11 sm:h-10 order-1 sm:order-2">
              <UserPlus className="mr-2 h-4 w-4" />
              <span className="text-sm sm:text-base">Convert to Client</span>
            </Button>}
        </DialogFooter>
      </DialogContent>
    </Dialog>;
};