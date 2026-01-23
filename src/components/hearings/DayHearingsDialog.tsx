import React from 'react';
import { format } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar, MapPin, User, X, Scale, ExternalLink } from 'lucide-react';
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
  onClose
}) => {
  const navigate = useNavigate();
  const { closeDialog } = useDialog();

  const handleViewCase = (caseId: string) => {
    closeDialog();
    navigate(`/cases/${caseId}`);
  };

  return (
    <div className="flex flex-col h-full bg-slate-50">
      {/* Header */}
      <div className="px-6 py-5 bg-white border-b border-slate-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center">
              <Calendar className="w-5 h-5 text-amber-500" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-slate-900">
                {format(selectedDate, 'MMMM d, yyyy')}
              </h2>
              <p className="text-sm text-muted-foreground">
                {hearings.length} hearing{hearings.length !== 1 ? 's' : ''} scheduled
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="md:hidden w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center hover:bg-slate-200 transition-colors"
          >
            <X className="w-4 h-4 text-slate-500" />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-6 py-6 space-y-3">
        {hearings.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm p-8 text-center">
            <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-4">
              <Calendar className="w-8 h-8 text-slate-400" />
            </div>
            <p className="text-slate-600">No hearings scheduled for this date</p>
          </div>
        ) : (
          hearings.map(hearing => (
            <div key={hearing.id} className="bg-white rounded-2xl shadow-sm overflow-hidden">
              <div className="p-4">
                {/* Case Title & Status */}
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-slate-900 mb-1 truncate">
                      {hearing.cases?.case_title || 'Untitled Case'}
                    </h3>
                    <div className="space-y-0.5">
                      {hearing.cases?.registration_number && (
                        <p className="text-sm font-medium text-violet-600">
                          {hearing.cases.registration_number}
                        </p>
                      )}
                      {hearing.cases?.case_number && (
                        <p className="text-xs text-slate-500">
                          Case No: {hearing.cases.case_number}
                        </p>
                      )}
                    </div>
                  </div>
                  <Badge className="bg-sky-100 text-sky-700 border-0 rounded-full px-2.5 py-0.5 text-xs flex-shrink-0">
                    Scheduled
                  </Badge>
                </div>

                {/* Details */}
                <div className="space-y-2">
                  {hearing.judge && (
                    <div className="flex items-center gap-2 p-2 rounded-xl bg-slate-50">
                      <User className="h-4 w-4 text-slate-400 flex-shrink-0" />
                      <span className="text-sm text-slate-600 truncate">Judge: {hearing.judge}</span>
                    </div>
                  )}

                  {hearing.cases?.court_name && (
                    <div className="flex items-center gap-2 p-2 rounded-xl bg-slate-50">
                      <MapPin className="h-4 w-4 text-slate-400 flex-shrink-0" />
                      <span className="text-sm text-slate-600 truncate">{hearing.cases.court_name}</span>
                    </div>
                  )}

                  {hearing.cause_list_type && (
                    <div className="flex items-center gap-2 p-2 rounded-xl bg-slate-50">
                      <Scale className="h-4 w-4 text-slate-400 flex-shrink-0" />
                      <span className="text-sm text-slate-600 truncate">{hearing.cause_list_type}</span>
                    </div>
                  )}

                  {hearing.purpose_of_hearing && (
                    <div className="p-3 rounded-xl bg-violet-50 border border-violet-100">
                      <p className="text-xs font-medium text-violet-700 mb-1">Purpose</p>
                      <p className="text-sm text-violet-800">{hearing.purpose_of_hearing}</p>
                    </div>
                  )}
                </div>

                {/* Action */}
                <div className="mt-4 pt-3 border-t border-slate-100">
                  <Button 
                    onClick={() => handleViewCase(hearing.case_id)} 
                    size="sm" 
                    className="w-full rounded-full bg-slate-800 hover:bg-slate-700"
                  >
                    <ExternalLink className="w-4 h-4 mr-2" />
                    View Case
                  </Button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Footer */}
      <div className="px-6 py-4 bg-white border-t border-slate-100">
        <Button 
          variant="outline" 
          onClick={onClose}
          className="w-full rounded-full"
        >
          Close
        </Button>
      </div>
    </div>
  );
};
