import React from 'react';
import { Plus, Calendar, ListTodo, Upload, StickyNote } from 'lucide-react';
import { useHapticFeedback } from '@/hooks/use-haptic-feedback';

interface QuickActionsBarProps {
  onNewCase: () => void;
  onSchedule: () => void;
  onAddTask: () => void;
  onUpload: () => void;
  onAddNote: () => void;
}

export const QuickActionsBar: React.FC<QuickActionsBarProps> = ({
  onNewCase,
  onSchedule,
  onAddTask,
  onUpload,
  onAddNote,
}) => {
  const { trigger: haptic } = useHapticFeedback();

  const handleAction = (callback: () => void) => {
    haptic('light');
    callback();
  };

  const actions = [
    { 
      icon: Plus, 
      label: 'New Case', 
      onClick: onNewCase,
      iconBg: 'bg-blue-100',
      iconColor: 'text-blue-600',
    },
    { 
      icon: Calendar, 
      label: 'Schedule', 
      onClick: onSchedule,
      iconBg: 'bg-purple-100',
      iconColor: 'text-purple-600',
    },
    { 
      icon: ListTodo, 
      label: 'Task', 
      onClick: onAddTask,
      iconBg: 'bg-green-100',
      iconColor: 'text-green-600',
    },
    { 
      icon: Upload, 
      label: 'Upload', 
      onClick: onUpload,
      iconBg: 'bg-orange-100',
      iconColor: 'text-orange-600',
    },
    { 
      icon: StickyNote, 
      label: 'Note', 
      onClick: onAddNote,
      iconBg: 'bg-yellow-100',
      iconColor: 'text-yellow-600',
    },
  ];

  return (
    <section className="mb-6">
      <h2 className="text-base font-semibold text-foreground mb-3">Quick Actions</h2>
      <div className="grid grid-cols-5 gap-2">
        {actions.map((action, index) => {
          const Icon = action.icon;
          return (
            <button
              key={index}
              onClick={() => handleAction(action.onClick)}
              className="flex flex-col items-center justify-center gap-2 active:scale-95 transition-transform"
            >
              <div className={`w-12 h-12 rounded-2xl ${action.iconBg} flex items-center justify-center shadow-sm`}>
                <Icon className={`w-5 h-5 ${action.iconColor}`} />
              </div>
              <span className="text-xs font-medium text-muted-foreground text-center leading-tight">
                {action.label}
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
};
