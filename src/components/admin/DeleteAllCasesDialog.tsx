import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AlertTriangle, Trash2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Alert, AlertDescription } from '@/components/ui/alert';

export const DeleteAllCasesDialog = () => {
  const [open, setOpen] = useState(false);
  const [confirmation, setConfirmation] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (confirmation !== 'DELETE_ALL_CASES') {
      toast.error('Please type the confirmation text exactly');
      return;
    }

    setIsDeleting(true);

    try {
      const { data, error } = await supabase.functions.invoke('delete-all-cases', {
        body: { confirmation },
      });

      if (error) throw error;

      if (data.status === 'processing') {
        toast.success(data.message || 'Case deletion started', {
          description: `Processing ${data.total_cases} cases in the background. This may take a few minutes.`,
          duration: 5000,
        });
      } else {
        toast.success(data.message || 'All cases deleted successfully', {
          description: `Deleted ${data.summary?.cases || 0} cases`,
        });
      }

      setOpen(false);
      setConfirmation('');
      
      // Wait a moment then reload to refresh data
      setTimeout(() => {
        window.location.reload();
      }, 2000);
    } catch (error: any) {
      console.error('Error deleting cases:', error);
      toast.error('Failed to delete cases', {
        description: error.message || 'An unexpected error occurred',
      });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="destructive" size="sm">
          <Trash2 className="h-4 w-4 mr-2" />
          Delete All Cases
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="h-5 w-5" />
            Delete All Cases
          </DialogTitle>
          <DialogDescription className="space-y-3 pt-2">
            <p className="font-semibold">This action cannot be undone!</p>
            <p>This will permanently delete:</p>
            <ul className="list-disc list-inside space-y-1 text-sm">
              <li>All cases in your firm</li>
              <li>Case documents, hearings, orders, objections</li>
              <li>Case notes, contacts, and activities</li>
              <li>Case fetch queue and history</li>
            </ul>
            <Alert>
              <AlertDescription className="text-sm">
                <strong>Will be preserved:</strong> Clients, Appointments, Tasks, Documents, and Audit Logs will remain intact.
              </AlertDescription>
            </Alert>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="confirmation">
              Type <span className="font-mono font-semibold">DELETE_ALL_CASES</span> to confirm
            </Label>
            <Input
              id="confirmation"
              value={confirmation}
              onChange={(e) => setConfirmation(e.target.value)}
              placeholder="DELETE_ALL_CASES"
              className="font-mono"
              disabled={isDeleting}
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => {
              setOpen(false);
              setConfirmation('');
            }}
            disabled={isDeleting}
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={confirmation !== 'DELETE_ALL_CASES' || isDeleting}
          >
            {isDeleting ? 'Deleting...' : 'Delete All Cases'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
