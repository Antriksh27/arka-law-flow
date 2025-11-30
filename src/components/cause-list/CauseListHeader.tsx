import React from 'react';
import { Button } from '@/components/ui/button';
import { RefreshCw, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface CauseListHeaderProps {
  onRefresh: () => void;
}

export const CauseListHeader: React.FC<CauseListHeaderProps> = ({ onRefresh }) => {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate('/hearings')}
          className="sm:hidden"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Gujarat Cause List</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Display board data from Gujarat High Court
          </p>
        </div>
      </div>

      <Button
        variant="outline"
        onClick={onRefresh}
        className="w-full sm:w-auto"
      >
        <RefreshCw className="h-4 w-4 mr-2" />
        Refresh
      </Button>
    </div>
  );
};
