import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileText, Upload, Grid, List } from 'lucide-react';
import { CaseDocuments } from '../../CaseDocuments';
import { LegalkartDocumentsTable } from '../../legalkart/LegalkartDocumentsTable';

interface DocumentsTabProps {
  caseId: string;
  onUploadDocument?: () => void;
}

export const DocumentsTab: React.FC<DocumentsTabProps> = ({ caseId, onUploadDocument }) => {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');

  return (
    <div className="space-y-6">
      {/* Header with Actions */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Documents</h3>
          <p className="text-sm text-muted-foreground">Manage case documents and API-fetched files</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center border border-gray-200 rounded-lg p-1">
            <Button
              variant={viewMode === 'list' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('list')}
            >
              <List className="w-4 h-4" />
            </Button>
            <Button
              variant={viewMode === 'grid' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('grid')}
            >
              <Grid className="w-4 h-4" />
            </Button>
          </div>
          {onUploadDocument && (
            <Button onClick={onUploadDocument}>
              <Upload className="w-4 h-4 mr-2" />
              Upload Document
            </Button>
          )}
        </div>
      </div>

      {/* Tabs for Manual vs API Documents */}
      <Tabs defaultValue="manual" className="space-y-6">
        <TabsList className="bg-gray-100">
          <TabsTrigger value="manual">
            <FileText className="w-4 h-4 mr-2" />
            Manual Documents
          </TabsTrigger>
          <TabsTrigger value="api">
            <FileText className="w-4 h-4 mr-2" />
            API Documents
          </TabsTrigger>
        </TabsList>

        <TabsContent value="manual">
          <Card>
            <CardContent className="p-6">
              <CaseDocuments caseId={caseId} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="api">
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
      </Tabs>
    </div>
  );
};
