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
  cnr_number?: string;
  case_number?: string;
  filing_number?: string;
  court_code?: string;
  year?: string;
  case_type?: string;
}
export const FetchCaseDialog: React.FC<FetchCaseDialogProps> = ({
  open,
  onClose,
  onSuccess
}) => {
  const {
    toast
  } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [fetchMethod, setFetchMethod] = useState<'cnr' | 'case_number'>('cnr');
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: {
      errors
    }
  } = useForm<FetchFormData>();
  const handleFetch = async (data: FetchFormData) => {
    setIsLoading(true);
    try {
      // Simulate API call to eCourts
      // In a real implementation, this would call the eCourts API
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Mock response data
      const mockData = {
        title: `Case ${data.cnr_number || data.case_number}`,
        case_number: data.case_number || "CS/123/2024",
        court: "District Court, Delhi",
        cnr_number: data.cnr_number || "DLCT010012342024",
        filing_number: data.filing_number || "FIL/2024/123",
        petitioner: "John Doe",
        respondent: "Jane Smith",
        advocate_name: "Adv. Rajesh Kumar",
        district: "Delhi",
        filing_date: "2024-01-15",
        case_type: data.case_type || "civil",
        status: "open"
      };
      onSuccess(mockData);
      reset();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch case details from eCourts",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };
  const handleClose = () => {
    reset();
    onClose();
  };
  return <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md bg-white border border-gray-200">
        <DialogHeader>
          <DialogTitle className="text-gray-900">Fetch Case Details from eCourts</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(handleFetch)} className="space-y-4">
          <div>
            <Label htmlFor="fetchMethod" className="text-gray-700">Fetch Method</Label>
            <Select value={fetchMethod} onValueChange={(value: 'cnr' | 'case_number') => setFetchMethod(value)}>
              <SelectTrigger className="mt-2 bg-white border-gray-300">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-white border border-gray-200">
                <SelectItem value="cnr">By CNR Number</SelectItem>
                <SelectItem value="case_number">By Case Number</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {fetchMethod === 'cnr' ? <div>
              <Label htmlFor="cnr_number" className="text-gray-700">CNR Number *</Label>
              <Input id="cnr_number" {...register('cnr_number', {
            required: fetchMethod === 'cnr' ? 'CNR Number is required' : false
          })} className="mt-2 bg-white border-gray-300" placeholder="Enter CNR number..." />
              {errors.cnr_number && <p className="text-sm text-red-600 mt-1">{errors.cnr_number.message}</p>}
            </div> : <>
              <div>
                <Label htmlFor="case_number" className="text-gray-700">Case Number *</Label>
                <Input id="case_number" {...register('case_number', {
              required: fetchMethod === 'case_number' ? 'Case Number is required' : false
            })} className="mt-2 bg-white border-gray-300" placeholder="Enter case number..." />
                {errors.case_number && <p className="text-sm text-red-600 mt-1">{errors.case_number.message}</p>}
              </div>

              <div>
                <Label htmlFor="court_code" className="text-gray-700">Court Code *</Label>
                <Input id="court_code" {...register('court_code', {
              required: fetchMethod === 'case_number' ? 'Court Code is required' : false
            })} className="mt-2 bg-white border-gray-300" placeholder="Enter court code..." />
                {errors.court_code && <p className="text-sm text-red-600 mt-1">{errors.court_code.message}</p>}
              </div>

              <div>
                <Label htmlFor="year" className="text-gray-700">Year *</Label>
                <Input id="year" {...register('year', {
              required: fetchMethod === 'case_number' ? 'Year is required' : false
            })} className="mt-2 bg-white border-gray-300" placeholder="Enter year..." />
                {errors.year && <p className="text-sm text-red-600 mt-1">{errors.year.message}</p>}
              </div>
            </>}

          <div>
            <Label htmlFor="case_type" className="text-gray-700">Case Type</Label>
            <Select onValueChange={value => setValue('case_type', value)}>
              <SelectTrigger className="mt-2 bg-white border-gray-300">
                <SelectValue placeholder="Select case type..." />
              </SelectTrigger>
              <SelectContent className="bg-white border border-gray-200">
                <SelectItem value="civil">Civil</SelectItem>
                <SelectItem value="criminal">Criminal</SelectItem>
                <SelectItem value="family">Family</SelectItem>
                <SelectItem value="commercial">Commercial</SelectItem>
                <SelectItem value="constitutional">Constitutional</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={handleClose} className="bg-white border-gray-300 text-gray-700 hover:bg-gray-50">
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading} className="text-white bg-slate-800 hover:bg-slate-700">
              {isLoading ? 'Fetching...' : 'Fetch Details'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>;
};