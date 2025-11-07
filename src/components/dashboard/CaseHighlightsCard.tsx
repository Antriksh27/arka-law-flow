import { Briefcase, Calendar, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { TimeUtils } from '@/lib/timeUtils';
import { useNavigate } from 'react-router-dom';

interface CaseHighlight {
  id: string;
  case_title: string;
  case_number: string;
  status: string;
  next_hearing_date?: string;
}

interface CaseHighlightsCardProps {
  cases: CaseHighlight[];
  isLoading: boolean;
}

export const CaseHighlightsCard = ({ cases, isLoading }: CaseHighlightsCardProps) => {
  const navigate = useNavigate();

  const getStatusColor = (status: string) => {
    const statusLower = status.toLowerCase();
    if (statusLower === 'open' || statusLower === 'active') return 'bg-blue-100 text-blue-800';
    if (statusLower === 'closed') return 'bg-gray-100 text-gray-800';
    if (statusLower === 'pending') return 'bg-yellow-100 text-yellow-800';
    return 'bg-gray-100 text-gray-800';
  };

  return (
    <Card className="bg-white border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-medium flex items-center gap-2">
            <Briefcase className="w-5 h-5 text-primary" />
            Case Highlights
          </CardTitle>
          <Button variant="link" size="sm" className="text-primary" onClick={() => navigate('/cases')}>
            View All
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-20 w-full" />)}
          </div>
        ) : cases.length === 0 ? (
          <div className="text-center py-8">
            <Briefcase className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-sm text-gray-500">No active cases</p>
            <Button variant="outline" size="sm" className="mt-3" onClick={() => navigate('/cases')}>
              Add Case
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {cases.slice(0, 5).map((caseItem) => (
              <div 
                key={caseItem.id} 
                className="p-3 bg-gray-50 rounded-lg border border-gray-200 cursor-pointer hover:bg-gray-100 transition-colors"
                onClick={() => navigate(`/cases/${caseItem.id}`)}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <h4 className="font-medium text-sm line-clamp-1">{caseItem.case_title}</h4>
                    <p className="text-xs text-gray-600 mt-1">{caseItem.case_number}</p>
                  </div>
                  <Badge className={getStatusColor(caseItem.status)}>
                    {caseItem.status}
                  </Badge>
                </div>
                {caseItem.next_hearing_date ? (
                  <div className="flex items-center gap-1 text-xs text-gray-600">
                    <Calendar className="w-3 h-3" />
                    Next hearing: {TimeUtils.formatDate(caseItem.next_hearing_date, 'MMM dd, yyyy')}
                  </div>
                ) : (
                  <div className="flex items-center gap-1 text-xs text-gray-500">
                    <AlertCircle className="w-3 h-3" />
                    No upcoming hearing
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
