import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { format, formatDistanceToNow, addDays, startOfWeek, endOfWeek, startOfDay, endOfDay } from 'date-fns';
import { dashboardQueryConfig } from '@/lib/queryConfig';

interface DashboardData {
  userProfile: any;
  legalNews: any[];
  role: string;
  metrics: {
    activeCases: number;
    hearings: number;
    appointments: number;
    tasks: number;
  };
  schedule: { [key: string]: number };
  myTasks: any[];
  myNotes: any[];
  teamMembers: any[];
  recentActivity: any[];
  recentDocuments: any[];
  todayAppointments: any[];
  upcomingHearings: any[];
  recentClients: any[];
  recentContacts: any[];
  caseHighlights: any[];
  timelineEvents: any[];
  weekEvents: any[];
}

const getFirmId = async (userId: string) => {
  const { data, error } = await supabase
    .from('team_members')
    .select('firm_id')
    .eq('user_id', userId)
    .limit(1)
    .maybeSingle();

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

  // Optimized queries - fetch only necessary fields
  // @ts-ignore - Parallel queries type depth warning (safe to ignore)
  const [
    { data: userProfile },
    { data: legalNews },
    { count: activeCasesCount },
    { count: hearingsCount },
    { count: appointmentsCount },
    { count: tasksCount },
    { data: weeklyHearings },
    { data: weeklyAppointments },
    { data: myTasks },
    { data: myNotes },
    { data: teamMembers },
    { data: recentDocuments },
    { data: todayAppointments },
    { data: upcomingHearings },
    { data: recentClients },
    { data: recentContacts },
    { data: caseHighlights },
    { data: recentActivity },
  ] = await Promise.all([
    supabase.from('team_members').select('full_name').eq('user_id', userId).single(),
    supabase.from('legal_news').select('title, url, source, published_at').order('published_at', { ascending: false }).limit(5),
    supabase.from('cases').select('*', { count: 'exact', head: true }).eq('firm_id', firmId).eq('status', 'pending'),
    supabase.from('case_hearings').select('*, cases!inner(firm_id)', { count: 'exact', head: true }).eq('cases.firm_id', firmId).gte('hearing_date', today.toISOString()),
    supabase.from('appointments').select('*', { count: 'exact', head: true }).eq('firm_id', firmId).gte('appointment_date', format(today, 'yyyy-MM-dd')),
    supabase.from('tasks').select('*', { count: 'exact', head: true }).eq('firm_id', firmId).neq('status', 'completed'),
    // @ts-ignore - Type depth warning (safe to ignore)
    supabase.from('case_hearings').select('hearing_date').eq('firm_id', firmId).gte('hearing_date', startOfThisWeek.toISOString()).lte('hearing_date', endOfThisWeek.toISOString()),
    supabase.from('appointments').select('appointment_date').eq('firm_id', firmId).gte('appointment_date', format(startOfThisWeek, 'yyyy-MM-dd')).lte('appointment_date', format(endOfThisWeek, 'yyyy-MM-dd')),
    supabase.from('tasks').select('title, priority, due_date').eq('assigned_to', userId).neq('status', 'completed').order('due_date', { ascending: true }).limit(3),
    supabase.from('notes_v2').select('id, title, content, created_at, color').eq('created_by', userId).eq('is_pinned', true).order('updated_at', { ascending: false }).limit(4),
    supabase.from('team_members').select('full_name, role').eq('firm_id', firmId).limit(5),
    supabase.from('documents').select('file_name, file_type, uploaded_at, id').eq('firm_id', firmId).order('uploaded_at', { ascending: false }).limit(2),
    supabase.from('appointments').select('id, appointment_date, appointment_time, status, title, clients(full_name)').eq('firm_id', firmId).eq('appointment_date', format(today, 'yyyy-MM-dd')).neq('status', 'cancelled').order('appointment_time', { ascending: true }).limit(50),
    supabase.from('case_hearings').select('id, hearing_date, hearing_time, judge, cases!inner(case_title, firm_id)').eq('cases.firm_id', firmId).gte('hearing_date', format(startOfToday, 'yyyy-MM-dd')).lte('hearing_date', format(endOfToday, 'yyyy-MM-dd')).order('hearing_date', { ascending: true }).limit(50),
    supabase.from('clients').select('id, full_name, email, phone, status, created_at').eq('firm_id', firmId).order('created_at', { ascending: false }).limit(5),
    supabase.from('contacts').select('id, name, phone, last_visited_at').eq('firm_id', firmId).order('last_visited_at', { ascending: false, nullsFirst: false }).limit(5),
    supabase.from('cases').select('id, case_title, case_number, status, next_hearing_date, client_id, clients(full_name)').eq('firm_id', firmId).eq('status', 'pending').not('next_hearing_date', 'is', null).gte('next_hearing_date', format(today, 'yyyy-MM-dd')).order('next_hearing_date', { ascending: true }).limit(5),
    // @ts-ignore - Type depth warning (safe to ignore)
    supabase.from('case_activities').select('description, created_at, profiles(full_name), cases!inner(firm_id)').eq('cases.firm_id', firmId).order('created_at', { ascending: false }).limit(2),
  ]);

  // Build events by date
  const eventsByDate: { [key: string]: number } = {};
  (weeklyHearings || []).forEach(h => {
    if (h.hearing_date) {
      const date = format(new Date(h.hearing_date), 'yyyy-MM-dd');
      eventsByDate[date] = (eventsByDate[date] || 0) + 1;
    }
  });
  (weeklyAppointments || []).forEach(a => {
    if (a.appointment_date) {
      const date = format(new Date(a.appointment_date), 'yyyy-MM-dd');
      eventsByDate[date] = (eventsByDate[date] || 0) + 1;
    }
  });

  // Calculate case counts for clients (optimized with single query)
  const clientIds = (recentClients || []).map(c => c.id);
  const { data: clientCaseCounts } = await supabase
    .from('cases')
    .select('client_id')
    .in('client_id', clientIds);
  
  const caseCountMap: { [key: string]: number } = {};
  (clientCaseCounts || []).forEach(c => {
    if (c.client_id) {
      caseCountMap[c.client_id] = (caseCountMap[c.client_id] || 0) + 1;
    }
  });

  const clientsWithCaseCount = (recentClients || []).map(client => ({
    ...client,
    case_count: caseCountMap[client.id] || 0,
  }));

  // Format appointments
  const formattedTodayAppointments = (todayAppointments || []).map(a => ({
    id: a.id,
    appointment_date: a.appointment_date,
    appointment_time: a.appointment_time,
    start_time: a.appointment_date && a.appointment_time ? `${a.appointment_date}T${a.appointment_time}` : a.appointment_date,
    client_name: a.clients?.full_name || (a.title ? a.title.replace(/^Appointment with\s+/, '') : 'Unknown Client'),
    meeting_type: 'Meeting',
    status: a.status || 'upcoming',
    title: a.title,
  }));

  const formattedUpcomingHearings = (upcomingHearings || []).map(h => ({
    id: h.id,
    hearing_date: h.hearing_date,
    hearing_time: h.hearing_time || '12:00:00',
    court_name: h.judge || 'Court',
    case_title: h.cases?.case_title || 'Unknown Case',
  }));

  // Build timeline events
  const timelineEvents = [
    ...(formattedTodayAppointments || []).map(a => ({
      id: a.id,
      type: 'appointment' as const,
      title: `Appointment with ${a.client_name}`,
      subtitle: `${a.client_name} • ${a.meeting_type}`,
      time: format(new Date(a.start_time), 'h:mm a'),
      badge: a.status,
      client_name: a.client_name,
      meeting_type: a.meeting_type,
    })),
    ...(formattedUpcomingHearings || []).filter(h => {
      const hearingDate = new Date(h.hearing_date);
      return hearingDate >= startOfToday && hearingDate <= endOfToday;
    }).map(h => ({
      id: h.id,
      type: 'hearing' as const,
      title: h.case_title,
      subtitle: h.court_name,
      time: format(new Date(`${h.hearing_date}T${h.hearing_time || '12:00:00'}`), 'h:mm a'),
      court_name: h.court_name,
      case_title: h.case_title,
    })),
    ...(myTasks || []).filter(t => t.due_date && new Date(t.due_date) >= startOfToday && new Date(t.due_date) <= endOfToday).map(t => ({
      id: t.title,
      type: 'task' as const,
      title: t.title,
      subtitle: t.title,
      time: format(new Date(t.due_date!), 'h:mm a'),
      description: t.title,
    })),
  ].sort((a, b) => a.time.localeCompare(b.time));

  return {
    userProfile: userProfile || null,
    legalNews: (legalNews || []).map(news => ({
      title: news.title,
      url: news.url,
      source: news.source,
      time: formatDistanceToNow(new Date(news.published_at)) + ' ago'
    })),
    role,
    metrics: {
      activeCases: activeCasesCount || 0,
      hearings: hearingsCount || 0,
      appointments: appointmentsCount || 0,
      tasks: tasksCount || 0,
    },
    schedule: eventsByDate,
    myTasks: myTasks || [],
    myNotes: myNotes || [],
    teamMembers: (teamMembers || []).map(m => ({ 
      name: m.full_name, 
      role: m.role, 
      avatar: (m.full_name || ' ').split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()
    })),
    recentActivity: (recentActivity || []).map(a => ({
      title: a.description,
      user: a.profiles?.full_name || 'System',
      time: `${formatDistanceToNow(new Date(a.created_at))} ago`
    })),
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
    caseHighlights: (caseHighlights || []).map(c => ({
      ...c,
      client: c.clients || null,
    })),
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
          format(new Date(a.appointment_date), 'yyyy-MM-dd') === dateStr
        ).length,
        tasks: (myTasks || []).filter(t =>
          t.due_date && format(new Date(t.due_date), 'yyyy-MM-dd') === dateStr
        ).length,
      };
    }),
  };
};

export const useDashboardDataOptimized = () => {
  const { user, role } = useAuth();

  const { data: firmId, isLoading: isLoadingFirmId, error: firmIdError, isError: isFirmIdError } = useQuery({
    queryKey: ['firmId', user?.id],
    queryFn: () => getFirmId(user!.id),
    enabled: !!user,
    ...dashboardQueryConfig,
  });

  const queryResult = useQuery<DashboardData>({
    queryKey: ['dashboard-data-optimized', firmId, role],
    queryFn: () => fetchDashboardData(firmId!, user!.id, role || 'admin'),
    enabled: !!firmId && !!user && !isFirmIdError && !!role,
    ...dashboardQueryConfig,
  });

  return {
    ...queryResult,
    isLoading: queryResult.isLoading || isLoadingFirmId,
    isError: queryResult.isError || isFirmIdError,
    error: queryResult.error || firmIdError,
  };
};
