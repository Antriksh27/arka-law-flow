
import React, { createContext, useContext, useState, ReactNode } from 'react';

interface DialogContextType {
  dialogContent: ReactNode | null;
  openDialog: (content: ReactNode) => void;
  closeDialog: () => void;
}

const DialogContext = createContext<DialogContextType | undefined>(undefined);

export const DialogProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [dialogContent, setDialogContent] = useState<ReactNode | null>(null);

  const openDialog = (content: ReactNode) => {
    setDialogContent(content);
  };

  const closeDialog = () => {
    setDialogContent(null);
  };

  return (
    <DialogContext.Provider value={{ dialogContent, openDialog, closeDialog }}>
      {children}
      {dialogContent}
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
