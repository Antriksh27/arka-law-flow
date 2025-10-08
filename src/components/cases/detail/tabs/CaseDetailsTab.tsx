import React from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { parsePartyString } from '@/lib/partyParser';

interface CaseDetailsTabProps {
  caseData: any;
  legalkartData: any;
}

export const CaseDetailsTab: React.FC<CaseDetailsTabProps> = ({ caseData, legalkartData }) => {
  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return 'Not set';
    try {
      return new Date(dateStr).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
    } catch {
      return 'Invalid date';
    }
  };

  // Parse parties from legalkart data
  const petitioners = parsePartyString(legalkartData?.petitioner_and_advocate || legalkartData?.petitioner || '');
  const respondents = parsePartyString(legalkartData?.respondent_and_advocate || legalkartData?.respondent || '');

  return (
    <div className="space-y-6">
      {/* Main Details Card */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Case Information</h3>
        <div className="grid grid-cols-2 gap-x-8 gap-y-4">
          <div>
            <p className="text-sm text-gray-500">Case Number</p>
            <p className="font-medium">{legalkartData?.case_number || caseData?.case_number || 'Not assigned'}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">CNR Number</p>
            <p className="font-medium">{caseData?.cnr_number || 'Not assigned'}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Court Name</p>
            <p className="font-medium">{legalkartData?.court_name || caseData?.court_name || caseData?.court || 'Not specified'}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Case Type</p>
            <p className="font-medium">{legalkartData?.case_type || caseData?.case_type || 'Not specified'}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Filing Date</p>
            <p className="font-medium">{formatDate(legalkartData?.filing_date || caseData?.filing_date)}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Registration Date</p>
            <p className="font-medium">{formatDate(legalkartData?.registration_date || caseData?.registration_date)}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Stage</p>
            <p className="font-medium">{legalkartData?.stage || caseData?.stage || 'Not specified'}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Status</p>
            <Badge className="bg-blue-100 text-blue-700">
              {caseData?.status?.replace('_', ' ') || 'Unknown'}
            </Badge>
          </div>
          <div>
            <p className="text-sm text-gray-500">Judge Name</p>
            <p className="font-medium">{legalkartData?.coram || caseData?.coram || 'Not assigned'}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Filing Number</p>
            <p className="font-medium">{legalkartData?.filing_number || caseData?.filing_number || 'Not assigned'}</p>
          </div>
        </div>

        {/* Acts & Sections */}
        {(legalkartData?.acts || caseData?.acts) && (
          <div className="mt-4 pt-4 border-t border-gray-100">
            <p className="text-sm text-gray-500 mb-2">Acts & Sections</p>
            <div className="flex flex-wrap gap-2">
              {(legalkartData?.acts || caseData?.acts || []).map((act: string, idx: number) => (
                <Badge key={idx} variant="outline" className="bg-gray-50">
                  {act}
                </Badge>
              ))}
            </div>
          </div>
        )}
      </Card>

      {/* Parties Information */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Petitioners */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-blue-500"></span>
            Petitioners
          </h3>
          {petitioners.length > 0 ? (
            <div className="space-y-4">
              {petitioners.map((party, idx) => (
                <div key={idx} className="pb-4 border-b border-gray-100 last:border-0">
                  <p className="font-medium text-gray-900 mb-2">{party.name}</p>
                  {party.advocates.length > 0 && (
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Advocates:</p>
                      <div className="space-y-1">
                        {party.advocates.map((advocate, advIdx) => (
                          <p key={advIdx} className="text-sm text-gray-600 pl-3">• {advocate}</p>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-500">No petitioner information available</p>
          )}
        </Card>

        {/* Respondents */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-red-500"></span>
            Respondents
          </h3>
          {respondents.length > 0 ? (
            <div className="space-y-4">
              {respondents.map((party, idx) => (
                <div key={idx} className="pb-4 border-b border-gray-100 last:border-0">
                  <p className="font-medium text-gray-900 mb-2">{party.name}</p>
                  {party.advocates.length > 0 && (
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Advocates:</p>
                      <div className="space-y-1">
                        {party.advocates.map((advocate, advIdx) => (
                          <p key={advIdx} className="text-sm text-gray-600 pl-3">• {advocate}</p>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-500">No respondent information available</p>
          )}
        </Card>
      </div>
    </div>
  );
};
