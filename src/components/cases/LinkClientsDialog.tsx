import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Upload, Download, Loader2, Link2 } from 'lucide-react';
import * as XLSX from 'xlsx';
import { Progress } from '@/components/ui/progress';

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

              // Find case by CNR
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

              // Skip if already linked
              if (existingCase.client_id) {
                processingResult.skipped++;
                return;
              }

              // Find client by name
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

              // Update case with client_id
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
        
        // Delay between batches
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
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Link2 className="w-5 h-5" />
            Link Clients to Cases
          </DialogTitle>
          <DialogDescription>
            Upload an Excel file with CNR numbers and client names to link existing clients to cases
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* File Upload Section */}
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                onClick={() => document.getElementById('client-link-file')?.click()}
                disabled={isProcessing}
                className="flex-1"
              >
                <Upload className="w-4 h-4 mr-2" />
                {file ? file.name : 'Select Excel File'}
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
                size="sm"
                onClick={downloadTemplate}
                disabled={isProcessing}
              >
                <Download className="w-4 h-4 mr-2" />
                Template
              </Button>
            </div>

            {file && (
              <div className="text-sm text-muted-foreground">
                Selected: {file.name}
              </div>
            )}
          </div>

          {/* Process Button */}
          {file && !result && (
            <Button
              onClick={processFile}
              disabled={isProcessing}
              className="w-full"
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
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Progress</span>
                <span className="font-medium">
                  {currentRow} / {totalRows} rows ({progress}%)
                </span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>
          )}

          {/* Results Section */}
          {result && (
            <div className="space-y-3 rounded-lg border border-border bg-muted/30 p-4">
              <h3 className="font-medium">Results</h3>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Total Rows:</span>
                  <span className="font-medium">{result.total}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-green-600">✓ Linked:</span>
                  <span className="font-medium text-green-600">{result.linked}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">⊘ Skipped (already linked):</span>
                  <span className="font-medium">{result.skipped}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-orange-600">Case Not Found:</span>
                  <span className="font-medium text-orange-600">{result.caseNotFound}</span>
                </div>
                <div className="flex items-center justify-between col-span-2">
                  <span className="text-red-600">Client Not Found:</span>
                  <span className="font-medium text-red-600">{result.clientNotFound}</span>
                </div>
              </div>

              {result.errors.length > 0 && (
                <div className="mt-3 space-y-2">
                  <h4 className="text-sm font-medium text-red-600">Errors:</h4>
                  <div className="max-h-40 overflow-y-auto space-y-1">
                    {result.errors.map((error, index) => (
                      <div key={index} className="text-xs text-red-600 bg-red-50 p-2 rounded">
                        {error}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-end gap-2 pt-2">
            {result && (
              <Button
                variant="outline"
                onClick={() => {
                  setFile(null);
                  setResult(null);
                }}
              >
                Upload Another
              </Button>
            )}
            <Button variant="ghost" onClick={handleClose} disabled={isProcessing}>
              {result ? 'Close' : 'Cancel'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
