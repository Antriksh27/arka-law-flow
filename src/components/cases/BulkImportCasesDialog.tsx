import React, { useState, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Upload, Download, AlertCircle, CheckCircle, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface BulkImportCasesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export const BulkImportCasesDialog = ({ 
  open, 
  onOpenChange, 
  onSuccess 
}: BulkImportCasesDialogProps) => {
  const [file, setFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);
  const [results, setResults] = useState<{ success: number; errors: string[] } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const { user } = useAuth();

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile) {
      if (selectedFile.type.includes('spreadsheet') || selectedFile.name.endsWith('.xlsx') || selectedFile.name.endsWith('.xls')) {
        setFile(selectedFile);
        setResults(null);
      } else {
        toast({
          title: "Invalid file type",
          description: "Please select an Excel file (.xlsx or .xls)",
          variant: "destructive"
        });
      }
    }
  };

  const deleteRecentCases = async () => {
    try {
      const { data: recentCases } = await supabase
        .from('cases')
        .select('id')
        .gte('created_at', new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()) // Last 2 hours
        .is('case_number', null)
        .is('client_id', null);

      if (recentCases && recentCases.length > 0) {
        const { error } = await supabase
          .from('cases')
          .delete()
          .in('id', recentCases.map(c => c.id));

        if (error) throw error;

        toast({
          title: "Cases deleted",
          description: `Deleted ${recentCases.length} recent cases with missing case number/client`,
        });
      } else {
        toast({
          title: "No cases to delete",
          description: "No recent cases found with missing case number/client",
        });
      }
    } catch (error: any) {
      toast({
        title: "Delete failed",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const downloadSampleTemplate = async () => {
    try {
      const XLSX = await import('xlsx');
      
      const sampleData = [
        {
          reference_number: 'REF-2024-001',
          case_title: 'Contract Dispute Case',
          case_number: 'CIV/2024/001',
          by_against: 'by',
          case_type: 'civil',
          status: 'open',
          priority: 'medium',
          court: 'District Court',
          court_name: 'Mumbai District Court',
          petitioner: 'John Doe',
          respondent: 'ABC Corporation',
          filing_date: '2024-01-15',
          next_hearing_date: '2024-02-15',
          description: 'Contract breach dispute case',
          stage: 'Initial hearing',
          client_name: 'John Doe'
        },
        {
          reference_number: 'REF-2024-002',
          case_title: 'Property Dispute',
          case_number: 'CIV/2024/002',
          by_against: 'against',
          case_type: 'civil',
          status: 'active',
          priority: 'high',
          court: 'High Court',
          court_name: 'Bombay High Court',
          petitioner: 'Jane Smith',
          respondent: 'XYZ Developers',
          filing_date: '2024-01-20',
          next_hearing_date: '2024-03-01',
          description: 'Property ownership dispute',
          stage: 'Evidence submission',
          client_name: 'Jane Smith'
        }
      ];

      const ws = XLSX.utils.json_to_sheet(sampleData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Cases');
      
      // Auto-size columns
      const colWidths = Object.keys(sampleData[0]).map(key => ({
        wch: Math.max(key.length, ...sampleData.map(row => String(row[key as keyof typeof row] || '').length)) + 2
      }));
      ws['!cols'] = colWidths;

      XLSX.writeFile(wb, 'cases_import_template.xlsx');
      
      toast({
        title: "Template downloaded",
        description: "Sample Excel template has been downloaded",
      });
    } catch (error) {
      console.error('Error downloading template:', error);
      toast({
        title: "Download failed",
        description: "Failed to download template. Please try again.",
        variant: "destructive"
      });
    }
  };

  const processImport = async () => {
    if (!file || !user) return;

    setImporting(true);
    setResults(null);

    try {
      const XLSX = await import('xlsx');
      
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data, { type: 'array' });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { 
        raw: false,
        defval: ''
      }) as any[];

      console.log('Raw parsed data sample:', jsonData.slice(0, 3));

      if (jsonData.length === 0) {
        throw new Error('No data found in the Excel file');
      }

      // Get user's firm_id
      const { data: teamMember } = await supabase
        .from('team_members')
        .select('firm_id')
        .eq('user_id', user.id)
        .single();

      if (!teamMember?.firm_id) {
        throw new Error('Unable to determine your firm. Please contact support.');
      }

      let successCount = 0;
      const errors: string[] = [];

      for (let i = 0; i < jsonData.length; i++) {
        const row = jsonData[i];
        const rowNumber = i + 2;

        try {
          const cleanField = (value: any): string | null => {
            if (value === null || value === undefined || value === '') return null;
            const cleaned = String(value).trim();
            return cleaned === '' ? null : cleaned;
          };

          // Get case identifiers
          const caseNumber = cleanField(row.case_number || row['Case Number'] || row['case_number']);
          const referenceNumber = cleanField(row.reference_number || row['Reference Number'] || row['reference_number'] || row['REFERENCE NUMBER']);
          const caseTitle = cleanField(row.case_title || row['Case Title'] || row['case_title'] || row['TITLE'] || row['Title']);

          if (!caseNumber && !referenceNumber && !caseTitle) {
            errors.push(`Row ${rowNumber}: Need at least case_number, reference_number, or case_title to identify the case`);
            continue;
          }

          // Find existing case
          let query = supabase
            .from('cases')
            .select('id, case_title')
            .eq('firm_id', teamMember.firm_id);

          if (caseNumber) {
            query = query.eq('case_number', caseNumber);
          } else if (referenceNumber) {
            query = query.eq('reference_number', referenceNumber);
          } else if (caseTitle) {
            query = query.ilike('case_title', `%${caseTitle}%`);
          }

          const { data: existingCase } = await query.limit(1).single();

          if (!existingCase) {
            errors.push(`Row ${rowNumber}: Case not found (${caseNumber || referenceNumber || caseTitle})`);
            continue;
          }

          // Find client by name if provided
          let clientId = null;
          const clientName = cleanField(row.client_name || row['Client Name'] || row['client_name']);
          if (clientName) {
            const { data: client } = await supabase
              .from('clients')
              .select('id')
              .eq('firm_id', teamMember.firm_id)
              .ilike('full_name', `%${clientName}%`)
              .limit(1)
              .single();
            
            if (client) {
              clientId = client.id;
            } else {
              errors.push(`Row ${rowNumber}: Client not found: ${clientName}`);
              continue;
            }
          }

          // Update existing case with client_id
          const { error } = await supabase
            .from('cases')
            .update({ 
              client_id: clientId,
              updated_at: new Date().toISOString()
            })
            .eq('id', existingCase.id);

          if (error) {
            throw error;
          }

          successCount++;
        } catch (error: any) {
          console.error(`Row ${rowNumber} error:`, error);
          errors.push(`Row ${rowNumber}: ${error.message}`);
        }
      }

      setResults({ success: successCount, errors });

      if (successCount > 0) {
        toast({
          title: "Update completed",
          description: `Successfully updated ${successCount} case(s) with client information`,
        });
        onSuccess?.();
      }

    } catch (error: any) {
      console.error('Import error:', error);
      toast({
        title: "Import failed",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setImporting(false);
    }
  };

  const resetDialog = () => {
    setFile(null);
    setResults(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <Dialog open={open} onOpenChange={(open) => {
      if (!open) resetDialog();
      onOpenChange(open);
    }}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Bulk Update Cases with Clients</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Clean up recent uploads */}
          <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
            <div className="flex items-start gap-3">
              <Trash2 className="w-5 h-5 text-orange-600 mt-0.5" />
              <div className="flex-1">
                <h3 className="font-medium text-orange-900 mb-1">Clean Up Failed Imports</h3>
                <p className="text-sm text-orange-700 mb-3">
                  Delete recent cases that were uploaded without case number/client data.
                </p>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={deleteRecentCases}
                  className="border-orange-300 text-orange-700 hover:bg-orange-100"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete Recent Incomplete Cases
                </Button>
              </div>
            </div>
          </div>

          {/* Template Download */}
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
            <div className="flex items-start gap-3">
              <Download className="w-5 h-5 text-blue-600 mt-0.5" />
              <div className="flex-1">
                <h3 className="font-medium text-blue-900 mb-1">Download Template</h3>
                <p className="text-sm text-blue-700 mb-3">
                  Download the sample Excel template to see the required format and columns.
                </p>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={downloadSampleTemplate}
                  className="border-blue-300 text-blue-700 hover:bg-blue-100"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Download Template
                </Button>
              </div>
            </div>
          </div>

          {/* File Upload */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Excel File (.xlsx or .xls)
              </label>
              <div className="flex items-center gap-3">
                <Input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx,.xls"
                  onChange={handleFileSelect}
                  className="border-gray-300"
                />
                {file && (
                  <div className="flex items-center gap-2 text-sm text-green-600">
                    <CheckCircle className="w-4 h-4" />
                    {file.name}
                  </div>
                )}
              </div>
            </div>

            <Button
              onClick={processImport}
              disabled={!file || importing}
              className="w-full bg-slate-800 hover:bg-slate-700"
            >
              {importing ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  Importing...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4 mr-2" />
                  Import Cases
                </>
              )}
            </Button>
          </div>

          {/* Results */}
          {results && (
            <div className="space-y-4">
              {results.success > 0 && (
                <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                  <div className="flex items-center gap-2 text-green-800">
                    <CheckCircle className="w-5 h-5" />
                    <span className="font-medium">
                      Successfully updated {results.success} case(s) with client information
                    </span>
                  </div>
                </div>
              )}

              {results.errors.length > 0 && (
                <div className="bg-red-50 p-4 rounded-lg border border-red-200">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
                    <div className="flex-1">
                      <h3 className="font-medium text-red-800 mb-2">
                        {results.errors.length} error(s) occurred:
                      </h3>
                      <div className="space-y-1 max-h-40 overflow-y-auto">
                        {results.errors.map((error, index) => (
                          <p key={index} className="text-sm text-red-700">
                            • {error}
                          </p>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Instructions */}
          <div className="bg-gray-50 p-4 rounded-lg text-sm text-gray-600">
            <h3 className="font-medium text-gray-800 mb-2">Instructions:</h3>
            <ul className="space-y-1 list-disc list-inside">
              <li>This tool updates existing cases with client information</li>
              <li>Include case_number, reference_number, or case_title to identify cases</li>
              <li>Provide client_name to link cases with clients</li>
              <li>Clients must already exist in your database</li>
              <li>Client names are matched using partial/fuzzy matching</li>
              <li>Cases not found will be skipped and shown in errors</li>
            </ul>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};