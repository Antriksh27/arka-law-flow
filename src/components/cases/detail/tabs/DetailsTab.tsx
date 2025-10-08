import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FileText, Gavel, AlertCircle, Calendar } from 'lucide-react';
import { LegalkartDocumentsTable } from '../../legalkart/LegalkartDocumentsTable';
import { LegalkartOrdersTable } from '../../legalkart/LegalkartOrdersTable';
import { LegalkartObjectionsTable } from '../../legalkart/LegalkartObjectionsTable';
import { LegalkartHistoryTable } from '../../legalkart/LegalkartHistoryTable';

interface DetailsTabProps {
  caseData: any;
  caseId: string;
}

export const DetailsTab: React.FC<DetailsTabProps> = ({ caseData, caseId }) => {
  const [activeSubTab, setActiveSubTab] = useState('documents');

  return (
    <Tabs value={activeSubTab} onValueChange={setActiveSubTab} className="space-y-6">
      <TabsList className="bg-[#F9FAFB] p-1 rounded-xl">
        <TabsTrigger value="documents" className="rounded-lg">
          <FileText className="w-4 h-4 mr-2" />
          Documents
        </TabsTrigger>
        <TabsTrigger value="orders" className="rounded-lg">
          <Gavel className="w-4 h-4 mr-2" />
          Orders
        </TabsTrigger>
        <TabsTrigger value="objections" className="rounded-lg">
          <AlertCircle className="w-4 h-4 mr-2" />
          Objections
        </TabsTrigger>
        <TabsTrigger value="history" className="rounded-lg">
          <Calendar className="w-4 h-4 mr-2" />
          Hearing History
        </TabsTrigger>
      </TabsList>

      <TabsContent value="documents">
        <LegalkartDocumentsTable caseId={caseId} />
      </TabsContent>

      <TabsContent value="orders">
        <LegalkartOrdersTable caseId={caseId} />
      </TabsContent>

      <TabsContent value="objections">
        <LegalkartObjectionsTable caseId={caseId} />
      </TabsContent>

      <TabsContent value="history">
        <LegalkartHistoryTable caseId={caseId} />
      </TabsContent>
    </Tabs>
  );
};
