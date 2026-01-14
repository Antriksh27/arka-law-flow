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
        {/* Header with Company Logo - Centered */}
        <div className="text-center mb-4 pb-3 border-b-2 border-gray-300 print-header">
          <img 
            src="/lovable-uploads/89ea18cf-8c73-4793-9dcc-1a192855a630.png" 
            alt="HRU Legal" 
            className="h-[162px] w-auto mx-auto mb-2"
          />
          <h1 className="text-lg font-bold uppercase mb-1">Daily Cause List</h1>
          <p className="text-sm">{format(selectedDate, 'EEEE, MMMM d, yyyy')}</p>
        </div>
        
        {groupedHearings.map((courtGroup) => (
          <div key={courtGroup.courtName} className="mb-4 court-group">
            <div className="bg-gray-100 px-3 py-1 mb-2">
              <h2 className="text-sm font-bold uppercase">{courtGroup.courtName}</h2>
            </div>
            
            {courtGroup.judges.map((judge) => {
              const firstHearing = judge.hearings[0];
              
              return (
                <div key={judge.judgeName} className="mb-4 judge-section">
                  {/* Judge Header with Court Boxes */}
                  <div className="bg-gray-50 px-3 py-2 flex items-center justify-between mb-1 judge-header">
                    <h3 className="text-sm font-semibold uppercase underline flex-1">{judge.judgeName}</h3>
                    <div className="flex items-center gap-1">
                      {/* Court Number Box 1 */}
                      <div className="border-2 border-gray-800 text-center bg-white min-w-[40px] h-[32px] flex flex-col items-center justify-center">
                        <div className="font-bold text-[10px] leading-tight">{firstHearing?.court_number || ''}</div>
                        <div className="text-[8px] leading-tight">{firstHearing?.bench || ''}</div>
                      </div>
                      {/* Court Number Box 2 */}
                      <div className="border-2 border-gray-800 text-center bg-white min-w-[40px] h-[32px] flex flex-col items-center justify-center">
                        <div className="font-bold text-[10px] leading-tight"></div>
                        <div className="text-[8px] leading-tight"></div>
                      </div>
                      {/* Court Number Box 3 */}
                      <div className="border-2 border-gray-800 text-center bg-white min-w-[40px] h-[32px] flex flex-col items-center justify-center">
                        <div className="font-bold text-[10px] leading-tight"></div>
                        <div className="text-[8px] leading-tight"></div>
                      </div>
                      {/* Status Boxes */}
                      <div className="border-2 border-red-400 w-[30px] h-[32px] bg-red-200"></div>
                      <div className="border-2 border-yellow-400 w-[30px] h-[32px] bg-yellow-200"></div>
                      <div className="border-2 border-green-400 w-[30px] h-[32px] bg-green-200"></div>
                    </div>
                  </div>
                  
                  {/* Table Header */}
                  <div className="w-full border border-gray-400 text-[9px] leading-normal table-header-row">
                    <div className="flex bg-white">
                      <div className="border-r border-gray-400 px-2 py-1.5 font-semibold w-[40px]">Sr.No</div>
                      <div className="border-r border-gray-400 px-2 py-1.5 font-semibold w-[80px]">Case No</div>
                      <div className="border-r border-gray-400 px-2 py-1.5 font-semibold flex-1">NameofParties</div>
                      <div className="border-r border-gray-400 px-2 py-1.5 font-semibold text-center w-[70px]">AORP</div>
                      <div className="border-r border-gray-400 px-2 py-1.5 font-semibold w-[80px]">AORR</div>
                      <div className="px-2 py-1.5 font-semibold w-[70px]">ArguingCouncil</div>
                    </div>
                  </div>
                  
                  {/* Each hearing as separate block for proper page breaks */}
                  {judge.hearings.map((hearing, index) => (
                    <div key={hearing.hearing_id} className="hearing-block">
                      {/* Main case row */}
                      <div className="flex w-full border-l border-r border-b border-gray-400 text-[9px] leading-normal">
                        <div className="border-r border-gray-400 px-2 py-2 w-[40px] align-top">
                          <div className="font-bold">{index + 1}</div>
                        </div>
                        <div className="border-r border-gray-400 px-2 py-2 w-[80px] font-medium">
                          {hearing.case_number || 'N/A'}
                        </div>
                        <div className="border-r border-gray-400 px-2 py-2 flex-1">
                          <div>{hearing.petitioner || '-'}</div>
                          <div className="text-[8px] text-gray-500 my-1">VS</div>
                          <div>{hearing.respondent || '-'}</div>
                        </div>
                        <div className="border-r border-gray-400 px-2 py-2 w-[70px] text-center">
                          <div>{hearing.formatted_aorp || '-'}</div>
                          <div className="text-[8px] text-gray-500 mt-1">(Pet.1)</div>
                        </div>
                        <div className="border-r border-gray-400 px-2 py-2 w-[80px]">
                          <div>{hearing.formatted_aorr || '-'}</div>
                          <div className="text-[8px] text-gray-500 mt-1">(Res.)</div>
                        </div>
                        <div className="px-2 py-2 w-[70px]">
                          {hearing.coram || 'CBU'}
                        </div>
                      </div>
                      
                      {/* Stage row */}
                      <div className="flex w-full border-l border-r border-b border-gray-400 text-[9px]">
                        <div className="border-r border-gray-400 px-2 py-1.5 font-medium w-[40px]">Stage</div>
                        <div className="px-2 py-1.5 flex-1">
                          {hearing.purpose_of_hearing || '-'}
                        </div>
                      </div>
                      
                      {/* Relief row */}
                      <div className="flex w-full border-l border-r border-b border-gray-400 text-[9px]">
                        <div className="border-r border-gray-400 px-2 py-1.5 font-medium w-[40px]">Relief</div>
                        <div className="px-2 py-1.5 flex-1">
                          {hearing.relief || '-'}
                        </div>
                      </div>
                      
                      {/* Acts row */}
                      <div className="flex w-full border-l border-r border-b border-gray-400 text-[9px] bg-gray-50">
                        <div className="border-r border-gray-400 px-2 py-1.5 font-medium w-[40px]">Acts</div>
                        <div className="px-2 py-1.5 flex-1">
                          {hearing.acts && hearing.acts.length > 0 
                            ? hearing.acts.join(', ') 
                            : '-'}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              );
            })}
          </div>
        ))}
        
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
            /* Each hearing block stays together */
            .print-view .hearing-block {
              page-break-inside: avoid;
              break-inside: avoid;
            }
            /* Judge sections can break between hearings */
            .print-view .judge-section {
              page-break-inside: auto;
              break-inside: auto;
            }
            /* Try to keep judge header with first hearing */
            .print-view .judge-header {
              page-break-after: avoid;
              break-after: avoid;
            }
            /* Table header should stay with content */
            .print-view .table-header-row {
              page-break-after: avoid;
              break-after: avoid;
            }
            /* Court groups can break naturally */
            .print-view .court-group {
              page-break-inside: auto;
              break-inside: auto;
            }
          }
        `}</style>
      </div>
    );
  }
);

PrintView.displayName = 'PrintView';