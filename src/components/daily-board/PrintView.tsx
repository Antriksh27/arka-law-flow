import React from 'react';
import { format } from 'date-fns';
import { GroupedHearings } from './types';

interface PrintViewProps {
  selectedDate: Date;
  groupedHearings: GroupedHearings[];
}

export const PrintView = React.forwardRef<HTMLDivElement, PrintViewProps>(
  ({ selectedDate, groupedHearings }, ref) => {
    return (
      <div ref={ref} className="hidden print:block bg-white p-4 print-view">
        <div className="text-center mb-3">
          <h1 className="text-base font-bold uppercase mb-0.5">Daily Cause List</h1>
          <p className="text-xs">{format(selectedDate, 'EEEE, MMMM d, yyyy')}</p>
        </div>
        
        {groupedHearings.map((courtGroup) => {
          let serialNo = 1;
          
          return (
            <div key={courtGroup.courtName} className="mb-2">
              <div className="bg-gray-100 px-2 py-0.5 mb-1">
                <h2 className="text-xs font-bold uppercase">{courtGroup.courtName}</h2>
              </div>
              
              {courtGroup.judges.map((judge) => (
                <div key={judge.judgeName} className="mb-1">
                  <div className="bg-gray-50 px-2 py-0.5 mb-0.5">
                    <h3 className="text-[10px] font-semibold uppercase">{judge.judgeName}</h3>
                  </div>
                  
                  <table className="w-full border-collapse border border-gray-300 text-[8px] leading-tight">
                    <thead>
                      <tr className="bg-gray-100">
                        <th className="border border-gray-300 px-0.5 py-0.5 text-left w-5">Sr.</th>
                        <th className="border border-gray-300 px-0.5 py-0.5 text-left w-16">Case No.</th>
                        <th className="border border-gray-300 px-0.5 py-0.5 text-left">Petitioner</th>
                        <th className="border border-gray-300 px-0.5 py-0.5 text-left">Respondent</th>
                        <th className="border border-gray-300 px-0.5 py-0.5 text-left w-14">AORP</th>
                        <th className="border border-gray-300 px-0.5 py-0.5 text-left w-14">AORR</th>
                        <th className="border border-gray-300 px-0.5 py-0.5 text-left w-8">Arguing</th>
                        <th className="border border-gray-300 px-0.5 py-0.5 text-left w-12">Stage</th>
                        <th className="border border-gray-300 px-0.5 py-0.5 text-left w-14">Relief</th>
                      </tr>
                    </thead>
                    <tbody>
                      {judge.hearings.map((hearing) => {
                        const row = (
                          <tr key={hearing.hearing_id}>
                            <td className="border border-gray-300 px-0.5 py-0.5">{serialNo}</td>
                            <td className="border border-gray-300 px-0.5 py-0.5 font-medium">
                              {hearing.case_number || 'N/A'}
                            </td>
                            <td className="border border-gray-300 px-0.5 py-0.5">
                              {hearing.petitioner || '-'}
                            </td>
                            <td className="border border-gray-300 px-0.5 py-0.5">
                              {hearing.respondent || '-'}
                            </td>
                            <td className="border border-gray-300 px-0.5 py-0.5">
                              {hearing.formatted_aorp || '-'}
                            </td>
                            <td className="border border-gray-300 px-0.5 py-0.5">
                              {hearing.formatted_aorr || '-'}
                            </td>
                            <td className="border border-gray-300 px-0.5 py-0.5 font-medium">
                              CBU
                            </td>
                            <td className="border border-gray-300 px-0.5 py-0.5">
                              {hearing.purpose_of_hearing || '-'}
                            </td>
                            <td className="border border-gray-300 px-0.5 py-0.5">
                              {hearing.relief || '-'}
                            </td>
                          </tr>
                        );
                        serialNo++;
                        return row;
                      })}
                    </tbody>
                  </table>
                </div>
              ))}
            </div>
          );
        })}
        
        <style>{`
          @media print {
            @page {
              size: A4 portrait;
              margin: 8mm;
            }
            body {
              print-color-adjust: exact;
              -webkit-print-color-adjust: exact;
            }
            body * {
              visibility: hidden;
            }
            .print-view,
            .print-view * {
              visibility: visible;
            }
            .print-view {
              position: absolute;
              left: 0;
              top: 0;
              width: 100%;
            }
            .print-view table {
              page-break-inside: auto;
            }
            .print-view tr {
              page-break-inside: avoid;
              page-break-after: auto;
            }
          }
        `}</style>
      </div>
    );
  }
);

PrintView.displayName = 'PrintView';
