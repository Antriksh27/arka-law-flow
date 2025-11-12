import { Plus, Briefcase, Calendar, CheckSquare, StickyNote, Upload } from 'lucide-react';
import { useState } from 'react';
import { BottomSheet } from '@/components/mobile/BottomSheet';
import { AddCaseDialog } from '@/components/cases/AddCaseDialog';
import { AddClientDialog } from '@/components/clients/AddClientDialog';
import { CreateAppointmentDialog } from '@/components/appointments/CreateAppointmentDialog';
import { CreateTaskDialog } from '@/components/tasks/CreateTaskDialog';
import { CreateNoteMultiModal } from '@/components/notes/CreateNoteMultiModal';
import { useNavigate } from 'react-router-dom';
import { useDialog } from '@/hooks/use-dialog';

export const DashboardMobileFAB = () => {
  const [showSheet, setShowSheet] = useState(false);
  const [showCaseDialog, setShowCaseDialog] = useState(false);
  const [showClientDialog, setShowClientDialog] = useState(false);
  const [showTaskDialog, setShowTaskDialog] = useState(false);
  const [showNoteDialog, setShowNoteDialog] = useState(false);
  const navigate = useNavigate();
  const { openDialog } = useDialog();

  const actions = [
    {
      icon: Briefcase,
      label: 'Add New Case',
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      onClick: () => {
        setShowSheet(false);
        setShowCaseDialog(true);
      },
    },
    {
      icon: Calendar,
      label: 'Schedule Appointment',
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      onClick: () => {
        setShowSheet(false);
        openDialog(<CreateAppointmentDialog />);
      },
    },
    {
      icon: CheckSquare,
      label: 'Create Task',
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
      onClick: () => {
        setShowSheet(false);
        setShowTaskDialog(true);
      },
    },
    {
      icon: StickyNote,
      label: 'Quick Note',
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-50',
      onClick: () => {
        setShowSheet(false);
        setShowNoteDialog(true);
      },
    },
    {
      icon: Upload,
      label: 'Upload Document',
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
      onClick: () => {
        setShowSheet(false);
        navigate('/documents');
      },
    },
  ];

  return (
    <>
      {/* FAB Button */}
      <button
        onClick={() => setShowSheet(true)}
        className="fixed bottom-20 right-4 z-40 w-14 h-14 rounded-full bg-primary shadow-lg hover:shadow-xl active:scale-95 transition-all flex items-center justify-center sm:hidden"
      >
        <Plus className="w-6 h-6 text-white" />
      </button>

      {/* Actions Bottom Sheet */}
      <BottomSheet
        open={showSheet}
        onClose={() => setShowSheet(false)}
        title="Quick Actions"
      >
        <div className="space-y-2 p-4">
          {actions.map((action, index) => {
            const Icon = action.icon;
            return (
              <button
                key={index}
                onClick={action.onClick}
                className="w-full flex items-center gap-4 p-4 rounded-xl border border-border hover:bg-accent/50 active:scale-98 transition-all"
              >
                <div className={`w-12 h-12 rounded-xl ${action.bgColor} flex items-center justify-center flex-shrink-0`}>
                  <Icon className={`w-6 h-6 ${action.color}`} />
                </div>
                <span className="text-base font-medium text-foreground">
                  {action.label}
                </span>
              </button>
            );
          })}
        </div>
      </BottomSheet>

      {/* Dialogs */}
      {showCaseDialog && (
        <AddCaseDialog open={showCaseDialog} onClose={() => setShowCaseDialog(false)} />
      )}
      {showClientDialog && (
        <AddClientDialog
          open={showClientDialog}
          onOpenChange={setShowClientDialog}
          onSuccess={() => setShowClientDialog(false)}
        />
      )}
      {showTaskDialog && (
        <CreateTaskDialog open={showTaskDialog} onClose={() => setShowTaskDialog(false)} />
      )}
      {showNoteDialog && (
        <CreateNoteMultiModal
          open={showNoteDialog}
          onClose={() => setShowNoteDialog(false)}
          isPinned={true}
        />
      )}
    </>
  );
};
