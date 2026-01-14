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
        
        {groupedHearings.map((courtGroup) => (
          <div key={courtGroup.courtName} className="mb-3">
            <div className="bg-gray-100 px-2 py-0.5 mb-1">
              <h2 className="text-xs font-bold uppercase">{courtGroup.courtName}</h2>
            </div>
            
            {courtGroup.judges.map((judge) => {
              const firstHearing = judge.hearings[0];
              
              return (
                <div key={judge.judgeName} className="mb-2">
                  {/* Judge Header with Court Boxes */}
                  <div className="flex items-center justify-between border-2 border-gray-800 mb-1">
                    {/* Judge Name */}
                    <div className="flex-1 px-2 py-1">
                      <span className="text-[10px] font-bold uppercase">{judge.judgeName}</span>
                    </div>
                    
                    {/* Court Number Boxes */}
                    <div className="flex">
                      {/* Court Box 1 */}
                      <div className="border-l-2 border-gray-800 px-2 py-1 text-center min-w-[40px]">
                        <div className="text-[9px] font-bold">{firstHearing?.court_number || ''}</div>
                        <div className="text-[7px]">{firstHearing?.bench || ''}</div>
                      </div>
                      
                      {/* Court Box 2 */}
                      <div className="border-l-2 border-gray-800 px-2 py-1 text-center min-w-[40px]">
                        <div className="text-[9px] font-bold"></div>
                        <div className="text-[7px]"></div>
                      </div>
                      
                      {/* Court Box 3 */}
                      <div className="border-l-2 border-gray-800 px-2 py-1 text-center min-w-[40px]">
                        <div className="text-[9px] font-bold"></div>
                        <div className="text-[7px]"></div>
                      </div>
                      
                      {/* Status Boxes */}
                      <div className="border-l-2 border-gray-800 w-[30px] h-[28px] bg-red-200"></div>
                      <div className="border-l-2 border-gray-800 w-[30px] h-[28px] bg-yellow-200"></div>
                      <div className="border-l-2 border-gray-800 w-[30px] h-[28px] bg-green-200"></div>
                    </div>
                  </div>
                  
                  {/* Hearings Table */}
                  <table className="w-full border-collapse border border-gray-400 text-[8px] leading-tight">
                    <thead>
                      <tr className="bg-gray-100">
                        <th className="border border-gray-400 px-0.5 py-0.5 text-center w-[30px]">Sr.No</th>
                        <th className="border border-gray-400 px-0.5 py-0.5 text-left w-[70px]">Case No.</th>
                        <th className="border border-gray-400 px-0.5 py-0.5 text-left">Petitioner</th>
                        <th className="border border-gray-400 px-0.5 py-0.5 text-left">Respondent</th>
                        <th className="border border-gray-400 px-0.5 py-0.5 text-left w-[60px]">AOR(P)</th>
                        <th className="border border-gray-400 px-0.5 py-0.5 text-left w-[60px]">AOR(R)</th>
                        <th className="border border-gray-400 px-0.5 py-0.5 text-center w-[40px]">Arguing</th>
                        <th className="border border-gray-400 px-0.5 py-0.5 text-left w-[50px]">Stage</th>
                        <th className="border border-gray-400 px-0.5 py-0.5 text-left w-[60px]">Relief</th>
                      </tr>
                    </thead>
                    <tbody>
                      {judge.hearings.map((hearing, idx) => (
                        <tr key={hearing.hearing_id}>
                          <td className="border border-gray-400 px-0.5 py-0.5 text-center">
                            <div className="font-bold">{hearing.serial_number || ''}</div>
                            <div className="text-[6px]">{hearing.bench || ''}</div>
                          </td>
                          <td className="border border-gray-400 px-0.5 py-0.5 font-medium">
                            {hearing.case_number || 'N/A'}
                          </td>
                          <td className="border border-gray-400 px-0.5 py-0.5">
                            {hearing.petitioner || '-'}
                          </td>
                          <td className="border border-gray-400 px-0.5 py-0.5">
                            {hearing.respondent || '-'}
                          </td>
                          <td className="border border-gray-400 px-0.5 py-0.5">
                            {hearing.formatted_aorp || '-'}
                          </td>
                          <td className="border border-gray-400 px-0.5 py-0.5">
                            {hearing.formatted_aorr || '-'}
                          </td>
                          <td className="border border-gray-400 px-0.5 py-0.5 text-center font-medium">
                            CBU
                          </td>
                          <td className="border border-gray-400 px-0.5 py-0.5">
                            {hearing.purpose_of_hearing || '-'}
                          </td>
                          <td className="border border-gray-400 px-0.5 py-0.5">
                            {hearing.relief || '-'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              );
            })}
          </div>
        ))}
        
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
