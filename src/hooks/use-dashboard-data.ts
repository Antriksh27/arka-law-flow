import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { startOfWeek, endOfWeek, format, formatDistanceToNow } from 'date-fns';

const getFirmId = async (userId: string) => {
  const { data, error } = await supabase
    .from('team_members')
    .select('firm_id')
    .eq('user_id', userId)
    .single();

  if (error) throw new Error(error.message);
  if (!data) throw new Error('User is not part of any firm.');
  return data.firm_id;
};

const fetchDashboardData = async (firmId: string, userId: string) => {
  const today = new Date();
  const startOfThisWeek = startOfWeek(today, { weekStartsOn: 1 });
  const endOfThisWeek = endOfWeek(today, { weekStartsOn: 1 });

  const [
    { count: activeCasesCount },
    { count: hearingsCount },
    { count: appointmentsCount },
    { count: tasksCount },
    { data: weeklyHearings },
    { data: weeklyAppointments },
    { data: myTasks },
    { data: myNotes },
    { data: teamMembers },
    { data: caseIdsInFirm },
    { data: revenueData },
    { data: recentDocuments },
  ] = await Promise.all([
    supabase.from('cases').select('*', { count: 'exact', head: true }).eq('firm_id', firmId).eq('status', 'open'),
    supabase.from('hearings').select('*', { count: 'exact', head: true }).eq('firm_id', firmId).gte('hearing_date', today.toISOString()),
    supabase.from('appointments').select('*', { count: 'exact', head: true }).eq('firm_id', firmId).gte('start_time', today.toISOString()),
    supabase.from('tasks').select('*', { count: 'exact', head: true }).eq('firm_id', firmId).neq('status', 'completed'),
    supabase.from('hearings').select('hearing_date').eq('firm_id', firmId).gte('hearing_date', startOfThisWeek.toISOString()).lte('hearing_date', endOfThisWeek.toISOString()),
    supabase.from('appointments').select('start_time').eq('firm_id', firmId).gte('start_time', startOfThisWeek.toISOString()).lte('start_time', endOfThisWeek.toISOString()),
    supabase.from('tasks').select('title, priority, due_date').eq('assigned_to', userId).neq('status', 'completed').order('due_date', { ascending: true }).limit(3),
    supabase.from('notes_v2').select('title, content, updated_at').eq('created_by', userId).order('updated_at', { ascending: false }).limit(2),
    supabase.from('team_members').select('full_name, role').eq('firm_id', firmId).limit(5),
    supabase.from('cases').select('id').eq('firm_id', firmId),
    supabase.from('invoices').select('status, total_amount').eq('firm_id', firmId),
    supabase.from('documents').select('file_name, file_type, uploaded_at').eq('firm_id', firmId).order('uploaded_at', { ascending: false }).limit(2),
  ]);

  const caseIds = (caseIdsInFirm || []).map(c => c.id);
  const { data: recentActivityData } = await supabase
    .from('case_activities')
    .select('description, created_at, profiles(full_name)')
    .in('case_id', caseIds)
    .order('created_at', { ascending: false })
    .limit(2);

  const revenue = { outstanding: 0, collected: 0, total: 0 };
  if (revenueData) {
    revenueData.forEach(inv => {
      if (inv.status === 'paid' && inv.total_amount) {
        revenue.collected += inv.total_amount;
      } else if ((inv.status === 'sent' || inv.status === 'overdue') && inv.total_amount) {
        revenue.outstanding += inv.total_amount;
      }
    });
    revenue.total = revenue.collected + revenue.outstanding;
  }

  const eventsByDate: { [key: string]: number } = {};
  (weeklyHearings || []).forEach(h => {
    if(h.hearing_date) {
      const date = format(new Date(h.hearing_date), 'yyyy-MM-dd');
      eventsByDate[date] = (eventsByDate[date] || 0) + 1;
    }
  });
  (weeklyAppointments || []).forEach(a => {
    if (a.start_time) {
      const date = format(new Date(a.start_time), 'yyyy-MM-dd');
      eventsByDate[date] = (eventsByDate[date] || 0) + 1;
    }
  });

  return {
    metrics: {
      activeCases: activeCasesCount || 0,
      hearings: hearingsCount || 0,
      appointments: appointmentsCount || 0,
      tasks: tasksCount || 0,
    },
    schedule: eventsByDate,
    myTasks: myTasks || [],
    myNotes: myNotes ? myNotes.map(n => ({...n, title: n.title, subtitle: n.content, date: `Updated ${formatDistanceToNow(new Date(n.updated_at))} ago`})) : [],
    teamMembers: (teamMembers || []).map(m => ({ name: m.full_name, role: m.role, avatar: (m.full_name || ' ').split(' ').map(n=>n[0]).join('').substring(0,2).toUpperCase()})),
    recentActivity: (recentActivityData || []).map(a => ({
      title: a.description,
      user: a.profiles?.full_name || 'System',
      time: `${formatDistanceToNow(new Date(a.created_at))} ago`
    })),
    revenue,
    recentDocuments: (recentDocuments || []).map(d => ({ name: d.file_name, icon: '📄' })),
  };
};

export const useDashboardData = () => {
  const { user } = useAuth();
  
  const { data: firmId, isLoading: isLoadingFirmId } = useQuery({
    queryKey: ['firmId', user?.id],
    queryFn: () => getFirmId(user!.id),
    enabled: !!user,
  });
  
  const queryResult = useQuery({
    queryKey: ['dashboardData', firmId],
    queryFn: () => fetchDashboardData(firmId!, user!.id),
    enabled: !!firmId && !!user,
  });

  return {
    ...queryResult,
    isLoading: queryResult.isLoading || isLoadingFirmId
  }
};
