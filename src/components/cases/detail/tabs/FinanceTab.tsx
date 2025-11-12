import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { InvoicesTab } from './InvoicesTab';
import { ExpensesTab } from './ExpensesTab';
import { PaymentsTab } from './PaymentsTab';
import { DollarSign, Receipt, CreditCard } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';

interface FinanceTabProps {
  caseId: string;
}

export const FinanceTab: React.FC<FinanceTabProps> = ({ caseId }) => {
  const [activeSubTab, setActiveSubTab] = useState('invoices');
  const isMobile = useIsMobile();

  const tabs = [
    { value: 'invoices', label: 'Invoices', icon: DollarSign },
    { value: 'expenses', label: 'Expenses', icon: Receipt },
    { value: 'payments', label: 'Payments', icon: CreditCard },
  ];

  return (
    <div className="space-y-4">
      <Tabs value={activeSubTab} onValueChange={setActiveSubTab} className="w-full">
        <TabsList className={`w-full ${isMobile ? 'grid grid-cols-3' : 'inline-flex'} bg-muted`}>
          {tabs.map(tab => {
            const IconComponent = tab.icon;
            return (
              <TabsTrigger 
                key={tab.value} 
                value={tab.value}
                className="gap-2 data-[state=active]:bg-background"
              >
                <IconComponent className="w-4 h-4" />
                {isMobile ? '' : tab.label}
              </TabsTrigger>
            );
          })}
        </TabsList>

        <TabsContent value="invoices" className="mt-4">
          <InvoicesTab caseId={caseId} />
        </TabsContent>

        <TabsContent value="expenses" className="mt-4">
          <ExpensesTab caseId={caseId} />
        </TabsContent>

        <TabsContent value="payments" className="mt-4">
          <PaymentsTab caseId={caseId} />
        </TabsContent>
      </Tabs>
    </div>
  );
};