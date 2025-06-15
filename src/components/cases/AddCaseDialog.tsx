
import React from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { NewCaseForm } from './NewCaseForm';

interface AddCaseDialogProps {
  open: boolean;
  onClose: () => void;
  preSelectedClientId?: string;
}

export const AddCaseDialog: React.FC<AddCaseDialogProps> = ({ 
  open, 
  onClose, 
  preSelectedClientId 
}) => {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-full h-screen p-0 bg-background m-0 border-none rounded-none">
        <NewCaseForm 
          onSuccess={onClose}
          onCancel={onClose}
          preSelectedClientId={preSelectedClientId}
        />
      </DialogContent>
    </Dialog>
  );
};
