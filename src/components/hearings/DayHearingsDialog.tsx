import React from 'react';
import { format } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar, MapPin, User, X } from 'lucide-react';
import { useDialog } from '@/hooks/use-dialog';

interface HearingData {
  id: string;
  hearing_date: string;
  judge: string | null;
  purpose_of_hearing: string | null;
  cause_list_type: string | null;
  business_on_date: string | null;
  case_id: string;
  cases?: {
    case_title: string;
    case_number: string | null;
    registration_number: string | null;
    court_name: string | null;
  };
}

interface DayHearingsDialogProps {
  selectedDate: Date;
  hearings: HearingData[];
  onClose: () => void;
}

export const DayHearingsDialog: React.FC<DayHearingsDialogProps> = ({
  selectedDate,
  hearings,
  onClose,
}) => {
  const navigate = useNavigate();
  const { closeDialog } = useDialog();

  const handleViewCase = (caseId: string) => {
    closeDialog();
    navigate(`/cases/${caseId}`);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between border-b border-gray-200 pb-4">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">
            Hearings on {format(selectedDate, 'MMMM d, yyyy')}
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            {hearings.length} hearing{hearings.length !== 1 ? 's' : ''} scheduled
          </p>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={onClose}
          className="h-8 w-8 p-0"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      <div className="space-y-3 max-h-[60vh] overflow-y-auto">
        {hearings.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Calendar className="h-12 w-12 mx-auto mb-3 text-gray-400" />
            <p>No hearings scheduled for this date</p>
          </div>
        ) : (
          hearings.map((hearing) => (
            <div
              key={hearing.id}
              className="border border-gray-200 rounded-xl p-4 hover:shadow-md transition-shadow bg-white"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 mb-1">
                      {hearing.cases?.case_title || 'Untitled Case'}
                    </h3>
                    <div className="text-sm text-gray-600 space-y-1">
                      {hearing.cases?.registration_number && (
                        <p className="font-medium">{hearing.cases.registration_number}</p>
                      )}
                      {hearing.cases?.case_number && (
                        <p>Case No: {hearing.cases.case_number}</p>
                      )}
                    </div>
                  </div>
                  <Badge className="bg-blue-100 text-blue-800 border-blue-200">
                    Scheduled
                  </Badge>
                </div>

                {hearing.judge && (
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <User className="h-4 w-4 text-gray-400" />
                    <span>Judge: {hearing.judge}</span>
                  </div>
                )}

                {hearing.cases?.court_name && (
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <MapPin className="h-4 w-4 text-gray-400" />
                    <span>{hearing.cases.court_name}</span>
                  </div>
                )}

                {hearing.cause_list_type && (
                  <div className="text-sm">
                    <span className="font-medium text-gray-700">List Type: </span>
                    <span className="text-gray-600">{hearing.cause_list_type}</span>
                  </div>
                )}

                {hearing.purpose_of_hearing && (
                  <div className="text-sm bg-gray-50 rounded-lg p-3">
                    <span className="font-medium text-gray-700">Purpose: </span>
                    <span className="text-gray-600">{hearing.purpose_of_hearing}</span>
                  </div>
                )}

                {hearing.business_on_date && (
                  <div className="text-sm bg-blue-50 rounded-lg p-3">
                    <span className="font-medium text-gray-700">Business: </span>
                    <span className="text-gray-600">{hearing.business_on_date}</span>
                  </div>
                )}

                <div className="flex justify-end pt-2">
                  <Button
                    onClick={() => handleViewCase(hearing.case_id)}
                    size="sm"
                    className="bg-primary hover:bg-primary/90"
                  >
                    View Case
                  </Button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
