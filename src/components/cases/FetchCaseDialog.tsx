import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';

interface FetchCaseDialogProps {
  open: boolean;
  onClose: () => void;
  onSuccess: (data: any) => void;
}

interface FetchFormData {
  courtType: string;
  cnrNumber: string;
}

export const FetchCaseDialog: React.FC<FetchCaseDialogProps> = ({
  open,
  onClose,
  onSuccess
}) => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  
  const { register, handleSubmit, setValue, formState: { errors } } = useForm<FetchFormData>();

  const handleFetch = async (data: FetchFormData) => {
    setIsLoading(true);
    try {
      // Map court type to API values
      const courtTypeMap: Record<string, string> = {
        'district_court': 'district_court',
        'high_court': 'high_court',
        'supreme_court': 'supreme_court'
      };

      // Call LegalKart API with courtType and cnrNumber
      // const response = await fetch('/api/legalkart', {
      //   method: 'POST',
      //   body: JSON.stringify({
      //     courtType: courtTypeMap[data.courtType],
      //     cnrNumber: data.cnrNumber
      //   })
      // });

      // Mock response for now
      await new Promise(resolve => setTimeout(resolve, 2000));

      const mockData = {
        title: `Case ${data.cnrNumber}`,
        cnr_number: data.cnrNumber,
        court_type: data.courtType,
        status: "open"
      };

      onSuccess(mockData);
      toast({
        title: "Success",
        description: "Case details fetched successfully from LegalKart API"
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch case details from LegalKart API",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md bg-white rounded-2xl">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold text-[#1F2937]">
            Fetch Case from LegalKart API
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(handleFetch)} className="space-y-6 pt-4">
          <div className="space-y-2">
            <Label htmlFor="courtType" className="text-sm font-medium text-[#111827]">
              Court Type *
            </Label>
            <Select 
              onValueChange={(value) => setValue('courtType', value)}
              required
            >
              <SelectTrigger className="bg-white border-[#E5E7EB] rounded-lg">
                <SelectValue placeholder="Select court type..." />
              </SelectTrigger>
              <SelectContent className="bg-white border border-[#E5E7EB] rounded-lg">
                <SelectItem value="district_court">District Court</SelectItem>
                <SelectItem value="high_court">High Court</SelectItem>
                <SelectItem value="supreme_court">Supreme Court</SelectItem>
              </SelectContent>
            </Select>
            {errors.courtType && (
              <p className="text-sm text-red-600">{errors.courtType.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="cnrNumber" className="text-sm font-medium text-[#111827]">
              CNR Number *
            </Label>
            <Input
              id="cnrNumber"
              {...register('cnrNumber', { 
                required: 'CNR Number is required',
                minLength: { value: 5, message: 'CNR Number must be at least 5 characters' }
              })}
              className="bg-white border-[#E5E7EB] rounded-lg"
              placeholder="Enter CNR number..."
            />
            {errors.cnrNumber && (
              <p className="text-sm text-red-600">{errors.cnrNumber.message}</p>
            )}
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button 
              type="button" 
              variant="outline" 
              onClick={onClose}
              className="rounded-lg border-[#E5E7EB]"
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={isLoading}
              className="bg-[#1E3A8A] hover:bg-[#1E3A8A]/90 text-white rounded-lg"
            >
              {isLoading ? 'Fetching...' : 'Fetch Case Details'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
