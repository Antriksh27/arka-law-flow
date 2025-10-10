import React from 'react';
import { format, parseISO } from 'date-fns';
import { Calendar, Clock, MapPin, User, FileText, Scale, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Hearing } from './types';
import { getHearingStatusBadge, formatHearingType } from './utils';
import { useNavigate } from 'react-router-dom';
import { useDialog } from '@/hooks/use-dialog';

interface HearingDetailsModalProps {
  hearing: Hearing & { cases?: any };
}

export const HearingDetailsModal: React.FC<HearingDetailsModalProps> = ({ hearing }) => {
  const navigate = useNavigate();
  const { closeDialog } = useDialog();

  const handleViewCase = () => {
    closeDialog();
    navigate(`/case/${hearing.case_id}`);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-[#111827]">Hearing Details</h2>
          <p className="text-sm text-[#6B7280] mt-1">Case: {hearing.cases?.case_title}</p>
        </div>
        {getHearingStatusBadge(hearing.status)}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="flex items-start gap-3 p-4 rounded-xl bg-[#F9FAFB] border border-[#E5E7EB]">
          <Calendar className="w-5 h-5 text-[#1E3A8A] mt-0.5" />
          <div>
            <div className="text-sm font-medium text-[#6B7280]">Date</div>
            <div className="text-base font-semibold text-[#111827]">
              {format(parseISO(hearing.hearing_date), 'EEEE, MMM d, yyyy')}
            </div>
          </div>
        </div>

        <div className="flex items-start gap-3 p-4 rounded-xl bg-[#F9FAFB] border border-[#E5E7EB]">
          <Clock className="w-5 h-5 text-[#1E3A8A] mt-0.5" />
          <div>
            <div className="text-sm font-medium text-[#6B7280]">Time</div>
            <div className="text-base font-semibold text-[#111827]">
              {hearing.hearing_time || 'Not specified'}
            </div>
          </div>
        </div>

        <div className="flex items-start gap-3 p-4 rounded-xl bg-[#F9FAFB] border border-[#E5E7EB]">
          <MapPin className="w-5 h-5 text-[#1E3A8A] mt-0.5" />
          <div>
            <div className="text-sm font-medium text-[#6B7280]">Court</div>
            <div className="text-base font-semibold text-[#111827]">
              {hearing.court_name}
            </div>
          </div>
        </div>

        <div className="flex items-start gap-3 p-4 rounded-xl bg-[#F9FAFB] border border-[#E5E7EB]">
          <Scale className="w-5 h-5 text-[#1E3A8A] mt-0.5" />
          <div>
            <div className="text-sm font-medium text-[#6B7280]">Type</div>
            <div className="text-base font-semibold text-[#111827]">
              {formatHearingType(hearing.hearing_type)}
            </div>
          </div>
        </div>
      </div>

      {hearing.bench && (
        <div className="p-4 rounded-xl bg-[#F9FAFB] border border-[#E5E7EB]">
          <div className="text-sm font-medium text-[#6B7280] mb-1">Bench</div>
          <div className="text-base text-[#111827]">{hearing.bench}</div>
        </div>
      )}

      {hearing.coram && (
        <div className="p-4 rounded-xl bg-[#F9FAFB] border border-[#E5E7EB]">
          <div className="text-sm font-medium text-[#6B7280] mb-1">Coram</div>
          <div className="text-base text-[#111827]">{hearing.coram}</div>
        </div>
      )}

      {hearing.notes && (
        <div className="p-4 rounded-xl bg-[#F9FAFB] border border-[#E5E7EB]">
          <div className="flex items-center gap-2 mb-2">
            <FileText className="w-4 h-4 text-[#1E3A8A]" />
            <div className="text-sm font-medium text-[#6B7280]">Notes</div>
          </div>
          <div className="text-base text-[#111827] whitespace-pre-wrap">{hearing.notes}</div>
        </div>
      )}

      {hearing.outcome && (
        <div className="p-4 rounded-xl bg-[#E0E7FF] border border-[#C7D2FE]">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle className="w-4 h-4 text-[#1E3A8A]" />
            <div className="text-sm font-medium text-[#1E3A8A]">Outcome</div>
          </div>
          <div className="text-base text-[#111827] whitespace-pre-wrap">{hearing.outcome}</div>
        </div>
      )}

      <div className="flex items-center gap-3 pt-4 border-t border-[#E5E7EB]">
        <Button onClick={handleViewCase} className="flex-1">
          View Case
        </Button>
        <Button variant="outline" onClick={closeDialog} className="flex-1">
          Close
        </Button>
      </div>
    </div>
  );
};
