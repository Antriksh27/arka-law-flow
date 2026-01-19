import React from 'react';
import { Plus, Calendar, ListTodo, Upload } from 'lucide-react';

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
  ];

  return (
    <section className="mb-6">
      <h2 className="text-base font-semibold text-foreground mb-3">Quick Actions</h2>
      <div className="grid grid-cols-4 gap-3">
        {actions.map((action, index) => {
          const Icon = action.icon;
          return (
            <button
              key={index}
              onClick={action.onClick}
              className="flex flex-col items-center justify-center gap-2 active:scale-95 transition-transform"
            >
              <div className={`w-14 h-14 rounded-2xl ${action.iconBg} flex items-center justify-center shadow-sm`}>
                <Icon className={`w-6 h-6 ${action.iconColor}`} />
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
