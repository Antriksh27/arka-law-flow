import React from 'react';

interface ContactTabProps {
  caseData: any;
}

export const ContactTab: React.FC<ContactTabProps> = ({ caseData }) => {
  const DataRow = ({ label, value }: { label: string; value: string }) => (
    <div className="flex py-3 border-b border-border last:border-0">
      <div className="w-56 text-sm font-medium text-muted-foreground">{label}</div>
      <div className="flex-1 text-sm text-foreground">{value || '-'}</div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-4">Client Information</h3>
        <div className="space-y-1">
          <DataRow label="Name" value={caseData.clients?.full_name} />
          <DataRow label="Email" value={caseData.clients?.email} />
          <DataRow label="Phone" value={caseData.clients?.phone} />
          <DataRow label="Address" value={caseData.clients?.address} />
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold mb-4">Case Contacts</h3>
        <p className="text-sm text-muted-foreground">No additional contacts available</p>
      </div>
    </div>
  );
};
