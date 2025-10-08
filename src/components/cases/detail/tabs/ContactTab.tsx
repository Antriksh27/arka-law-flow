import React from 'react';

interface ContactTabProps {
  caseData: any;
}

export const ContactTab: React.FC<ContactTabProps> = ({ caseData }) => {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-bold text-[#1F2937] mb-4">Client Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4 text-sm">
          <div className="space-y-1">
            <p className="text-[#6B7280]">Name</p>
            <p className="font-medium text-[#1F2937]">{caseData.clients?.full_name || '-'}</p>
          </div>
          <div className="space-y-1">
            <p className="text-[#6B7280]">Email</p>
            <p className="font-medium text-[#1F2937]">{caseData.clients?.email || '-'}</p>
          </div>
          <div className="space-y-1">
            <p className="text-[#6B7280]">Phone</p>
            <p className="font-medium text-[#1F2937]">{caseData.clients?.phone || '-'}</p>
          </div>
          <div className="space-y-1 md:col-span-2">
            <p className="text-[#6B7280]">Address</p>
            <p className="font-medium text-[#1F2937]">{caseData.clients?.address || '-'}</p>
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-bold text-[#1F2937] mb-4">Case Contacts</h3>
        <p className="text-sm text-[#6B7280]">No additional contacts available</p>
      </div>
    </div>
  );
};
