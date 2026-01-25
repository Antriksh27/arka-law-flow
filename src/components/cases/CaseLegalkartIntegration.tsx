import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { LegalkartCaseSearch } from './LegalkartCaseSearch';
import { AutoFetchCaseDialog } from './AutoFetchCaseDialog';
import { Settings, Search, Clock, ExternalLink } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface CaseLegalkartIntegrationProps {
  caseId: string;
  cnrNumber?: string;
  autoFetchEnabled?: boolean;
  lastFetchedAt?: string;
  onCaseDataUpdated?: () => void;
}

export const CaseLegalkartIntegration: React.FC<CaseLegalkartIntegrationProps> = ({
  caseId,
  cnrNumber,
  autoFetchEnabled = false,
  lastFetchedAt,
  onCaseDataUpdated,
}) => {
  const [showSettings, setShowSettings] = useState(false);
  const [showSearch, setShowSearch] = useState(false);

  // Fetch case data to get the fetched_data field
  const { data: caseData } = useQuery({
    queryKey: ['case-legalkart-data', caseId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('cases')
        .select('fetched_data')
        .eq('id', caseId)
        .single();
      
      if (error) throw error;
      return data;
    },
    enabled: !!caseId
  });

  const handleCaseDataFetched = (data: any) => {
    console.log('Case data fetched:', data);
    onCaseDataUpdated?.();
  };

  return (
    <div className="space-y-4">
      {/* Show only integration controls, not the data display */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ExternalLink className="h-5 w-5" />
              Legalkart Integration Controls
            </div>
            <div className="flex items-center gap-2">
              <Badge variant={autoFetchEnabled ? "default" : "outline"}>
                {autoFetchEnabled ? "Auto-fetch ON" : "Auto-fetch OFF"}
              </Badge>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowSettings(true)}
              >
                <Settings className="h-4 w-4 mr-1" />
                Settings
              </Button>
            </div>
          </CardTitle>
          <CardDescription>
            Manage Legalkart API integration settings. Case data is displayed in the Details tab.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {cnrNumber && (
              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                <div>
                  <p className="text-sm font-medium">CNR Number</p>
                  <p className="text-lg font-mono">{cnrNumber}</p>
                </div>
                {lastFetchedAt && (
                  <div className="text-right">
                    <p className="text-sm text-slate-500 flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      Last fetched
                    </p>
                    <p className="text-sm">
                      {new Date(lastFetchedAt).toLocaleString()}
                    </p>
                  </div>
                )}
              </div>
            )}

            {!cnrNumber && (
              <div className="text-center py-6 text-slate-500">
                <p>No CNR number provided for this case.</p>
                <p className="text-sm">Add a CNR number to enable Legalkart integration.</p>
              </div>
            )}

            <div className="flex gap-2">
              <Button
                onClick={() => setShowSearch(true)}
                disabled={!cnrNumber}
                className="flex-1"
              >
                <Search className="h-4 w-4 mr-2" />
                Search Case Details
              </Button>
            </div>

            {autoFetchEnabled && cnrNumber && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <p className="text-sm text-blue-800">
                  <strong>Auto-fetch is enabled.</strong> Case details will be automatically 
                  fetched when the CNR number is updated. Data is displayed in the Details tab.
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Search Dialog */}
      {showSearch && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-6xl w-full max-h-[90vh] overflow-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold">Legalkart Case Search</h2>
                <Button
                  variant="outline"
                  onClick={() => setShowSearch(false)}
                >
                  Close
                </Button>
              </div>
              <LegalkartCaseSearch
                caseId={caseId}
                initialCnr={cnrNumber}
                onCaseDataFetched={handleCaseDataFetched}
              />
            </div>
          </div>
        </div>
      )}

      {/* Settings Dialog */}
      <AutoFetchCaseDialog
        open={showSettings}
        onClose={() => setShowSettings(false)}
        caseId={caseId}
        currentAutoFetch={autoFetchEnabled}
      />
    </div>
  );
};
