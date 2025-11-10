import React, { useState, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Upload, Download, AlertCircle, CheckCircle, FileDown, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import * as XLSX from 'xlsx';

interface BulkImportDisposedCasesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

interface PreviewData {
  rows: any[];
  columns: string[];
  validationResults: {
    rowNumber: number;
    title: string;
    cnr: string;
    caseNumber: string;
    referenceNumber: string;
    clientName: string;
    matchedClient: string | null;
    hasRequiredFields: boolean;
    errors: string[];
  }[];
}

interface DetailedResults {
  successCount: number;
  failureCount: number;
  clientNotFoundCount: number;
  successfulImports: {
    rowNumber: number;
    title: string;
    cnr: string;
    clientName: string;
  }[];
  clientsNotFound: {
    rowNumber: number;
    clientName: string;
  }[];
  errors: {
    rowNumber: number;
    error: string;
  }[];
}

export const BulkImportDisposedCasesDialog = ({
  open,
  onOpenChange,
  onSuccess
}: BulkImportDisposedCasesDialogProps) => {
  const [file, setFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);
  const [progress, setProgress] = useState({
    current: 0,
    total: 0,
    phase: '' as 'validating' | 'processing' | '',
    currentBatch: 0,
    totalBatches: 0
  });
  const [preview, setPreview] = useState<PreviewData | null>(null);
  const [results, setResults] = useState<DetailedResults | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const { user } = useAuth();

  // Helper function to add delay
  const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

  // Normalize CNR number
  const normalizeCNR = (cnr: string): string => {
    return cnr.replace(/[-\s\/]/g, '').toUpperCase();
  };

  // Normalize client name for matching
  const normalizeClientName = (name: string): string => {
    return name.toLowerCase()
      .replace(/^(mr\.?|mrs\.?|ms\.?|miss\.?|dr\.?|prof\.?|sr\.?|jr\.?)\s+/gi, '')
      .replace(/[.\s]+/g, ' ')
      .replace(/&/g, 'and')
      .replace(/\s+(ltd|limited|pvt|private|inc|incorporated|llp|llc)\.?$/gi, '')
      .trim();
  };

  // Parse date from multiple formats
  const parseDate = (dateStr: string | number): string | null => {
    if (!dateStr) return null;
    
    try {
      // Handle Excel serial date numbers
      if (typeof dateStr === 'number') {
        const date = new Date((dateStr - 25569) * 86400 * 1000);
        return date.toISOString().split('T')[0];
      }
      
      const str = String(dateStr).trim();
      
      // Try DD-MM-YYYY or DD/MM/YYYY
      const ddmmyyyyMatch = str.match(/^(\d{1,2})[-\/](\d{1,2})[-\/](\d{4})$/);
      if (ddmmyyyyMatch) {
        const [, day, month, year] = ddmmyyyyMatch;
        return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
      }
      
      // Try YYYY-MM-DD
      const yyyymmddMatch = str.match(/^(\d{4})[-\/](\d{1,2})[-\/](\d{1,2})$/);
      if (yyyymmddMatch) {
        const [, year, month, day] = yyyymmddMatch;
        return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
      }
      
      return null;
    } catch (error) {
      return null;
    }
  };

  // Map By/Against values
  const mapByAgainst = (value: string): 'by' | 'against' | null => {
    if (!value) return null;
    const normalized = value.toLowerCase().trim();
    if (normalized === 'by') return 'by';
    if (normalized === 'against') return 'against';
    return null;
  };

  // Extract field from row with multiple possible column names
  const getField = (row: any, possibleNames: string[]): string => {
    for (const name of possibleNames) {
      const value = row[name];
      if (value !== undefined && value !== null && String(value).trim()) {
        return String(value).trim();
      }
    }
    return '';
  };

  // Download sample template
  const downloadSampleTemplate = () => {
    const template = [
      {
        'Matter Reference Number': 'MAT/2023/001',
        'Title': 'John Doe Vs State of Gujarat',
        'Case Number': 'WP 1234/2023',
        'Forum Type': 'High Court',
        'Court': 'Gujarat High Court',
        'By/Against': 'By',
        'client': 'John Doe',
        'CNR': 'GUJHC010012342023',
        'Case status': 'Disposed',
        'Filing Date': '15-01-2023',
        'Disposed Date': '20-03-2024',
        'Nature of Disposal': 'Dismissed',
        'Last Order Date': '20-03-2024',
        'Last Hearing Date': '15-03-2024'
      }
    ];

    const ws = XLSX.utils.json_to_sheet(template);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Template');
    XLSX.writeFile(wb, 'disposed_cases_template.xlsx');

    toast({
      title: "Template Downloaded",
      description: "Sample template downloaded successfully"
    });
  };

  // Generate preview
  const generatePreview = async (uploadedFile: File) => {
    try {
      const data = await uploadedFile.arrayBuffer();
      const workbook = XLSX.read(data);
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json(worksheet);

      if (rows.length === 0) {
        toast({
          title: "Empty File",
          description: "The uploaded file contains no data",
          variant: "destructive"
        });
        return;
      }

      // Get firm_id for the current user
      const { data: teamMember } = await supabase
        .from('team_members')
        .select('firm_id')
        .eq('user_id', user?.id)
        .single();

      if (!teamMember?.firm_id) {
        toast({
          title: "Error",
          description: "Could not find your firm association",
          variant: "destructive"
        });
        return;
      }

      // Fetch all clients for matching
      const { data: clients } = await supabase
        .from('clients')
        .select('id, full_name')
        .eq('firm_id', teamMember.firm_id);

      const clientsMap = new Map();
      clients?.forEach(client => {
        clientsMap.set(normalizeClientName(client.full_name), {
          id: client.id,
          name: client.full_name
        });
      });

      // Validate first 5 rows for preview
      const previewRows = rows.slice(0, 5);
      const validationResults = previewRows.map((row: any, index: number) => {
        const title = getField(row, ['Title', 'title', 'TITLE', 'Case Title']);
        const cnr = getField(row, ['CNR', 'cnr', 'CNR Number', 'cnr_number']);
        const caseNumber = getField(row, ['Case Number', 'case_number', 'CASE_NUMBER']);
        const referenceNumber = getField(row, ['Matter Reference Number', 'reference_number', 'Reference Number']);
        const clientName = getField(row, ['client', 'Client', 'Client Name', 'client_name']);

        const errors: string[] = [];
        let matchedClient = null;

        // Required field: Title
        if (!title) {
          errors.push('Missing Title');
        }

        // At least one identifier required
        if (!cnr && !caseNumber && !referenceNumber) {
          errors.push('Need at least one: CNR, Case Number, or Reference Number');
        }

        // Match client if provided
        if (clientName) {
          const normalizedClientName = normalizeClientName(clientName);
          const match = clientsMap.get(normalizedClientName);
          if (match) {
            matchedClient = match.name;
          } else {
            errors.push('Client not found');
          }
        }

        return {
          rowNumber: index + 2, // +2 because Excel is 1-indexed and has header
          title,
          cnr,
          caseNumber,
          referenceNumber,
          clientName,
          matchedClient,
          hasRequiredFields: !!(title && (cnr || caseNumber || referenceNumber)),
          errors
        };
      });

      setPreview({
        rows: previewRows,
        columns: Object.keys(rows[0]),
        validationResults
      });

    } catch (error) {
      console.error('Preview generation error:', error);
      toast({
        title: "Error",
        description: "Failed to generate preview",
        variant: "destructive"
      });
    }
  };

  // Handle file selection
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setPreview(null);
      setResults(null);
      generatePreview(selectedFile);
    }
  };

  // Process import
  const processImport = async () => {
    if (!file || !user) return;

    setImporting(true);
    setResults(null);
    setProgress({ current: 0, total: 0, phase: 'validating', currentBatch: 0, totalBatches: 0 });

    try {
      // Get firm_id
      const { data: teamMember } = await supabase
        .from('team_members')
        .select('firm_id')
        .eq('user_id', user.id)
        .single();

      if (!teamMember?.firm_id) {
        throw new Error('Could not find your firm association');
      }

      const firmId = teamMember.firm_id;

      // Read Excel file
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data);
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json(worksheet);

      setProgress(prev => ({ ...prev, total: rows.length }));

      // Fetch all clients for matching
      const { data: clients } = await supabase
        .from('clients')
        .select('id, full_name')
        .eq('firm_id', firmId);

      const clientsMap = new Map();
      clients?.forEach(client => {
        clientsMap.set(normalizeClientName(client.full_name), {
          id: client.id,
          name: client.full_name
        });
      });

      // Process in batches
      const BATCH_SIZE = 10;
      const totalBatches = Math.ceil(rows.length / BATCH_SIZE);
      
      const detailedResults: DetailedResults = {
        successCount: 0,
        failureCount: 0,
        clientNotFoundCount: 0,
        successfulImports: [],
        clientsNotFound: [],
        errors: []
      };

      setProgress(prev => ({ ...prev, phase: 'processing', totalBatches }));

      for (let batchIndex = 0; batchIndex < totalBatches; batchIndex++) {
        const batchStart = batchIndex * BATCH_SIZE;
        const batchEnd = Math.min(batchStart + BATCH_SIZE, rows.length);
        const batch = rows.slice(batchStart, batchEnd);

        setProgress(prev => ({ ...prev, currentBatch: batchIndex + 1 }));

        for (let i = 0; i < batch.length; i++) {
          const row: any = batch[i];
          const rowNumber = batchStart + i + 2; // +2 for Excel indexing and header

          try {
            // Extract all fields
            const title = getField(row, ['Title', 'title', 'TITLE', 'Case Title']);
            const referenceNumber = getField(row, ['Matter Reference Number', 'reference_number', 'Reference Number']);
            const caseNumber = getField(row, ['Case Number', 'case_number', 'CASE_NUMBER']);
            const forumType = getField(row, ['Forum Type', 'forum_type', 'Court Type']);
            const court = getField(row, ['Court', 'court', 'Court Name']);
            const byAgainstStr = getField(row, ['By/Against', 'by_against', 'BY_AGAINST']);
            const clientName = getField(row, ['client', 'Client', 'Client Name', 'client_name']);
            const cnr = getField(row, ['CNR', 'cnr', 'CNR Number', 'cnr_number']);
            const filingDateStr = getField(row, ['Filing Date', 'filing_date', 'FILING_DATE']);
            const disposedDateStr = getField(row, ['Disposed Date', 'disposed_date', 'DISPOSED_DATE', 'Disposal Date']);
            const natureOfDisposal = getField(row, ['Nature of Disposal', 'nature_of_disposal', 'Disposal Nature']);
            const lastOrderDateStr = getField(row, ['Last Order Date', 'last_order_date', 'Order Date']);
            const lastHearingDateStr = getField(row, ['Last Hearing Date', 'last_hearing_date', 'Hearing Date']);

            // Validation: Title is required
            if (!title) {
              detailedResults.errors.push({
                rowNumber,
                error: 'Missing required field: Title'
              });
              detailedResults.failureCount++;
              continue;
            }

            // Validation: At least one identifier
            if (!cnr && !caseNumber && !referenceNumber) {
              detailedResults.errors.push({
                rowNumber,
                error: 'Need at least one: CNR, Case Number, or Reference Number'
              });
              detailedResults.failureCount++;
              continue;
            }

            // Match client (optional)
            let clientId = null;
            let matchedClientName = null;
            if (clientName) {
              const normalizedClientName = normalizeClientName(clientName);
              const match = clientsMap.get(normalizedClientName);
              if (match) {
                clientId = match.id;
                matchedClientName = match.name;
              } else {
                detailedResults.clientsNotFound.push({
                  rowNumber,
                  clientName
                });
                detailedResults.clientNotFoundCount++;
                // Continue without client - it's optional
              }
            }

            // Parse dates
            const filingDate = parseDate(filingDateStr);
            const disposedDate = parseDate(disposedDateStr);
            const lastOrderDate = parseDate(lastOrderDateStr);
            const lastHearingDate = parseDate(lastHearingDateStr);

            // Map by/against
            const byAgainst = mapByAgainst(byAgainstStr);

            // Prepare case data
            const caseData: any = {
              case_title: title,
              reference_number: referenceNumber || null,
              case_number: caseNumber || null,
              court_type: forumType || null,
              court_name: court || null,
              by_against: byAgainst,
              client_id: clientId,
              cnr_number: cnr ? normalizeCNR(cnr) : null,
              status: 'disposed',
              filing_date: filingDate,
              disposal_date: disposedDate,
              decision_date: lastOrderDate,
              next_hearing_date: lastHearingDate,
              description: natureOfDisposal || null,
              created_by: user.id,
              firm_id: firmId,
              is_auto_fetched: false
            };

            // Insert case
            const { error: insertError } = await supabase
              .from('cases')
              .insert([caseData]);

            if (insertError) {
              detailedResults.errors.push({
                rowNumber,
                error: `Database error: ${insertError.message}`
              });
              detailedResults.failureCount++;
            } else {
              detailedResults.successfulImports.push({
                rowNumber,
                title,
                cnr: cnr || caseNumber || referenceNumber,
                clientName: matchedClientName || 'No client'
              });
              detailedResults.successCount++;
            }

          } catch (error: any) {
            detailedResults.errors.push({
              rowNumber,
              error: error.message
            });
            detailedResults.failureCount++;
          }

          setProgress(prev => ({ ...prev, current: batchStart + i + 1 }));
        }

        // Add delay between batches
        if (batchIndex < totalBatches - 1) {
          await sleep(800);
        }
      }

      setResults(detailedResults);

      toast({
        title: "Import Complete",
        description: `Successfully imported ${detailedResults.successCount} of ${rows.length} cases`
      });

      if (onSuccess) {
        onSuccess();
      }

    } catch (error: any) {
      console.error('Import error:', error);
      toast({
        title: "Import Failed",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setImporting(false);
      setProgress({ current: 0, total: 0, phase: '', currentBatch: 0, totalBatches: 0 });
    }
  };

  // Download detailed report
  const downloadReport = () => {
    if (!results) return;

    const reportData: any[] = [];

    // Add successful imports
    results.successfulImports.forEach(item => {
      reportData.push({
        'Row Number': item.rowNumber,
        'Status': 'Success',
        'Title': item.title,
        'CNR/Case Number': item.cnr,
        'Client': item.clientName,
        'Error': ''
      });
    });

    // Add clients not found
    results.clientsNotFound.forEach(item => {
      reportData.push({
        'Row Number': item.rowNumber,
        'Status': 'Client Not Found',
        'Title': '',
        'CNR/Case Number': '',
        'Client': item.clientName,
        'Error': 'Client not found in database'
      });
    });

    // Add errors
    results.errors.forEach(item => {
      reportData.push({
        'Row Number': item.rowNumber,
        'Status': 'Error',
        'Title': '',
        'CNR/Case Number': '',
        'Client': '',
        'Error': item.error
      });
    });

    const ws = XLSX.utils.json_to_sheet(reportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Import Report');
    XLSX.writeFile(wb, `disposed_cases_import_report_${new Date().toISOString().split('T')[0]}.xlsx`);

    toast({
      title: "Report Downloaded",
      description: "Detailed import report downloaded successfully"
    });
  };

  // Reset dialog
  const resetDialog = () => {
    setFile(null);
    setPreview(null);
    setResults(null);
    setImporting(false);
    setProgress({ current: 0, total: 0, phase: '', currentBatch: 0, totalBatches: 0 });
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
      if (!isOpen) resetDialog();
      onOpenChange(isOpen);
    }}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Bulk Import Disposed Cases</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Template Download Section */}
          <div className="bg-muted/50 p-4 rounded-lg space-y-3">
            <h3 className="font-semibold text-sm">Step 1: Download Template</h3>
            <p className="text-sm text-muted-foreground">
              Download the Excel template with all required columns for disposed cases
            </p>
            <Button onClick={downloadSampleTemplate} variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Download Template
            </Button>
          </div>

          {/* File Upload Section */}
          <div className="space-y-3">
            <h3 className="font-semibold text-sm">Step 2: Upload Your File</h3>
            <div className="flex items-center gap-3">
              <Input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls"
                onChange={handleFileSelect}
                disabled={importing}
                className="flex-1"
              />
              {file && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setFile(null);
                    setPreview(null);
                    if (fileInputRef.current) {
                      fileInputRef.current.value = '';
                    }
                  }}
                  disabled={importing}
                >
                  Clear
                </Button>
              )}
            </div>
          </div>

          {/* Preview Section */}
          {preview && (
            <div className="space-y-3">
              <h3 className="font-semibold text-sm">Preview (First 5 Rows)</h3>
              <div className="border rounded-lg overflow-hidden">
                <div className="max-h-64 overflow-y-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-muted sticky top-0">
                      <tr>
                        <th className="p-2 text-left">Row</th>
                        <th className="p-2 text-left">Title</th>
                        <th className="p-2 text-left">CNR/Case #</th>
                        <th className="p-2 text-left">Client</th>
                        <th className="p-2 text-left">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {preview.validationResults.map((result) => (
                        <tr key={result.rowNumber} className="border-t">
                          <td className="p-2">{result.rowNumber}</td>
                          <td className="p-2 truncate max-w-[200px]">{result.title || '-'}</td>
                          <td className="p-2 truncate max-w-[150px]">{result.cnr || result.caseNumber || result.referenceNumber || '-'}</td>
                          <td className="p-2">
                            {result.clientName ? (
                              result.matchedClient ? (
                                <span className="text-green-600 text-xs">✓ {result.matchedClient}</span>
                              ) : (
                                <span className="text-amber-600 text-xs">⚠ Not found</span>
                              )
                            ) : (
                              <span className="text-muted-foreground text-xs">No client</span>
                            )}
                          </td>
                          <td className="p-2">
                            {result.hasRequiredFields && result.errors.length === 0 ? (
                              <CheckCircle className="h-4 w-4 text-green-600" />
                            ) : (
                              <div className="flex items-center gap-1">
                                <AlertCircle className="h-4 w-4 text-destructive" />
                                <span className="text-xs text-destructive">{result.errors[0]}</span>
                              </div>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                Total rows to process: {preview.rows.length} (showing first 5)
              </p>
            </div>
          )}

          {/* Progress Section */}
          {importing && (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium">
                  {progress.phase === 'validating' ? 'Validating...' : 
                   `Processing batch ${progress.currentBatch} of ${progress.totalBatches}...`}
                </span>
                <span className="text-muted-foreground">
                  {progress.current} / {progress.total}
                </span>
              </div>
              <Progress value={(progress.current / progress.total) * 100} />
            </div>
          )}

          {/* Import Button */}
          {file && preview && !results && (
            <Button
              onClick={processImport}
              disabled={importing}
              className="w-full"
            >
              {importing ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Importing...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4 mr-2" />
                  Import Disposed Cases
                </>
              )}
            </Button>
          )}

          {/* Results Section */}
          {results && (
            <div className="space-y-4">
              <div className="bg-muted/50 p-4 rounded-lg space-y-3">
                <h3 className="font-semibold">Import Summary</h3>
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span>Success: {results.successCount}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 text-amber-600" />
                    <span>No Client: {results.clientNotFoundCount}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 text-destructive" />
                    <span>Failed: {results.failureCount}</span>
                  </div>
                </div>
              </div>

              {/* Successful Imports */}
              {results.successfulImports.length > 0 && (
                <div className="space-y-2">
                  <h4 className="font-semibold text-sm text-green-600">
                    Successfully Imported ({results.successfulImports.length})
                  </h4>
                  <div className="max-h-32 overflow-y-auto border rounded p-2 text-xs space-y-1">
                    {results.successfulImports.map((item) => (
                      <div key={item.rowNumber} className="flex justify-between">
                        <span>Row {item.rowNumber}: {item.title}</span>
                        <span className="text-muted-foreground">{item.clientName}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Clients Not Found */}
              {results.clientsNotFound.length > 0 && (
                <div className="space-y-2">
                  <h4 className="font-semibold text-sm text-amber-600">
                    Client Not Found ({results.clientNotFoundCount})
                  </h4>
                  <div className="max-h-32 overflow-y-auto border rounded p-2 text-xs space-y-1">
                    {results.clientsNotFound.map((item) => (
                      <div key={item.rowNumber}>
                        Row {item.rowNumber}: {item.clientName}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Errors */}
              {results.errors.length > 0 && (
                <div className="space-y-2">
                  <h4 className="font-semibold text-sm text-destructive">
                    Errors ({results.failureCount})
                  </h4>
                  <div className="max-h-32 overflow-y-auto border rounded p-2 text-xs space-y-1">
                    {results.errors.map((item) => (
                      <div key={item.rowNumber}>
                        Row {item.rowNumber}: {item.error}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Download Report Button */}
              <Button onClick={downloadReport} variant="outline" className="w-full">
                <FileDown className="h-4 w-4 mr-2" />
                Download Detailed Report
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};