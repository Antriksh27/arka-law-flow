import React from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { NewCaseForm } from './NewCaseForm';
import { MobileDialogHeader } from '@/components/ui/mobile-dialog-header';

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
      <DialogContent hideCloseButton className="sm:max-w-4xl w-full max-h-[100dvh] sm:max-h-[90vh] p-0 bg-slate-50 gap-0 overflow-hidden flex flex-col">
        <MobileDialogHeader
          title="Add New Case"
          subtitle="Enter case information below"
          onClose={onClose}
        />
        
        {/* Scrollable Form Content */}
        <div className="flex-1 overflow-y-auto">
          <NewCaseForm 
            onSuccess={onClose}
            onCancel={onClose}
            preSelectedClientId={preSelectedClientId}
            hideHeader={true}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
};
