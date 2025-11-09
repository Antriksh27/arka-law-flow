import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { RefreshCw } from 'lucide-react';

interface FetchCaseDetailsDialogProps {
  open: boolean;
  onClose: () => void;
  caseId: string;
  onFetchTriggered: () => void;
}

const detectCourtType = (cnr: string): 'high_court' | 'district_court' | 'supreme_court' => {
  const normalized = cnr.toUpperCase().replace(/[-\s]/g, '');
  
  // Check if starts with "SCIN" -> Supreme Court
  if (normalized.startsWith('SCIN')) {
    return 'supreme_court';
  }
  
  // Check if 3rd and 4th characters are "HC" -> High Court
  if (normalized.length >= 4 && normalized.substring(2, 4) === 'HC') {
    return 'high_court';
  }
  
  // Default to District Court
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
      
      // Update case with CNR and court type
      const { error } = await supabase
        .from('cases')
        .update({
          cnr_number: cnrNumber.trim(),
          court_type: getCourtTypeLabel(courtType)
        })
        .eq('id', caseId);

      if (error) throw error;

      toast({ title: 'CNR number saved successfully' });
      
      // Trigger fetch from parent
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
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Enter CNR Number</DialogTitle>
          <DialogDescription>
            Please provide the CNR number to fetch case details from eCourts
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="cnr">CNR Number</Label>
            <Input
              id="cnr"
              placeholder="e.g. GJHC24-074065-2025"
              value={cnrNumber}
              onChange={handleCnrChange}
              className={validationError ? 'border-destructive' : ''}
            />
            {validationError && (
              <p className="text-sm text-destructive">{validationError}</p>
            )}
            {!validationError && cnrNumber && (
              <p className="text-sm text-muted-foreground">
                Examples: GJHC24-074065-2025, SCIN010138342019, GJAH010006472005
              </p>
            )}
          </div>

          {cnrNumber.length >= 4 && (
            <div className="space-y-2">
              <Label>Detected Court Type</Label>
              <div className="flex items-center gap-2">
                <Badge className="bg-accent text-accent-foreground">
                  {getCourtTypeLabel(detectedCourtType)}
                </Badge>
                <span className="text-sm text-muted-foreground">(Auto-detected)</span>
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="court-type">Override Court Type (Optional)</Label>
            <Select
              value={manualCourtType || ''}
              onValueChange={(value) => setManualCourtType(value as 'high_court' | 'district_court' | 'supreme_court')}
            >
              <SelectTrigger id="court-type">
                <SelectValue placeholder="Use auto-detected type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="high_court">High Court</SelectItem>
                <SelectItem value="district_court">District Court</SelectItem>
                <SelectItem value="supreme_court">Supreme Court</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-sm text-muted-foreground">
              Leave empty to use auto-detected court type
            </p>
          </div>
        </div>

        <div className="flex gap-2 justify-end">
          <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button 
            onClick={handleSaveAndFetch} 
            disabled={isSubmitting || !cnrNumber}
            className="bg-primary text-primary-foreground"
          >
            {isSubmitting ? (
              <>
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              'Save & Fetch Details'
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
