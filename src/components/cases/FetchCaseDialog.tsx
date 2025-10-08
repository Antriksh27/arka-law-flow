import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useLegalkartIntegration } from '@/hooks/useLegalkartIntegration';
import { Loader2 } from 'lucide-react';

interface FetchCaseDialogProps {
  open: boolean;
  onClose: () => void;
  onSuccess: (data: any) => void;
}

interface FetchFormData {
  cnr_number: string;
}

export const FetchCaseDialog: React.FC<FetchCaseDialogProps> = ({
  open,
  onClose,
  onSuccess
}) => {
  const { toast } = useToast();
  const [searchType, setSearchType] = useState<'high_court' | 'district_court' | 'supreme_court'>('district_court');
  const [fetchedData, setFetchedData] = useState<any>(null);
  const { register, handleSubmit, formState: { errors }, reset } = useForm<FetchFormData>();
  const { searchCase } = useLegalkartIntegration();

  const handleFetch = async (data: FetchFormData) => {
    try {
      const result = await searchCase.mutateAsync({
        cnr: data.cnr_number,
        searchType: searchType,
      });

      if (result?.success && result?.data) {
        setFetchedData(result.data);
        toast({
          title: "Case Details Fetched",
          description: "Successfully retrieved case details from eCourts.",
        });
      } else {
        throw new Error(result?.error || 'Failed to fetch case details');
      }
    } catch (error: any) {
      toast({
        title: "Fetch Failed",
        description: error.message || "Unable to fetch case details. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleAddCase = () => {
    if (fetchedData) {
      onSuccess(fetchedData);
      setFetchedData(null);
      reset();
      onClose();
    }
  };

  const handleCancel = () => {
    setFetchedData(null);
    reset();
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleCancel}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Fetch Case Details from eCourts</DialogTitle>
        </DialogHeader>
        
        {!fetchedData ? (
          <form onSubmit={handleSubmit(handleFetch)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="cnr_number">CNR Number *</Label>
              <Input
                id="cnr_number"
                {...register('cnr_number', { required: 'CNR number is required' })}
                placeholder="Enter CNR number (e.g., DLCT010012345678)"
              />
              {errors.cnr_number && (
                <p className="text-sm text-destructive">{errors.cnr_number.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="searchType">Court Type *</Label>
              <Select value={searchType} onValueChange={(value: any) => setSearchType(value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select court type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="district_court">District Court</SelectItem>
                  <SelectItem value="high_court">High Court</SelectItem>
                  <SelectItem value="supreme_court">Supreme Court</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <Button type="button" variant="outline" onClick={handleCancel}>
                Cancel
              </Button>
              <Button type="submit" disabled={searchCase.isPending}>
                {searchCase.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Fetching...
                  </>
                ) : (
                  'Fetch Details'
                )}
              </Button>
            </div>
          </form>
        ) : (
          <div className="space-y-6">
            <div className="bg-[#F9FAFB] rounded-lg p-4 space-y-4">
              <h3 className="text-lg font-bold text-[#1F2937]">Basic Case Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div className="space-y-1">
                  <p className="text-[#6B7280]">Case Title</p>
                  <p className="font-medium text-[#111827]">{fetchedData.case_title || fetchedData.vs || '-'}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-[#6B7280]">Case Number</p>
                  <p className="font-medium text-[#111827]">{fetchedData.case_number || '-'}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-[#6B7280]">CNR Number</p>
                  <p className="font-medium text-[#111827]">{fetchedData.cnr_number || '-'}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-[#6B7280]">Court Name</p>
                  <p className="font-medium text-[#111827]">{fetchedData.court || fetchedData.court_name || '-'}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-[#6B7280]">Filing Date</p>
                  <p className="font-medium text-[#111827]">{fetchedData.filing_date || '-'}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-[#6B7280]">Registration Date</p>
                  <p className="font-medium text-[#111827]">{fetchedData.registration_date || '-'}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-[#6B7280]">Status</p>
                  <p className="font-medium text-[#111827]">{fetchedData.status || 'Open'}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-[#6B7280]">Case Type</p>
                  <p className="font-medium text-[#111827]">{fetchedData.case_type || fetchedData.matter_type || '-'}</p>
                </div>
                {fetchedData.petitioner && (
                  <div className="space-y-1">
                    <p className="text-[#6B7280]">Petitioner</p>
                    <p className="font-medium text-[#111827]">{fetchedData.petitioner}</p>
                  </div>
                )}
                {fetchedData.respondent && (
                  <div className="space-y-1">
                    <p className="text-[#6B7280]">Respondent</p>
                    <p className="font-medium text-[#111827]">{fetchedData.respondent}</p>
                  </div>
                )}
                {fetchedData.next_hearing_date && (
                  <div className="space-y-1">
                    <p className="text-[#6B7280]">Next Hearing</p>
                    <p className="font-medium text-[#111827]">{fetchedData.next_hearing_date}</p>
                  </div>
                )}
                {fetchedData.stage && (
                  <div className="space-y-1">
                    <p className="text-[#6B7280]">Stage</p>
                    <p className="font-medium text-[#111827]">{fetchedData.stage}</p>
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <Button type="button" variant="outline" onClick={handleCancel}>
                Cancel
              </Button>
              <Button type="button" onClick={handleAddCase}>
                Add Case
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
