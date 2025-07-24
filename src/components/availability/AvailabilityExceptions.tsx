import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { toast } from '@/hooks/use-toast';
import { CalendarIcon, Plus, Trash2, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

interface AvailabilityException {
  id: string;
  date: string;
  reason: string | null;
  is_blocked: boolean;
}

export const AvailabilityExceptions = () => {
  const [isAddingException, setIsAddingException] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();
  const [reason, setReason] = useState('');
  const queryClient = useQueryClient();

  const { data: exceptions, isLoading } = useQuery({
    queryKey: ['availability-exceptions'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('availability_exceptions')
        .select('*')
        .order('date', { ascending: true });

      if (error) throw error;
      return data as AvailabilityException[];
    }
  });

  const createExceptionMutation = useMutation({
    mutationFn: async ({ date, reason }: { date: string; reason: string }) => {
      const { data, error } = await supabase
        .from('availability_exceptions')
        .insert([{
          user_id: (await supabase.auth.getUser()).data.user?.id,
          date,
          reason: reason || null,
          is_blocked: true
        }])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['availability-exceptions'] });
      toast({ title: 'Blocked date added successfully' });
      setIsAddingException(false);
      setSelectedDate(undefined);
      setReason('');
    },
    onError: (error) => {
      toast({ title: 'Error adding blocked date', description: error.message, variant: 'destructive' });
    }
  });

  const deleteExceptionMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('availability_exceptions')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['availability-exceptions'] });
      toast({ title: 'Blocked date removed successfully' });
    },
    onError: (error) => {
      toast({ title: 'Error removing blocked date', description: error.message, variant: 'destructive' });
    }
  });

  const handleAddException = async () => {
    if (!selectedDate) return;

    const dateStr = format(selectedDate, 'yyyy-MM-dd');
    await createExceptionMutation.mutateAsync({ date: dateStr, reason });
  };

  if (isLoading) {
    return <div>Loading blocked dates...</div>;
  }

  const today = new Date();
  const upcomingExceptions = exceptions?.filter(exc => new Date(exc.date) >= today) || [];
  const pastExceptions = exceptions?.filter(exc => new Date(exc.date) < today) || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Blocked Dates</h2>
          <p className="text-sm text-muted-foreground">
            Manage dates when you're not available for appointments
          </p>
        </div>
        <Button onClick={() => setIsAddingException(true)} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Block Date
        </Button>
      </div>

      {isAddingException && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5" />
              Block New Date
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Select Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !selectedDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {selectedDate ? format(selectedDate, "PPP") : "Pick a date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={selectedDate}
                      onSelect={setSelectedDate}
                      disabled={(date) => date < today}
                      initialFocus
                      className="pointer-events-auto"
                    />
                  </PopoverContent>
                </Popover>
              </div>
              <div>
                <Label>Reason (Optional)</Label>
                <Textarea
                  placeholder="e.g., Holiday, Out of office, Personal day..."
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  rows={3}
                />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button onClick={handleAddException} disabled={!selectedDate}>
                Block Date
              </Button>
              <Button variant="outline" onClick={() => {
                setIsAddingException(false);
                setSelectedDate(undefined);
                setReason('');
              }}>
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6">
        {upcomingExceptions.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                Upcoming Blocked Dates
                <Badge variant="outline">{upcomingExceptions.length}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {upcomingExceptions.map(exception => (
                  <div key={exception.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <div className="font-medium">
                        {format(new Date(exception.date), 'EEEE, MMMM d, yyyy')}
                      </div>
                      {exception.reason && (
                        <div className="text-sm text-muted-foreground mt-1">
                          {exception.reason}
                        </div>
                      )}
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deleteExceptionMutation.mutate(exception.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {pastExceptions.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                Past Blocked Dates
                <Badge variant="outline">{pastExceptions.length}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {pastExceptions.slice(-10).map(exception => (
                  <div key={exception.id} className="flex items-center justify-between p-3 border rounded-lg opacity-60">
                    <div>
                      <div className="font-medium">
                        {format(new Date(exception.date), 'EEEE, MMMM d, yyyy')}
                      </div>
                      {exception.reason && (
                        <div className="text-sm text-muted-foreground mt-1">
                          {exception.reason}
                        </div>
                      )}
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deleteExceptionMutation.mutate(exception.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                {pastExceptions.length > 10 && (
                  <div className="text-center text-sm text-muted-foreground">
                    ... and {pastExceptions.length - 10} more past dates
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {exceptions?.length === 0 && (
          <Card>
            <CardContent className="text-center py-8">
              <AlertCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="font-medium mb-2">No blocked dates</h3>
              <p className="text-sm text-muted-foreground mb-4">
                You haven't blocked any dates yet. Add blocked dates for holidays, vacations, or other unavailable periods.
              </p>
              <Button onClick={() => setIsAddingException(true)}>
                Block Your First Date
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};