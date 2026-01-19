import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { Calendar, User, ChevronRight } from 'lucide-react';
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
          <h2 className="text-base font-semibold text-foreground">Active Cases</h2>
          <button className="flex items-center gap-1 text-sm font-medium text-muted-foreground">
            See All <ChevronRight className="w-4 h-4" />
          </button>
        </div>
        <div className="space-y-3">
          {[1, 2].map((i) => (
            <div key={i} className="bg-white rounded-2xl p-4 animate-pulse shadow-sm">
              <div className="h-5 bg-slate-100 rounded w-3/4 mb-3" />
              <div className="flex items-center gap-2 mb-3">
                <div className="h-6 bg-slate-100 rounded-full w-20" />
              </div>
              <div className="flex items-center gap-4">
                <div className="h-4 bg-slate-100 rounded w-32" />
                <div className="h-4 bg-slate-100 rounded w-24" />
              </div>
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
          <h2 className="text-base font-semibold text-foreground">Active Cases</h2>
          <button
            onClick={() => navigate('/cases')}
            className="flex items-center gap-1 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            See All <ChevronRight className="w-4 h-4" />
          </button>
        </div>
        <div className="bg-white rounded-2xl p-6 text-center shadow-sm">
          <p className="text-sm text-muted-foreground">No active cases</p>
        </div>
      </section>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'active':
        return 'bg-green-100 text-green-700';
      case 'pending':
        return 'bg-amber-100 text-amber-700';
      case 'closed':
        return 'bg-slate-100 text-slate-600';
      default:
        return 'bg-blue-100 text-blue-700';
    }
  };

  return (
    <section className="mb-6">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-base font-semibold text-foreground">Active Cases</h2>
        <button
          onClick={() => navigate('/cases')}
          className="flex items-center gap-1 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
        >
          See All <ChevronRight className="w-4 h-4" />
        </button>
      </div>
      <div className="space-y-3">
        {cases.slice(0, 3).map((caseItem) => (
          <div
            key={caseItem.id}
            className="bg-white rounded-2xl p-4 shadow-sm"
          >
            <h3 className="text-sm font-semibold text-foreground mb-2 line-clamp-2 uppercase tracking-wide">
              {caseItem.title}
            </h3>
            
            <div className="mb-3">
              <Badge className={`${getStatusColor(caseItem.status)} font-medium text-xs px-2.5 py-0.5 rounded-full border-0`}>
                {caseItem.status?.toUpperCase()}
              </Badge>
            </div>
            
            <div className="flex items-center gap-4 text-xs text-muted-foreground mb-3">
              <div className="flex items-center gap-1.5">
                <User className="w-3.5 h-3.5" />
                <span>{caseItem.client_name}</span>
              </div>
              {caseItem.next_hearing_date && (
                <div className="flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5" />
                  <span>{format(new Date(caseItem.next_hearing_date), 'MMM d, yyyy')}</span>
                </div>
              )}
            </div>
            
            <button
              onClick={() => navigate(`/cases/${caseItem.id}`)}
              className="text-xs font-medium text-primary hover:underline"
            >
              View Details
            </button>
          </div>
        ))}
      </div>
    </section>
  );
};
