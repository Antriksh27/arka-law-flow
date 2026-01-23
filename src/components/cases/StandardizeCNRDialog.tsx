import React, { useState } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { AlertCircle, CheckCircle, Loader2, ArrowRight, X, Hash, Info } from 'lucide-react';
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

  const normalizeCNR = (cnr: string): string => {
    return cnr.replace(/[-\s]/g, '').toUpperCase();
  };

  const analyzeCNRs = async () => {
    if (!user) return;

    setAnalyzing(true);
    setPreview([]);
    setResults(null);

    try {
      const { data: teamMember } = await supabase
        .from('team_members')
        .select('firm_id')
        .eq('user_id', user.id)
        .single();

      if (!teamMember?.firm_id) {
        throw new Error('Unable to determine your firm');
      }

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

      const needsStandardization: CNRPreview[] = [];
      
      for (const caseItem of cases) {
        const original = caseItem.cnr_number || '';
        const standardized = normalizeCNR(original);
        
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
      <DialogContent className="max-w-full sm:max-w-2xl h-screen sm:h-[90vh] sm:max-h-[800px] p-0 bg-slate-50 m-0 sm:m-4 rounded-none sm:rounded-2xl overflow-hidden">
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="px-6 py-5 bg-white border-b border-slate-100">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-violet-50 flex items-center justify-center">
                  <Hash className="w-5 h-5 text-violet-500" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-slate-800">Standardize CNR Numbers</h2>
                  <p className="text-sm text-muted-foreground">Clean and format all CNR numbers</p>
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

          {/* Scrollable Content */}
          <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-6 space-y-4">
            {/* Info Card */}
            <div className="bg-sky-50 rounded-2xl p-4 border border-sky-100">
              <div className="flex items-start gap-3">
                <Info className="w-5 h-5 text-sky-500 mt-0.5 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold text-sky-900 mb-1">About CNR Standardization</h3>
                  <p className="text-sm text-sky-700">
                    This tool removes dashes and spaces from CNR numbers, converting them to uppercase.
                  </p>
                  <p className="text-sm text-sky-600 mt-2 font-mono">
                    Example: GJHC-24052244-2018 → GJHC240522442018
                  </p>
                </div>
              </div>
            </div>

            {/* Actions Card */}
            <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
              <div className="p-4 space-y-3">
                <Button
                  onClick={analyzeCNRs}
                  disabled={analyzing || loading}
                  className="w-full rounded-xl h-12 bg-slate-800 hover:bg-slate-700"
                >
                  {analyzing ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Analyzing...
                    </>
                  ) : (
                    'Analyze CNR Numbers'
                  )}
                </Button>

                {preview.length > 0 && !results && (
                  <Button
                    onClick={applyStandardization}
                    disabled={loading}
                    className="w-full rounded-xl h-12 bg-emerald-500 hover:bg-emerald-600"
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
            </div>

            {/* Preview */}
            {preview.length > 0 && !results && (
              <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
                <div className="p-4 border-b border-slate-100">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-violet-50 flex items-center justify-center">
                      <AlertCircle className="w-5 h-5 text-violet-500" />
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-slate-700">Preview of Changes</h3>
                      <p className="text-xs text-muted-foreground">{preview.length} CNR numbers will be updated</p>
                    </div>
                  </div>
                </div>
                <div className="divide-y divide-slate-100 max-h-64 overflow-y-auto">
                  {preview.slice(0, 20).map((item, idx) => (
                    <div key={idx} className="p-4">
                      <p className="text-sm font-medium text-slate-800 mb-2 truncate">{item.caseTitle}</p>
                      <div className="flex items-center gap-3 text-xs">
                        <span className="text-red-600 font-mono bg-red-50 px-2 py-1 rounded">{item.originalCNR}</span>
                        <ArrowRight className="w-4 h-4 text-slate-400" />
                        <span className="text-emerald-600 font-mono font-medium bg-emerald-50 px-2 py-1 rounded">{item.standardizedCNR}</span>
                      </div>
                    </div>
                  ))}
                  {preview.length > 20 && (
                    <div className="p-4 text-center text-sm text-muted-foreground">
                      ...and {preview.length - 20} more
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Results */}
            {results && (
              <div className="space-y-4">
                {results.updated > 0 && (
                  <div className="bg-emerald-50 rounded-2xl p-4 border border-emerald-100">
                    <div className="flex items-center gap-3 text-emerald-800">
                      <CheckCircle className="w-5 h-5" />
                      <span className="font-medium">
                        Successfully standardized {results.updated} CNR number(s)
                      </span>
                    </div>
                  </div>
                )}

                {results.errors.length > 0 && (
                  <div className="bg-red-50 rounded-2xl p-4 border border-red-100">
                    <div className="flex items-start gap-3">
                      <AlertCircle className="w-5 h-5 text-red-500 mt-0.5" />
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
            <div className="bg-slate-100 rounded-2xl p-4">
              <h3 className="font-semibold text-slate-800 mb-2">How to use:</h3>
              <ol className="space-y-1.5 list-decimal list-inside text-sm text-slate-600">
                <li>Click "Analyze CNR Numbers" to scan your database</li>
                <li>Review the preview of changes</li>
                <li>Click "Apply Standardization" to update all CNR numbers</li>
                <li>This makes CNR matching more reliable</li>
              </ol>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
