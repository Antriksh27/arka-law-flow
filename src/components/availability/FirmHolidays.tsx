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
import { CalendarIcon, Plus, Trash2, AlertCircle, Building } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { TimeUtils } from '@/lib/timeUtils';
import { useAuth } from '@/contexts/AuthContext';

interface FirmHoliday {
  id: string;
  date: string;
  name: string;
  description: string | null;
  created_by: string | null;
}

export const FirmHolidays = () => {
  const [isAddingHoliday, setIsAddingHoliday] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const { firmId, role } = useAuth();
  const queryClient = useQueryClient();

  const { data: holidays, isLoading } = useQuery({
    queryKey: ['firm-holidays', firmId],
    queryFn: async () => {
      if (!firmId) return [];
      
      const { data, error } = await supabase
        .from('firm_holidays')
        .select('*')
        .eq('firm_id', firmId)
        .order('date', { ascending: true });

      if (error) throw error;
      return data as FirmHoliday[];
    },
    enabled: !!firmId
  });

  const createHolidayMutation = useMutation({
    mutationFn: async ({ date, name, description }: { date: string; name: string; description: string }) => {
      if (!firmId) throw new Error('No firm ID available');
      
      const { data, error } = await supabase
        .from('firm_holidays')
        .insert([{
          firm_id: firmId,
          date,
          name,
          description: description || null,
          created_by: (await supabase.auth.getUser()).data.user?.id
        }])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['firm-holidays'] });
      toast({ title: 'Firm holiday added successfully' });
      setIsAddingHoliday(false);
      setSelectedDate(undefined);
      setName('');
      setDescription('');
    },
    onError: (error) => {
      toast({ title: 'Error adding holiday', description: error.message, variant: 'destructive' });
    }
  });

  const deleteHolidayMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('firm_holidays')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['firm-holidays'] });
      toast({ title: 'Firm holiday removed successfully' });
    },
    onError: (error) => {
      toast({ title: 'Error removing holiday', description: error.message, variant: 'destructive' });
    }
  });

  const handleAddHoliday = async () => {
    if (!selectedDate || !name.trim()) return;

    const dateStr = format(selectedDate, 'yyyy-MM-dd');
    await createHolidayMutation.mutateAsync({ date: dateStr, name: name.trim(), description: description.trim() });
  };

  if (isLoading) {
    return <div>Loading firm holidays...</div>;
  }

  const today = new Date();
  const upcomingHolidays = holidays?.filter(holiday => new Date(holiday.date) >= today) || [];
  const pastHolidays = holidays?.filter(holiday => new Date(holiday.date) < today) || [];

  const isAdmin = role === 'admin';

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Building className="h-5 w-5 text-blue-600" />
          <div>
            <h2 className="text-xl font-semibold">Firm-wide Holidays</h2>
            <p className="text-sm text-muted-foreground">
              These holidays apply to all lawyers and juniors in the firm
            </p>
          </div>
        </div>
        {isAdmin && (
          <Button onClick={() => setIsAddingHoliday(true)} className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Add Holiday
          </Button>
        )}
      </div>

      {!isAdmin && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-blue-600" />
            <p className="text-sm text-blue-800">
              Only administrators can manage firm-wide holidays. These holidays automatically block availability for all team members.
            </p>
          </div>
        </div>
      )}

      {isAddingHoliday && isAdmin && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building className="h-5 w-5" />
              Add Firm Holiday
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Holiday Date</Label>
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
                      initialFocus
                      className="pointer-events-auto"
                    />
                  </PopoverContent>
                </Popover>
              </div>
              <div>
                <Label>Holiday Name</Label>
                <Input
                  placeholder="e.g., Christmas Day, Independence Day..."
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
            </div>
            <div>
              <Label>Description (Optional)</Label>
              <Textarea
                placeholder="Additional details about this holiday..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={2}
              />
            </div>
            <div className="flex items-center gap-2">
              <Button 
                onClick={handleAddHoliday} 
                disabled={!selectedDate || !name.trim() || createHolidayMutation.isPending}
              >
                {createHolidayMutation.isPending ? 'Adding...' : 'Add Holiday'}
              </Button>
              <Button variant="outline" onClick={() => {
                setIsAddingHoliday(false);
                setSelectedDate(undefined);
                setName('');
                setDescription('');
              }}>
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6">
        {upcomingHolidays.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <CalendarIcon className="h-4 w-4" />
                  Upcoming Holidays
                </span>
                <Badge variant="outline">{upcomingHolidays.length}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {upcomingHolidays.map(holiday => (
                  <div key={holiday.id} className="flex items-center justify-between p-4 border rounded-lg bg-gradient-to-r from-blue-50 to-indigo-50">
                    <div className="flex-1">
                      <div className="font-medium text-lg">
                        {holiday.name}
                      </div>
                      <div className="text-sm text-blue-600 font-medium">
                        {TimeUtils.formatDate(holiday.date)}
                      </div>
                      {holiday.description && (
                        <div className="text-sm text-muted-foreground mt-1">
                          {holiday.description}
                        </div>
                      )}
                    </div>
                    {isAdmin && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteHolidayMutation.mutate(holiday.id)}
                        disabled={deleteHolidayMutation.isPending}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {pastHolidays.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <CalendarIcon className="h-4 w-4" />
                  Past Holidays
                </span>
                <Badge variant="outline">{pastHolidays.length}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {pastHolidays.slice(-10).map(holiday => (
                  <div key={holiday.id} className="flex items-center justify-between p-3 border rounded-lg opacity-60">
                    <div>
                      <div className="font-medium">
                        {holiday.name}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {TimeUtils.formatDate(holiday.date)}
                      </div>
                      {holiday.description && (
                        <div className="text-sm text-muted-foreground mt-1">
                          {holiday.description}
                        </div>
                      )}
                    </div>
                    {isAdmin && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteHolidayMutation.mutate(holiday.id)}
                        disabled={deleteHolidayMutation.isPending}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))}
                {pastHolidays.length > 10 && (
                  <div className="text-center text-sm text-muted-foreground">
                    ... and {pastHolidays.length - 10} more past holidays
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {holidays?.length === 0 && (
          <Card>
            <CardContent className="text-center py-8">
              <Building className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="font-medium mb-2">No firm holidays</h3>
              <p className="text-sm text-muted-foreground mb-4">
                No firm-wide holidays have been set up yet. {isAdmin ? 'Add holidays that will block availability for all team members.' : 'Ask your administrator to set up firm holidays.'}
              </p>
              {isAdmin && (
                <Button onClick={() => setIsAddingHoliday(true)}>
                  Add First Holiday
                </Button>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};