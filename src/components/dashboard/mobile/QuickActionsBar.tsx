import React from 'react';
import { Plus, Calendar, CheckSquare, Upload } from 'lucide-react';

interface QuickActionsBarProps {
  onNewCase: () => void;
  onSchedule: () => void;
  onAddTask: () => void;
  onUpload: () => void;
}

export const QuickActionsBar: React.FC<QuickActionsBarProps> = ({
  onNewCase,
  onSchedule,
  onAddTask,
  onUpload,
}) => {
  const actions = [
    { icon: Plus, label: 'New Case', onClick: onNewCase },
    { icon: Calendar, label: 'Schedule', onClick: onSchedule },
    { icon: CheckSquare, label: 'Add Task', onClick: onAddTask },
    { icon: Upload, label: 'Upload', onClick: onUpload },
  ];

  return (
    <section className="mb-6">
      <h2 className="text-base font-semibold text-foreground mb-3">Quick Actions</h2>
      <div className="grid grid-cols-4 gap-2">
        {actions.map((action, index) => {
          const Icon = action.icon;
          return (
            <button
              key={index}
              onClick={action.onClick}
              className="flex flex-col items-center justify-center gap-2 bg-card rounded-xl border border-border p-4 transition-all active:scale-95 hover:shadow-md"
            >
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Icon className="w-5 h-5 text-primary" />
              </div>
              <span className="text-xs font-medium text-foreground text-center leading-tight">
                {action.label}
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
};
