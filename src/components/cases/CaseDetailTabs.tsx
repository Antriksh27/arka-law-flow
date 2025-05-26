
import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { 
  FileText, 
  Calendar, 
  CheckSquare, 
  StickyNote, 
  MessageSquare, 
  Activity,
  Upload,
  Plus,
  Download,
  MoreHorizontal,
  Eye
} from 'lucide-react';

interface CaseDetailTabsProps {
  caseId: string;
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export const CaseDetailTabs: React.FC<CaseDetailTabsProps> = ({ 
  caseId, 
  activeTab, 
  onTabChange 
}) => {
  const tabs = [
    { value: 'documents', label: 'Documents', icon: FileText },
    { value: 'hearings', label: 'Hearings', icon: Calendar },
    { value: 'tasks', label: 'Tasks', icon: CheckSquare },
    { value: 'notes', label: 'Notes', icon: StickyNote },
    { value: 'messages', label: 'Messages', icon: MessageSquare },
    { value: 'activity', label: 'Activity', icon: Activity },
  ];

  return (
    <div className="bg-white border border-gray-200 rounded-2xl shadow-sm">
      <Tabs value={activeTab} onValueChange={onTabChange} className="w-full">
        <TabsList className="w-full bg-white border-b border-gray-200 rounded-none h-auto p-0">
          <div className="flex overflow-x-auto">
            {tabs.map((tab) => {
              const IconComponent = tab.icon;
              return (
                <TabsTrigger 
                  key={tab.value}
                  value={tab.value} 
                  className="flex items-center gap-2 px-6 py-4 text-sm font-medium text-gray-600 hover:text-gray-900 border-b-2 border-transparent data-[state=active]:border-orange-500 data-[state=active]:text-orange-600 data-[state=active]:bg-transparent bg-transparent rounded-none whitespace-nowrap"
                >
                  <IconComponent className="w-4 h-4" />
                  {tab.label}
                </TabsTrigger>
              );
            })}
          </div>
        </TabsList>

        <div className="p-6">
          <TabsContent value="documents" className="m-0">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Search documents..."
                      className="w-64 pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm"
                    />
                    <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
                      <Eye className="w-4 h-4 text-gray-400" />
                    </div>
                  </div>
                  <Button variant="outline" size="sm">
                    Filter
                  </Button>
                </div>
                <Button className="bg-orange-600 hover:bg-orange-700 text-white">
                  <Upload className="w-4 h-4 mr-2" />
                  Upload Document
                </Button>
              </div>

              {/* Documents Table */}
              <div className="border border-gray-200 rounded-lg overflow-hidden">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">Document Name</th>
                      <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">Type</th>
                      <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">Uploaded By</th>
                      <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">Date</th>
                      <th className="text-right px-6 py-3 text-sm font-medium text-gray-500">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    <tr>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-orange-100 rounded flex items-center justify-center">
                            <FileText className="w-4 h-4 text-orange-600" />
                          </div>
                          <span className="font-medium text-gray-900">First Information Report</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">PDF</td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <Avatar className="w-6 h-6">
                            <AvatarFallback className="bg-red-600 text-white text-xs">PS</AvatarFallback>
                          </Avatar>
                          <span className="text-sm text-gray-900">Priya Sharma</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">2 hours ago</td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button variant="ghost" size="sm">
                            <Download className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal className="w-4 h-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                    <tr>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-blue-100 rounded flex items-center justify-center">
                            <FileText className="w-4 h-4 text-blue-600" />
                          </div>
                          <span className="font-medium text-gray-900">Witness Statement</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">DOCX</td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <Avatar className="w-6 h-6">
                            <AvatarFallback className="bg-green-600 text-white text-xs">RV</AvatarFallback>
                          </Avatar>
                          <span className="text-sm text-gray-900">Rahul Verma</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">Yesterday</td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button variant="ghost" size="sm">
                            <Download className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal className="w-4 h-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="hearings" className="m-0">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium text-gray-900">Hearings</h3>
                <Button className="bg-orange-600 hover:bg-orange-700 text-white">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Hearing
                </Button>
              </div>
              <div className="text-center py-12 text-gray-500">
                No hearings scheduled yet
              </div>
            </div>
          </TabsContent>

          <TabsContent value="tasks" className="m-0">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium text-gray-900">Tasks</h3>
                <Button className="bg-orange-600 hover:bg-orange-700 text-white">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Task
                </Button>
              </div>
              <div className="text-center py-12 text-gray-500">
                No tasks created yet
              </div>
            </div>
          </TabsContent>

          <TabsContent value="notes" className="m-0">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium text-gray-900">Notes</h3>
                <Button className="bg-orange-600 hover:bg-orange-700 text-white">
                  <Plus className="w-4 h-4 mr-2" />
                  New Note
                </Button>
              </div>
              <div className="text-center py-12 text-gray-500">
                No notes added yet
              </div>
            </div>
          </TabsContent>

          <TabsContent value="messages" className="m-0">
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900">Messages</h3>
              <div className="text-center py-12 text-gray-500">
                No messages yet
              </div>
            </div>
          </TabsContent>

          <TabsContent value="activity" className="m-0">
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900">Recent Activity</h3>
              
              {/* Activity Feed */}
              <div className="space-y-3">
                <div className="flex items-start gap-3 p-3 bg-orange-50 rounded-lg">
                  <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
                    <FileText className="w-4 h-4 text-orange-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm">
                      <span className="font-medium">Document uploaded</span>
                    </p>
                    <p className="text-xs text-gray-500 mt-1">Added by Priya Sharma • 2 hours ago</p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 bg-yellow-50 rounded-lg">
                  <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center">
                    <Calendar className="w-4 h-4 text-yellow-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm">
                      <span className="font-medium">Hearing scheduled</span>
                    </p>
                    <p className="text-xs text-gray-500 mt-1">Added by Admin • 4 hours ago</p>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
};
