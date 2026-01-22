import React, { useState, useRef, useMemo, useEffect, useCallback } from 'react';
import { DailyBoardHeader } from '@/components/daily-board/DailyBoardHeader';
import { DailyBoardSummary } from '@/components/daily-board/DailyBoardSummary';
import { DailyBoardContent } from '@/components/daily-board/DailyBoardContent';
import { PrintView } from '@/components/daily-board/PrintView';
import { useDailyBoardData } from '@/hooks/useDailyBoardData';
import { DailyBoardFilters, GroupedHearings, CourtBox, JudgeBoxesMap } from '@/components/daily-board/types';
import { useToast } from '@/hooks/use-toast';
import html2pdf from 'html2pdf.js';
import { format } from 'date-fns';
import { useIsMobile } from '@/hooks/use-mobile';
import { MobileHeader } from '@/components/mobile/MobileHeader';

import { MobileDailyBoardCard } from '@/components/daily-board/MobileDailyBoardCard';
import { Button } from '@/components/ui/button';
import { Calendar as CalendarIcon, Loader2, RefreshCw } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown } from 'lucide-react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { cn } from '@/lib/utils';

const DailyBoard = () => {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [isGenerated, setIsGenerated] = useState(false);
  const [filters, setFilters] = useState<DailyBoardFilters>({
    searchQuery: '',
    court: 'all',
    judge: 'all',
    myHearingsOnly: false,
  });
  const [judgeBoxes, setJudgeBoxes] = useState<JudgeBoxesMap>({});
  
  const printViewRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const isMobile = useIsMobile();
  
  const { data: hearings = [], isFetching, refetch } = useDailyBoardData(selectedDate, filters);
  
  // Reset isGenerated and judgeBoxes when date changes
  useEffect(() => {
    setIsGenerated(false);
    setJudgeBoxes({});
  }, [selectedDate]);

  const handleGenerate = async () => {
    await refetch();
    setIsGenerated(true);
  };

  const handleJudgeBoxesChange = useCallback((judgeName: string, boxes: CourtBox[]) => {
    setJudgeBoxes(prev => ({
      ...prev,
      [judgeName]: boxes,
    }));
  }, []);
  
  // Group hearings by court and judge
  const groupedHearings = useMemo((): GroupedHearings[] => {
    const courtMap = new Map<string, Map<string, typeof hearings>>();
    
    hearings.forEach((hearing) => {
      const court = hearing.court_name || hearing.case_court_name || 'Gujarat High Court';
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
      printViewRef.current.classList.remove('hidden');
      printViewRef.current.classList.add('block');
      
      const options = {
        margin: [10, 10, 10, 10] as [number, number, number, number],
        filename: `Daily_Cause_List_${format(selectedDate, 'yyyy-MM-dd')}.pdf`,
        image: { type: 'jpeg' as const, quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' as const },
      };
      
      await html2pdf().set(options).from(printViewRef.current).save();
      
      printViewRef.current.classList.add('hidden');
      printViewRef.current.classList.remove('block');
      
      toast({ title: 'PDF exported successfully!' });
    } catch (error) {
      console.error('PDF export error:', error);
      if (printViewRef.current) {
        printViewRef.current.classList.add('hidden');
        printViewRef.current.classList.remove('block');
      }
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
    setFilters({
      ...newFilters,
      court: newFilters.court === 'all' ? '' : newFilters.court,
      judge: newFilters.judge === 'all' ? '' : newFilters.judge,
    });
  };

  if (isMobile) {
    return (
      <div className="min-h-screen bg-background pb-24">
        <MobileHeader 
          title="Daily Board"
          actions={
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="ghost" size="icon">
                  <CalendarIcon className="w-5 h-5" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="end">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={(date) => date && setSelectedDate(date)}
                  className={cn("p-3 pointer-events-auto")}
                />
              </PopoverContent>
            </Popover>
          }
        />

        <div className="p-4 space-y-4">
          <div className="bg-white rounded-xl p-4 shadow-sm">
            <p className="text-sm text-muted-foreground mb-1">
              {format(selectedDate, 'EEEE, MMMM d, yyyy')}
            </p>
            {isGenerated ? (
              <p className="text-2xl font-bold text-primary">
                {hearings.length} Hearings
              </p>
            ) : (
              <p className="text-sm text-muted-foreground">
                Click generate to load hearings
              </p>
            )}
          </div>

          {!isGenerated ? (
            <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
              <CalendarIcon className="h-16 w-16 mb-4 opacity-20" />
              <p className="text-sm mb-4">Select a date and generate the board</p>
              <Button onClick={handleGenerate} disabled={isFetching} className="min-w-[160px]">
                {isFetching ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Generate Board
                  </>
                )}
              </Button>
            </div>
          ) : isFetching ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : groupedHearings.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
              <CalendarIcon className="h-16 w-16 mb-4 opacity-20" />
              <p className="text-sm">No hearings for this date</p>
              <Button variant="outline" onClick={handleGenerate} className="mt-4">
                <RefreshCw className="h-4 w-4 mr-2" />
                Regenerate
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <Button variant="outline" onClick={handleGenerate} disabled={isFetching} className="w-full">
                {isFetching ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <RefreshCw className="h-4 w-4 mr-2" />
                )}
                Regenerate
              </Button>
              
              {groupedHearings.map((court) => (
                <Collapsible key={court.courtName} defaultOpen>
                  <CollapsibleTrigger className="w-full">
                    <div className="bg-white rounded-xl p-4 shadow-sm flex items-center justify-between">
                      <div className="flex-1 text-left">
                        <h3 className="font-semibold text-sm">{court.courtName}</h3>
                        <p className="text-xs text-muted-foreground">
                          {court.judges.reduce((sum, j) => sum + j.hearings.length, 0)} hearings
                        </p>
                      </div>
                      <ChevronDown className="w-5 h-5 text-muted-foreground transition-transform ui-expanded:rotate-180" />
                    </div>
                  </CollapsibleTrigger>
                  <CollapsibleContent className="space-y-4 mt-4">
                    {court.judges.map((judge) => (
                      <div key={judge.judgeName} className="space-y-3">
                        <div className="px-2">
                          <h4 className="font-semibold text-xs text-muted-foreground">
                            {judge.judgeName}
                          </h4>
                        </div>
                        {judge.hearings.map((hearing, idx) => (
                          <MobileDailyBoardCard
                            key={hearing.hearing_id}
                            hearing={hearing}
                            index={idx + 1}
                          />
                        ))}
                      </div>
                    ))}
                  </CollapsibleContent>
                </Collapsible>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }
  
  return (
    <DashboardLayout>
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
            onGenerate={handleGenerate}
            isGenerating={isFetching}
            isGenerated={isGenerated}
          />
          
          {!isGenerated ? (
            <div className="bg-white rounded-2xl shadow-sm p-12 text-center">
              <CalendarIcon className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-20" />
              <p className="text-muted-foreground">
                Select a date and click "Generate Board" to fetch the latest hearing data
              </p>
            </div>
          ) : isFetching ? (
            <div className="bg-white rounded-2xl shadow-sm p-12 text-center">
              <Loader2 className="h-8 w-8 mx-auto mb-4 animate-spin text-primary" />
              <p className="text-muted-foreground">Loading hearings...</p>
            </div>
          ) : (
            <>
              <DailyBoardSummary
                groupedHearings={groupedHearings}
                totalCount={hearings.length}
              />
              <DailyBoardContent 
                groupedHearings={groupedHearings}
                judgeBoxes={judgeBoxes}
                onJudgeBoxesChange={handleJudgeBoxesChange}
              />
            </>
          )}
        </div>
        
        <PrintView
          ref={printViewRef}
          selectedDate={selectedDate}
          groupedHearings={groupedHearings}
          judgeBoxes={judgeBoxes}
        />
      </div>
    </DashboardLayout>
  );
};

export default DailyBoard;
