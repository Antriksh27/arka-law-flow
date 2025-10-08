import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { LegalkartCaseInfo } from '../../legalkart/LegalkartCaseInfo';
import { LegalkartParties } from '../../legalkart/LegalkartParties';
import { LegalkartDocumentsTable } from '../../legalkart/LegalkartDocumentsTable';
import { LegalkartOrdersTable } from '../../legalkart/LegalkartOrdersTable';
import { LegalkartObjectionsTable } from '../../legalkart/LegalkartObjectionsTable';
import { LegalkartHistoryTable } from '../../legalkart/LegalkartHistoryTable';

interface DetailsTabProps {
  caseData: any;
  caseId: string;
}

export const DetailsTab: React.FC<DetailsTabProps> = ({ caseData, caseId }) => {
  const [activeSubTab, setActiveSubTab] = useState('basic');

  return (
    <Tabs value={activeSubTab} onValueChange={setActiveSubTab} className="space-y-6">
      <TabsList className="bg-muted">
        <TabsTrigger value="basic">Basic Info</TabsTrigger>
        <TabsTrigger value="parties">Parties & Advocates</TabsTrigger>
        <TabsTrigger value="court">Court Details</TabsTrigger>
        <TabsTrigger value="api-docs">API Documents</TabsTrigger>
        <TabsTrigger value="orders">Orders</TabsTrigger>
        <TabsTrigger value="objections">Objections</TabsTrigger>
        <TabsTrigger value="history">Hearing History</TabsTrigger>
        <TabsTrigger value="config">API Configuration</TabsTrigger>
      </TabsList>

      <TabsContent value="basic" className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Case Numbers & Dates</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              {caseData.case_number && (
                <div>
                  <p className="text-sm text-muted-foreground">Case Number</p>
                  <p className="font-medium">{caseData.case_number}</p>
                </div>
              )}
              {caseData.cnr_number && (
                <div>
                  <p className="text-sm text-muted-foreground">CNR Number</p>
                  <p className="font-medium">{caseData.cnr_number}</p>
                </div>
              )}
              {caseData.filing_number && (
                <div>
                  <p className="text-sm text-muted-foreground">Filing Number</p>
                  <p className="font-medium">{caseData.filing_number}</p>
                </div>
              )}
              {caseData.registration_number && (
                <div>
                  <p className="text-sm text-muted-foreground">Registration Number</p>
                  <p className="font-medium">{caseData.registration_number}</p>
                </div>
              )}
            </div>
            <div className="space-y-4">
              {caseData.filing_date && (
                <div>
                  <p className="text-sm text-muted-foreground">Filing Date</p>
                  <p className="font-medium">{format(new Date(caseData.filing_date), 'MMM d, yyyy')}</p>
                </div>
              )}
              {caseData.registration_date && (
                <div>
                  <p className="text-sm text-muted-foreground">Registration Date</p>
                  <p className="font-medium">{format(new Date(caseData.registration_date), 'MMM d, yyyy')}</p>
                </div>
              )}
              {caseData.first_hearing_date && (
                <div>
                  <p className="text-sm text-muted-foreground">First Hearing Date</p>
                  <p className="font-medium">{format(new Date(caseData.first_hearing_date), 'MMM d, yyyy')}</p>
                </div>
              )}
              {caseData.next_hearing_date && (
                <div>
                  <p className="text-sm text-muted-foreground">Next Hearing Date</p>
                  <Badge className="bg-blue-100 text-blue-700">
                    {format(new Date(caseData.next_hearing_date), 'MMM d, yyyy')}
                  </Badge>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Case Details</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground">Case Type</p>
                <p className="font-medium capitalize">{caseData.case_type?.replace('_', ' ')}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Status</p>
                <p className="font-medium capitalize">{caseData.status?.replace('_', ' ')}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Priority</p>
                <p className="font-medium capitalize">{caseData.priority}</p>
              </div>
              {caseData.category && (
                <div>
                  <p className="text-sm text-muted-foreground">Category</p>
                  <p className="font-medium">{caseData.category}</p>
                </div>
              )}
            </div>
            <div className="space-y-4">
              {caseData.description && (
                <div>
                  <p className="text-sm text-muted-foreground">Description</p>
                  <p className="font-medium">{caseData.description}</p>
                </div>
              )}
              {caseData.stage && (
                <div>
                  <p className="text-sm text-muted-foreground">Stage</p>
                  <p className="font-medium">{caseData.stage}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {(caseData.acts || caseData.sections) && (
          <Card>
            <CardHeader>
              <CardTitle>Acts & Sections</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {caseData.acts && caseData.acts.length > 0 && (
                <div>
                  <p className="text-sm text-muted-foreground mb-2">Acts</p>
                  <div className="flex flex-wrap gap-2">
                    {caseData.acts.map((act: string, index: number) => (
                      <Badge key={index} variant="outline">{act}</Badge>
                    ))}
                  </div>
                </div>
              )}
              {caseData.sections && caseData.sections.length > 0 && (
                <div>
                  <p className="text-sm text-muted-foreground mb-2">Sections</p>
                  <div className="flex flex-wrap gap-2">
                    {caseData.sections.map((section: string, index: number) => (
                      <Badge key={index} variant="outline">{section}</Badge>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </TabsContent>

      <TabsContent value="parties" className="space-y-6">
        <LegalkartParties caseId={caseId} />
        
        {(caseData.petitioner || caseData.respondent) && (
          <Card>
            <CardHeader>
              <CardTitle>Manual Party Information</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {caseData.petitioner && (
                <div>
                  <p className="text-sm text-muted-foreground mb-2">Petitioner</p>
                  <p className="font-medium">{caseData.petitioner}</p>
                  {caseData.petitioner_advocate && (
                    <p className="text-sm text-muted-foreground mt-1">
                      Advocate: {caseData.petitioner_advocate}
                    </p>
                  )}
                </div>
              )}
              {caseData.respondent && (
                <div>
                  <p className="text-sm text-muted-foreground mb-2">Respondent</p>
                  <p className="font-medium">{caseData.respondent}</p>
                  {caseData.respondent_advocate && (
                    <p className="text-sm text-muted-foreground mt-1">
                      Advocate: {caseData.respondent_advocate}
                    </p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </TabsContent>

      <TabsContent value="court" className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Court Information</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              {caseData.court_name && (
                <div>
                  <p className="text-sm text-muted-foreground">Court Name</p>
                  <p className="font-medium">{caseData.court_name}</p>
                </div>
              )}
              {caseData.court_complex && (
                <div>
                  <p className="text-sm text-muted-foreground">Court Complex</p>
                  <p className="font-medium">{caseData.court_complex}</p>
                </div>
              )}
              {caseData.bench_type && (
                <div>
                  <p className="text-sm text-muted-foreground">Bench Type</p>
                  <p className="font-medium">{caseData.bench_type}</p>
                </div>
              )}
              {caseData.judicial_branch && (
                <div>
                  <p className="text-sm text-muted-foreground">Judicial Branch</p>
                  <p className="font-medium">{caseData.judicial_branch}</p>
                </div>
              )}
            </div>
            <div className="space-y-4">
              {caseData.coram && (
                <div>
                  <p className="text-sm text-muted-foreground">Coram (Judge)</p>
                  <p className="font-medium">{caseData.coram}</p>
                </div>
              )}
              {caseData.state && (
                <div>
                  <p className="text-sm text-muted-foreground">State</p>
                  <p className="font-medium">{caseData.state}</p>
                </div>
              )}
              {caseData.district && (
                <div>
                  <p className="text-sm text-muted-foreground">District</p>
                  <p className="font-medium">{caseData.district}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="api-docs" className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>API-Fetched Documents</CardTitle>
            <p className="text-sm text-muted-foreground">
              Documents automatically fetched from court APIs
            </p>
          </CardHeader>
          <CardContent>
            <LegalkartDocumentsTable caseId={caseId} />
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="orders" className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Court Orders</CardTitle>
            <p className="text-sm text-muted-foreground">
              Orders issued by the court
            </p>
          </CardHeader>
          <CardContent>
            <LegalkartOrdersTable caseId={caseId} />
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="objections" className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Objections</CardTitle>
            <p className="text-sm text-muted-foreground">
              Case objections and their status
            </p>
          </CardHeader>
          <CardContent>
            <LegalkartObjectionsTable caseId={caseId} />
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="history" className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Hearing History</CardTitle>
            <p className="text-sm text-muted-foreground">
              Complete history of all hearings from court APIs
            </p>
          </CardHeader>
          <CardContent>
            <LegalkartHistoryTable caseId={caseId} />
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="config" className="space-y-6">
        <LegalkartCaseInfo caseId={caseId} />
        
        <Card>
          <CardHeader>
            <CardTitle>Auto-Fetch Configuration</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Auto-Fetch Status</p>
                <p className="text-sm text-muted-foreground">
                  Automatically fetch case updates from court APIs
                </p>
              </div>
              <Badge variant={caseData.cnr_auto_fetch_enabled ? 'default' : 'outline'}>
                {caseData.cnr_auto_fetch_enabled ? 'Enabled' : 'Disabled'}
              </Badge>
            </div>
            {caseData.last_fetched_at && (
              <div>
                <p className="text-sm text-muted-foreground">Last Fetched</p>
                <p className="font-medium">
                  {format(new Date(caseData.last_fetched_at), 'MMM d, yyyy h:mm a')}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
};