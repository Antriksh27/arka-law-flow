import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Briefcase, Calendar, AlertCircle, CheckCircle } from 'lucide-react';

export const CasesMetrics: React.FC = () => {
  const { data: metrics, isLoading } = useQuery({
    queryKey: ['cases-metrics'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Get user's firm
      const { data: teamMember } = await supabase
        .from('team_members')
        .select('firm_id, role')
        .eq('user_id', user.id)
        .single();

      if (!teamMember) throw new Error('Not part of any firm');

      // Fetch metrics
      const today = new Date().toISOString();
      const nextWeek = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

      const [
        { count: activeCases },
        { count: casesThisMonth },
        { data: upcomingHearings },
        { count: overdueTasks }
      ] = await Promise.all([
        supabase.from('cases').select('*', { count: 'exact', head: true })
          .eq('firm_id', teamMember.firm_id)
          .eq('status', 'open'),
        supabase.from('cases').select('*', { count: 'exact', head: true })
          .eq('firm_id', teamMember.firm_id)
          .gte('created_at', new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString()),
        supabase.from('hearings').select('id')
          .eq('firm_id', teamMember.firm_id)
          .gte('hearing_date', today.split('T')[0])
          .lte('hearing_date', nextWeek.split('T')[0]),
        supabase.from('tasks').select('*', { count: 'exact', head: true })
          .eq('firm_id', teamMember.firm_id)
          .lt('due_date', today.split('T')[0])
          .neq('status', 'completed')
      ]);

      return {
        activeCases: activeCases || 0,
        casesThisMonth: casesThisMonth || 0,
        upcomingHearings: upcomingHearings?.length || 0,
        overdueTasks: overdueTasks || 0
      };
    }
  });

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <div className="animate-pulse space-y-3">
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                <div className="h-8 bg-gray-200 rounded w-1/3"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const metricCards = [
    {
      title: 'Active Cases',
      value: metrics?.activeCases || 0,
      icon: Briefcase,
      color: 'bg-blue-100 text-blue-600'
    },
    {
      title: 'Cases This Month',
      value: metrics?.casesThisMonth || 0,
      icon: CheckCircle,
      color: 'bg-green-100 text-green-600'
    },
    {
      title: 'Upcoming Hearings',
      value: metrics?.upcomingHearings || 0,
      subtitle: 'Next 7 days',
      icon: Calendar,
      color: 'bg-purple-100 text-purple-600'
    },
    {
      title: 'Overdue Tasks',
      value: metrics?.overdueTasks || 0,
      icon: AlertCircle,
      color: 'bg-red-100 text-red-600'
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
      {metricCards.map((metric, index) => (
        <Card key={index} className="hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">{metric.title}</p>
                <p className="text-3xl font-semibold">{metric.value}</p>
                {metric.subtitle && (
                  <p className="text-xs text-muted-foreground">{metric.subtitle}</p>
                )}
              </div>
              <div className={`w-12 h-12 rounded-full flex items-center justify-center ${metric.color}`}>
                <metric.icon className="w-6 h-6" />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};
