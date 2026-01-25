import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { sanitizeInput, isValidEmail } from '@/lib/security';
import { useIsMobile } from '@/hooks/use-mobile';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { User, Mail, Phone, FileText, Shield } from 'lucide-react';

interface EditTeamMemberDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  member: any;
}

interface TeamMemberFormData {
  full_name: string;
  email: string;
  phone_number?: string;
  role: 'lawyer' | 'paralegal' | 'office_staff' | 'receptionist';
  status: 'active' | 'suspended' | 'pending' | 'invited';
  notes?: string;
}

const EditTeamMemberDialog = ({ open, onOpenChange, member }: EditTeamMemberDialogProps) => {
  const { role: userRole } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isUpdating, setIsUpdating] = useState(false);
  const isMobile = useIsMobile();

  const form = useForm<TeamMemberFormData>({
    defaultValues: {
      full_name: member?.full_name || '',
      email: member?.email || '',
      phone_number: member?.phone_number || '',
      role: member?.role || 'lawyer',
      status: member?.status || 'active',
      notes: member?.notes || '',
    },
  });

  React.useEffect(() => {
    if (member) {
      form.reset({
        full_name: member.full_name || '',
        email: member.email || '',
        phone_number: member.phone_number || '',
        role: member.role || 'lawyer',
        status: member.status || 'active',
        notes: member.notes || '',
      });
    }
  }, [member, form]);

  const updateTeamMemberMutation = useMutation({
    mutationFn: async (data: TeamMemberFormData) => {
      setIsUpdating(true);
      
      try {
        const sanitizedData = {
          full_name: sanitizeInput(data.full_name),
          email: sanitizeInput(data.email).toLowerCase(),
          phone_number: data.phone_number ? sanitizeInput(data.phone_number) : null,
          role: data.role,
          status: data.status,
          notes: data.notes ? sanitizeInput(data.notes) : null,
        };

        if (!isValidEmail(sanitizedData.email)) {
          throw new Error('Invalid email format');
        }

        const { error } = await supabase
          .from('team_members')
          .update(sanitizedData)
          .eq('id', member.id);

        if (error) throw error;
        return sanitizedData;
      } finally {
        setIsUpdating(false);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['team-members'] });
      toast({
        title: "Success",
        description: "Team member has been successfully updated.",
      });
      onOpenChange(false);
    },
    onError: (error: Error) => {
      console.error('Error updating team member:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to update team member. Please try again.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: TeamMemberFormData) => {
    const canEditMembers = userRole === 'admin';
    if (!canEditMembers) {
      toast({
        title: "Access Denied",
        description: "Only administrators can edit team members.",
        variant: "destructive",
      });
      return;
    }
    updateTeamMemberMutation.mutate(data);
  };

  const canEditMembers = userRole === 'admin';

  if (!canEditMembers || !member) {
    return null;
  }

  const formContent = (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        {/* Personal Information Card */}
        <div className={isMobile ? "bg-white rounded-2xl shadow-sm overflow-hidden" : ""}>
          {isMobile && (
            <div className="px-4 py-3 border-b border-slate-100">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Personal Information</p>
            </div>
          )}
          <div className={isMobile ? "p-4 space-y-4" : "grid grid-cols-2 gap-3"}>
            <FormField control={form.control} name="full_name" rules={{ required: "Full name is required" }} render={({ field }) => (
              <FormItem>
                <FormLabel className={isMobile ? "text-slate-700" : ""}>Full Name *</FormLabel>
                <FormControl>
                  <div className="relative">
                    {isMobile && <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />}
                    <Input 
                      placeholder="Enter full name" 
                      className={isMobile ? "pl-10 h-12 bg-slate-50 border-0 rounded-xl" : ""} 
                      {...field} 
                    />
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )} />

            <FormField control={form.control} name="role" rules={{ required: "Role is required" }} render={({ field }) => (
              <FormItem>
                <FormLabel className={isMobile ? "text-slate-700" : ""}>Role *</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger className={isMobile ? "h-12 bg-slate-50 border-0 rounded-xl" : ""}>
                      <SelectValue placeholder="Select role" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="lawyer">Lawyer</SelectItem>
                    <SelectItem value="paralegal">Paralegal</SelectItem>
                    <SelectItem value="office_staff">Office</SelectItem>
                    <SelectItem value="receptionist">Reception</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )} />
          </div>
        </div>

        {/* Contact Information Card */}
        <div className={isMobile ? "bg-white rounded-2xl shadow-sm overflow-hidden" : ""}>
          {isMobile && (
            <div className="px-4 py-3 border-b border-slate-100">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Contact Information</p>
            </div>
          )}
          <div className={isMobile ? "p-4 space-y-4" : "space-y-4"}>
            <FormField control={form.control} name="email" rules={{ required: "Email is required", pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: "Invalid email address" }}} render={({ field }) => (
              <FormItem>
                <FormLabel className={isMobile ? "text-slate-700" : ""}>Email Address *</FormLabel>
                <FormControl>
                  <div className="relative">
                    {isMobile && <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />}
                    <Input 
                      type="email" 
                      placeholder="Enter email address" 
                      className={isMobile ? "pl-10 h-12 bg-slate-50 border-0 rounded-xl" : ""} 
                      {...field} 
                    />
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )} />

            {!isMobile && (
              <div className="grid grid-cols-2 gap-3">
                <FormField control={form.control} name="phone_number" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phone Number</FormLabel>
                    <FormControl>
                      <Input type="tel" placeholder="Enter phone number" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />

                <FormField control={form.control} name="status" rules={{ required: "Status is required" }} render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="suspended">Suspended</SelectItem>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="invited">Invited</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>
            )}

            {isMobile && (
              <>
                <FormField control={form.control} name="phone_number" render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-slate-700">Phone Number</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <Input 
                          type="tel" 
                          placeholder="Enter phone number" 
                          className="pl-10 h-12 bg-slate-50 border-0 rounded-xl" 
                          {...field} 
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              </>
            )}
          </div>
        </div>

        {/* Status Card - Mobile */}
        {isMobile && (
          <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
            <div className="px-4 py-3 border-b border-slate-100">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Status</p>
            </div>
            <div className="p-4">
              <FormField control={form.control} name="status" rules={{ required: "Status is required" }} render={({ field }) => (
                <FormItem>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger className="h-12 bg-slate-50 border-0 rounded-xl">
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="suspended">Suspended</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="invited">Invited</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />
            </div>
          </div>
        )}

        {/* Notes Card */}
        <div className={isMobile ? "bg-white rounded-2xl shadow-sm overflow-hidden" : ""}>
          {isMobile && (
            <div className="px-4 py-3 border-b border-slate-100">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Additional Notes</p>
            </div>
          )}
          <div className={isMobile ? "p-4" : ""}>
            <FormField control={form.control} name="notes" render={({ field }) => (
              <FormItem>
                {!isMobile && <FormLabel>Notes</FormLabel>}
                <FormControl>
                  <Textarea 
                    placeholder="Additional notes about this team member"
                    rows={3}
                    className={isMobile ? "bg-slate-50 border-0 rounded-xl resize-none" : ""}
                    {...field} 
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )} />
          </div>
        </div>

        {/* Actions - Desktop only */}
        {!isMobile && (
          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isUpdating}>
              Cancel
            </Button>
            <Button type="submit" disabled={isUpdating}>
              {isUpdating ? 'Updating...' : 'Update Team Member'}
            </Button>
          </div>
        )}
      </form>
    </Form>
  );

  // Mobile: iOS-style bottom sheet
  if (isMobile) {
    return (
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent 
          side="bottom" 
          className="h-[95vh] rounded-t-3xl bg-slate-50 overflow-hidden p-0"
          hideCloseButton
        >
          {/* iOS-style Header */}
          <div className="flex items-center justify-between px-4 h-14 bg-white border-b border-slate-100 sticky top-0 z-10">
            <button 
              onClick={() => onOpenChange(false)}
              className="text-primary font-medium text-base active:opacity-70"
              type="button"
            >
              Cancel
            </button>
            <span className="font-semibold text-slate-900">Edit Member</span>
            <button 
              onClick={form.handleSubmit(onSubmit)}
              disabled={isUpdating}
              className="text-primary font-semibold text-base active:opacity-70 disabled:opacity-50"
              type="button"
            >
              {isUpdating ? 'Saving...' : 'Save'}
            </button>
          </div>
          
          {/* iOS Drag Handle */}
          <div className="absolute top-2 left-1/2 -translate-x-1/2 w-10 h-1 bg-slate-300 rounded-full" />

          <div className="p-4 overflow-y-auto h-[calc(95vh-56px)] pb-8">
            {formContent}
          </div>
        </SheetContent>
      </Sheet>
    );
  }

  // Desktop: Dialog
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent hideCloseButton className="sm:max-w-[500px] p-0 gap-0 overflow-hidden">
        <DialogHeader className="p-6 pb-4">
          <DialogTitle>Edit Team Member</DialogTitle>
          <DialogDescription>
            Update team member information and permissions.
          </DialogDescription>
        </DialogHeader>

        <div className="px-6 pb-6">
          {formContent}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default EditTeamMemberDialog;