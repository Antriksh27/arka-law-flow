import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Upload, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
export const SyncClientsToZoho: React.FC = () => {
  const {
    toast
  } = useToast();
  const [open, setOpen] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [results, setResults] = useState<any>(null);
  const handleSync = async () => {
    setSyncing(true);
    setResults(null);
    try {
      const {
        data,
        error
      } = await supabase.functions.invoke('zoho-books-sync-clients');
      if (error) throw error;
      if (!data.success) {
        throw new Error('Sync failed');
      }
      setResults(data.results);
      toast({
        title: 'Sync Complete',
        description: `Created ${data.results.created} new customers in Zoho Books`
      });
    } catch (error: any) {
      console.error('Sync error:', error);
      toast({
        title: 'Sync Failed',
        description: error.message || 'Failed to sync clients to Zoho Books',
        variant: 'destructive'
      });
    } finally {
      setSyncing(false);
    }
  };
  return <>
      

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Sync Clients to Zoho Books</DialogTitle>
            <DialogDescription>
              This will push all your clients to Zoho Books as customers. Existing contacts (matched by email or name) will be skipped.
            </DialogDescription>
          </DialogHeader>

          {results ? <div className="space-y-3 py-4">
              <Alert>
                <CheckCircle2 className="h-4 w-4" />
                <AlertDescription>
                  <div className="space-y-1">
                    <p><strong>Total Clients:</strong> {results.total}</p>
                    <p><strong>Created in Zoho:</strong> {results.created}</p>
                    <p><strong>Skipped (already exist):</strong> {results.skipped}</p>
                  </div>
                </AlertDescription>
              </Alert>

              {results.errors.length > 0 && <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    <p className="font-semibold mb-2">Errors ({results.errors.length}):</p>
                    <div className="max-h-32 overflow-y-auto space-y-1">
                      {results.errors.map((err: any, i: number) => <p key={i} className="text-xs">
                          {err.client}: {err.error}
                        </p>)}
                    </div>
                  </AlertDescription>
                </Alert>}
            </div> : <div className="py-4">
              <p className="text-sm text-muted-foreground">
                This process may take a few moments depending on the number of clients.
              </p>
            </div>}

          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)} disabled={syncing}>
              {results ? 'Close' : 'Cancel'}
            </Button>
            {!results && <Button onClick={handleSync} disabled={syncing}>
                {syncing ? <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Syncing...
                  </> : 'Start Sync'}
              </Button>}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>;
};