import React, { useState } from 'react';
import { Plus, StickyNote, CheckSquare, Upload, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { useIsMobile } from '@/hooks/use-mobile';

interface CaseFABProps {
  onAddNote: () => void;
  onAddTask: () => void;
  onUploadDocument: () => void;
  onCreateHearing: () => void;
}

export const CaseFAB: React.FC<CaseFABProps> = ({
  onAddNote,
  onAddTask,
  onUploadDocument,
  onCreateHearing,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const isMobile = useIsMobile();

  if (!isMobile) return null;

  const actions = [
    { icon: StickyNote, label: 'Add Note', onClick: () => { onAddNote(); setIsOpen(false); }, color: 'bg-yellow-500' },
    { icon: CheckSquare, label: 'Add Task', onClick: () => { onAddTask(); setIsOpen(false); }, color: 'bg-blue-500' },
    { icon: Upload, label: 'Upload Document', onClick: () => { onUploadDocument(); setIsOpen(false); }, color: 'bg-green-500' },
    { icon: Calendar, label: 'Create Hearing', onClick: () => { onCreateHearing(); setIsOpen(false); }, color: 'bg-purple-500' },
  ];

  return (
    <>
      {/* FAB Button */}
      <Button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-20 right-4 z-40 h-14 w-14 rounded-full bg-primary hover:bg-primary/90 shadow-lg p-0 flex items-center justify-center active:scale-95 transition-transform"
        aria-label="Quick actions"
      >
        <Plus className="w-6 h-6 text-primary-foreground" />
      </Button>

      {/* Action Sheet */}
      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetContent side="bottom" className="h-auto rounded-t-2xl">
          <SheetHeader>
            <SheetTitle>Quick Actions</SheetTitle>
          </SheetHeader>
          <div className="grid grid-cols-2 gap-3 mt-4 pb-4">
            {actions.map((action, index) => {
              const IconComponent = action.icon;
              return (
                <button
                  key={index}
                  onClick={action.onClick}
                  className="flex flex-col items-center justify-center p-4 rounded-xl bg-card border border-border hover:bg-accent active:scale-95 transition-all min-h-[100px]"
                >
                  <div className={`w-12 h-12 rounded-full ${action.color} flex items-center justify-center mb-2`}>
                    <IconComponent className="w-6 h-6 text-white" />
                  </div>
                  <span className="text-sm font-medium text-center">{action.label}</span>
                </button>
              );
            })}
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
};