import { createContext, useContext, useState, ReactNode } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';

interface DialogContextType {
  openDialog: (content: ReactNode) => void;
  closeDialog: () => void;
}

const DialogContext = createContext<DialogContextType | undefined>(undefined);

export const DialogProvider = ({ children }: { children: ReactNode }) => {
  const [dialogContent, setDialogContent] = useState<ReactNode | null>(null);

  const openDialog = (content: ReactNode) => {
    setDialogContent(content);
  };

  const closeDialog = () => {
    setDialogContent(null);
  };

  return (
    <DialogContext.Provider value={{ openDialog, closeDialog }}>
      {children}
      <Dialog open={!!dialogContent} onOpenChange={(open) => { if (!open) closeDialog(); }}>
        <DialogContent hideCloseButton className="p-0 gap-0 overflow-hidden">
          {dialogContent}
        </DialogContent>
      </Dialog>
    </DialogContext.Provider>
  );
};

export const useDialog = () => {
  const context = useContext(DialogContext);
  if (context === undefined) {
    throw new Error('useDialog must be used within a DialogProvider');
  }
  return context;
};
