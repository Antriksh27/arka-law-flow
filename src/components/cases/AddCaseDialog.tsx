import React from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { NewCaseForm } from './NewCaseForm';
import { X } from 'lucide-react';

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
        {/* Mobile-friendly Header with Close Button */}
        <div className="sticky top-0 z-10 bg-white border-b border-slate-100 px-4 py-3 sm:px-6 sm:py-4 flex items-center justify-between shrink-0">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Add New Case</h2>
            <p className="text-xs text-slate-500 mt-0.5">Enter case information below</p>
          </div>
          <button 
            onClick={onClose}
            className="p-2 rounded-full hover:bg-slate-100 active:scale-95 transition-all"
          >
            <X className="h-5 w-5 text-slate-500" />
          </button>
        </div>
        
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
