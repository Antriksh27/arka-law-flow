import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';
import { Plus, Trash2, Save } from 'lucide-react';

interface AvailabilityRule {
  id: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  appointment_duration: number;
  buffer_time: number;
  max_appointments_per_day: number | null;
  is_active: boolean;
}

const DAYS_OF_WEEK = [
  { value: 0, label: 'Sunday' },
  { value: 1, label: 'Monday' },
  { value: 2, label: 'Tuesday' },
  { value: 3, label: 'Wednesday' },
  { value: 4, label: 'Thursday' },
  { value: 5, label: 'Friday' },
  { value: 6, label: 'Saturday' },
];

const DURATION_OPTIONS = [15, 30, 45, 60, 90, 120];

export const AvailabilitySchedule = () => {
  const [editingRules, setEditingRules] = useState<Partial<AvailabilityRule>[]>([]);
  const queryClient = useQueryClient();

  const { data: availabilityRules, isLoading } = useQuery({
    queryKey: ['availability-rules'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('availability_rules')
        .select('*')
        .order('day_of_week', { ascending: true })
        .order('start_time', { ascending: true });

      if (error) throw error;
      return data as AvailabilityRule[];
    }
  });

  const createRuleMutation = useMutation({
    mutationFn: async (rule: Omit<AvailabilityRule, 'id'>) => {
      const { data, error } = await supabase
        .from('availability_rules')
        .insert([{
          ...rule,
          user_id: (await supabase.auth.getUser()).data.user?.id
        }])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['availability-rules'] });
      toast({ title: 'Availability rule added successfully' });
    },
    onError: (error) => {
      toast({ title: 'Error adding availability rule', description: error.message, variant: 'destructive' });
    }
  });

  const updateRuleMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<AvailabilityRule> }) => {
      const { error } = await supabase
        .from('availability_rules')
        .update(updates)
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['availability-rules'] });
      toast({ title: 'Availability rule updated successfully' });
    },
    onError: (error) => {
      toast({ title: 'Error updating availability rule', description: error.message, variant: 'destructive' });
    }
  });

  const deleteRuleMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('availability_rules')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['availability-rules'] });
      toast({ title: 'Availability rule deleted successfully' });
    },
    onError: (error) => {
      toast({ title: 'Error deleting availability rule', description: error.message, variant: 'destructive' });
    }
  });

  const addNewRule = () => {
    setEditingRules([...editingRules, {
      day_of_week: 1,
      start_time: '09:00',
      end_time: '17:00',
      appointment_duration: 30,
      buffer_time: 0,
      max_appointments_per_day: null,
      is_active: true
    }]);
  };

  const saveNewRule = async (index: number) => {
    const rule = editingRules[index];
    if (rule.day_of_week !== undefined && rule.start_time && rule.end_time && rule.start_time < rule.end_time) {
      await createRuleMutation.mutateAsync(rule as Omit<AvailabilityRule, 'id'>);
      setEditingRules(editingRules.filter((_, i) => i !== index));
    }
  };

  const updateEditingRule = (index: number, field: string, value: any) => {
    const updated = [...editingRules];
    updated[index] = { ...updated[index], [field]: value };
    setEditingRules(updated);
  };

  const toggleRuleActive = async (rule: AvailabilityRule) => {
    await updateRuleMutation.mutateAsync({
      id: rule.id,
      updates: { is_active: !rule.is_active }
    });
  };

  if (isLoading) {
    return <div>Loading availability rules...</div>;
  }

  const rulesByDay = DAYS_OF_WEEK.map(day => ({
    ...day,
    rules: availabilityRules?.filter(rule => rule.day_of_week === day.value) || []
  }));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Weekly Schedule</h2>
          <p className="text-sm text-muted-foreground">
            Set your available time slots for each day of the week
          </p>
        </div>
        <Button onClick={addNewRule} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Add Time Slot
        </Button>
      </div>

      <div className="grid gap-6">
        {rulesByDay.map(day => (
          <Card key={day.value}>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>{day.label}</span>
                <Badge variant={day.rules.length > 0 ? 'default' : 'outline'}>
                  {day.rules.length} slot{day.rules.length !== 1 ? 's' : ''}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {day.rules.map(rule => (
                <div key={rule.id} className="flex items-center gap-4 p-4 border rounded-lg">
                  <div className="grid grid-cols-4 gap-4 flex-1">
                    <div>
                      <Label className="text-xs">Start Time</Label>
                      <div className="text-sm font-medium">{rule.start_time}</div>
                    </div>
                    <div>
                      <Label className="text-xs">End Time</Label>
                      <div className="text-sm font-medium">{rule.end_time}</div>
                    </div>
                    <div>
                      <Label className="text-xs">Max/Day</Label>
                      <div className="text-sm font-medium">{rule.max_appointments_per_day || 'No limit'}</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={rule.is_active}
                        onCheckedChange={() => toggleRuleActive(rule)}
                      />
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteRuleMutation.mutate(rule.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}

              {/* Show editing rules for this day */}
              {editingRules.map((rule, index) => {
                if (rule.day_of_week !== day.value) return null;
                
                return (
                  <div key={index} className="grid grid-cols-4 gap-4 p-4 border-2 border-dashed rounded-lg bg-blue-50">
                    <div>
                      <Label>Start Time</Label>
                      <Input
                        type="time"
                        value={rule.start_time || ''}
                        onChange={(e) => updateEditingRule(index, 'start_time', e.target.value)}
                      />
                    </div>
                    <div>
                      <Label>End Time</Label>
                      <Input
                        type="time"
                        value={rule.end_time || ''}
                        onChange={(e) => updateEditingRule(index, 'end_time', e.target.value)}
                      />
                    </div>
                    <div>
                      <Label>Max/Day</Label>
                      <Input
                        type="number"
                        min="1"
                        placeholder="No limit"
                        value={rule.max_appointments_per_day || ''}
                        onChange={(e) => updateEditingRule(index, 'max_appointments_per_day', e.target.value ? parseInt(e.target.value) : null)}
                      />
                    </div>
                    <div className="flex items-end gap-2">
                      <Button size="sm" onClick={() => saveNewRule(index)} className="bg-blue-600 hover:bg-blue-700">
                        <Save className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setEditingRules(editingRules.filter((_, i) => i !== index))}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                );
              })}

              {day.rules.length === 0 && editingRules.filter(r => r.day_of_week === day.value).length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <p>No availability set for {day.label}</p>
                  <Button
                    variant="ghost"
                    onClick={() => {
                      const newRule = {
                        day_of_week: day.value,
                        start_time: '09:00',
                        end_time: '17:00',
                        appointment_duration: 30,
                        buffer_time: 0,
                        max_appointments_per_day: null,
                        is_active: true
                      };
                      setEditingRules([...editingRules, newRule]);
                    }}
                  >
                    Add availability for {day.label}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};