
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ExternalLink, RefreshCw, AlertTriangle } from 'lucide-react';

interface CaseDetailsProps {
  caseId: string;
}

export const CaseDetails: React.FC<CaseDetailsProps> = ({ caseId }) => {
  return (
    <div className="space-y-6">
      {/* E-Courts Integration Status */}
      <Card className="border-orange-200 bg-orange-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-orange-800">
            <AlertTriangle className="w-5 h-5" />
            E-Courts Integration
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-orange-700 mb-2">
                E-Courts data integration is not yet configured for this case.
              </p>
              <Badge variant="outline" className="text-orange-700 border-orange-300">
                Integration Pending
              </Badge>
            </div>
            <Button variant="outline" className="flex items-center gap-2">
              <RefreshCw className="w-4 h-4" />
              Sync with E-Courts
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Case Registry Details */}
      <Card>
        <CardHeader>
          <CardTitle>Case Registry Details</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-500">Case Number</p>
                <p className="font-medium">Will be fetched from E-Courts</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Court Complex</p>
                <p className="font-medium">Will be fetched from E-Courts</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Judge Name</p>
                <p className="font-medium">Will be fetched from E-Courts</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Case Stage</p>
                <p className="font-medium">Will be fetched from E-Courts</p>
              </div>
            </div>
            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-500">Registration Date</p>
                <p className="font-medium">Will be fetched from E-Courts</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Case Type</p>
                <p className="font-medium">Will be fetched from E-Courts</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Act/Section</p>
                <p className="font-medium">Will be fetched from E-Courts</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Police Station</p>
                <p className="font-medium">Will be fetched from E-Courts</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Parties Involved */}
      <Card>
        <CardHeader>
          <CardTitle>Parties Involved</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Petitioner/Complainant</h4>
              <p className="text-gray-600">Will be fetched from E-Courts</p>
            </div>
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Respondent/Accused</h4>
              <p className="text-gray-600">Will be fetched from E-Courts</p>
            </div>
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Advocates</h4>
              <p className="text-gray-600">Will be fetched from E-Courts</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Case Status History */}
      <Card>
        <CardHeader>
          <CardTitle>Case Status History</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <p className="text-gray-600">Case status history will be automatically synced from E-Courts website.</p>
            <Button variant="outline" className="flex items-center gap-2">
              <ExternalLink className="w-4 h-4" />
              View on E-Courts Website
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
