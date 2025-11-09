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

          // Validate required fields
          const caseTitle = cleanField(row.case_title || row['Case Title'] || row['case_title'] || row['TITLE'] || row['Title']);
          if (!caseTitle) {
            errors.push(`Row ${rowNumber}: Case title is required`);
            continue;
          }

          // Parse dates
          const parseDate = (dateValue: any): string | null => {
            if (!dateValue) return null;
            try {
              const date = new Date(dateValue);
              if (isNaN(date.getTime())) return null;
              return date.toISOString().split('T')[0];
            } catch {
              return null;
            }
          };

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
            }
          }

          // Find Chitrajeet Upadhyaya as assigned lawyer
          let assignedLawyerId = null;
          const { data: lawyer } = await supabase
            .from('team_members')
            .select('user_id')
            .eq('firm_id', teamMember.firm_id)
            .in('role', ['lawyer', 'admin'])
            .limit(1)
            .single();
          
          if (lawyer) {
            const { data: profile } = await supabase
              .from('profiles')
              .select('id')
              .eq('id', lawyer.user_id)
              .ilike('full_name', '%Chitrajeet Upadhyaya%')
              .single();
            
            if (profile) {
              assignedLawyerId = profile.id;
            }
          }

          // If Chitrajeet not found, use any lawyer/admin from the firm
          if (!assignedLawyerId && lawyer) {
            assignedLawyerId = lawyer.user_id;
          }

          const caseData = {
            case_title: caseTitle,
            title: caseTitle, // For compatibility
            reference_number: cleanField(row.reference_number || row['Reference Number'] || row['reference_number'] || row['REFERENCE NUMBER']),
            case_number: cleanField(row.case_number || row['Case Number'] || row['case_number']),
            by_against: (cleanField(row.by_against || row['By/Against'] || row['by_against'] || row['BY/AGAINST']) || null)?.toLowerCase() as any,
            case_type: (cleanField(row.case_type || row['Case Type'] || row['case_type']) || 'civil').toLowerCase() as any,
            status: (cleanField(row.status || row['Status']) || 'open').toLowerCase() as any,
            priority: (cleanField(row.priority || row['Priority']) || 'medium').toLowerCase() as any,
            court: cleanField(row.court || row['Court'] || row.court_name || row['Court Name'] || row['court_name']),
            court_name: cleanField(row.court_name || row['Court Name'] || row['court_name'] || row.court || row['Court']),
            petitioner: cleanField(row.petitioner || row['Petitioner']),
            respondent: cleanField(row.respondent || row['Respondent']),
            filing_date: parseDate(row.filing_date || row['Filing Date'] || row['filing_date']),
            next_hearing_date: parseDate(row.next_hearing_date || row['Next Hearing Date'] || row['next_hearing_date']),
            description: cleanField(row.description || row['Description']),
            stage: cleanField(row.stage || row['Stage']),
            client_id: clientId,
            assigned_to: assignedLawyerId,
            firm_id: teamMember.firm_id,
            created_by: user.id
          };

          // Validate enums
          const validByAgainst = ['by', 'against'];
          if (caseData.by_against && !validByAgainst.includes(caseData.by_against)) {
            caseData.by_against = null;
          }

          const validCaseTypes = ['civil', 'criminal', 'family', 'corporate', 'tax', 'labor', 'property', 'other'];
          if (!validCaseTypes.includes(caseData.case_type)) {
            caseData.case_type = 'civil';
          }

          const validStatuses = ['open', 'closed', 'on_hold', 'active', 'pending'];
          if (!validStatuses.includes(caseData.status)) {
            caseData.status = 'open';
          }

          const validPriorities = ['low', 'medium', 'high', 'urgent'];
          if (!validPriorities.includes(caseData.priority)) {
            caseData.priority = 'medium';
          }

          const { error } = await supabase
            .from('cases')
            .insert([caseData]);

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
          title: "Import completed",
          description: `Successfully imported ${successCount} case(s)`,
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
          <DialogTitle>Bulk Import Cases</DialogTitle>
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
                      Successfully imported {results.success} case(s)
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
              <li>Download the template first to see the required format</li>
              <li>Fill in your case data following the template structure</li>
              <li>Case title is required for each case</li>
              <li>Column names are flexible (e.g., "Case Title", "case_title", "TITLE" all work)</li>
              <li>Valid by_against values: by, against (indicates if case is filed by or against the client)</li>
              <li>Valid case types: civil, criminal, family, corporate, tax, labor, property, other</li>
              <li>Valid status values: open, closed, on_hold, active, pending</li>
              <li>Valid priority values: low, medium, high, urgent</li>
              <li>Dates should be in YYYY-MM-DD format or Excel date format</li>
              <li>Client names will be matched with existing clients in your firm</li>
              <li>Save your file as .xlsx or .xls format</li>
            </ul>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};