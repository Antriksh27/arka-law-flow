import { Plus, Briefcase, Calendar, CheckSquare, StickyNote, Upload } from 'lucide-react';
import { useState } from 'react';
import { BottomSheet } from '@/components/mobile/BottomSheet';
import { AddCaseDialog } from '@/components/cases/AddCaseDialog';
import { AddClientDialog } from '@/components/clients/AddClientDialog';
import { CreateAppointmentDialog } from '@/components/appointments/CreateAppointmentDialog';
import { CreateTaskDialog } from '@/components/tasks/CreateTaskDialog';
import { CreateNoteMultiModal } from '@/components/notes/CreateNoteMultiModal';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { CARD_STYLES } from '@/lib/mobileStyles';

export const DashboardMobileFAB = () => {
  const [showSheet, setShowSheet] = useState(false);
  const [showCaseDialog, setShowCaseDialog] = useState(false);
  const [showClientDialog, setShowClientDialog] = useState(false);
  const [showTaskDialog, setShowTaskDialog] = useState(false);
  const [showNoteDialog, setShowNoteDialog] = useState(false);
  const [showAppointmentDialog, setShowAppointmentDialog] = useState(false);
  const navigate = useNavigate();

  const actions = [
    {
      icon: Briefcase,
      label: 'Add New Case',
      bg: 'bg-sky-50',
      iconBg: 'bg-sky-100',
      iconColor: 'text-sky-500',
      onClick: () => {
        setShowSheet(false);
        setShowCaseDialog(true);
      },
    },
    {
      icon: Calendar,
      label: 'Schedule Appointment',
      bg: 'bg-emerald-50',
      iconBg: 'bg-emerald-100',
      iconColor: 'text-emerald-500',
      onClick: () => {
        setShowSheet(false);
        setShowAppointmentDialog(true);
      },
    },
    {
      icon: CheckSquare,
      label: 'Create Task',
      bg: 'bg-amber-50',
      iconBg: 'bg-amber-100',
      iconColor: 'text-amber-500',
      onClick: () => {
        setShowSheet(false);
        setShowTaskDialog(true);
      },
    },
    {
      icon: StickyNote,
      label: 'Quick Note',
      bg: 'bg-violet-50',
      iconBg: 'bg-violet-100',
      iconColor: 'text-violet-500',
      onClick: () => {
        setShowSheet(false);
        setShowNoteDialog(true);
      },
    },
    {
      icon: Upload,
      label: 'Upload Document',
      bg: 'bg-rose-50',
      iconBg: 'bg-rose-100',
      iconColor: 'text-rose-500',
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
        className="fixed bottom-6 right-4 z-40 w-14 h-14 rounded-full bg-slate-800 shadow-lg hover:shadow-xl active:scale-95 transition-all duration-200 flex items-center justify-center sm:hidden"
      >
        <Plus className="w-6 h-6 text-white" />
      </button>

      {/* Actions Bottom Sheet */}
      <BottomSheet
        open={showSheet}
        onClose={() => setShowSheet(false)}
        title="Quick Actions"
      >
        <div className="px-4 space-y-2 pb-6">
          {actions.map((action, index) => {
            const Icon = action.icon;
            return (
              <button
                key={index}
                onClick={action.onClick}
                className={cn(
                  "w-full flex items-center gap-4 p-4 rounded-2xl transition-all active:scale-[0.98]",
                  action.bg,
                  "border border-transparent hover:border-slate-200"
                )}
              >
                <div className={cn(
                  "w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0",
                  action.iconBg
                )}>
                  <Icon className={cn("w-6 h-6", action.iconColor)} />
                </div>
                <span className="text-base font-medium text-slate-900">
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
      {showAppointmentDialog && (
        <CreateAppointmentDialog 
          open={showAppointmentDialog} 
          onClose={() => setShowAppointmentDialog(false)} 
        />
      )}
    </>
  );
};
