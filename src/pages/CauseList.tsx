import React, { useEffect, useState } from 'react';
import { useLegalkartIntegration } from '@/hooks/useLegalkartIntegration';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { CauseListHeader } from '@/components/cause-list/CauseListHeader';
import { CauseListContent } from '@/components/cause-list/CauseListContent';
import { BottomNavBar } from '@/components/mobile/BottomNavBar';
import { Card } from '@/components/ui/card';

const CauseList = () => {
  const { getDisplayBoard } = useLegalkartIntegration();
  const [causeListData, setCauseListData] = useState<any>(null);

  useEffect(() => {
    getDisplayBoard.mutate(undefined, {
      onSuccess: (data) => {
        console.log('Gujarat Display Board API Response:', data);
        if (data.success) {
          // The LegalKart API response is nested: data.data contains { success, data: [] }
          const responseData = data.data?.data || data.data || [];
          console.log('Extracted data:', responseData, 'isArray:', Array.isArray(responseData));
          setCauseListData(responseData);
        }
      },
      onError: (error) => {
        console.error('Failed to fetch display board:', error);
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
        ) : causeListData && Array.isArray(causeListData) && causeListData.length === 0 ? (
          <Card className="p-8 text-center">
            <p className="text-muted-foreground">
              No cases currently listed on the Gujarat Display Board.
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              The display board is typically available during Gujarat High Court working hours (Mon-Fri, 10am-5pm IST).
            </p>
          </Card>
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
