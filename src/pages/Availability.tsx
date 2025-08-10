import React, { useEffect, useState } from 'react';
import DefaultPageLayout from '@/components/messages/ui/DefaultPageLayout';
import { AvailabilitySchedule } from '@/components/availability/AvailabilitySchedule';
import { AvailabilityExceptions } from '@/components/availability/AvailabilityExceptions';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calendar, Clock, AlertCircle, List, LayoutGrid } from 'lucide-react';

const Availability = () => {
  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list');

  useEffect(() => {
    document.title = 'My Availability | Working hours & blocked dates';
  }, []);

  return (
    <DefaultPageLayout>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Availability</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Set your weekly hours and date-specific blocks. These control when clients can book you.
            </p>
          </div>
        </div>

        {/* Top Tabs like Calendly */}
        <Tabs defaultValue="schedules" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 rounded-xl border bg-gray-50 p-1">
            <TabsTrigger value="schedules" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm hover-scale">Schedules</TabsTrigger>
            <TabsTrigger value="holidays" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm hover-scale">Holidays</TabsTrigger>
            <TabsTrigger value="settings" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm hover-scale">Calendar settings</TabsTrigger>
          </TabsList>

          {/* Schedules Tab */}
          <TabsContent value="schedules" className="space-y-6">
            {/* Schedule Header Bar */}
            <div className="rounded-2xl border bg-white p-5 shadow-sm hover:shadow-md transition-shadow animate-fade-in">
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <div className="text-sm text-muted-foreground">Schedule</div>
                  <div className="text-lg font-semibold text-gray-900">Working hours (default)</div>
                  <div className="text-xs text-muted-foreground mt-1">Active on: 1 event type</div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setViewMode('list')}
                    className={`inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm ${
                      viewMode === 'list' ? 'bg-accent' : 'bg-white'
                    }`}
                    aria-label="List view"
                  >
                    <List className="h-4 w-4" /> List
                  </button>
                  <button
                    type="button"
                    onClick={() => setViewMode('calendar')}
                    className={`inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm ${
                      viewMode === 'calendar' ? 'bg-accent' : 'bg-white'
                    }`}
                    aria-label="Calendar view"
                  >
                    <LayoutGrid className="h-4 w-4" /> Calendar
                  </button>
                </div>
              </div>
            </div>

            {/* Main Content: Weekly hours + Date-specific hours */}
            {viewMode === 'list' ? (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <section className="rounded-2xl border bg-white p-5 shadow-sm">
                  <header className="flex items-center justify-between mb-4">
                    <div>
                      <h2 className="text-base font-medium text-gray-900">Weekly hours</h2>
                      <p className="text-xs text-muted-foreground">Set when you are typically available for meetings</p>
                    </div>
                  </header>
                  <AvailabilitySchedule />
                </section>

                <aside className="rounded-2xl border bg-white p-5 shadow-sm">
                  <header className="flex items-center justify-between mb-4">
                    <div>
                      <h2 className="text-base font-medium text-gray-900">Date-specific hours</h2>
                      <p className="text-xs text-muted-foreground">Adjust hours for specific days (use as blocked dates)</p>
                    </div>
                    <div className="text-xs text-muted-foreground">+ Hours</div>
                  </header>
                  <AvailabilityExceptions />
                </aside>
              </div>
            ) : (
              <div className="rounded-2xl border bg-white p-5 shadow-sm">
                <div className="flex items-center gap-2 mb-4">
                  <Calendar className="h-4 w-4" />
                  <h2 className="text-base font-medium text-gray-900">Availability calendar (preview)</h2>
                </div>
                {/* Lightweight preview: reuse the schedule list for now */}
                <p className="text-sm text-muted-foreground mb-4">Preview your bookable days based on weekly hours and blocked dates.</p>
                <div className="text-sm text-muted-foreground">Switch back to List to edit hours.</div>
              </div>
            )}
          </TabsContent>

          {/* Holidays Tab */}
          <TabsContent value="holidays" className="space-y-6">
            <div className="rounded-2xl border bg-white p-5 shadow-sm">
              <h2 className="text-base font-medium text-gray-900 mb-2">Holidays</h2>
              <p className="text-xs text-muted-foreground mb-4">Add blocked dates and tag the reason as "Holiday".</p>
              <AvailabilityExceptions />
            </div>
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings" className="space-y-6">
            <div className="rounded-2xl border bg-white p-5 shadow-sm">
              <h2 className="text-base font-medium text-gray-900 mb-2">Calendar settings</h2>
              <ul className="text-sm text-muted-foreground list-disc pl-5 space-y-2">
                <li>Appointment duration and buffer are configured per day in Weekly hours.</li>
                <li>Blocked dates override weekly hours.</li>
                <li>Your firm can book you only within these available times.</li>
              </ul>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </DefaultPageLayout>
  );
};

export default Availability;