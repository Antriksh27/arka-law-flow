import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { AlertCircle, CheckCircle, Loader2, ArrowRight } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface StandardizeCNRDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

interface CNRPreview {
  caseId: string;
  caseTitle: string;
  originalCNR: string;
  standardizedCNR: string;
}

export const StandardizeCNRDialog = ({ 
  open, 
  onOpenChange, 
  onSuccess 
}: StandardizeCNRDialogProps) => {
  const [loading, setLoading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [preview, setPreview] = useState<CNRPreview[]>([]);
  const [results, setResults] = useState<{ updated: number; errors: string[] } | null>(null);
  const { toast } = useToast();
  const { user } = useAuth();

  // Normalize CNR number by removing dashes, spaces and converting to uppercase
  const normalizeCNR = (cnr: string): string => {
    return cnr.replace(/[-\s]/g, '').toUpperCase();
  };

  const analyzeCNRs = async () => {
    if (!user) return;

    setAnalyzing(true);
    setPreview([]);
    setResults(null);

    try {
      // Get user's firm_id
      const { data: teamMember } = await supabase
        .from('team_members')
        .select('firm_id')
        .eq('user_id', user.id)
        .single();

      if (!teamMember?.firm_id) {
        throw new Error('Unable to determine your firm');
      }

      // Get all cases with CNR numbers
      const { data: cases, error } = await supabase
        .from('cases')
        .select('id, case_title, cnr_number')
        .eq('firm_id', teamMember.firm_id)
        .not('cnr_number', 'is', null);

      if (error) throw error;

      if (!cases || cases.length === 0) {
        toast({
          title: "No cases found",
          description: "No cases with CNR numbers found in your database",
        });
        return;
      }

      // Find cases that need standardization (contain dashes or spaces)
      const needsStandardization: CNRPreview[] = [];
      
      for (const caseItem of cases) {
        const original = caseItem.cnr_number || '';
        const standardized = normalizeCNR(original);
        
        // Only include if there's a difference
        if (original !== standardized) {
          needsStandardization.push({
            caseId: caseItem.id,
            caseTitle: caseItem.case_title,
            originalCNR: original,
            standardizedCNR: standardized
          });
        }
      }

      setPreview(needsStandardization);

      if (needsStandardization.length === 0) {
        toast({
          title: "All CNRs are already standardized",
          description: "No changes needed",
        });
      } else {
        toast({
          title: "Analysis complete",
          description: `Found ${needsStandardization.length} case(s) that need standardization`,
        });
      }

    } catch (error: any) {
      console.error('Analysis error:', error);
      toast({
        title: "Analysis failed",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setAnalyzing(false);
    }
  };

  const applyStandardization = async () => {
    if (preview.length === 0) return;

    setLoading(true);
    setResults(null);

    try {
      let updatedCount = 0;
      const errors: string[] = [];

      // Update each case
      for (const item of preview) {
        try {
          const { error } = await supabase
            .from('cases')
            .update({ 
              cnr_number: item.standardizedCNR,
              updated_at: new Date().toISOString()
            })
            .eq('id', item.caseId);

          if (error) {
            throw error;
          }

          updatedCount++;
        } catch (error: any) {
          console.error(`Failed to update case ${item.caseId}:`, error);
          errors.push(`${item.caseTitle}: ${error.message}`);
        }
      }

      setResults({ updated: updatedCount, errors });

      if (updatedCount > 0) {
        toast({
          title: "Standardization complete",
          description: `Successfully standardized ${updatedCount} CNR number(s)`,
        });
        onSuccess?.();
      }

      if (errors.length > 0) {
        toast({
          title: "Some updates failed",
          description: `${errors.length} error(s) occurred`,
          variant: "destructive"
        });
      }

    } catch (error: any) {
      console.error('Standardization error:', error);
      toast({
        title: "Standardization failed",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const resetDialog = () => {
    setPreview([]);
    setResults(null);
  };

  return (
    <Dialog open={open} onOpenChange={(open) => {
      if (!open) resetDialog();
      onOpenChange(open);
    }}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Standardize CNR Numbers</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Info */}
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5" />
              <div className="flex-1">
                <h3 className="font-medium text-blue-900 mb-1">About CNR Standardization</h3>
                <p className="text-sm text-blue-700">
                  This tool will remove dashes and spaces from all CNR numbers in your database, converting them to a consistent uppercase format without dashes.
                  <br />
                  <strong>Example:</strong> GJHC-24052244-2018 → GJHC240522442018
                </p>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="space-y-3">
            <Button
              onClick={analyzeCNRs}
              disabled={analyzing || loading}
              className="w-full bg-slate-800 hover:bg-slate-700"
            >
              {analyzing ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  Analyze CNR Numbers
                </>
              )}
            </Button>

            {preview.length > 0 && (
              <Button
                onClick={applyStandardization}
                disabled={loading}
                className="w-full bg-green-600 hover:bg-green-700"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Applying Changes...
                  </>
                ) : (
                  <>
                    Apply Standardization ({preview.length} case{preview.length !== 1 ? 's' : ''})
                  </>
                )}
              </Button>
            )}
          </div>

          {/* Preview */}
          {preview.length > 0 && !results && (
            <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-purple-600 mt-0.5" />
                <div className="flex-1">
                  <h3 className="font-medium text-purple-900 mb-3">Preview of Changes</h3>
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {preview.slice(0, 20).map((item, idx) => (
                      <div key={idx} className="bg-white p-3 rounded border border-purple-200">
                        <p className="text-sm font-medium text-gray-800 mb-2">{item.caseTitle}</p>
                        <div className="flex items-center gap-3 text-xs">
                          <span className="text-red-700 font-mono">{item.originalCNR}</span>
                          <ArrowRight className="w-4 h-4 text-purple-600" />
                          <span className="text-green-700 font-mono font-medium">{item.standardizedCNR}</span>
                        </div>
                      </div>
                    ))}
                    {preview.length > 20 && (
                      <p className="text-sm text-purple-600 italic text-center">
                        ...and {preview.length - 20} more
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Results */}
          {results && (
            <div className="space-y-4">
              {results.updated > 0 && (
                <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                  <div className="flex items-center gap-2 text-green-800">
                    <CheckCircle className="w-5 h-5" />
                    <span className="font-medium">
                      Successfully standardized {results.updated} CNR number(s)
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
            <h3 className="font-medium text-gray-800 mb-2">How to use:</h3>
            <ol className="space-y-1 list-decimal list-inside">
              <li>Click "Analyze CNR Numbers" to scan your database</li>
              <li>Review the preview of changes that will be made</li>
              <li>Click "Apply Standardization" to update all CNR numbers</li>
              <li>This will make CNR matching more reliable across the system</li>
            </ol>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
