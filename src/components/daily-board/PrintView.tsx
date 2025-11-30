import React from 'react';
import { format } from 'date-fns';
import { GroupedHearings } from './types';
import { formatAdvocatesSmart } from './utils';

interface PrintViewProps {
  selectedDate: Date;
  groupedHearings: GroupedHearings[];
}

export const PrintView = React.forwardRef<HTMLDivElement, PrintViewProps>(
  ({ selectedDate, groupedHearings }, ref) => {
    return (
      <div ref={ref} className="hidden print:block bg-white p-8">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold uppercase mb-2">Daily Cause List</h1>
          <p className="text-lg">{format(selectedDate, 'EEEE, MMMM d, yyyy')}</p>
        </div>
        
        {groupedHearings.map((courtGroup) => {
          let serialNo = 1;
          
          return (
            <div key={courtGroup.courtName} className="mb-8 break-inside-avoid">
              <div className="bg-gray-100 px-4 py-3 mb-4">
                <h2 className="text-xl font-bold uppercase">{courtGroup.courtName}</h2>
              </div>
              
              {courtGroup.judges.map((judge) => (
                <div key={judge.judgeName} className="mb-6 break-inside-avoid">
                  <div className="bg-gray-50 px-4 py-2 mb-3">
                    <h3 className="text-lg font-semibold uppercase">{judge.judgeName}</h3>
                  </div>
                  
                  <table className="w-full border-collapse border border-gray-300 text-sm">
                    <thead>
                      <tr className="bg-gray-100">
                        <th className="border border-gray-300 px-2 py-2 text-left w-12">Sr.</th>
                        <th className="border border-gray-300 px-2 py-2 text-left">Case No.</th>
                        <th className="border border-gray-300 px-2 py-2 text-left">Petitioner</th>
                        <th className="border border-gray-300 px-2 py-2 text-left">Respondent</th>
                        <th className="border border-gray-300 px-2 py-2 text-left">AORP</th>
                        <th className="border border-gray-300 px-2 py-2 text-left">AORR</th>
                        <th className="border border-gray-300 px-2 py-2 text-left">Arguing</th>
                        <th className="border border-gray-300 px-2 py-2 text-left">Stage</th>
                        <th className="border border-gray-300 px-2 py-2 text-left">Relief</th>
                      </tr>
                    </thead>
                    <tbody>
                      {judge.hearings.map((hearing) => {
                        const row = (
                          <tr key={hearing.hearing_id}>
                            <td className="border border-gray-300 px-2 py-2">{serialNo}</td>
                            <td className="border border-gray-300 px-2 py-2 font-medium">
                              {hearing.case_number || 'N/A'}
                            </td>
                            <td className="border border-gray-300 px-2 py-2">
                              {hearing.petitioner || '-'}
                            </td>
                            <td className="border border-gray-300 px-2 py-2">
                              {hearing.respondent || '-'}
                            </td>
                            <td className="border border-gray-300 px-2 py-2">
                              {formatAdvocatesSmart(hearing.petitioner_advocate, 'petitioner')}
                            </td>
                            <td className="border border-gray-300 px-2 py-2">
                              {formatAdvocatesSmart(hearing.respondent_advocate, 'respondent')}
                            </td>
                            <td className="border border-gray-300 px-2 py-2 font-medium">
                              CBU
                            </td>
                            <td className="border border-gray-300 px-2 py-2">
                              {hearing.purpose_of_hearing || '-'}
                            </td>
                            <td className="border border-gray-300 px-2 py-2">
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
              size: A4 landscape;
              margin: 20mm;
            }
            body {
              print-color-adjust: exact;
              -webkit-print-color-adjust: exact;
            }
          }
        `}</style>
      </div>
    );
  }
);

PrintView.displayName = 'PrintView';
