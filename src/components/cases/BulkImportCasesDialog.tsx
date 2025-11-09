import React, { useState, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Upload, Download, AlertCircle, CheckCircle, Trash2, Eye, FileDown } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface BulkImportCasesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

interface PreviewData {
  rows: any[];
  columns: string[];
  clientMatches: { rowNumber: number; cnrNumber: string; caseFound: boolean; clientName: string; matchedClient: string | null }[];
}

interface DetailedResults {
  successCount: number;
  casesNotFound: string[];
  clientsNotFound: string[];
  successfulUpdates: { caseId: string; caseTitle: string; clientName: string }[];
  errors: string[];
}

export const BulkImportCasesDialog = ({ 
  open, 
  onOpenChange, 
  onSuccess 
}: BulkImportCasesDialogProps) => {
  const [file, setFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0 });
  const [preview, setPreview] = useState<PreviewData | null>(null);
  const [results, setResults] = useState<DetailedResults | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const { user } = useAuth();

  // Helper function to add delay
  const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

  // Normalize CNR number by removing dashes and converting to uppercase
  const normalizeCNR = (cnr: string): string => {
    return cnr.replace(/[-\s]/g, '').toUpperCase();
  };

  // Normalize client name for matching
  const normalizeClientName = (name: string): string => {
    return name
      .toLowerCase()
      .replace(/^(mr\.?|mrs\.?|ms\.?|miss\.?|dr\.?|prof\.?|sr\.?|jr\.?)\s+/gi, '') // Remove titles at start
      .replace(/[.\s]+/g, ' ') // Replace periods and multiple spaces with single space
      .replace(/&/g, 'and')     // Normalize ampersand
      .trim();
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile) {
      if (selectedFile.type.includes('spreadsheet') || selectedFile.name.endsWith('.xlsx') || selectedFile.name.endsWith('.xls')) {
        setFile(selectedFile);
        setResults(null);
        setPreview(null);
        
        // Generate preview
        await generatePreview(selectedFile);
      } else {
        toast({
          title: "Invalid file type",
          description: "Please select an Excel file (.xlsx or .xls)",
          variant: "destructive"
        });
      }
    }
  };

  const generatePreview = async (selectedFile: File) => {
    if (!user) return;

    try {
      const XLSX = await import('xlsx');
      const data = await selectedFile.arrayBuffer();
      const workbook = XLSX.read(data, { type: 'array' });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { 
        raw: false,
        defval: ''
      }) as any[];

      if (jsonData.length === 0) {
        toast({
          title: "Empty file",
          description: "The Excel file contains no data",
          variant: "destructive"
        });
        return;
      }

      // Get user's firm_id
      const { data: teamMember } = await supabase
        .from('team_members')
        .select('firm_id')
        .eq('user_id', user.id)
        .single();

      if (!teamMember?.firm_id) return;

      // Fetch all cases and clients ONCE upfront to avoid repeated queries
      const { data: allCases } = await supabase
        .from('cases')
        .select('id, case_title, cnr_number')
        .eq('firm_id', teamMember.firm_id);

      const { data: allClients } = await supabase
        .from('clients')
        .select('id, full_name')
        .eq('firm_id', teamMember.firm_id);

      // Extract columns
      const columns = Object.keys(jsonData[0]);
      
      // Preview first 5 rows
      const previewRows = jsonData.slice(0, 5);

      // Check CNR and client matches for preview rows
      const clientMatches = [];
      for (let i = 0; i < previewRows.length; i++) {
        const row = previewRows[i];
        const cleanField = (value: any): string | null => {
          if (value === null || value === undefined || value === '') return null;
          const cleaned = String(value).trim();
          return cleaned === '' ? null : cleaned;
        };

        const cnrNumber = cleanField(row.cnr_number || row['CNR Number'] || row['cnr_number'] || row['CNR'] || row['cnr']);
        const clientName = cleanField(row.client_name || row['Client Name'] || row['client_name'] || row.client || row['Client']);
        let matchedClient = null;
        let caseFound = false;

        // Check if case exists with this CNR (normalize for matching)
        if (cnrNumber && allCases) {
          const normalizedCNR = normalizeCNR(cnrNumber);
          
          const existingCase = allCases.find(c => 
            normalizeCNR(c.cnr_number || '') === normalizedCNR
          );
          
          caseFound = !!existingCase;
        }

        if (clientName && allClients) {
          const normalizedInputName = normalizeClientName(clientName);
          
          const matchedDbClient = allClients.find(c => 
            normalizeClientName(c.full_name) === normalizedInputName
          );

          matchedClient = matchedDbClient?.full_name || null;
        }

        clientMatches.push({
          rowNumber: i + 2,
          cnrNumber: cnrNumber || 'N/A',
          caseFound,
          clientName: clientName || 'N/A',
          matchedClient
        });
      }

      setPreview({
        rows: previewRows,
        columns,
        clientMatches
      });

    } catch (error: any) {
      console.error('Preview error:', error);
      toast({
        title: "Preview failed",
        description: error.message,
        variant: "destructive"
      });
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
          cnr_number: 'GUJHC010123452024',
          client_name: 'John Doe'
        },
        {
          cnr_number: 'GUJHC010123462024',
          client_name: 'Jane Smith'
        },
        {
          cnr_number: 'GUJHC010123472024',
          client_name: 'ABC Corporation'
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

      XLSX.writeFile(wb, 'cases_client_link_template.xlsx');
      
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
    setProgress({ current: 0, total: 0 });

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

      if (jsonData.length === 0) {
        throw new Error('No data found in the Excel file');
      }

      setProgress({ current: 0, total: jsonData.length });

      // Get user's firm_id
      const { data: teamMember } = await supabase
        .from('team_members')
        .select('firm_id')
        .eq('user_id', user.id)
        .single();

      if (!teamMember?.firm_id) {
        throw new Error('Unable to determine your firm. Please contact support.');
      }

      // Fetch all cases and clients ONCE upfront to avoid repeated queries
      const { data: allCases } = await supabase
        .from('cases')
        .select('id, case_title, cnr_number')
        .eq('firm_id', teamMember.firm_id);

      const { data: allClients } = await supabase
        .from('clients')
        .select('id, full_name')
        .eq('firm_id', teamMember.firm_id);

      if (!allCases || !allClients) {
        throw new Error('Failed to load cases and clients data');
      }

      let successCount = 0;
      const casesNotFound: string[] = [];
      const clientsNotFound: string[] = [];
      const successfulUpdates: { caseId: string; caseTitle: string; clientName: string }[] = [];
      const errors: string[] = [];

      // Prepare batch updates
      const batchUpdates: Array<{ id: string; client_id: string; rowInfo: any }> = [];

      for (let i = 0; i < jsonData.length; i++) {
        const row = jsonData[i];
        const rowNumber = i + 2;

        try {
          const cleanField = (value: any): string | null => {
            if (value === null || value === undefined || value === '') return null;
            const cleaned = String(value).trim();
            return cleaned === '' ? null : cleaned;
          };

          // Get CNR number
          const cnrNumber = cleanField(row.cnr_number || row['CNR Number'] || row['cnr_number'] || row['CNR'] || row['cnr']);

          if (!cnrNumber) {
            errors.push(`Row ${rowNumber}: CNR number is required`);
            continue;
          }

          // Normalize CNR for matching
          const normalizedCNR = normalizeCNR(cnrNumber);

          // Find existing case by CNR using cached data
          const existingCase = allCases.find(c => 
            normalizeCNR(c.cnr_number || '') === normalizedCNR
          );

          if (!existingCase) {
            casesNotFound.push(`Row ${rowNumber}: CNR ${cnrNumber}`);
            continue;
          }

          // Find client by name if provided
          let clientId = null;
          let matchedClientName = null;
          const clientName = cleanField(row.client_name || row['Client Name'] || row['client_name'] || row.client || row['Client']);
          
          if (clientName) {
            const normalizedInputName = normalizeClientName(clientName);
            
            // Find best match using cached clients data
            const matchedClient = allClients.find(c => 
              normalizeClientName(c.full_name) === normalizedInputName
            );
            
            if (matchedClient) {
              clientId = matchedClient.id;
              matchedClientName = matchedClient.full_name;
            } else {
              clientsNotFound.push(`Row ${rowNumber}: ${clientName}`);
              continue;
            }
          } else {
            // No client name provided, skip this row
            errors.push(`Row ${rowNumber}: No client_name provided`);
            continue;
          }

          // Prepare for batch update
          batchUpdates.push({
            id: existingCase.id,
            client_id: clientId,
            rowInfo: {
              caseId: existingCase.cnr_number || existingCase.id,
              caseTitle: existingCase.case_title,
              clientName: matchedClientName || clientName
            }
          });

        } catch (error: any) {
          console.error(`Row ${rowNumber} error:`, error);
          errors.push(`Row ${rowNumber}: ${error.message}`);
        }
      }

      // Process batch updates in chunks of 20 to avoid timeouts
      const BATCH_SIZE = 20;
      for (let i = 0; i < batchUpdates.length; i += BATCH_SIZE) {
        const batch = batchUpdates.slice(i, i + BATCH_SIZE);
        
        // Execute batch updates in parallel
        const updatePromises = batch.map(async (update) => {
          try {
            const { error } = await supabase
              .from('cases')
              .update({ 
                client_id: update.client_id,
                updated_at: new Date().toISOString()
              })
              .eq('id', update.id);

            if (error) {
              throw error;
            }

            return { success: true, rowInfo: update.rowInfo };
          } catch (error: any) {
            console.error(`Update error for case ${update.id}:`, error);
            return { 
              success: false, 
              error: error.message,
              rowInfo: update.rowInfo
            };
          }
        });

        const results = await Promise.all(updatePromises);
        
        // Track results
        results.forEach((result) => {
          if (result.success) {
            successCount++;
            successfulUpdates.push(result.rowInfo);
          } else {
            errors.push(`Failed to update ${result.rowInfo.caseId}: ${result.error}`);
          }
        });

        // Update progress
        setProgress({ 
          current: Math.min(i + BATCH_SIZE, batchUpdates.length), 
          total: batchUpdates.length 
        });

        // Add delay between batches to prevent database overload
        if (i + BATCH_SIZE < batchUpdates.length) {
          await sleep(400);
        }
      }

      setResults({ 
        successCount, 
        casesNotFound, 
        clientsNotFound, 
        successfulUpdates,
        errors 
      });

      if (successCount > 0) {
        toast({
          title: "Update completed",
          description: `Successfully updated ${successCount} case(s) with client information`,
        });
        onSuccess?.();
      } else {
        toast({
          title: "No updates made",
          description: "Check the errors below for details",
          variant: "destructive"
        });
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

  const downloadReport = async () => {
    if (!results) return;

    try {
      const XLSX = await import('xlsx');
      
      // Create report data
      const reportData = {
        summary: [
          { Metric: 'Total Successful Updates', Count: results.successCount },
          { Metric: 'Cases Not Found', Count: results.casesNotFound.length },
          { Metric: 'Clients Not Found', Count: results.clientsNotFound.length },
          { Metric: 'Other Errors', Count: results.errors.length }
        ],
        successfulUpdates: results.successfulUpdates.map(u => ({
          'Case ID': u.caseId,
          'Case Title': u.caseTitle,
          'Client Name': u.clientName
        })),
        casesNotFound: results.casesNotFound.map(c => ({ Error: c })),
        clientsNotFound: results.clientsNotFound.map(c => ({ Error: c })),
        otherErrors: results.errors.map(e => ({ Error: e }))
      };

      const wb = XLSX.utils.book_new();
      
      // Add sheets
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(reportData.summary), 'Summary');
      if (reportData.successfulUpdates.length > 0) {
        XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(reportData.successfulUpdates), 'Successful Updates');
      }
      if (reportData.casesNotFound.length > 0) {
        XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(reportData.casesNotFound), 'Cases Not Found');
      }
      if (reportData.clientsNotFound.length > 0) {
        XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(reportData.clientsNotFound), 'Clients Not Found');
      }
      if (reportData.otherErrors.length > 0) {
        XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(reportData.otherErrors), 'Other Errors');
      }

      XLSX.writeFile(wb, `bulk_update_report_${new Date().toISOString().split('T')[0]}.xlsx`);
      
      toast({
        title: "Report downloaded",
        description: "Detailed report has been downloaded",
      });
    } catch (error: any) {
      toast({
        title: "Download failed",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const resetDialog = () => {
    setFile(null);
    setResults(null);
    setPreview(null);
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
          <DialogTitle>Link Cases with Clients by CNR</DialogTitle>
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
                  Download template with CNR number and client name columns.
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

            {/* Preview */}
            {preview && (
              <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
                <div className="flex items-start gap-3">
                  <Eye className="w-5 h-5 text-purple-600 mt-0.5" />
                  <div className="flex-1">
                    <h3 className="font-medium text-purple-900 mb-2">Data Preview</h3>
                    
                    <div className="mb-3">
                      <p className="text-sm text-purple-700 mb-1">
                        <strong>Detected Columns:</strong> {preview.columns.join(', ')}
                      </p>
                      <p className="text-sm text-purple-700">
                        <strong>Total Rows:</strong> {preview.rows.length} (showing first 5)
                      </p>
                    </div>

                    <div className="bg-white rounded border border-purple-200 overflow-hidden">
                      <div className="overflow-x-auto max-h-48">
                        <table className="w-full text-xs">
                          <thead className="bg-purple-100 sticky top-0">
                            <tr>
                              <th className="px-2 py-1 text-left">Row</th>
                              {preview.columns.slice(0, 5).map(col => (
                                <th key={col} className="px-2 py-1 text-left">{col}</th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {preview.rows.map((row, idx) => (
                              <tr key={idx} className="border-t border-purple-100">
                                <td className="px-2 py-1 font-medium">{idx + 2}</td>
                                {preview.columns.slice(0, 5).map(col => (
                                  <td key={col} className="px-2 py-1 truncate max-w-[150px]">
                                    {row[col] || '-'}
                                  </td>
                                ))}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    <div className="mt-3">
                      <p className="text-sm font-medium text-purple-900 mb-2">Matching Preview:</p>
                      <div className="space-y-1">
                        {preview.clientMatches.map((match, idx) => (
                          <div key={idx} className="text-xs text-purple-700">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-medium">Row {match.rowNumber}:</span>
                              <span className="text-purple-600">CNR: {match.cnrNumber}</span>
                              {match.caseFound ? (
                                <span className="text-green-700 font-medium">✓ Case Found</span>
                              ) : (
                                <span className="text-red-700 font-medium">✗ Case Not Found</span>
                              )}
                            </div>
                            <div className="flex items-center gap-2 ml-4">
                              <span>Client: {match.clientName}</span>
                              <span>→</span>
                              {match.matchedClient ? (
                                <span className="text-green-700 font-medium">✓ {match.matchedClient}</span>
                              ) : (
                                <span className="text-red-700 font-medium">✗ Not found</span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Progress Bar */}
            {importing && progress.total > 0 && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm text-slate-700">
                  <span>Processing...</span>
                  <span>{progress.current} / {progress.total} rows</span>
                </div>
                <Progress 
                  value={(progress.current / progress.total) * 100} 
                  className="h-2"
                />
              </div>
            )}

            <Button
              onClick={processImport}
              disabled={!file || importing}
              className="w-full bg-slate-800 hover:bg-slate-700"
            >
              {importing ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  Processing...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4 mr-2" />
                  Update Cases with Client Links
                </>
              )}
            </Button>
          </div>

          {/* Results */}
          {results && (
            <div className="space-y-4">
              {/* Summary */}
              <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-slate-900">Update Summary</h3>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={downloadReport}
                    className="text-slate-700"
                  >
                    <FileDown className="w-4 h-4 mr-2" />
                    Download Report
                  </Button>
                </div>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="bg-green-100 p-3 rounded">
                    <p className="text-green-600 font-medium">Successful</p>
                    <p className="text-2xl font-bold text-green-800">{results.successCount}</p>
                  </div>
                  <div className="bg-red-100 p-3 rounded">
                    <p className="text-red-600 font-medium">Failed</p>
                    <p className="text-2xl font-bold text-red-800">
                      {results.casesNotFound.length + results.clientsNotFound.length + results.errors.length}
                    </p>
                  </div>
                </div>
              </div>

              {/* Successful Updates */}
              {results.successfulUpdates.length > 0 && (
                <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                  <div className="flex items-start gap-2">
                    <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
                    <div className="flex-1">
                      <h3 className="font-medium text-green-800 mb-2">
                        Successfully Updated ({results.successfulUpdates.length})
                      </h3>
                      <div className="space-y-1 max-h-40 overflow-y-auto">
                        {results.successfulUpdates.slice(0, 10).map((update, index) => (
                          <p key={index} className="text-sm text-green-700">
                            • {update.caseId}: {update.caseTitle} → {update.clientName}
                          </p>
                        ))}
                        {results.successfulUpdates.length > 10 && (
                          <p className="text-sm text-green-600 italic">
                            ...and {results.successfulUpdates.length - 10} more (download report for full list)
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Cases Not Found */}
              {results.casesNotFound.length > 0 && (
                <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="w-5 h-5 text-orange-600 mt-0.5" />
                    <div className="flex-1">
                      <h3 className="font-medium text-orange-800 mb-2">
                        Cases Not Found ({results.casesNotFound.length})
                      </h3>
                      <div className="space-y-1 max-h-32 overflow-y-auto">
                        {results.casesNotFound.slice(0, 5).map((error, index) => (
                          <p key={index} className="text-sm text-orange-700">
                            • {error}
                          </p>
                        ))}
                        {results.casesNotFound.length > 5 && (
                          <p className="text-sm text-orange-600 italic">
                            ...and {results.casesNotFound.length - 5} more
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Clients Not Found */}
              {results.clientsNotFound.length > 0 && (
                <div className="bg-red-50 p-4 rounded-lg border border-red-200">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
                    <div className="flex-1">
                      <h3 className="font-medium text-red-800 mb-2">
                        Clients Not Found ({results.clientsNotFound.length})
                      </h3>
                      <div className="space-y-1 max-h-32 overflow-y-auto">
                        {results.clientsNotFound.slice(0, 5).map((error, index) => (
                          <p key={index} className="text-sm text-red-700">
                            • {error}
                          </p>
                        ))}
                        {results.clientsNotFound.length > 5 && (
                          <p className="text-sm text-red-600 italic">
                            ...and {results.clientsNotFound.length - 5} more
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Other Errors */}
              {results.errors.length > 0 && (
                <div className="bg-red-50 p-4 rounded-lg border border-red-200">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
                    <div className="flex-1">
                      <h3 className="font-medium text-red-800 mb-2">
                        Other Errors ({results.errors.length})
                      </h3>
                      <div className="space-y-1 max-h-32 overflow-y-auto">
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
              <li>Upload Excel file with two columns: <strong>cnr_number</strong> and <strong>client_name</strong></li>
              <li>CNR number will be matched with cases in your database</li>
              <li>Client names will be matched using fuzzy matching</li>
              <li>Both case and client must exist in your database</li>
              <li>Cases or clients not found will be shown in errors</li>
              <li>Download the template to see the correct format</li>
            </ul>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};