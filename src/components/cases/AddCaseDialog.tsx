
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
      <DialogContent className="max-w-full sm:max-w-4xl h-screen sm:h-[90vh] sm:max-h-[900px] p-0 bg-slate-50 m-0 sm:m-4 rounded-none sm:rounded-2xl pt-safe pb-safe overflow-hidden">
        <NewCaseForm 
          onSuccess={onClose}
          onCancel={onClose}
          preSelectedClientId={preSelectedClientId}
        />
      </DialogContent>
    </Dialog>
  );
};
