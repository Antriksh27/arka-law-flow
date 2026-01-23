import React from 'react';
import { format, parseISO } from 'date-fns';
import { Calendar, User, FileText, Scale, Clock, X, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { useDialog } from '@/hooks/use-dialog';

interface HearingDetailsModalProps {
  hearing: any;
}

export const HearingDetailsModal: React.FC<HearingDetailsModalProps> = ({
  hearing
}) => {
  const navigate = useNavigate();
  const { closeDialog } = useDialog();

  const handleViewCase = () => {
    closeDialog();
    navigate(`/cases/${hearing.case_id}`);
  };

  return (
    <div className="flex flex-col h-full bg-slate-50">
      {/* Header */}
      <div className="px-6 py-5 bg-white border-b border-slate-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-violet-50 flex items-center justify-center">
              <Scale className="w-5 h-5 text-violet-500" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-slate-900">Hearing Details</h2>
              <p className="text-sm text-muted-foreground truncate max-w-[200px]">
                {hearing.cases?.title || hearing.cases?.case_title}
              </p>
            </div>
          </div>
          <button 
            onClick={closeDialog}
            className="md:hidden w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center hover:bg-slate-200 transition-colors"
          >
            <X className="w-4 h-4 text-slate-500" />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-6 py-6 space-y-4">
        {/* Date & Time Card */}
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          <div className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center">
                <Calendar className="w-5 h-5 text-amber-500" />
              </div>
              <div className="flex-1">
                <p className="text-xs text-muted-foreground">Date & Time</p>
                <p className="text-base font-semibold text-slate-900">
                  {format(parseISO(hearing.hearing_date), 'EEEE, MMM d, yyyy')}
                </p>
                {hearing.hearing_time && (
                  <div className="flex items-center gap-1 mt-1">
                    <Clock className="w-3.5 h-3.5 text-amber-500" />
                    <span className="text-sm text-amber-600">
                      {format(parseISO(`2000-01-01T${hearing.hearing_time}`), 'h:mm a')}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Judge Card */}
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          <div className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-sky-50 flex items-center justify-center">
                <User className="w-5 h-5 text-sky-500" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Judge</p>
                <p className="text-base font-semibold text-slate-900">
                  {hearing.judge || 'Not specified'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Cause List Type Card */}
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          <div className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center">
                <Scale className="w-5 h-5 text-emerald-500" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Cause List Type</p>
                <p className="text-base font-semibold text-slate-900">
                  {hearing.cause_list_type || 'Not specified'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Purpose of Hearing Card */}
        {hearing.purpose_of_hearing && (
          <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
            <div className="p-4">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl bg-rose-50 flex items-center justify-center">
                  <FileText className="w-5 h-5 text-rose-500" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-900">Purpose of Hearing</p>
                  <p className="text-xs text-muted-foreground">Scheduled agenda</p>
                </div>
              </div>
              <div className="p-3 rounded-xl bg-slate-50">
                <p className="text-sm text-slate-700 whitespace-pre-wrap">
                  {hearing.purpose_of_hearing}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="px-6 py-4 bg-white border-t border-slate-100">
        <div className="flex gap-3">
          <Button 
            variant="outline" 
            onClick={closeDialog}
            className="flex-1 rounded-full"
          >
            Close
          </Button>
          <Button 
            onClick={handleViewCase}
            className="flex-1 rounded-full bg-slate-800 hover:bg-slate-700"
          >
            <ExternalLink className="w-4 h-4 mr-2" />
            View Case
          </Button>
        </div>
      </div>
    </div>
  );
};
