import { createContext, useContext, useState, ReactNode } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { useIsMobile } from '@/hooks/use-mobile';

interface DialogContextType {
  openDialog: (content: ReactNode) => void;
  closeDialog: () => void;
}

const DialogContext = createContext<DialogContextType | undefined>(undefined);

export const DialogProvider = ({ children }: { children: ReactNode }) => {
  const [dialogContent, setDialogContent] = useState<ReactNode | null>(null);
  const isMobile = useIsMobile();

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
        <DialogContent 
          className={
            isMobile 
              ? "w-full h-full max-w-none max-h-none m-0 p-0 rounded-none border-0 overflow-hidden"
              : "max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto p-0"
          }
        >
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
