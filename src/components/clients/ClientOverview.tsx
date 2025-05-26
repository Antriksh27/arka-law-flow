
import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, AlertCircle } from 'lucide-react';

interface ClientOverviewProps {
  clientId: string;
}

export const ClientOverview: React.FC<ClientOverviewProps> = ({
  clientId
}) => {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-900">Client Overview</h2>
        <Button size="sm">
          <Plus className="w-4 h-4 mr-2" />
          Add Note
        </Button>
      </div>

      {/* Client Portal Access */}
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5" />
          <div className="flex-1">
            <h3 className="font-medium text-amber-800">Client Portal Access</h3>
            <p className="text-sm text-amber-700 mt-1">
              Sarah has not yet activated their client portal account.
            </p>
          </div>
          <Button size="sm" variant="outline" className="text-amber-700 border-amber-300 hover:bg-amber-100 hover:text-amber-700">
            Send Invite
          </Button>
        </div>
      </div>

      {/* Recent Activity */}
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Recent Activity</h3>
        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div className="flex-1">
              <div className="font-medium text-gray-900">Case #2024-001 Updated</div>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-sm text-gray-500">Today</span>
              <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">
                In Progress
              </Badge>
              <Button variant="link" size="sm" className="text-gray-600">
                View
              </Button>
            </div>
          </div>

          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div className="flex-1">
              <div className="font-medium text-gray-900">Document Uploaded</div>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-sm text-gray-500">Yesterday</span>
              <Badge className="bg-green-100 text-green-800 border-green-200">
                Complete
              </Badge>
              <Button variant="link" size="sm" className="text-gray-600">
                View
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
