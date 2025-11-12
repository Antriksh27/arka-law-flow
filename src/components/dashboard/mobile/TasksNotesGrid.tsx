import React from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckSquare, StickyNote } from 'lucide-react';
import { format } from 'date-fns';

interface Task {
  id: string;
  title: string;
  due_date?: string;
  priority?: string;
}

interface Note {
  id: string;
  title: string;
  content: string;
  color?: string;
}

interface TasksNotesGridProps {
  tasks: Task[];
  notes: Note[];
  isLoading?: boolean;
}

export const TasksNotesGrid: React.FC<TasksNotesGridProps> = ({ tasks, notes, isLoading }) => {
  const navigate = useNavigate();

  if (isLoading) {
    return (
      <section className="mb-6">
        <h2 className="text-base font-semibold text-foreground mb-3">Tasks & Notes</h2>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            {[1, 2].map((i) => (
              <div key={i} className="bg-card rounded-lg border border-border p-3 animate-pulse">
                <div className="h-4 bg-muted rounded w-full mb-2" />
                <div className="h-3 bg-muted rounded w-2/3" />
              </div>
            ))}
          </div>
          <div className="space-y-2">
            {[1, 2].map((i) => (
              <div key={i} className="bg-card rounded-lg border border-border p-3 animate-pulse">
                <div className="h-4 bg-muted rounded w-full mb-2" />
                <div className="h-3 bg-muted rounded w-3/4" />
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="mb-6">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-base font-semibold text-foreground">Tasks & Notes</h2>
        <div className="flex gap-3">
          <button
            onClick={() => navigate('/tasks')}
            className="text-xs font-medium text-primary hover:underline"
          >
            All Tasks
          </button>
          <button
            onClick={() => navigate('/notes')}
            className="text-xs font-medium text-primary hover:underline"
          >
            All Notes
          </button>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        {/* Tasks Column */}
        <div className="space-y-2">
          {tasks.length === 0 ? (
            <div className="bg-card rounded-lg border border-border p-4 text-center">
              <CheckSquare className="w-6 h-6 text-muted-foreground mx-auto mb-1" />
              <p className="text-xs text-muted-foreground">No tasks</p>
            </div>
          ) : (
            tasks.slice(0, 2).map((task) => (
              <button
                key={task.id}
                onClick={() => navigate('/tasks')}
                className="w-full bg-card rounded-lg border border-border p-3 text-left transition-all active:scale-[0.98] hover:shadow-sm"
              >
                <div className="flex items-start gap-2 mb-1">
                  <CheckSquare className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0 mt-0.5" />
                  <h3 className="text-xs font-medium text-foreground line-clamp-2 flex-1">
                    {task.title}
                  </h3>
                </div>
                {task.due_date && (
                  <p className="text-xs text-muted-foreground pl-5">
                    {format(new Date(task.due_date), 'MMM d')}
                  </p>
                )}
              </button>
            ))
          )}
        </div>

        {/* Notes Column */}
        <div className="space-y-2">
          {notes.length === 0 ? (
            <div className="bg-card rounded-lg border border-border p-4 text-center">
              <StickyNote className="w-6 h-6 text-muted-foreground mx-auto mb-1" />
              <p className="text-xs text-muted-foreground">No notes</p>
            </div>
          ) : (
            notes.slice(0, 2).map((note) => {
              const bgColor = note.color || 'bg-yellow-50';
              return (
                <button
                  key={note.id}
                  onClick={() => navigate('/notes')}
                  className={`w-full ${bgColor} rounded-lg border border-border p-3 text-left transition-all active:scale-[0.98] hover:shadow-sm`}
                >
                  <h3 className="text-xs font-semibold text-foreground mb-1 line-clamp-1">
                    {note.title}
                  </h3>
                  <p className="text-xs text-muted-foreground line-clamp-2">{note.content}</p>
                </button>
              );
            })
          )}
        </div>
      </div>
    </section>
  );
};
