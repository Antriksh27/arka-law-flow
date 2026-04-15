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
import { UserPlus, User, Mail, Phone, KeyRound, FileText, Briefcase, Loader2 } from 'lucide-react';
import { useContext } from 'react';
import { DialogContentContext, useDialog } from '@/hooks/use-dialog';
import { MobileDialogHeader } from '@/components/ui/mobile-dialog-header';
import { ScrollArea } from '@/components/ui/scroll-area';

interface AddTeamMemberDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}
interface TeamMemberFormData {
  full_name: string;
  email: string;
  phone?: string;
  role: 'lawyer' | 'paralegal' | 'office_staff' | 'receptionist';
  password: string;
  notes?: string;
}
const AddTeamMemberDialog = ({
  open,
  onOpenChange
}: AddTeamMemberDialogProps) => {
  const { user, firmId, role: userRole } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isCreating, setIsCreating] = useState(false);
  const isMobile = useIsMobile();
  const { closeDialog } = useDialog();
  const isInsideDialog = useContext(DialogContentContext);
  const handleClose = isInsideDialog ? closeDialog : () => onOpenChange?.(false);

  const form = useForm<TeamMemberFormData>({
    defaultValues: {
      full_name: '',
      email: '',
      phone: '',
      role: 'lawyer',
      password: '',
      notes: ''
    }
  });

  const addTeamMemberMutation = useMutation({
    mutationFn: async (data: TeamMemberFormData) => {
      setIsCreating(true);
      try {
        const sanitizedData = {
          full_name: sanitizeInput(data.full_name),
          email: sanitizeInput(data.email).toLowerCase(),
          phone: data.phone ? sanitizeInput(data.phone) : undefined,
          role: data.role,
          password: data.password,
          notes: data.notes ? sanitizeInput(data.notes) : undefined
        };

        if (!isValidEmail(sanitizedData.email)) {
          throw new Error('Invalid email format');
        }

        const { data: session } = await supabase.auth.getSession();
        if (!session.session) {
          throw new Error('No active session');
        }
        const { data: result, error } = await supabase.functions.invoke('create-team-member', {
          body: {
            ...sanitizedData,
            firm_id: firmId,
            invited_by: user?.id
          }
        });
        if (error) {
          throw new Error(error.message || 'Failed to create team member');
        }
        return result;
      } finally {
        setIsCreating(false);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['team-members'] });
      toast({
        title: "Success",
        description: "Team member has been successfully added and can now log in with their email and password."
      });
      form.reset();
      handleClose();
    },
    onError: (error: Error) => {
      console.error('Error adding team member:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to add team member. Please try again.",
        variant: "destructive"
      });
    }
  });

  const onSubmit = (data: TeamMemberFormData) => {
    addTeamMemberMutation.mutate(data);
  };

  const { role: userRole, firmId } = useAuth();
  const canAddMembers = userRole === 'admin';
  
  if (!canAddMembers) {
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
                <Select onValueChange={field.onChange} defaultValue={field.value}>
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

            <FormField control={form.control} name="phone" render={({ field }) => (
              <FormItem>
                <FormLabel className={isMobile ? "text-slate-700" : ""}>Phone Number</FormLabel>
                <FormControl>
                  <div className="relative">
                    {isMobile && <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />}
                    <Input 
                      type="tel" 
                      inputMode="numeric"
                      placeholder="Enter phone number" 
                      className={isMobile ? "pl-10 h-12 bg-slate-50 border-0 rounded-xl" : ""} 
                      {...field} 
                    />
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )} />
          </div>
        </div>

        {/* Security Card */}
        <div className={isMobile ? "bg-white rounded-2xl shadow-sm overflow-hidden" : ""}>
          {isMobile && (
            <div className="px-4 py-3 border-b border-slate-100">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Security</p>
            </div>
          )}
          <div className={isMobile ? "p-4" : ""}>
            <FormField control={form.control} name="password" rules={{ required: "Password is required", minLength: { value: 8, message: "Password must be at least 8 characters" }, validate: { hasUppercase: value => /[A-Z]/.test(value) || "Password must contain at least one uppercase letter", hasLowercase: value => /[a-z]/.test(value) || "Password must contain at least one lowercase letter", hasNumber: value => /\d/.test(value) || "Password must contain at least one number", hasSymbol: value => /[!@#$%^&*()+=\[\]{}|;:,.<>?]/.test(value) || "Password must contain at least one symbol" }}} render={({ field }) => (
              <FormItem>
                <FormLabel className={isMobile ? "text-slate-700" : ""}>Password *</FormLabel>
                <FormControl>
                  <div className="relative">
                    {isMobile && <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />}
                    <Input 
                      type="password" 
                      placeholder="Enter password" 
                      className={isMobile ? "pl-10 h-12 bg-slate-50 border-0 rounded-xl" : ""} 
                      {...field} 
                    />
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )} />
          </div>
        </div>

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
      </form>
    </Form>
  );

  const formView = (
    <div className="flex flex-col h-full bg-slate-50">
      <MobileDialogHeader
        title="Add Team Member"
        subtitle="Create a new user account for your firm's team."
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
          disabled={isCreating}
          className="flex-1 rounded-full h-11"
        >
          {isCreating ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : 'Add Member'}
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

export default AddTeamMemberDialog;
