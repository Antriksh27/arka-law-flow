import React from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { NewCaseForm } from './NewCaseForm';
import { MobileDialogHeader } from '@/components/ui/mobile-dialog-header';
import { useIsMobile } from '@/hooks/use-mobile';
import { Drawer, DrawerContent } from '@/components/ui/drawer';
import { useDialog, DialogContentContext } from '@/hooks/use-dialog';
import { useContext } from 'react';

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
  const { closeDialog } = useDialog();
  const isInsideDialog = useContext(DialogContentContext);

  const handleClose = isInsideDialog ? closeDialog : onClose;

  const formContent = (
    <NewCaseForm 
      onSuccess={handleClose}
      onCancel={handleClose}
      preSelectedClientId={preSelectedClientId}
      hideHeader={true}
    />
  );

  const formView = (
    <div className="flex flex-col h-full bg-slate-50 overflow-hidden">
      <MobileDialogHeader
        title="Add New Case"
        subtitle="Enter case information below"
        onClose={handleClose}
        showBorder
      />
      <div className="flex-1 overflow-y-auto">
        <div className="p-4">
          {formContent}
        </div>
      </div>
    </div>
  );

  if (isInsideDialog) {
    return formView;
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent hideCloseButton className="sm:max-w-4xl w-full max-h-[100dvh] sm:max-h-[90vh] p-0 bg-slate-50 gap-0 overflow-hidden flex flex-col">
        {formView}
      </DialogContent>
    </Dialog>
  );
};
