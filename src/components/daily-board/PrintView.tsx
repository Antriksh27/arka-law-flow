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
        <div className="text-center mb-4">
          <h1 className="text-lg font-bold uppercase mb-1">Daily Cause List</h1>
          <p className="text-sm">{format(selectedDate, 'EEEE, MMMM d, yyyy')}</p>
        </div>
        
        {groupedHearings.map((courtGroup) => (
          <div key={courtGroup.courtName} className="mb-4">
            <div className="bg-gray-100 px-3 py-1 mb-2">
              <h2 className="text-sm font-bold uppercase">{courtGroup.courtName}</h2>
            </div>
            
            {courtGroup.judges.map((judge) => {
              const firstHearing = judge.hearings[0];
              
              return (
                <div key={judge.judgeName} className="mb-4">
                  {/* Judge Header with Court Boxes - matching JudgeSection */}
                  <div className="bg-gray-50 px-3 py-2 flex items-center justify-between mb-1">
                    <h3 className="text-sm font-semibold uppercase underline">{judge.judgeName}</h3>
                    <div className="flex gap-1">
                      {/* Court Number Box 1 */}
                      <div className="border-2 border-gray-800 px-2 py-1 text-center bg-white min-w-[40px]">
                        <div className="font-bold text-[10px]">{firstHearing?.court_number || ''}</div>
                        <div className="text-[8px]">{firstHearing?.bench || ''}</div>
                      </div>
                      {/* Court Number Box 2 */}
                      <div className="border-2 border-gray-800 px-2 py-1 text-center bg-white min-w-[40px]">
                        <div className="font-bold text-[10px]"></div>
                        <div className="text-[8px]"></div>
                      </div>
                      {/* Court Number Box 3 */}
                      <div className="border-2 border-gray-800 px-2 py-1 text-center bg-white min-w-[40px]">
                        <div className="font-bold text-[10px]"></div>
                        <div className="text-[8px]"></div>
                      </div>
                      {/* Status Boxes */}
                      <div className="border-2 border-red-400 w-[30px] h-[28px] bg-red-200"></div>
                      <div className="border-2 border-yellow-400 w-[30px] h-[28px] bg-yellow-200"></div>
                      <div className="border-2 border-green-400 w-[30px] h-[28px] bg-green-200"></div>
                    </div>
                  </div>
                  
                  {/* Hearings Table - matching JudgeSection format */}
                  <table className="w-full border-collapse border border-gray-400 text-[9px] leading-tight">
                    <thead>
                      <tr className="bg-white">
                        <th className="border border-gray-400 px-1 py-1 text-left w-[40px] font-semibold">Sr.No</th>
                        <th className="border border-gray-400 px-1 py-1 text-left w-[80px] font-semibold">Case No</th>
                        <th className="border border-gray-400 px-1 py-1 text-left font-semibold">NameofParties</th>
                        <th className="border border-gray-400 px-1 py-1 text-center w-[50px] font-semibold">AORP</th>
                        <th className="border border-gray-400 px-1 py-1 text-left w-[60px] font-semibold">AORR</th>
                        <th className="border border-gray-400 px-1 py-1 text-left w-[70px] font-semibold">ArguingCouncil</th>
                      </tr>
                    </thead>
                    <tbody>
                      {judge.hearings.map((hearing) => (
                        <React.Fragment key={hearing.hearing_id}>
                          {/* Main case row */}
                          <tr>
                            {/* Sr.No with bench type */}
                            <td className="border border-gray-400 px-1 py-1 align-top">
                              <div className="font-bold">{hearing.serial_number || ''}</div>
                              <div className="text-[7px]">{hearing.bench || ''}</div>
                            </td>
                            {/* Case Number */}
                            <td className="border border-gray-400 px-1 py-1 align-top font-medium">
                              {hearing.case_number || 'N/A'}
                            </td>
                            {/* Name of Parties */}
                            <td className="border border-gray-400 px-1 py-1 align-top">
                              <div>{hearing.petitioner || '-'}</div>
                              <div className="text-[7px] text-gray-500">VS</div>
                              <div>{hearing.respondent || '-'}</div>
                            </td>
                            {/* AORP */}
                            <td className="border border-gray-400 px-1 py-1 align-top text-center">
                              <div>{hearing.formatted_aorp || '-'}</div>
                              <div className="text-[7px] text-gray-500">(Pet.1)</div>
                            </td>
                            {/* AORR */}
                            <td className="border border-gray-400 px-1 py-1 align-top">
                              <div>{hearing.formatted_aorr || '-'}</div>
                              <div className="text-[7px] text-gray-500">(Res.)</div>
                            </td>
                            {/* Arguing Council */}
                            <td className="border border-gray-400 px-1 py-1 align-top">
                              {hearing.coram || 'CBU'}
                            </td>
                          </tr>
                          
                          {/* Stage row */}
                          <tr>
                            <td className="border border-gray-400 px-1 py-0.5 font-medium text-[8px]">Stage</td>
                            <td colSpan={5} className="border border-gray-400 px-1 py-0.5">
                              {hearing.purpose_of_hearing || '-'}
                            </td>
                          </tr>
                          
                          {/* Relief row */}
                          <tr>
                            <td className="border border-gray-400 px-1 py-0.5 font-medium text-[8px]">Relief</td>
                            <td colSpan={5} className="border border-gray-400 px-1 py-0.5">
                              {hearing.relief || '-'}
                            </td>
                          </tr>
                          
                          {/* Acts row */}
                          <tr className="bg-gray-50">
                            <td className="border border-gray-400 px-1 py-0.5 font-medium text-[8px]">Acts</td>
                            <td colSpan={5} className="border border-gray-400 px-1 py-0.5">
                              {hearing.acts && hearing.acts.length > 0 
                                ? hearing.acts.join(', ') 
                                : '-'}
                            </td>
                          </tr>
                        </React.Fragment>
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
