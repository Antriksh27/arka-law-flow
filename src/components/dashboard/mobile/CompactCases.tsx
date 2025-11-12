import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { Calendar, ArrowRight } from 'lucide-react';
import { format } from 'date-fns';

interface Case {
  id: string;
  title: string;
  client_name: string;
  status: string;
  next_hearing_date?: string;
}

interface CompactCasesProps {
  cases: Case[];
  isLoading?: boolean;
}

export const CompactCases: React.FC<CompactCasesProps> = ({ cases, isLoading }) => {
  const navigate = useNavigate();

  if (isLoading) {
    return (
      <section className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-semibold text-foreground">My Active Cases</h2>
          <button className="text-sm font-medium text-primary">View All</button>
        </div>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-card rounded-xl border border-border p-4 animate-pulse">
              <div className="h-5 bg-muted rounded w-3/4 mb-2" />
              <div className="h-4 bg-muted rounded w-1/2 mb-2" />
              <div className="h-4 bg-muted rounded w-1/3" />
            </div>
          ))}
        </div>
      </section>
    );
  }

  if (cases.length === 0) {
    return (
      <section className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-semibold text-foreground">My Active Cases</h2>
          <button
            onClick={() => navigate('/cases')}
            className="text-sm font-medium text-primary hover:underline"
          >
            View All
          </button>
        </div>
        <div className="bg-card rounded-xl border border-border p-6 text-center">
          <p className="text-sm text-muted-foreground">No active cases</p>
        </div>
      </section>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'closed':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-blue-100 text-blue-800';
    }
  };

  return (
    <section className="mb-6">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-base font-semibold text-foreground">My Active Cases</h2>
        <button
          onClick={() => navigate('/cases')}
          className="text-sm font-medium text-primary hover:underline"
        >
          View All
        </button>
      </div>
      <div className="space-y-3">
        {cases.slice(0, 3).map((caseItem) => (
          <button
            key={caseItem.id}
            onClick={() => navigate(`/cases/${caseItem.id}`)}
            className="w-full bg-card rounded-xl border border-border p-4 text-left transition-all active:scale-[0.98] hover:shadow-md"
          >
            <div className="flex items-start justify-between gap-3 mb-2">
              <h3 className="text-sm font-semibold text-foreground flex-1 line-clamp-2">
                {caseItem.title}
              </h3>
              <ArrowRight className="w-4 h-4 text-muted-foreground flex-shrink-0 mt-0.5" />
            </div>
            <p className="text-xs text-muted-foreground mb-2">{caseItem.client_name}</p>
            <div className="flex items-center justify-between">
              <Badge className={getStatusColor(caseItem.status)}>
                {caseItem.status}
              </Badge>
              {caseItem.next_hearing_date && (
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Calendar className="w-3 h-3" />
                  {format(new Date(caseItem.next_hearing_date), 'MMM d')}
                </div>
              )}
            </div>
          </button>
        ))}
      </div>
    </section>
  );
};
