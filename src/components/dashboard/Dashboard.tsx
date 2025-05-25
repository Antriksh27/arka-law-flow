
import React from 'react';
import MetricCard from './MetricCard';
import { Calendar, Users, File, Folder, Inbox, MessageSquare } from 'lucide-react';

const Dashboard = () => {
  const metrics = [
    {
      title: 'Active Cases',
      value: 24,
      icon: Folder,
      change: '+12%',
      changeType: 'positive' as const,
    },
    {
      title: 'This Week\'s Hearings',
      value: 8,
      icon: Calendar,
      change: '+2',
      changeType: 'positive' as const,
    },
    {
      title: 'Pending Tasks',
      value: 15,
      icon: File,
      change: '-5%',
      changeType: 'positive' as const,
    },
    {
      title: 'Total Clients',
      value: 47,
      icon: Users,
      change: '+8%',
      changeType: 'positive' as const,
    },
    {
      title: 'Pending Invoices',
      value: '₹2.4L',
      icon: File,
      change: '+15%',
      changeType: 'positive' as const,
    },
    {
      title: 'Unread Messages',
      value: 6,
      icon: MessageSquare,
      change: 'New',
      changeType: 'neutral' as const,
    },
  ];

  const recentActivity = [
    {
      id: 1,
      type: 'case',
      title: 'New case filed: Property Dispute - Sharma vs. Kumar',
      time: '2 hours ago',
      user: 'Adv. Priya Singh',
    },
    {
      id: 2,
      type: 'hearing',
      title: 'Hearing scheduled for tomorrow: Criminal Case #2024/45',
      time: '4 hours ago',
      user: 'Adv. Raj Mehta',
    },
    {
      id: 3,
      type: 'document',
      title: 'New document uploaded: Witness Statement.pdf',
      time: '6 hours ago',
      user: 'Paralegal Anita',
    },
    {
      id: 4,
      type: 'invoice',
      title: 'Invoice #INV-2024-089 sent to client',
      time: '8 hours ago',
      user: 'Admin Office',
    },
  ];

  const upcomingEvents = [
    {
      id: 1,
      title: 'Client Meeting - ABC Corp Legal Review',
      time: '10:00 AM',
      type: 'meeting',
    },
    {
      id: 2,
      title: 'Court Hearing - Property Dispute',
      time: '2:30 PM',
      type: 'hearing',
    },
    {
      id: 3,
      title: 'Document Review - Contract Analysis',
      time: '4:00 PM',
      type: 'task',
    },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600 mt-1">Welcome back! Here's what's happening today.</p>
        </div>
        <div className="flex gap-3">
          <button className="btn-secondary">
            <Calendar className="w-4 h-4 mr-2" />
            Today's Schedule
          </button>
          <button className="btn-primary">
            <Folder className="w-4 h-4 mr-2" />
            New Case
          </button>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {metrics.map((metric, index) => (
          <MetricCard
            key={index}
            title={metric.title}
            value={metric.value}
            icon={metric.icon}
            change={metric.change}
            changeType={metric.changeType}
          />
        ))}
      </div>

      {/* Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Today's Events */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Today's Events</h2>
          <div className="space-y-4">
            {upcomingEvents.map((event) => (
              <div key={event.id} className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg">
                <div className="w-2 h-2 bg-primary rounded-full"></div>
                <div className="flex-1">
                  <p className="font-medium text-gray-900">{event.title}</p>
                  <p className="text-sm text-gray-600">{event.time}</p>
                </div>
                <span className="text-xs px-2 py-1 bg-primary/10 text-primary rounded-full capitalize">
                  {event.type}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h2>
          <div className="space-y-4">
            {recentActivity.map((activity) => (
              <div key={activity.id} className="flex gap-4">
                <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                  <Inbox className="w-4 h-4 text-primary" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">{activity.title}</p>
                  <p className="text-xs text-gray-500">{activity.user} • {activity.time}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <button className="p-4 text-left border border-gray-200 rounded-lg hover:border-primary hover:bg-primary/5 transition-colors">
            <Folder className="w-6 h-6 text-primary mb-2" />
            <p className="font-medium text-gray-900">New Case</p>
            <p className="text-sm text-gray-600">Create a new case file</p>
          </button>
          <button className="p-4 text-left border border-gray-200 rounded-lg hover:border-primary hover:bg-primary/5 transition-colors">
            <Users className="w-6 h-6 text-primary mb-2" />
            <p className="font-medium text-gray-900">Add Client</p>
            <p className="text-sm text-gray-600">Register new client</p>
          </button>
          <button className="p-4 text-left border border-gray-200 rounded-lg hover:border-primary hover:bg-primary/5 transition-colors">
            <Calendar className="w-6 h-6 text-primary mb-2" />
            <p className="font-medium text-gray-900">Schedule</p>
            <p className="text-sm text-gray-600">Book appointment</p>
          </button>
          <button className="p-4 text-left border border-gray-200 rounded-lg hover:border-primary hover:bg-primary/5 transition-colors">
            <File className="w-6 h-6 text-primary mb-2" />
            <p className="font-medium text-gray-900">Create Invoice</p>
            <p className="text-sm text-gray-600">Generate client bill</p>
          </button>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
