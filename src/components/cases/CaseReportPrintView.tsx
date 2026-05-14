import React from 'react';
import { format } from 'date-fns';

interface CaseReportPrintViewProps {
  cases: any[];
  filters: {
    searchQuery?: string;
    statusFilter?: string;
    typeFilter?: string;
    assignedFilter?: string;
  };
}

export const CaseReportPrintView = React.forwardRef<HTMLDivElement, CaseReportPrintViewProps>(
  ({ cases, filters }, ref) => {
    const today = new Date();

    return (
      <div ref={ref} className="hidden print:block bg-white p-8 print-view font-sans">
        {/* Header with Company Logo */}
        <div className="flex flex-col items-center mb-8 pb-6 border-b-2 border-slate-800">
          <img 
            src="/lovable-uploads/89ea18cf-8c73-4793-9dcc-1a192855a630.png" 
            alt="HRU Legal" 
            className="h-24 w-auto mb-4"
          />
          <h1 className="text-2xl font-bold uppercase text-slate-900">Cases Filtered Report</h1>
          <p className="text-slate-600 mt-1">Generated on {format(today, 'PPPP p')}</p>
        </div>

        {/* Filters Summary */}
        <div className="mb-6 p-4 bg-slate-50 rounded-lg border border-slate-200">
          <h2 className="text-sm font-semibold text-slate-700 uppercase mb-2">Report Filters</h2>
          <div className="grid grid-cols-2 gap-y-2 text-sm">
            <div className="flex gap-2">
              <span className="text-slate-500">Search:</span>
              <span className="font-medium text-slate-800">{filters.searchQuery || 'None'}</span>
            </div>
            <div className="flex gap-2">
              <span className="text-slate-500">Status:</span>
              <span className="font-medium text-slate-800 capitalize">{filters.statusFilter || 'All'}</span>
            </div>
            <div className="flex gap-2">
              <span className="text-slate-500">Type:</span>
              <span className="font-medium text-slate-800 capitalize">{filters.typeFilter || 'All'}</span>
            </div>
            <div className="flex gap-2">
              <span className="text-slate-500">Total Results:</span>
              <span className="font-medium text-slate-800">{cases.length} Cases</span>
            </div>
          </div>
        </div>

        {/* Table */}
        <table className="w-full border-collapse border border-slate-300 text-xs leading-normal">
          <thead>
            <tr className="bg-slate-800 text-white">
              <th className="border border-slate-300 px-3 py-2 text-left w-20">Ref No</th>
              <th className="border border-slate-300 px-3 py-2 text-left">Case Title</th>
              <th className="border border-slate-300 px-3 py-2 text-left">Client</th>
              <th className="border border-slate-300 px-3 py-2 text-left w-24">Type</th>
              <th className="border border-slate-300 px-3 py-2 text-left w-24">Status</th>
              <th className="border border-slate-300 px-3 py-2 text-left w-24">Stage</th>
            </tr>
          </thead>
          <tbody>
            {cases.map((caseItem, index) => (
              <tr key={caseItem.id} className={index % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>
                <td className="border border-slate-300 px-3 py-2 font-medium">
                  {caseItem.reference_number || '-'}
                </td>
                <td className="border border-slate-300 px-3 py-2">
                  <div className="font-semibold">{caseItem.case_title}</div>
                  {caseItem.registration_number && (
                    <div className="text-[10px] text-slate-500 mt-0.5">Reg: {caseItem.registration_number}</div>
                  )}
                </td>
                <td className="border border-slate-300 px-3 py-2">
                  {caseItem.client_name || caseItem.clients?.full_name || '-'}
                </td>
                <td className="border border-slate-300 px-3 py-2 capitalize">
                  {caseItem.case_type?.replace('_', ' ') || '-'}
                </td>
                <td className="border border-slate-300 px-3 py-2 capitalize">
                  {caseItem.status?.replace('_', ' ') || '-'}
                </td>
                <td className="border border-slate-300 px-3 py-2 capitalize">
                  {caseItem.stage || '-'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Footer */}
        <div className="mt-8 pt-4 border-t border-slate-200 text-center text-[10px] text-slate-400">
          <p>© {today.getFullYear()} HRU Legal. Confidential and Privileged Information.</p>
          <p>This report was generated from the Arka Law Flow management system.</p>
        </div>

        <style>{`
          @media print {
            @page {
              size: A4 portrait;
              margin: 15mm;
            }
            body {
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
            }
            .print-view {
              width: 100%;
              background: white !important;
            }
            table {
              page-break-inside: auto;
              width: 100% !important;
              border-collapse: collapse !important;
            }
            tr {
              page-break-inside: avoid !important;
              page-break-after: auto !important;
              break-inside: avoid !important;
            }
            thead {
              display: table-header-group !important;
            }
            tfoot {
              display: table-footer-group !important;
            }
            td, th {
              word-break: break-word !important;
            }
          }
        `}</style>
      </div>
    );
  }
);

CaseReportPrintView.displayName = 'CaseReportPrintView';
