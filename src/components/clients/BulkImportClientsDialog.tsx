import React, { useState, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Upload, Download, AlertCircle, CheckCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import * as XLSX from 'xlsx';

interface BulkImportClientsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

interface ClientRow {
  full_name: string;
  email?: string;
  phone?: string;
  organization?: string;
  address?: string;
  city?: string;
  state?: string;
  district?: string;
  type?: string;
  status?: string;
  notes?: string;
}

export const BulkImportClientsDialog = ({ 
  open, 
  onOpenChange, 
  onSuccess 
}: BulkImportClientsDialogProps) => {
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

  const downloadSampleTemplate = () => {
    const sampleData = [
      {
        full_name: 'John Doe',
        email: 'john.doe@example.com',
        phone: '+91 9876543210',
        organization: 'ABC Corp',
        address: '123 Main Street',
        city: 'Mumbai',
        state: 'Maharashtra',
        district: 'Mumbai',
        type: 'Individual',
        status: 'active',
        notes: 'Important client'
      },
      {
        full_name: 'Jane Smith',
        email: 'jane.smith@example.com',
        phone: '+91 9876543211',
        organization: 'XYZ Ltd',
        address: '456 Oak Avenue',
        city: 'Delhi',
        state: 'Delhi',
        district: 'Central Delhi',
        type: 'Corporate',
        status: 'new',
        notes: 'Referred by John'
      }
    ];

    const ws = XLSX.utils.json_to_sheet(sampleData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Clients');
    
    // Auto-size columns
    const colWidths = Object.keys(sampleData[0]).map(key => ({
      wch: Math.max(key.length, ...sampleData.map(row => String(row[key as keyof typeof row] || '').length)) + 2
    }));
    ws['!cols'] = colWidths;

    XLSX.writeFile(wb, 'clients_import_template.xlsx');
    
    toast({
      title: "Template downloaded",
      description: "Sample Excel template has been downloaded",
    });
  };

  const processImport = async () => {
    if (!file || !user) return;

    setImporting(true);
    setResults(null);

    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data, { type: 'array' });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json(worksheet) as ClientRow[];

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
        const rowNumber = i + 2; // Excel row number (1-indexed + header row)

        try {
          // Validate required fields
          if (!row.full_name || row.full_name.trim() === '') {
            errors.push(`Row ${rowNumber}: Full name is required`);
            continue;
          }

          // Prepare client data
          const clientData = {
            full_name: row.full_name.trim(),
            email: row.email ? row.email.trim() : null,
            phone: row.phone ? row.phone.trim() : null,
            organization: row.organization ? row.organization.trim() : null,
            address: row.address ? row.address.trim() : null,
            city: row.city ? row.city.trim() : null,
            state: row.state ? row.state.trim() : null,
            district: row.district ? row.district.trim() : null,
            type: row.type ? row.type.trim() : 'Individual',
            status: row.status ? row.status.toLowerCase().trim() as any : 'new',
            notes: row.notes ? row.notes.trim() : null,
            firm_id: teamMember.firm_id,
            created_by: user.id
          };

          // Validate status
          const validStatuses = ['active', 'inactive', 'lead', 'prospect', 'new'];
          if (clientData.status && !validStatuses.includes(clientData.status)) {
            clientData.status = 'new';
          }

          // Insert client
          const { error } = await supabase
            .from('clients')
            .insert([clientData]);

          if (error) {
            throw error;
          }

          successCount++;
        } catch (error: any) {
          errors.push(`Row ${rowNumber}: ${error.message}`);
        }
      }

      setResults({ success: successCount, errors });

      if (successCount > 0) {
        toast({
          title: "Import completed",
          description: `Successfully imported ${successCount} client(s)`,
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
          <DialogTitle>Bulk Import Clients</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
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

            {/* Import Button */}
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
                  Import Clients
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
                      Successfully imported {results.success} client(s)
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
              <li>Fill in your client data following the template structure</li>
              <li>Full name is required for each client</li>
              <li>Valid status values: active, inactive, lead, prospect, new</li>
              <li>Type can be: Individual or Corporate</li>
              <li>Save your file as .xlsx or .xls format</li>
            </ul>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};