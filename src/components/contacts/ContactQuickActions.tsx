import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { MoreVertical, Edit, UserPlus, Trash2, Mail, Phone } from 'lucide-react';
import { EditContactDialog } from './EditContactDialog';
import { ConvertToClientDialog } from './ConvertToClientDialog';
import { DeleteContactDialog } from './DeleteContactDialog';
import { useNavigate } from 'react-router-dom';

interface ContactQuickActionsProps {
  contactId: string;
  contactName: string;
  contactEmail?: string;
  onAction: () => void;
}

export const ContactQuickActions: React.FC<ContactQuickActionsProps> = ({
  contactId,
  contactName,
  contactEmail,
  onAction
}) => {
  const navigate = useNavigate();
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showConvertDialog, setShowConvertDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [contact, setContact] = useState<any>(null);

  // Simple contact object for dialogs
  const getContact = () => ({
    id: contactId,
    name: contactName,
    email: contactEmail
  });

  const handleEdit = () => {
    setContact(getContact());
    setShowEditDialog(true);
  };

  const handleConvert = () => {
    setContact(getContact());
    setShowConvertDialog(true);
  };

  const handleDelete = () => {
    setContact(getContact());
    setShowDeleteDialog(true);
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="h-9 w-9">
            <MoreVertical className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48 bg-white">
          <DropdownMenuItem onClick={handleEdit} className="cursor-pointer">
            <Edit className="w-4 h-4 mr-2" />
            Edit Contact
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handleConvert} className="cursor-pointer text-green-600">
            <UserPlus className="w-4 h-4 mr-2" />
            Convert to Client
          </DropdownMenuItem>
          {contactEmail && (
            <DropdownMenuItem 
              onClick={() => window.open(`mailto:${contactEmail}`, '_blank')}
              className="cursor-pointer"
            >
              <Mail className="w-4 h-4 mr-2" />
              Send Email
            </DropdownMenuItem>
          )}
          <DropdownMenuItem onClick={handleDelete} className="cursor-pointer text-red-600">
            <Trash2 className="w-4 h-4 mr-2" />
            Delete Contact
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {contact && (
        <>
          <EditContactDialog
            open={showEditDialog}
            onOpenChange={(open) => {
              setShowEditDialog(open);
              if (!open) onAction();
            }}
            contact={contact}
          />
          <ConvertToClientDialog
            open={showConvertDialog}
            onOpenChange={(open) => {
              setShowConvertDialog(open);
              if (!open) {
                onAction();
                // Navigate to contacts list after conversion
                navigate('/contacts');
              }
            }}
            contact={contact}
          />
          <DeleteContactDialog
            open={showDeleteDialog}
            onOpenChange={(open) => {
              setShowDeleteDialog(open);
              if (!open) {
                // Navigate to contacts list after deletion
                navigate('/contacts');
              }
            }}
            contact={contact}
          />
        </>
      )}
    </>
  );
};
