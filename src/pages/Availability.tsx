import React, { useState } from 'react';
import DefaultPageLayout from '@/components/messages/ui/DefaultPageLayout';
import { AvailabilitySchedule } from '@/components/availability/AvailabilitySchedule';
import { AvailabilityExceptions } from '@/components/availability/AvailabilityExceptions';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calendar, Clock, AlertCircle } from 'lucide-react';

const Availability = () => {
  return (
    <DefaultPageLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">My Availability</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Manage your weekly schedule and blocked dates for appointment bookings
            </p>
          </div>
        </div>

        <Tabs defaultValue="schedule" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="schedule" className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Weekly Schedule
            </TabsTrigger>
            <TabsTrigger value="exceptions" className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4" />
              Blocked Dates
            </TabsTrigger>
          </TabsList>

          <TabsContent value="schedule" className="space-y-6">
            <AvailabilitySchedule />
          </TabsContent>

          <TabsContent value="exceptions" className="space-y-6">
            <AvailabilityExceptions />
          </TabsContent>
        </Tabs>
      </div>
    </DefaultPageLayout>
  );
};

export default Availability;