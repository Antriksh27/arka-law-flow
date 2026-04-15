import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { sanitizeInput, isValidEmail } from '@/lib/security';
import { useIsMobile } from '@/hooks/use-mobile';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { User, Mail, Phone, FileText, Shield, Loader2 } from 'lucide-react';
import { useContext } from 'react';
import { DialogContentContext, useDialog } from '@/hooks/use-dialog';
import { MobileDialogHeader } from '@/components/ui/mobile-dialog-header';
import { ScrollArea } from '@/components/ui/scroll-area';

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
  const { closeDialog } = useDialog();
  const isInsideDialog = useContext(DialogContentContext);
  const handleClose = isInsideDialog ? closeDialog : () => onOpenChange?.(false);

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
      handleClose();
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
            <Button type="button" variant="outline" onClick={handleClose} disabled={isUpdating}>
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

  const formView = (
    <div className="flex flex-col h-full bg-slate-50">
      <MobileDialogHeader
        title="Edit Team Member"
        subtitle="Update member details and permissions."
        onClose={handleClose}
        showBorder
      />
      
      <ScrollArea className="flex-1">
        <div className="p-4 space-y-4">
          {formContent}
        </div>
      </ScrollArea>

      <div className="p-4 bg-white border-t flex gap-3">
        <Button 
          type="submit" 
          onClick={form.handleSubmit(onSubmit)}
          disabled={isUpdating}
          className="flex-1 rounded-full h-11"
        >
          {isUpdating ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : 'Update Member'}
        </Button>
      </div>
    </div>
  );

  if (isInsideDialog) {
    return formView;
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent hideCloseButton className="sm:max-w-[600px] p-0 gap-0 overflow-hidden bg-white max-h-[95vh] sm:max-h-[90vh]">
        {formView}
      </DialogContent>
    </Dialog>
  );
};

export default EditTeamMemberDialog;
