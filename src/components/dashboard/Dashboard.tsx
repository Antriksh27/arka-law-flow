
import React from 'react';
import { Calendar, Users, File, Folder, Plus, Upload, Download, Clock, User, FileText, CheckCircle, MoreHorizontal } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

const Dashboard = () => {
  const metrics = [
    { number: '1', label: 'Active Cases', bgColor: 'bg-blue-50', textColor: 'text-blue-600' },
    { number: '5', label: 'Hearings', bgColor: 'bg-orange-50', textColor: 'text-orange-600' },
    { number: '3', label: 'Appointments', bgColor: 'bg-green-50', textColor: 'text-green-600' },
    { number: '8', label: 'Tasks', bgColor: 'bg-purple-50', textColor: 'text-purple-600' }
  ];

  const weekDays = [
    { day: 'Mon', date: '19', events: [] },
    { day: 'Tue', date: '20', events: [] },
    { day: 'Wed', date: '21', events: [] },
    { day: 'Thu', date: '22', events: [] },
    { day: 'Fri', date: '23', events: [] },
    { day: 'Sat', date: '24', events: ['30'] }
  ];

  const myTasks = [
    { title: 'Review case documents for upcoming hearing', priority: 'High', dueDate: 'Due in 2 hours' },
    { title: 'Prepare client meeting notes', priority: 'Medium', dueDate: 'Due April 25th' },
    { title: 'Update Law Timeline', priority: 'Low', dueDate: 'Due April 22nd' }
  ];

  const myNotes = [
    { title: 'Case Strategy', subtitle: 'Update defense argument for upcoming hearing', date: 'Updated 2h ago' },
    { title: 'Meeting Points', subtitle: 'Key discussion items for client consultation', date: 'Updated 1d ago' }
  ];

  const teamMembers = [
    { name: 'Priya Sharma', role: 'Manager', avatar: 'PS' },
    { name: 'Rahul Verma', role: 'Junior', avatar: 'RV' }
  ];

  const recentActivity = [
    { title: 'Document added to Sonali vs State', user: 'Priya Sharma', time: '4 hours ago' },
    { title: 'Hearing rescheduled for Mehta Corp Case', user: 'Admin', time: '4 hours ago' }
  ];

  const recentDocuments = [
    { name: 'hearing_notice.pdf', icon: '📄' },
    { name: 'client_statement.doc', icon: '📄' }
  ];

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">Dashboard Overview</h1>
        <p className="text-gray-600">Welcome back</p>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        {metrics.map((metric, index) => (
          <Card key={index} className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className={`w-10 h-10 rounded-lg ${metric.bgColor} flex items-center justify-center mb-2`}>
                  <span className={`text-xl font-bold ${metric.textColor}`}>{metric.number}</span>
                </div>
                <p className="text-sm text-gray-600">{metric.label}</p>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* This Week's Events */}
      <Card className="mb-8">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-medium">This Week's Events</CardTitle>
            <div className="flex items-center gap-4 text-sm text-gray-600">
              <span>May 19 - May 25, 2024</span>
              <Button variant="ghost" size="sm">
                <MoreHorizontal className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-7 gap-4">
            {weekDays.map((day, index) => (
              <div key={index} className="text-center">
                <div className="text-xs text-gray-500 mb-2">{day.day}</div>
                <div className={`w-12 h-12 mx-auto flex items-center justify-center rounded-lg border ${
                  day.events.length > 0 ? 'bg-blue-500 text-white' : 'border-gray-200'
                }`}>
                  <span className="font-medium">{day.date}</span>
                </div>
                {day.events.map((event, eventIndex) => (
                  <div key={eventIndex} className="mt-2 text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                    {event}
                  </div>
                ))}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Main Content Grid */}
      <div className="grid grid-cols-12 gap-6">
        {/* Left Column - My Workspace */}
        <div className="col-span-8">
          <Card>
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg font-medium">My Workspace</CardTitle>
                <Button variant="link" className="text-blue-600 text-sm">View All</Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-8">
                {/* My Tasks */}
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-medium flex items-center gap-2">
                      <CheckCircle className="w-4 h-4" />
                      My Tasks
                    </h3>
                    <Button size="sm" variant="outline" className="text-blue-600 border-blue-600">
                      Add Task
                    </Button>
                  </div>
                  <div className="space-y-3">
                    {myTasks.map((task, index) => (
                      <div key={index} className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                        <div className="flex items-start justify-between mb-2">
                          <h4 className="text-sm font-medium text-gray-900">{task.title}</h4>
                          <span className={`text-xs px-2 py-1 rounded ${
                            task.priority === 'High' ? 'bg-red-100 text-red-800' :
                            task.priority === 'Medium' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-green-100 text-green-800'
                          }`}>
                            {task.priority}
                          </span>
                        </div>
                        <p className="text-xs text-gray-600">{task.dueDate}</p>
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
                    <Button size="sm" variant="outline" className="text-blue-600 border-blue-600">
                      Add Note
                    </Button>
                  </div>
                  <div className="space-y-3">
                    {myNotes.map((note, index) => (
                      <div key={index} className="p-3 border border-gray-200 rounded-lg">
                        <h4 className="text-sm font-medium text-gray-900 mb-1">{note.title}</h4>
                        <p className="text-xs text-gray-600 mb-2">{note.subtitle}</p>
                        <p className="text-xs text-gray-500">{note.date}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Team Workload */}
          <Card className="mt-6">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg font-medium">Team Workload</CardTitle>
                <Button variant="link" className="text-blue-600 text-sm">View Full Team</Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {teamMembers.map((member, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center text-xs font-medium">
                        {member.avatar}
                      </div>
                      <div>
                        <div className="font-medium text-sm">{member.name}</div>
                        <div className="text-xs text-gray-500">{member.role}</div>
                      </div>
                    </div>
                    <div className="flex gap-8 text-sm">
                      <span>12</span>
                      <span>8</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Recent Case Activity */}
          <Card className="mt-6">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg font-medium">Recent Case Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentActivity.map((activity, index) => (
                  <div key={index} className="flex gap-3">
                    <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                    <div>
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

        {/* Right Column - Quick Actions & Other */}
        <div className="col-span-4 space-y-6">
          {/* Quick Actions */}
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="text-lg font-medium">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button className="w-full justify-start gap-3 h-12 bg-orange-500 hover:bg-orange-600">
                <Plus className="w-4 h-4" />
                Add Team Member
              </Button>
              <Button className="w-full justify-start gap-3 h-12 bg-gray-500 hover:bg-gray-600">
                <FileText className="w-4 h-4" />
                Create Invoice
              </Button>
              <Button className="w-full justify-start gap-3 h-12 bg-gray-500 hover:bg-gray-600">
                <Upload className="w-4 h-4" />
                Upload Document
              </Button>
            </CardContent>
          </Card>

          {/* Revenue Overview */}
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="text-lg font-medium">Revenue Overview</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center mb-4">
                <div className="text-2xl font-bold">₹72.5L</div>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
                <div className="bg-orange-500 h-2 rounded-full" style={{ width: '75%' }}></div>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Outstanding</span>
                  <span>₹75.2L</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Collected</span>
                  <span>₹4.2L</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Recent Documents */}
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="text-lg font-medium">Recent Documents</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {recentDocuments.map((doc, index) => (
                  <div key={index} className="flex items-center gap-3">
                    <span className="text-lg">{doc.icon}</span>
                    <div className="flex-1">
                      <p className="text-sm font-medium">{doc.name}</p>
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
