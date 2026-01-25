import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { RefreshCw, X, Hash, Scale, Info } from 'lucide-react';

interface FetchCaseDetailsDialogProps {
  open: boolean;
  onClose: () => void;
  caseId: string;
  onFetchTriggered: () => void;
}

const detectCourtType = (cnr: string): 'high_court' | 'district_court' | 'supreme_court' => {
  const normalized = cnr.toUpperCase().replace(/[-\s]/g, '');
  
  if (normalized.startsWith('SCIN')) {
    return 'supreme_court';
  }
  
  if (normalized.length >= 4 && normalized.substring(2, 4) === 'HC') {
    return 'high_court';
  }
  
  return 'district_court';
};

const getCourtTypeLabel = (type: 'high_court' | 'district_court' | 'supreme_court'): string => {
  const labels = {
    high_court: 'High Court',
    district_court: 'District Court',
    supreme_court: 'Supreme Court'
  };
  return labels[type];
};

export function FetchCaseDetailsDialog({ open, onClose, caseId, onFetchTriggered }: FetchCaseDetailsDialogProps) {
  const [cnrNumber, setCnrNumber] = useState('');
  const [detectedCourtType, setDetectedCourtType] = useState<'high_court' | 'district_court' | 'supreme_court'>('district_court');
  const [manualCourtType, setManualCourtType] = useState<'high_court' | 'district_court' | 'supreme_court' | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationError, setValidationError] = useState('');

  useEffect(() => {
    if (cnrNumber.length >= 4) {
      const detected = detectCourtType(cnrNumber);
      setDetectedCourtType(detected);
      setValidationError('');
    }
  }, [cnrNumber]);

  const handleCnrChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.toUpperCase();
    setCnrNumber(value);
  };

  const validateCnr = (): boolean => {
    if (!cnrNumber || cnrNumber.trim().length < 10) {
      setValidationError('CNR number must be at least 10 characters');
      return false;
    }
    setValidationError('');
    return true;
  };

  const handleSaveAndFetch = async () => {
    if (!validateCnr()) return;

    setIsSubmitting(true);

    try {
      const courtType = manualCourtType || detectedCourtType;
      
      const { error } = await supabase
        .from('cases')
        .update({
          cnr_number: cnrNumber.trim(),
          court_type: getCourtTypeLabel(courtType)
        })
        .eq('id', caseId);

      if (error) throw error;

      toast({ title: 'CNR number saved successfully' });
      
      onFetchTriggered();
    } catch (error: any) {
      console.error('Error saving CNR:', error);
      toast({
        title: 'Failed to save CNR',
        description: error.message,
        variant: 'destructive'
      });
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent hideCloseButton className="sm:max-w-md p-0 bg-slate-50 overflow-hidden">
        <div className="flex flex-col h-full sm:h-auto">
          {/* Header */}
          <div className="px-6 py-5 bg-white border-b border-slate-100">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-sky-50 flex items-center justify-center">
                  <Hash className="w-5 h-5 text-sky-500" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-foreground">Enter CNR Number</h2>
                  <p className="text-sm text-muted-foreground">Fetch case details from eCourts</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="md:hidden w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center hover:bg-slate-200 transition-colors"
              >
                <X className="w-4 h-4 text-slate-500" />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-6 space-y-4">
            {/* CNR Input Card */}
            <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
              <div className="p-4">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center">
                    <Hash className="w-5 h-5 text-emerald-500" />
                  </div>
                  <div>
                    <Label className="text-sm font-semibold text-foreground">CNR Number</Label>
                    <p className="text-xs text-muted-foreground">Case identification number</p>
                  </div>
                </div>
                
                <Input
                  placeholder="e.g. GJHC24-074065-2025"
                  value={cnrNumber}
                  onChange={handleCnrChange}
                  className={`bg-slate-50 border-slate-200 rounded-xl h-12 text-lg font-mono ${validationError ? 'border-red-300' : ''}`}
                />
                {validationError && (
                  <p className="text-sm text-red-500 mt-2">{validationError}</p>
                )}
                {!validationError && cnrNumber && (
                  <p className="text-xs text-muted-foreground mt-2">
                    Examples: GJHC24-074065-2025, SCIN010138342019
                  </p>
                )}
              </div>
            </div>

            {/* Detected Court Type Card */}
            {cnrNumber.length >= 4 && (
              <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
                <div className="p-4">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-xl bg-violet-50 flex items-center justify-center">
                      <Scale className="w-5 h-5 text-violet-500" />
                    </div>
                    <div>
                      <Label className="text-sm font-semibold text-foreground">Detected Court Type</Label>
                      <p className="text-xs text-muted-foreground">Auto-detected from CNR format</p>
                    </div>
                  </div>
                  
                  <Badge className="bg-violet-100 text-violet-700 border-0 rounded-full px-4 py-1.5 text-sm">
                    {getCourtTypeLabel(detectedCourtType)}
                  </Badge>
                </div>
              </div>
            )}

            {/* Override Court Type Card */}
            <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
              <div className="p-4">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center">
                    <Scale className="w-5 h-5 text-amber-500" />
                  </div>
                  <div>
                    <Label className="text-sm font-semibold text-foreground">Override Court Type</Label>
                    <p className="text-xs text-muted-foreground">Optional manual selection</p>
                  </div>
                </div>
                
                <Select
                  value={manualCourtType || ''}
                  onValueChange={(value) => setManualCourtType(value as 'high_court' | 'district_court' | 'supreme_court')}
                >
                  <SelectTrigger className="bg-slate-50 border-slate-200 rounded-xl h-11">
                    <SelectValue placeholder="Use auto-detected type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="high_court">High Court</SelectItem>
                    <SelectItem value="district_court">District Court</SelectItem>
                    <SelectItem value="supreme_court">Supreme Court</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Info Card */}
            <div className="bg-sky-50 rounded-2xl p-4 border border-sky-100">
              <div className="flex items-start gap-3">
                <Info className="w-5 h-5 text-sky-500 mt-0.5 flex-shrink-0" />
                <p className="text-sm text-sky-700">
                  Leave the override empty to use the auto-detected court type based on the CNR format.
                </p>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="px-6 py-4 bg-white border-t border-slate-100">
            <div className="flex gap-3">
              <Button 
                variant="outline" 
                onClick={onClose} 
                disabled={isSubmitting}
                className="flex-1 rounded-full border-slate-200"
              >
                Cancel
              </Button>
              <Button 
                onClick={handleSaveAndFetch} 
                disabled={isSubmitting || !cnrNumber}
                className="flex-1 rounded-full"
              >
                {isSubmitting ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  'Save & Fetch'
                )}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
