import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';
import { CauseListTable } from './CauseListTable';

interface CauseListContentProps {
  data: any[];
}

export const CauseListContent: React.FC<CauseListContentProps> = ({ data }) => {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredData = data?.filter(item => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      item.case_number?.toLowerCase().includes(query) ||
      item.petitioner?.toLowerCase().includes(query) ||
      item.respondent?.toLowerCase().includes(query) ||
      item.advocate?.toLowerCase().includes(query)
    );
  });

  return (
    <div className="space-y-4">
      <Card className="p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by case number, parties, or advocate..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
      </Card>

      <Card className="p-6">
        <div className="mb-4">
          <h2 className="text-lg font-semibold">
            Cause List Items
            <span className="ml-2 text-sm font-normal text-muted-foreground">
              ({filteredData?.length || 0} cases)
            </span>
          </h2>
        </div>
        <CauseListTable data={filteredData || []} />
      </Card>
    </div>
  );
};
