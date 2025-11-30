import React, { useEffect, useState } from 'react';
import { useLegalkartIntegration } from '@/hooks/useLegalkartIntegration';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { CauseListHeader } from '@/components/cause-list/CauseListHeader';
import { CauseListContent } from '@/components/cause-list/CauseListContent';
import { BottomNavBar } from '@/components/mobile/BottomNavBar';

const CauseList = () => {
  const { getDisplayBoard } = useLegalkartIntegration();
  const [causeListData, setCauseListData] = useState<any>(null);

  useEffect(() => {
    getDisplayBoard.mutate(undefined, {
      onSuccess: (data) => {
        if (data.success) {
          setCauseListData(data.data);
        }
      }
    });
  }, []);

  return (
    <>
      <div className="max-w-7xl mx-auto p-4 sm:p-6 space-y-6 pb-20 sm:pb-6">
        <CauseListHeader onRefresh={() => {
          getDisplayBoard.mutate(undefined, {
            onSuccess: (data) => {
              if (data.success) {
                setCauseListData(data.data);
              }
            }
          });
        }} />
        
        {getDisplayBoard.isPending ? (
          <LoadingSpinner message="Fetching Gujarat Display Board data..." />
        ) : causeListData ? (
          <CauseListContent data={causeListData} />
        ) : (
          <div className="flex items-center justify-center min-h-[400px]">
            <p className="text-muted-foreground">No data available</p>
          </div>
        )}
      </div>
      <BottomNavBar />
    </>
  );
};

export default CauseList;
