import React from 'react';
import { Calendar, User, Tag, Eye, Edit, Trash2, Play, CheckCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import TimeUtils from '@/lib/timeUtils';

interface MobileTaskCardProps {
  task: any;
  onView: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onStatusChange: (status: 'todo' | 'in_progress' | 'completed') => void;
  memberMap: Record<string, string>;
}

export const MobileTaskCard: React.FC<MobileTaskCardProps> = ({
  task,
  onView,
  onEdit,
  onDelete,
  onStatusChange,
  memberMap,
}) => {
  const isOverdue = (dueDate: string | null, status: string) => {
    if (!dueDate || status === 'completed') return false;
    return new Date(dueDate) < new Date();
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-700 border-red-200';
      case 'medium':
        return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 'low':
        return 'bg-green-100 text-green-700 border-green-200';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const overdueStatus = isOverdue(task.due_date, task.status);

  return (
    <div
      className={cn(
        "w-full bg-white rounded-xl p-4 border transition-all",
        overdueStatus ? 'border-red-300 bg-red-50' : 'border-border'
      )}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex-1 min-w-0">
          <h3
            onClick={onView}
            className="font-medium text-base text-foreground leading-tight line-clamp-2 cursor-pointer active:text-primary"
          >
            {task.title}
          </h3>
        </div>
        
        <div className="flex flex-col gap-1 flex-shrink-0">
          <Badge className={cn("text-xs rounded-full border", getPriorityColor(task.priority))}>
            {task.priority}
          </Badge>
          {overdueStatus && (
            <Badge className="bg-red-100 text-red-700 border-red-200 text-xs rounded-full border">
              Overdue
            </Badge>
          )}
        </div>
      </div>

      {/* Description */}
      {task.description && (
        <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
          {task.description}
        </p>
      )}

      {/* Case/Client Info */}
      {(task.case || task.client) && (
        <div className="mb-3 space-y-1">
          {task.case && (
            <div className="text-xs text-blue-600 font-medium">
              Case: {task.case.case_title}
            </div>
          )}
          {task.client && (
            <div className="text-xs text-green-600 font-medium">
              Client: {task.client.full_name}
            </div>
          )}
        </div>
      )}

      {/* Meta Info */}
      <div className="flex items-center justify-between text-xs text-muted-foreground mb-3">
        <div className="flex items-center gap-1.5">
          <User className="w-3.5 h-3.5" />
          <span className="truncate max-w-[120px]">
            {(task.assigned_to && memberMap[task.assigned_to]) || 'Unassigned'}
          </span>
        </div>
        
        {task.due_date && (
          <div className={cn(
            "flex items-center gap-1.5",
            overdueStatus && "text-red-600 font-medium"
          )}>
            <Calendar className="w-3.5 h-3.5" />
            <span>{TimeUtils.formatDate(task.due_date, 'MMM d')}</span>
          </div>
        )}
      </div>

      {/* Tags */}
      {task.tags && task.tags.length > 0 && (
        <div className="flex items-center gap-1.5 mb-3 flex-wrap">
          <Tag className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
          {task.tags.slice(0, 2).map((tag: string) => (
            <span
              key={tag}
              className="text-xs bg-gray-50 text-gray-600 px-2 py-1 rounded-md border border-border"
            >
              {tag}
            </span>
          ))}
          {task.tags.length > 2 && (
            <span className="text-xs text-muted-foreground">
              +{task.tags.length - 2}
            </span>
          )}
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center justify-between pt-3 border-t border-border">
        {/* Status Change Buttons */}
        <div className="flex gap-2">
          {task.status === 'todo' && (
            <button
              onClick={() => onStatusChange('in_progress')}
              className="flex items-center gap-1.5 px-3 h-8 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 active:scale-95 rounded-lg transition-all"
            >
              <Play className="w-3 h-3" />
              Start
            </button>
          )}
          {task.status === 'in_progress' && (
            <button
              onClick={() => onStatusChange('completed')}
              className="flex items-center gap-1.5 px-3 h-8 text-xs font-medium text-white bg-green-600 hover:bg-green-700 active:scale-95 rounded-lg transition-all"
            >
              <CheckCircle className="w-3 h-3" />
              Complete
            </button>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-1">
          <button
            onClick={onView}
            className="p-2 text-muted-foreground hover:text-blue-600 hover:bg-blue-50 rounded-lg active:scale-95 transition-all"
            aria-label="View task"
          >
            <Eye className="w-4 h-4" />
          </button>
          <button
            onClick={onEdit}
            className="p-2 text-muted-foreground hover:text-green-600 hover:bg-green-50 rounded-lg active:scale-95 transition-all"
            aria-label="Edit task"
          >
            <Edit className="w-4 h-4" />
          </button>
          <button
            onClick={onDelete}
            className="p-2 text-muted-foreground hover:text-red-600 hover:bg-red-50 rounded-lg active:scale-95 transition-all"
            aria-label="Delete task"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
