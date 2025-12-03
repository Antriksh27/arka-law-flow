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
      <div ref={ref} className="hidden print:block bg-white p-6 print-view">
        <div className="text-center mb-6">
          <h1 className="text-xl font-bold uppercase mb-1">Daily Cause List</h1>
          <p className="text-base">{format(selectedDate, 'EEEE, MMMM d, yyyy')}</p>
        </div>
        
        {groupedHearings.map((courtGroup) => {
          let serialNo = 1;
          
          return (
            <div key={courtGroup.courtName} className="mb-6 break-inside-avoid">
              <div className="bg-gray-100 px-3 py-2 mb-3">
                <h2 className="text-base font-bold uppercase">{courtGroup.courtName}</h2>
              </div>
              
              {courtGroup.judges.map((judge) => (
                <div key={judge.judgeName} className="mb-4 break-inside-avoid">
                  <div className="bg-gray-50 px-3 py-1.5 mb-2">
                    <h3 className="text-sm font-semibold uppercase">{judge.judgeName}</h3>
                  </div>
                  
                  <table className="w-full border-collapse border border-gray-300 text-[10px]">
                    <thead>
                      <tr className="bg-gray-100">
                        <th className="border border-gray-300 px-1 py-1 text-left w-8">Sr.</th>
                        <th className="border border-gray-300 px-1 py-1 text-left w-24">Case No.</th>
                        <th className="border border-gray-300 px-1 py-1 text-left">Petitioner</th>
                        <th className="border border-gray-300 px-1 py-1 text-left">Respondent</th>
                        <th className="border border-gray-300 px-1 py-1 text-left w-20">AORP</th>
                        <th className="border border-gray-300 px-1 py-1 text-left w-20">AORR</th>
                        <th className="border border-gray-300 px-1 py-1 text-left w-12">Arguing</th>
                        <th className="border border-gray-300 px-1 py-1 text-left w-16">Stage</th>
                        <th className="border border-gray-300 px-1 py-1 text-left w-20">Relief</th>
                      </tr>
                    </thead>
                    <tbody>
                      {judge.hearings.map((hearing) => {
                        const row = (
                          <tr key={hearing.hearing_id}>
                            <td className="border border-gray-300 px-1 py-1">{serialNo}</td>
                            <td className="border border-gray-300 px-1 py-1 font-medium">
                              {hearing.case_number || 'N/A'}
                            </td>
                            <td className="border border-gray-300 px-1 py-1">
                              {hearing.petitioner || '-'}
                            </td>
                            <td className="border border-gray-300 px-1 py-1">
                              {hearing.respondent || '-'}
                            </td>
                            <td className="border border-gray-300 px-1 py-1">
                              {hearing.formatted_aorp || '-'}
                            </td>
                            <td className="border border-gray-300 px-1 py-1">
                              {hearing.formatted_aorr || '-'}
                            </td>
                            <td className="border border-gray-300 px-1 py-1 font-medium">
                              CBU
                            </td>
                            <td className="border border-gray-300 px-1 py-1">
                              {hearing.purpose_of_hearing || '-'}
                            </td>
                            <td className="border border-gray-300 px-1 py-1">
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
              margin: 10mm;
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
          }
        `}</style>
      </div>
    );
  }
);

PrintView.displayName = 'PrintView';
