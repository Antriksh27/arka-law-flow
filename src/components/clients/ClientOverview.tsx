import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Plus, FileText, Calendar, Briefcase } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { TimeUtils } from '@/lib/timeUtils';
import { useIsMobile } from '@/hooks/use-mobile';
interface ClientOverviewProps {
  clientId: string;
}
export const ClientOverview: React.FC<ClientOverviewProps> = ({
  clientId
}) => {
  const isMobile = useIsMobile();
  
  // Fetch client stats
  const {
    data: clientStats
  } = useQuery({
    queryKey: ['client-stats', clientId],
    queryFn: async () => {
      const [casesResult, appointmentsResult, documentsResult] = await Promise.all([
        supabase.from('cases').select('id, status').eq('client_id', clientId),
        supabase.from('appointments').select('id, status').eq('client_id', clientId),
        supabase.from('documents').select('id').eq('client_id', clientId)
      ]);
      const activeCases = casesResult.data?.filter(c => c.status === 'pending').length || 0;
      const totalCases = casesResult.data?.length || 0;
      const upcomingAppointments = appointmentsResult.data?.filter(a => a.status === 'upcoming' || a.status === 'confirmed').length || 0;
      const totalDocuments = documentsResult.data?.length || 0;
      return {
        activeCases,
        totalCases,
        upcomingAppointments,
        totalDocuments
      };
    }
  });

  // Fetch recent activity
  const {
    data: recentActivity
  } = useQuery({
    queryKey: ['client-recent-activity', clientId],
    queryFn: async () => {
      const {
        data,
        error
      } = await supabase.from('case_activities').select(`
          id,
          activity_type,
          description,
          created_at,
          cases!inner(case_title, case_number)
        `).eq('cases.client_id', clientId).order('created_at', {
        ascending: false
      }).limit(5);
      if (error) throw error;
      return data || [];
    }
  });
  const stats = [{
    title: 'Active Cases',
    value: clientStats?.activeCases || 0,
    total: clientStats?.totalCases || 0,
    icon: Briefcase,
    color: 'text-blue-600',
    bgColor: 'bg-blue-50'
  }, {
    title: 'Upcoming Appointments',
    value: clientStats?.upcomingAppointments || 0,
    icon: Calendar,
    color: 'text-green-600',
    bgColor: 'bg-green-50'
  }, {
    title: 'Documents',
    value: clientStats?.totalDocuments || 0,
    icon: FileText,
    color: 'text-purple-600',
    bgColor: 'bg-purple-50'
  }];
  if (isMobile) {
    return (
      <div className="space-y-4 pb-4">
        {/* Stats Strip - Horizontal Scroll */}
        <div className="flex gap-3 overflow-x-auto scrollbar-hide px-1 pb-2">
          {stats.map((stat, index) => {
            const IconComponent = stat.icon;
            return (
              <Card key={index} className="flex-shrink-0 w-32">
                <CardContent className="p-3">
                  <div className={`w-8 h-8 rounded-lg ${stat.bgColor} flex items-center justify-center mb-2`}>
                    <IconComponent className={`w-4 h-4 ${stat.color}`} />
                  </div>
                  <p className="text-lg font-bold text-gray-900">
                    {stat.value}
                    {stat.total && <span className="text-xs font-normal text-gray-500">/{stat.total}</span>}
                  </p>
                  <p className="text-xs text-gray-600 truncate">{stat.title}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Recent Activity - Mobile Cards */}
        <div>
          <h3 className="text-base font-semibold text-gray-900 mb-3 px-1">Recent Activity</h3>
          <div className="space-y-2">
            {recentActivity && recentActivity.length > 0 ? (
              recentActivity.map((activity) => (
                <Card key={activity.id} className="active:scale-95 transition-transform">
                  <CardContent className="p-3">
                    <div className="flex items-start justify-between mb-1">
                      <div className="font-medium text-sm text-gray-900 flex-1">
                        {activity.description}
                      </div>
                      <Badge variant="outline" className="capitalize text-xs ml-2 flex-shrink-0">
                        {activity.activity_type}
                      </Badge>
                    </div>
                    <div className="text-xs text-gray-600 mb-1">
                      {activity.cases?.case_number} - {activity.cases?.case_title}
                    </div>
                    <div className="flex items-center gap-1 text-xs text-gray-500">
                      <Calendar className="w-3 h-3" />
                      {TimeUtils.formatDate(activity.created_at)}
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <div className="text-center py-12 text-gray-500">
                <Briefcase className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                <p className="text-sm">No recent activity</p>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-900">Client Overview</h2>
        
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {stats.map((stat, index) => {
        const IconComponent = stat.icon;
        return <Card key={index} className="p-4">
              <CardContent className="p-0">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {stat.value}
                      {stat.total && <span className="text-sm font-normal text-gray-500">/{stat.total}</span>}
                    </p>
                  </div>
                  <div className={`p-3 rounded-lg ${stat.bgColor}`}>
                    <IconComponent className={`w-6 h-6 ${stat.color}`} />
                  </div>
                </div>
              </CardContent>
            </Card>;
      })}
      </div>

      {/* Recent Activity */}
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Recent Activity</h3>
        <div className="space-y-3">
          {recentActivity && recentActivity.length > 0 ? recentActivity.map((activity, index) => <div key={activity.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex-1">
                  <div className="font-medium text-gray-900">{activity.description}</div>
                  <div className="text-sm text-gray-600">
                    Case: {activity.cases?.case_number} - {activity.cases?.case_title}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm text-gray-500">
                    {TimeUtils.formatDate(activity.created_at)}
                  </span>
                  <Badge variant="outline" className="capitalize">
                    {activity.activity_type}
                  </Badge>
                </div>
              </div>) : <div className="text-center py-8 text-gray-500">
              No recent activity found
            </div>}
        </div>
      </div>
    </div>;
};