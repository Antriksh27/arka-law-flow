import { ChevronRight } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { TimeUtils } from '@/lib/timeUtils';
interface Case {
  id: string;
  case_title: string;
  case_number?: string;
  client_name: string;
  next_hearing_date?: string;
  status: string;
}
interface MyActiveCasesProps {
  cases: Case[];
  isLoading?: boolean;
}
export const MyActiveCases = ({
  cases,
  isLoading
}: MyActiveCasesProps) => {
  const navigate = useNavigate();
  if (isLoading) {
    return <div className="mb-4 md:mb-6">
        <div className="flex items-center gap-2 mb-4">
          <span className="text-lg md:text-xl">⚖️</span>
          <h2 className="text-lg md:text-xl font-semibold">My Active Cases</h2>
        </div>
        <div className="space-y-3">
          {[1, 2, 3].map(i => <div key={i} className="h-24 bg-gray-100 rounded-lg animate-pulse" />)}
        </div>
      </div>;
  }
  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active':
        return 'bg-green-100 text-green-700 border-green-200';
      case 'discovery':
        return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 'pending':
        return 'bg-orange-100 text-orange-700 border-orange-200';
      case 'closed':
        return 'bg-gray-100 text-gray-700 border-gray-200';
      default:
        return 'bg-blue-100 text-blue-700 border-blue-200';
    }
  };
  return <div className="mb-4 md:mb-6">
      <div className="flex items-center gap-2 mb-4">
        
        <h2 className="text-lg md:text-xl font-semibold">My Active Cases</h2>
      </div>

      {cases.length === 0 ? <Card className="p-6 md:p-8 text-center border-dashed">
          <p className="text-sm text-muted-foreground mb-3">No active cases</p>
          <Button size="sm" variant="outline" onClick={() => navigate('/cases')}>
            View All Cases
          </Button>
        </Card> : <div className="space-y-3">
          {cases.slice(0, 3).map(caseItem => <Card key={caseItem.id} className="p-3 md:p-4 hover:shadow-md transition-shadow cursor-pointer group" onClick={() => navigate(`/cases/${caseItem.id}`)}>
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <h3 className="font-medium text-sm truncate">{caseItem.case_title}</h3>
                    <Badge className={`text-xs px-2 py-0 h-5 flex-shrink-0 ${getStatusColor(caseItem.status)}`}>
                      {caseItem.status}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mb-2 truncate">
                    Client: {caseItem.client_name}
                  </p>
                  {caseItem.next_hearing_date && <p className="text-xs text-muted-foreground truncate">
                      Next Hearing: {TimeUtils.formatDate(caseItem.next_hearing_date, 'dd/MM/yyyy')} • District Court
                    </p>}
                </div>
                <ChevronRight className="w-4 h-4 md:w-5 md:h-5 text-muted-foreground group-hover:text-foreground transition-colors flex-shrink-0" />
              </div>
            </Card>)}
          
          {cases.length > 3 && <Button variant="ghost" size="sm" className="w-full" onClick={() => navigate('/cases')}>
              View All Cases
            </Button>}
        </div>}
    </div>;
};