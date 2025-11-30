import React, { useState, useRef, useMemo } from 'react';
import { DailyBoardHeader } from '@/components/daily-board/DailyBoardHeader';
import { DailyBoardSummary } from '@/components/daily-board/DailyBoardSummary';
import { DailyBoardContent } from '@/components/daily-board/DailyBoardContent';
import { PrintView } from '@/components/daily-board/PrintView';
import { useDailyBoardData } from '@/hooks/useDailyBoardData';
import { DailyBoardFilters, GroupedHearings } from '@/components/daily-board/types';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { useToast } from '@/hooks/use-toast';
import html2pdf from 'html2pdf.js';
import { format } from 'date-fns';

const DailyBoard = () => {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [filters, setFilters] = useState<DailyBoardFilters>({
    searchQuery: '',
    court: 'all',
    judge: 'all',
    myHearingsOnly: false,
  });
  
  const printViewRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  
  const { data: hearings = [], isLoading } = useDailyBoardData(selectedDate, filters);
  
  // Group hearings by court and judge
  const groupedHearings = useMemo((): GroupedHearings[] => {
    const courtMap = new Map<string, Map<string, typeof hearings>>();
    
    hearings.forEach((hearing) => {
      const court = hearing.court_name || 'Unknown Court';
      const judge = hearing.judge || 'Unassigned';
      
      if (!courtMap.has(court)) {
        courtMap.set(court, new Map());
      }
      
      const judgeMap = courtMap.get(court)!;
      if (!judgeMap.has(judge)) {
        judgeMap.set(judge, []);
      }
      
      judgeMap.get(judge)!.push(hearing);
    });
    
    const result: GroupedHearings[] = [];
    courtMap.forEach((judgeMap, courtName) => {
      const judges: GroupedHearings['judges'] = [];
      judgeMap.forEach((hearings, judgeName) => {
        judges.push({ judgeName, hearings });
      });
      result.push({ courtName, judges });
    });
    
    return result;
  }, [hearings]);
  
  // Get unique courts and judges for filters
  const uniqueCourts = useMemo(() => {
    return Array.from(new Set(hearings.map(h => h.court_name).filter(Boolean)));
  }, [hearings]);
  
  const uniqueJudges = useMemo(() => {
    return Array.from(new Set(hearings.map(h => h.judge).filter(Boolean)));
  }, [hearings]);
  
  const handleExportPDF = async () => {
    if (!printViewRef.current) return;
    
    toast({ title: 'Generating PDF...', description: 'Please wait' });
    
    try {
      const options = {
        margin: [10, 10, 10, 10] as [number, number, number, number],
        filename: `Daily_Cause_List_${format(selectedDate, 'yyyy-MM-dd')}.pdf`,
        image: { type: 'jpeg' as const, quality: 0.98 },
        html2canvas: { scale: 2 },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'landscape' as const },
      };
      
      await html2pdf().set(options).from(printViewRef.current).save();
      
      toast({ title: 'PDF exported successfully!' });
    } catch (error) {
      console.error('PDF export error:', error);
      toast({ 
        title: 'Export failed', 
        description: 'Could not generate PDF',
        variant: 'destructive'
      });
    }
  };
  
  const handlePrint = () => {
    window.print();
  };
  
  const handleFiltersChange = (newFilters: DailyBoardFilters) => {
    // Handle "all" values
    setFilters({
      ...newFilters,
      court: newFilters.court === 'all' ? '' : newFilters.court,
      judge: newFilters.judge === 'all' ? '' : newFilters.judge,
    });
  };
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner message="Loading hearings..." />
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-gray-50 pb-20 print:bg-white">
      <div className="max-w-[1600px] mx-auto p-4 md:p-6 space-y-6 print:hidden">
        <DailyBoardHeader
          selectedDate={selectedDate}
          onDateChange={setSelectedDate}
          filters={{
            ...filters,
            court: filters.court || 'all',
            judge: filters.judge || 'all',
          }}
          onFiltersChange={handleFiltersChange}
          courts={uniqueCourts}
          judges={uniqueJudges}
          onExportPDF={handleExportPDF}
          onPrint={handlePrint}
        />
        
        <DailyBoardSummary
          groupedHearings={groupedHearings}
          totalCount={hearings.length}
        />
        
        <DailyBoardContent groupedHearings={groupedHearings} />
      </div>
      
      <PrintView
        ref={printViewRef}
        selectedDate={selectedDate}
        groupedHearings={groupedHearings}
      />
    </div>
  );
};

export default DailyBoard;
