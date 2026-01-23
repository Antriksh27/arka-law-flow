import React, { useState, useRef } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Upload, Download, AlertCircle, CheckCircle, Trash2, FileSpreadsheet, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface BulkImportClientsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
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

  const deleteRecentContacts = async () => {
    try {
      const { data: recentContacts } = await supabase
        .from('clients')
        .select('id')
        .gte('created_at', new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString())
        .is('email', null)
        .is('phone', null);

      if (recentContacts && recentContacts.length > 0) {
        const { error } = await supabase
          .from('clients')
          .delete()
          .in('id', recentContacts.map(c => c.id));

        if (error) throw error;

        toast({
          title: "Contacts deleted",
          description: `Deleted ${recentContacts.length} recent contacts with missing email/phone`,
        });
      } else {
        toast({
          title: "No contacts to delete",
          description: "No recent contacts found with missing email/phone",
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
          full_name: 'John Doe',
          email: 'john.doe@example.com',
          phone: '+91 9876543210',
          organization: 'ABC Corp',
          address: '123 Main Street',
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
      
      const colWidths = Object.keys(sampleData[0]).map(key => ({
        wch: Math.max(key.length, ...sampleData.map(row => String(row[key as keyof typeof row] || '').length)) + 2
      }));
      ws['!cols'] = colWidths;

      XLSX.writeFile(wb, 'clients_import_template.xlsx');
      
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

      if (jsonData.length === 0) {
        throw new Error('No data found in the Excel file');
      }

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

          const fullName = cleanField(row.full_name || row['Full Name'] || row['full_name'] || row['NAME'] || row['Name']);
          if (!fullName) {
            errors.push(`Row ${rowNumber}: Full name is required`);
            continue;
          }

          const rawEmail = cleanField(row.email || row['Email'] || row['EMAIL'] || row['E-mail'] || row['e-mail']);
          let email = rawEmail;

          const phone = cleanField(row.phone || row['Phone'] || row['PHONE'] || row['Mobile'] || row['mobile'] || row['Contact']);

          const clientData = {
            full_name: fullName,
            email: email,
            phone: phone,
            organization: cleanField(row.organization || row['Organization'] || row['Company']),
            address: cleanField(row.address || row['Address']),
            state: cleanField(row.state || row['State']),
            district: cleanField(row.district || row['District']),
            type: cleanField(row.type || row['Type']) || 'Individual',
            status: (cleanField(row.status || row['Status']) || 'new').toLowerCase() as any,
            notes: cleanField(row.notes || row['Notes']),
            firm_id: teamMember.firm_id,
            created_by: user.id
          };

          const validStatuses = ['active', 'inactive', 'lead', 'prospect', 'new'];
          if (!validStatuses.includes(clientData.status)) {
            clientData.status = 'new';
          }

          const { error } = await supabase
            .from('clients')
            .insert([clientData]);

          if (error) throw error;

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
      <DialogContent className="sm:max-w-2xl p-0 gap-0 overflow-hidden max-h-[90vh]">
        <div className="flex flex-col h-full bg-slate-50">
          {/* Header */}
          <div className="px-6 py-5 bg-white border-b border-slate-100">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center">
                  <Upload className="w-5 h-5 text-emerald-500" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-slate-900">Bulk Import Clients</h2>
                  <p className="text-sm text-muted-foreground">Import from Excel file</p>
                </div>
              </div>
              <button 
                onClick={() => onOpenChange(false)}
                className="md:hidden w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center hover:bg-slate-200 transition-colors"
              >
                <X className="w-4 h-4 text-slate-500" />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto px-6 py-6 space-y-4">
            {/* Clean Up Card */}
            <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
              <div className="p-4">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center">
                    <Trash2 className="w-5 h-5 text-orange-500" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-900">Clean Up Failed Imports</p>
                    <p className="text-xs text-muted-foreground">Delete recent contacts without email/phone</p>
                  </div>
                </div>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={deleteRecentContacts}
                  className="w-full rounded-xl border-orange-200 text-orange-700 hover:bg-orange-50"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete Incomplete Contacts
                </Button>
              </div>
            </div>

            {/* Template Download Card */}
            <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
              <div className="p-4">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-xl bg-sky-50 flex items-center justify-center">
                    <Download className="w-5 h-5 text-sky-500" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-900">Download Template</p>
                    <p className="text-xs text-muted-foreground">Get the sample Excel format</p>
                  </div>
                </div>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={downloadSampleTemplate}
                  className="w-full rounded-xl border-sky-200 text-sky-700 hover:bg-sky-50"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Download Template
                </Button>
              </div>
            </div>

            {/* File Upload Card */}
            <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
              <div className="p-4">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-xl bg-violet-50 flex items-center justify-center">
                    <FileSpreadsheet className="w-5 h-5 text-violet-500" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-900">Select Excel File</p>
                    <p className="text-xs text-muted-foreground">.xlsx or .xls format</p>
                  </div>
                </div>
                <div className="space-y-3">
                  <Input
                    ref={fileInputRef}
                    type="file"
                    accept=".xlsx,.xls"
                    onChange={handleFileSelect}
                    className="bg-slate-50 border-slate-200 rounded-xl"
                  />
                  {file && (
                    <div className="flex items-center gap-2 text-sm text-emerald-600 p-2 rounded-xl bg-emerald-50">
                      <CheckCircle className="w-4 h-4" />
                      {file.name}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Results */}
            {results && (
              <div className="space-y-3">
                {results.success > 0 && (
                  <div className="bg-emerald-50 rounded-2xl p-4 border border-emerald-100">
                    <div className="flex items-center gap-2 text-emerald-800">
                      <CheckCircle className="w-5 h-5" />
                      <span className="font-medium">
                        Successfully imported {results.success} client(s)
                      </span>
                    </div>
                  </div>
                )}

                {results.errors.length > 0 && (
                  <div className="bg-red-50 rounded-2xl p-4 border border-red-100">
                    <div className="flex items-start gap-2">
                      <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
                      <div className="flex-1">
                        <h3 className="font-medium text-red-800 mb-2">
                          {results.errors.length} error(s) occurred:
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
            <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
              <div className="p-4">
                <p className="text-sm font-semibold text-slate-900 mb-3">Instructions</p>
                <ul className="space-y-2 text-sm text-slate-600">
                  <li className="flex items-start gap-2">
                    <span className="w-5 h-5 rounded-full bg-slate-100 flex items-center justify-center text-xs font-medium flex-shrink-0">1</span>
                    <span>Download the template to see the required format</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="w-5 h-5 rounded-full bg-slate-100 flex items-center justify-center text-xs font-medium flex-shrink-0">2</span>
                    <span>Fill in your client data following the template structure</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="w-5 h-5 rounded-full bg-slate-100 flex items-center justify-center text-xs font-medium flex-shrink-0">3</span>
                    <span>Full name is required for each client</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="w-5 h-5 rounded-full bg-slate-100 flex items-center justify-center text-xs font-medium flex-shrink-0">4</span>
                    <span>Valid status: active, inactive, lead, prospect, new</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="px-6 py-4 bg-white border-t border-slate-100">
            <div className="flex gap-3">
              <Button 
                variant="outline" 
                onClick={() => onOpenChange(false)}
                className="flex-1 rounded-full"
              >
                Cancel
              </Button>
              <Button
                onClick={processImport}
                disabled={!file || importing}
                className="flex-1 rounded-full bg-slate-800 hover:bg-slate-700"
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
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
