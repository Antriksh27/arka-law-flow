
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { startOfWeek, endOfWeek, startOfDay, endOfDay, format, formatDistanceToNow, addDays } from 'date-fns';

const getFirmId = async (userId: string) => {
  const { data, error } = await supabase
    .from('team_members')
    .select('firm_id')
    .eq('user_id', userId)
    .limit(1) // Grabs the first firm if multiple exist for the user
    .maybeSingle(); // Handles if there are 0 or 1 results without erroring

  if (error) throw new Error(error.message);
  if (!data) throw new Error('User is not part of any firm.');
  return data.firm_id;
};

const fetchDashboardData = async (firmId: string, userId: string, role: string) => {
  const today = new Date();
  const startOfToday = startOfDay(today);
  const endOfToday = endOfDay(today);
  const startOfThisWeek = startOfWeek(today, { weekStartsOn: 1 });
  const endOfThisWeek = endOfWeek(today, { weekStartsOn: 1 });

  // Build role-based queries
  let appointmentsQuery = supabase.from('appointments').select('*', { count: 'exact', head: false }).eq('firm_id', firmId);
  let hearingsQuery = supabase.from('hearings').select('*').eq('firm_id', firmId);
  let casesQuery = supabase.from('cases').select('*').eq('firm_id', firmId);
  
  // Apply role-based filtering
  if (role === 'lawyer' || role === 'partner' || role === 'associate') {
    appointmentsQuery = appointmentsQuery.eq('lawyer_id', userId);
    casesQuery = casesQuery.eq('created_by', userId);
  } else if (role === 'junior' || role === 'paralegal') {
    // Juniors see assigned cases/tasks
    casesQuery = casesQuery.contains('assigned_users', [userId]);
  }
  // Admin and office_staff see all

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
    { data: todayAppointments },
    { data: upcomingHearings },
    { data: recentClients },
    { data: recentContacts },
    { data: caseHighlights },
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
    supabase.from('appointments').select('id, start_time, status, clients(full_name)').eq('firm_id', firmId).gte('start_time', startOfToday.toISOString()).lte('start_time', endOfToday.toISOString()).order('start_time', { ascending: true }).limit(5),
    supabase.from('hearings').select('id, hearing_date, court_name, cases(case_title)').eq('firm_id', firmId).gte('hearing_date', today.toISOString()).order('hearing_date', { ascending: true }).limit(5),
    supabase.from('clients').select('id, full_name, email, phone, status, created_at').eq('firm_id', firmId).order('created_at', { ascending: false }).limit(5),
    supabase.from('contacts').select('id, name, phone, last_visited_at').eq('firm_id', firmId).order('last_visited_at', { ascending: false, nullsFirst: false }).limit(5),
    supabase.from('cases').select('id, case_title, case_number, status, hearings(hearing_date)').eq('firm_id', firmId).eq('status', 'open').order('created_at', { ascending: false }).limit(5),
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

  // Calculate case counts for clients
  const clientsWithCaseCount = await Promise.all(
    (recentClients || []).map(async (client) => {
      const { count } = await supabase.from('cases').select('*', { count: 'exact', head: true }).eq('client_id', client.id);
      return { ...client, case_count: count || 0 };
    })
  );

  // Get next hearing dates for case highlights
  const casesWithNextHearing = (caseHighlights || []).map(c => ({
    ...c,
    next_hearing_date: c.hearings?.[0]?.hearing_date || null,
  }));

  // Format today's appointments
  const formattedTodayAppointments = (todayAppointments || []).map(a => ({
    id: a.id,
    start_time: a.start_time,
    client_name: a.clients?.full_name || 'Unknown Client',
    meeting_type: 'in-person',
    status: a.status || 'scheduled',
  }));

  // Format upcoming hearings
  const formattedUpcomingHearings = (upcomingHearings || []).map(h => ({
    id: h.id,
    hearing_date: h.hearing_date,
    court_name: h.court_name,
    case_title: h.cases?.case_title || 'Unknown Case',
  }));

  // Build timeline events for today
  const timelineEvents = [
    ...(formattedTodayAppointments || []).map(a => ({
      id: a.id,
      type: 'appointment' as const,
      title: `Appointment with ${a.client_name}`,
      time: a.start_time,
      location: a.meeting_type,
    })),
    ...(formattedUpcomingHearings || []).filter(h => {
      const hearingDate = new Date(h.hearing_date);
      return hearingDate >= startOfToday && hearingDate <= endOfToday;
    }).map(h => ({
      id: h.id,
      type: 'hearing' as const,
      title: h.case_title,
      time: h.hearing_date,
      location: h.court_name,
    })),
    ...(myTasks || []).filter(t => t.due_date).map(t => ({
      id: t.title,
      type: 'task' as const,
      title: t.title,
      time: t.due_date!,
      location: undefined,
    })),
  ];

  return {
    role,
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
    recentDocuments: (recentDocuments || []).map((d, index) => ({
      id: `doc-${index}`,
      name: d.file_name,
      file_name: d.file_name,
      created_at: d.uploaded_at,
      uploaded_at: d.uploaded_at,
      file_type: d.file_type,
      icon: '📄' 
    })),
    todayAppointments: formattedTodayAppointments,
    upcomingHearings: formattedUpcomingHearings,
    recentClients: clientsWithCaseCount,
    recentContacts: recentContacts || [],
    caseHighlights: casesWithNextHearing,
    timelineEvents,
    weekEvents: Array.from({ length: 7 }).map((_, i) => {
      const date = addDays(startOfWeek(new Date(), { weekStartsOn: 1 }), i);
      const dateStr = format(date, 'yyyy-MM-dd');
      
      return {
        date: dateStr,
        hearings: (weeklyHearings || []).filter(h => 
          format(new Date(h.hearing_date), 'yyyy-MM-dd') === dateStr
        ).length,
        appointments: (weeklyAppointments || []).filter(a => 
          format(new Date(a.start_time), 'yyyy-MM-dd') === dateStr
        ).length,
        tasks: (myTasks || []).filter(t => 
          t.due_date && format(new Date(t.due_date), 'yyyy-MM-dd') === dateStr
        ).length,
      };
    }),
    role,
  };
};

export const useDashboardData = () => {
  const { user, role } = useAuth();
  
  const { data: firmId, isLoading: isLoadingFirmId, error: firmIdError, isError: isFirmIdError } = useQuery({
    queryKey: ['firmId', user?.id],
    queryFn: () => getFirmId(user!.id),
    enabled: !!user,
  });
  
  const queryResult = useQuery({
    queryKey: ['dashboardData', firmId, role],
    queryFn: () => fetchDashboardData(firmId!, user!.id, role || 'admin'),
    enabled: !!firmId && !!user && !isFirmIdError && !!role,
  });

  return {
    ...queryResult,
    isLoading: queryResult.isLoading || isLoadingFirmId,
    isError: queryResult.isError || isFirmIdError,
    error: queryResult.error || firmIdError,
  }
};
