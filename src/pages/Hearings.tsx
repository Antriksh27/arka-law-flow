import React, { useState } from 'react';
import { HearingsHeader } from '../components/hearings/HearingsHeader';
import { HearingsFilters } from '../components/hearings/HearingsFilters';
import { HearingsTimeline } from '../components/hearings/HearingsTimeline';
import { HearingsTable } from '../components/hearings/HearingsTable';
import { HearingsCalendarView } from '../components/hearings/HearingsCalendarView';
import { HearingsSummary } from '../components/hearings/HearingsSummary';
import { FilterState, ViewType } from '../components/hearings/types';
import { useIsMobile } from '@/hooks/use-mobile';
import { MobileHeader } from '@/components/mobile/MobileHeader';
import { BottomNavBar } from '@/components/mobile/BottomNavBar';
import { MobileHearingCard } from '../components/hearings/MobileHearingCard';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { useDialog } from '@/hooks/use-dialog';
import { HearingDetailsModal } from '../components/hearings/HearingDetailsModal';
import { Loader2, Plus, Calendar, SlidersHorizontal } from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import TimeUtils from '@/lib/timeUtils';

const Hearings = () => {
  const [viewType, setViewType] = useState<ViewType>('calendar');
  const [filters, setFilters] = useState<FilterState>({
    dateRange: { from: undefined, to: undefined },
    status: [],
    case: '',
    court: '',
    assignedUser: '',
    searchQuery: '',
    clientId: undefined,
  });
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const isMobile = useIsMobile();
  const { openDialog } = useDialog();

  // Mobile data fetching
  const { data: mobileHearings, isLoading: isMobileLoading } = useQuery({
    queryKey: ['hearings-mobile', filters.searchQuery],
    queryFn: async () => {
      let query = supabase
        .from('case_hearings')
        .select(`
          *,
          cases!inner(
            case_title,
            case_number,
            registration_number,
            court_name
          )
        `);

      const today = new Date();
      today.setHours(0, 0, 0, 0);
      query = query.gte('hearing_date', format(today, 'yyyy-MM-dd'));

      if (filters.searchQuery) {
        query = query.or(`judge.ilike.%${filters.searchQuery}%,purpose_of_hearing.ilike.%${filters.searchQuery}%`);
      }

      const { data, error } = await query.order('hearing_date', { ascending: true });
      if (error) throw error;
      return data || [];
    },
    enabled: isMobile,
  });

  const groupedHearings = React.useMemo(() => {
    if (!mobileHearings) return {};
    
    const groups: Record<string, any[]> = {};
    mobileHearings.forEach((hearing) => {
      if (!groups[hearing.hearing_date]) {
        groups[hearing.hearing_date] = [];
      }
      groups[hearing.hearing_date].push(hearing);
    });
    
    return groups;
  }, [mobileHearings]);

  const handleHearingClick = (hearing: any) => {
    openDialog(<HearingDetailsModal hearing={hearing} />);
  };

  if (isMobile) {
    return (
      <div className="min-h-screen bg-background pb-24">
        <MobileHeader 
          title="Hearings" 
          actions={
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowMobileFilters(true)}
            >
              <SlidersHorizontal className="w-5 h-5" />
            </Button>
          }
        />

        <div className="p-4 space-y-4">
          <Input
            placeholder="Search hearings..."
            value={filters.searchQuery}
            onChange={(e) => setFilters({ ...filters, searchQuery: e.target.value })}
            className="w-full"
          />

          {isMobileLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : !mobileHearings || mobileHearings.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
              <Calendar className="h-16 w-16 mb-4 opacity-20" />
              <p className="text-sm">No upcoming hearings</p>
            </div>
          ) : (
            Object.entries(groupedHearings).map(([date, hearings]) => (
              <div key={date} className="space-y-3">
                <h3 className="text-sm font-semibold text-muted-foreground px-1">
                  {TimeUtils.formatDate(TimeUtils.toISTDate(date)!, 'EEEE, MMMM d')}
                </h3>
                {hearings.map((hearing) => (
                  <MobileHearingCard
                    key={hearing.id}
                    hearing={hearing}
                    onClick={() => handleHearingClick(hearing)}
                  />
                ))}
              </div>
            ))
          )}
        </div>

        <Sheet open={showMobileFilters} onOpenChange={setShowMobileFilters}>
          <SheetContent side="bottom" className="h-[80vh]">
            <SheetHeader>
              <SheetTitle>Filter Hearings</SheetTitle>
            </SheetHeader>
            <div className="py-4">
              <HearingsFilters filters={filters} onFilterChange={setFilters} />
            </div>
          </SheetContent>
        </Sheet>

        <BottomNavBar />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      <HearingsHeader onViewChange={setViewType} currentView={viewType} />
      <HearingsSummary />
      <HearingsFilters filters={filters} onFilterChange={setFilters} />
      
      {viewType === 'calendar' ? (
        <HearingsCalendarView filters={filters} />
      ) : viewType === 'timeline' ? (
        <HearingsTimeline filters={filters} />
      ) : (
        <div className="bg-white border border-gray-200 rounded-2xl shadow-sm w-full">
          <HearingsTable filters={filters} />
        </div>
      )}
    </div>
  );
};

export default Hearings;
