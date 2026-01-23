import React, { useState } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Upload, Download, Loader2, Link2, X, CheckCircle, AlertCircle, FileSpreadsheet } from 'lucide-react';
import * as XLSX from 'xlsx';
import { Progress } from '@/components/ui/progress';
import { Label } from '@/components/ui/label';

interface LinkClientsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

interface UploadRow {
  cnr_number: string;
  client_name: string;
  rowNumber: number;
}

interface ProcessingResult {
  total: number;
  linked: number;
  skipped: number;
  caseNotFound: number;
  clientNotFound: number;
  errors: string[];
}

const normalizeCNR = (cnr: string): string => {
  if (!cnr) return '';
  return cnr.toString().trim().toUpperCase().replace(/[\/\-\s]/g, '');
};

export const LinkClientsDialog: React.FC<LinkClientsDialogProps> = ({
  open,
  onOpenChange,
  onSuccess,
}) => {
  const [file, setFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentRow, setCurrentRow] = useState(0);
  const [totalRows, setTotalRows] = useState(0);
  const [result, setResult] = useState<ProcessingResult | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setResult(null);
    }
  };

  const downloadTemplate = () => {
    const template = [
      { cnr_number: 'GJHC240536442017', client_name: 'John Doe' },
      { cnr_number: 'GJ/HC/24/053644/2017', client_name: 'Jane Smith' },
    ];

    const ws = XLSX.utils.json_to_sheet(template);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Template');
    XLSX.writeFile(wb, 'link_clients_template.xlsx');
    toast.success('Template downloaded');
  };

  const processFile = async () => {
    if (!file) {
      toast.error('Please select a file');
      return;
    }

    setIsProcessing(true);
    setResult(null);
    setProgress(0);

    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data);
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData = XLSX.utils.sheet_to_json(worksheet);

      if (jsonData.length === 0) {
        toast.error('File is empty');
        setIsProcessing(false);
        return;
      }

      const rows: UploadRow[] = jsonData.map((row: any, index) => ({
        cnr_number: row.cnr_number || row.CNR_NUMBER || row['CNR Number'] || '',
        client_name: row.client_name || row.CLIENT_NAME || row['Client Name'] || '',
        rowNumber: index + 2,
      }));

      setTotalRows(rows.length);

      const processingResult: ProcessingResult = {
        total: rows.length,
        linked: 0,
        skipped: 0,
        caseNotFound: 0,
        clientNotFound: 0,
        errors: [],
      };

      const BATCH_SIZE = 10;
      for (let i = 0; i < rows.length; i += BATCH_SIZE) {
        const batch = rows.slice(i, i + BATCH_SIZE);

        await Promise.all(
          batch.map(async (row) => {
            try {
              setCurrentRow(row.rowNumber - 1);

              if (!row.cnr_number || !row.client_name) {
                processingResult.errors.push(
                  `Row ${row.rowNumber}: Missing CNR or client name`
                );
                return;
              }

              const normalizedCNR = normalizeCNR(row.cnr_number);

              const { data: cases, error: caseError } = await supabase
                .from('cases')
                .select('id, client_id, cnr_number, case_number')
                .or(`cnr_number.ilike.%${normalizedCNR}%,case_number.ilike.%${normalizedCNR}%`)
                .limit(1);

              if (caseError) throw caseError;

              if (!cases || cases.length === 0) {
                processingResult.caseNotFound++;
                processingResult.errors.push(
                  `Row ${row.rowNumber}: Case not found with CNR ${row.cnr_number}`
                );
                return;
              }

              const existingCase = cases[0];

              if (existingCase.client_id) {
                processingResult.skipped++;
                return;
              }

              const { data: clients, error: clientError } = await supabase
                .from('clients')
                .select('id, full_name')
                .ilike('full_name', row.client_name.trim())
                .limit(1);

              if (clientError) throw clientError;

              if (!clients || clients.length === 0) {
                processingResult.clientNotFound++;
                processingResult.errors.push(
                  `Row ${row.rowNumber}: Client not found: ${row.client_name}`
                );
                return;
              }

              const { error: updateError } = await supabase
                .from('cases')
                .update({ client_id: clients[0].id })
                .eq('id', existingCase.id);

              if (updateError) throw updateError;

              processingResult.linked++;
            } catch (error) {
              console.error('Error processing row:', error);
              processingResult.errors.push(
                `Row ${row.rowNumber}: ${error instanceof Error ? error.message : 'Unknown error'}`
              );
            }
          })
        );

        setProgress(Math.round(((i + batch.length) / rows.length) * 100));
        
        if (i + BATCH_SIZE < rows.length) {
          await new Promise(resolve => setTimeout(resolve, 500));
        }
      }

      setResult(processingResult);

      if (processingResult.linked > 0) {
        toast.success(`Successfully linked ${processingResult.linked} clients to cases`);
        onSuccess?.();
      } else {
        toast.warning('No clients were linked');
      }
    } catch (error) {
      console.error('Error processing file:', error);
      toast.error('Failed to process file');
    } finally {
      setIsProcessing(false);
      setProgress(100);
    }
  };

  const handleClose = () => {
    if (!isProcessing) {
      setFile(null);
      setResult(null);
      setProgress(0);
      setCurrentRow(0);
      setTotalRows(0);
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-full sm:max-w-xl h-screen sm:h-auto sm:max-h-[85vh] p-0 bg-slate-50 m-0 sm:m-4 rounded-none sm:rounded-2xl overflow-hidden">
        <div className="flex flex-col h-full sm:h-auto">
          {/* Header */}
          <div className="px-6 py-5 bg-white border-b border-slate-100">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-sky-50 flex items-center justify-center">
                  <Link2 className="w-5 h-5 text-sky-500" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-slate-800">Link Clients to Cases</h2>
                  <p className="text-sm text-muted-foreground">Upload Excel with CNR and client names</p>
                </div>
              </div>
              <button
                onClick={handleClose}
                disabled={isProcessing}
                className="md:hidden w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center hover:bg-slate-200 transition-colors"
              >
                <X className="w-4 h-4 text-slate-500" />
              </button>
            </div>
          </div>

          {/* Scrollable Content */}
          <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-6 space-y-4">
            {/* File Upload Card */}
            <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
              <div className="p-4">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center">
                    <FileSpreadsheet className="w-5 h-5 text-emerald-500" />
                  </div>
                  <div>
                    <Label className="text-sm font-semibold text-slate-700">Upload Excel File</Label>
                    <p className="text-xs text-muted-foreground">Select file with CNR and client data</p>
                  </div>
                </div>
                
                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    onClick={() => document.getElementById('client-link-file')?.click()}
                    disabled={isProcessing}
                    className="flex-1 rounded-xl h-11 border-slate-200"
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    {file ? file.name : 'Select File'}
                  </Button>
                  <input
                    id="client-link-file"
                    type="file"
                    accept=".xlsx,.xls,.csv"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={downloadTemplate}
                    disabled={isProcessing}
                    className="h-11 w-11 rounded-xl"
                  >
                    <Download className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>

            {/* Process Button */}
            {file && !result && (
              <Button
                onClick={processFile}
                disabled={isProcessing}
                className="w-full rounded-xl h-12 bg-sky-500 hover:bg-sky-600"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Link2 className="w-4 h-4 mr-2" />
                    Link Clients
                  </>
                )}
              </Button>
            )}

            {/* Progress Section */}
            {isProcessing && totalRows > 0 && (
              <div className="bg-white rounded-2xl shadow-sm p-4 space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Progress</span>
                  <span className="font-medium text-slate-800">
                    {currentRow} / {totalRows} rows ({progress}%)
                  </span>
                </div>
                <Progress value={progress} className="h-2" />
              </div>
            )}

            {/* Results Section */}
            {result && (
              <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
                <div className="p-4 border-b border-slate-100">
                  <h3 className="font-semibold text-slate-800">Results</h3>
                </div>
                <div className="p-4 space-y-3">
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
                      <span className="text-muted-foreground">Total Rows</span>
                      <span className="font-semibold text-slate-800">{result.total}</span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-emerald-50 rounded-xl">
                      <span className="text-emerald-600">Linked</span>
                      <span className="font-semibold text-emerald-600">{result.linked}</span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
                      <span className="text-muted-foreground">Skipped</span>
                      <span className="font-semibold text-slate-600">{result.skipped}</span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-amber-50 rounded-xl">
                      <span className="text-amber-600">Case Not Found</span>
                      <span className="font-semibold text-amber-600">{result.caseNotFound}</span>
                    </div>
                    <div className="col-span-2 flex items-center justify-between p-3 bg-red-50 rounded-xl">
                      <span className="text-red-600">Client Not Found</span>
                      <span className="font-semibold text-red-600">{result.clientNotFound}</span>
                    </div>
                  </div>

                  {result.errors.length > 0 && (
                    <div className="mt-4 space-y-2">
                      <h4 className="text-sm font-medium text-red-600 flex items-center gap-2">
                        <AlertCircle className="w-4 h-4" />
                        Errors
                      </h4>
                      <div className="max-h-32 overflow-y-auto space-y-1.5">
                        {result.errors.map((error, index) => (
                          <div key={index} className="text-xs text-red-600 bg-red-50 p-2 rounded-lg">
                            {error}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-6 py-4 bg-white border-t border-slate-100">
            <div className="flex gap-3 justify-end">
              {result && (
                <Button
                  variant="outline"
                  onClick={() => {
                    setFile(null);
                    setResult(null);
                  }}
                  className="rounded-full px-6 border-slate-200"
                >
                  Upload Another
                </Button>
              )}
              <Button 
                variant="ghost" 
                onClick={handleClose} 
                disabled={isProcessing}
                className="rounded-full px-6"
              >
                {result ? 'Close' : 'Cancel'}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
