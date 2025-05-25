
import React from 'react';
import MetricCard from './MetricCard';
import { Calendar, Users, File, Folder, Plus, Upload, Download, Clock, User, FileText, CheckCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

const Dashboard = () => {
  const metrics = [
    {
      title: 'Active Cases',
      value: '₹4.2L',
      icon: Folder,
      change: '+12%',
      changeType: 'positive' as const,
      subtitle: 'This month'
    }
  ];

  const weekEvents = [
    { day: 'Mon', date: '2', events: [{ type: 'hearing', time: '9:30' }, { type: 'meeting', time: '2:00' }] },
    { day: 'Tue', date: '3', events: [{ type: 'hearing', time: '10:00' }] },
    { day: 'Wed', date: '4', events: [{ type: 'meeting', time: '11:00' }, { type: 'task', time: '3:30' }] },
    { day: 'Thu', date: '5', events: [{ type: 'hearing', time: '9:00' }, { type: 'meeting', time: '2:30' }] },
    { day: 'Fri', date: '6', events: [{ type: 'task', time: '10:30' }] },
    { day: 'Sat', date: '7', events: [{ type: 'hearing', time: '11:00' }] },
    { day: 'Sun', date: '8', events: [] }
  ];

  const quickActions = [
    { title: 'Add Team Member', icon: Users, color: 'bg-orange-500' },
    { title: 'Create Invoice', icon: FileText, color: 'bg-gray-500' },
    { title: 'Upload Document', icon: Upload, color: 'bg-gray-500' }
  ];

  const myTasks = [
    { title: 'Review case documents', priority: 'High', status: 'pending' },
    { title: 'Prepare client meeting notes', priority: 'Medium', status: 'pending' },
    { title: 'Update case timeline', priority: 'Low', status: 'completed' }
  ];

  const myNotes = [
    { title: 'Case Strategy', date: 'Updated 2h ago' },
    { title: 'Meeting Points', date: 'Updated 1d ago' }
  ];

  const teamWorkload = [
    { name: 'Priya Sharma', role: 'Manager', tasks: 12, hours: 8 },
    { name: 'Rahul Verma', role: 'Junior', tasks: 0, hours: 16 }
  ];

  const recentActivity = [
    { title: 'Document added to Sonali vs State', user: 'Priya Sharma', time: '4 hours ago' },
    { title: 'Hearing rescheduled for Mehta Corp Case', user: 'Admin', time: '4 hours ago' }
  ];

  const recentDocuments = [
    { name: 'hearing_notice.pdf', size: '2.1MB' },
    { name: 'client_statement.doc', size: '1.8MB' }
  ];

  return (
    <div className="p-6 space-y-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600">Overview</p>
        </div>
      </div>

      {/* Main Grid Layout */}
      <div className="grid grid-cols-12 gap-6">
        {/* Left Column - Main Content */}
        <div className="col-span-8 space-y-6">
          {/* Metrics Card */}
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">This month</p>
                  <p className="text-3xl font-bold">₹4.2L</p>
                  <p className="text-sm text-green-600">+12% from last month</p>
                </div>
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Folder className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* This Week's Events */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">This Week's Events</CardTitle>
                <div className="flex gap-2 text-xs">
                  <span className="flex items-center gap-1">
                    <div className="w-2 h-2 bg-orange-400 rounded-full"></div>
                    Hearings
                  </span>
                  <span className="flex items-center gap-1">
                    <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                    Appointments
                  </span>
                  <span className="flex items-center gap-1">
                    <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                    Tasks
                  </span>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-7 gap-4">
                {weekEvents.map((day, index) => (
                  <div key={index} className="text-center">
                    <div className="text-xs text-gray-500 mb-2">{day.day}</div>
                    <div className="text-lg font-semibold mb-2">{day.date}</div>
                    <div className="space-y-1">
                      {day.events.map((event, eventIndex) => (
                        <div
                          key={eventIndex}
                          className={`text-xs px-2 py-1 rounded text-white ${
                            event.type === 'hearing' ? 'bg-orange-400' :
                            event.type === 'meeting' ? 'bg-blue-400' : 'bg-green-400'
                          }`}
                        >
                          {event.time}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* My Workspace */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">My Workspace</CardTitle>
                <Button variant="link" className="text-blue-600 text-sm">View All</Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-6">
                {/* My Tasks */}
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-medium flex items-center gap-2">
                      <CheckCircle className="w-4 h-4" />
                      My Tasks
                    </h3>
                    <Button size="sm" variant="outline">Add Task</Button>
                  </div>
                  <div className="space-y-2">
                    {myTasks.map((task, index) => (
                      <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                        <span className="text-sm">{task.title}</span>
                        <span className={`text-xs px-2 py-1 rounded ${
                          task.priority === 'High' ? 'bg-red-100 text-red-800' :
                          task.priority === 'Medium' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-green-100 text-green-800'
                        }`}>
                          {task.priority}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* My Notes */}
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-medium flex items-center gap-2">
                      <FileText className="w-4 h-4" />
                      My Notes
                    </h3>
                    <Button size="sm" variant="outline">Add Note</Button>
                  </div>
                  <div className="space-y-2">
                    {myNotes.map((note, index) => (
                      <div key={index} className="p-2 bg-gray-50 rounded">
                        <div className="font-medium text-sm">{note.title}</div>
                        <div className="text-xs text-gray-500">{note.date}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Team Workload */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Team Workload</CardTitle>
                <Button variant="link" className="text-blue-600 text-sm">View Full Team</Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {teamWorkload.map((member, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
                        <User className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="font-medium">{member.name}</div>
                        <div className="text-sm text-gray-500">{member.role}</div>
                      </div>
                    </div>
                    <div className="flex gap-4 text-sm">
                      <span>{member.tasks}</span>
                      <span>{member.hours}</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Sidebar */}
        <div className="col-span-4 space-y-6">
          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {quickActions.map((action, index) => (
                <Button
                  key={index}
                  className={`w-full justify-start gap-3 h-12 ${action.color} hover:opacity-90`}
                >
                  <action.icon className="w-4 h-4" />
                  {action.title}
                </Button>
              ))}
            </CardContent>
          </Card>

          {/* Revenue Overview */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Revenue Overview</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm">
                    <span>Outstanding</span>
                    <span>₹75.2L</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                    <div className="bg-orange-500 h-2 rounded-full" style={{ width: '75%' }}></div>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-sm">
                    <span>Outstanding</span>
                    <span>₹4.2L</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Recent Documents */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Recent Documents</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {recentDocuments.map((doc, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-gray-500" />
                      <span className="text-sm">{doc.name}</span>
                    </div>
                    <span className="text-xs text-gray-500">{doc.size}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Recent Case Activity */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Recent Case Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentActivity.map((activity, index) => (
                  <div key={index} className="flex gap-3">
                    <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">{activity.title}</p>
                      <p className="text-xs text-gray-500">
                        Added by {activity.user} • {activity.time}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
