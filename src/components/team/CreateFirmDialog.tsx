
import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface CreateFirmDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
}

export function CreateFirmDialog({ isOpen, onOpenChange }: CreateFirmDialogProps) {
  const [firmName, setFirmName] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  const handleCreate = async () => {
    if (!firmName.trim()) {
      toast.error('Firm name cannot be empty.');
      return;
    }

    setIsCreating(true);
    toast.info('Creating your firm...');

    const { error } = await supabase.rpc('create_firm_and_assign_admin', {
      firm_name: firmName.trim(),
    });

    setIsCreating(false);

    if (error) {
      console.error('Error creating firm:', error);
      toast.error(`Failed to create firm: ${error.message}`);
    } else {
      toast.success('Firm created successfully! Reloading page...');
      onOpenChange(false);
      setTimeout(() => window.location.reload(), 1500);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Create a New Firm</DialogTitle>
          <DialogDescription>
            Enter a name for your new law firm. You will automatically become the administrator.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="firm-name" className="text-right">
              Firm Name
            </Label>
            <Input
              id="firm-name"
              value={firmName}
              onChange={(e) => setFirmName(e.target.value)}
              className="col-span-3"
              placeholder="e.g., Apex Legal Associates"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isCreating}>
            Cancel
          </Button>
          <Button onClick={handleCreate} disabled={isCreating || !firmName.trim()}>
            {isCreating ? 'Creating...' : 'Create Firm'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
