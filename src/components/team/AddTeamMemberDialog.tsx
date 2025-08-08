import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { sanitizeInput, isValidEmail } from '@/lib/security';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';

interface AddTeamMemberDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface TeamMemberFormData {
  full_name: string;
  email: string;
  phone?: string;
  role: 'lawyer' | 'paralegal' | 'junior' | 'office_staff' | 'receptionist';
  password: string;
  notes?: string;
}

const AddTeamMemberDialog = ({ open, onOpenChange }: AddTeamMemberDialogProps) => {
  const { user, firmId, role: userRole } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isCreating, setIsCreating] = useState(false);

  const form = useForm<TeamMemberFormData>({
    defaultValues: {
      full_name: '',
      email: '',
      phone: '',
      role: 'junior',
      password: '',
      notes: '',
    },
  });

  const addTeamMemberMutation = useMutation({
    mutationFn: async (data: TeamMemberFormData) => {
      setIsCreating(true);
      
      try {
        // Sanitize inputs before processing
        const sanitizedData = {
          full_name: sanitizeInput(data.full_name),
          email: sanitizeInput(data.email).toLowerCase(),
          phone: data.phone ? sanitizeInput(data.phone) : undefined,
          role: data.role,
          password: data.password, // Don't sanitize password
          notes: data.notes ? sanitizeInput(data.notes) : undefined,
        };

        // Additional validation
        if (!isValidEmail(sanitizedData.email)) {
          throw new Error('Invalid email format');
        }

        // Call the edge function to create the team member
        const { data: session } = await supabase.auth.getSession();
        if (!session.session) {
          throw new Error('No active session');
        }

        const { data: result, error } = await supabase.functions.invoke('create-team-member', {
          body: {
            ...sanitizedData,
            firm_id: firmId,
            invited_by: user?.id,
          },
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
        description: "Team member has been successfully added and can now log in with their email and password.",
      });
      form.reset();
      onOpenChange(false);
    },
    onError: (error: Error) => {
      console.error('Error adding team member:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to add team member. Please try again.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: TeamMemberFormData) => {
    const canAddMembers = userRole === 'admin' || userRole === 'lawyer';
    if (!canAddMembers) {
      toast({
        title: "Access Denied",
        description: "Only administrators and lawyers can add team members.",
        variant: "destructive",
      });
      return;
    }
    addTeamMemberMutation.mutate(data);
  };

  const generatePassword = () => {
    // Generate exactly 8 character password with mixed case, numbers, and symbols
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
    let password = '';
    
    // Ensure at least one character from each category
    const categories = [
      'ABCDEFGHIJKLMNOPQRSTUVWXYZ', // uppercase
      'abcdefghijklmnopqrstuvwxyz', // lowercase
      '0123456789', // numbers
      '!@#$%^&*' // symbols
    ];
    
    // Add one char from each category first (4 chars)
    categories.forEach(category => {
      password += category.charAt(Math.floor(Math.random() * category.length));
    });
    
    // Fill remaining 4 characters randomly
    for (let i = 4; i < 8; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    
    // Shuffle the password
    password = password.split('').sort(() => 0.5 - Math.random()).join('');
    form.setValue('password', password);
  };

  // Allow admin and lawyer roles to add team members
  const canAddMembers = userRole === 'admin' || userRole === 'lawyer';

  if (!canAddMembers) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add New Team Member</DialogTitle>
          <DialogDescription>
            Create a new user account and add them to your firm's team.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <FormField
                control={form.control}
                name="full_name"
                rules={{ required: "Full name is required" }}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Full Name *</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter full name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="role"
                rules={{ required: "Role is required" }}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Role *</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select role" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="lawyer">Lawyer</SelectItem>
                        <SelectItem value="paralegal">Paralegal</SelectItem>
                        <SelectItem value="junior">Junior</SelectItem>
                        <SelectItem value="office_staff">Office Staff</SelectItem>
                        <SelectItem value="receptionist">Receptionist</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="email"
              rules={{ 
                required: "Email is required",
                pattern: {
                  value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                  message: "Invalid email address"
                }
              }}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email Address *</FormLabel>
                  <FormControl>
                    <Input 
                      type="email" 
                      placeholder="Enter email address" 
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Phone Number</FormLabel>
                  <FormControl>
                    <Input 
                      type="tel" 
                      placeholder="Enter phone number" 
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="password"
              rules={{ 
                required: "Password is required",
                minLength: {
                  value: 8,
                  message: "Password must be at least 8 characters"
                },
                validate: {
                  hasUppercase: (value) => /[A-Z]/.test(value) || "Password must contain at least one uppercase letter",
                  hasLowercase: (value) => /[a-z]/.test(value) || "Password must contain at least one lowercase letter",
                  hasNumber: (value) => /\d/.test(value) || "Password must contain at least one number",
                  hasSymbol: (value) => /[!@#$%^&*()+=\[\]{}|;:,.<>?]/.test(value) || "Password must contain at least one symbol"
                }
              }}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Password *</FormLabel>
                  <div className="flex gap-2">
                    <FormControl>
                      <Input 
                        type="password" 
                        placeholder="Enter password" 
                        {...field} 
                      />
                    </FormControl>
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={generatePassword}
                      className="whitespace-nowrap"
                    >
                      Generate
                    </Button>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Additional notes about this team member"
                      rows={3}
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-3 pt-4">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => onOpenChange(false)}
                disabled={isCreating}
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={isCreating}
              >
                {isCreating ? 'Creating Account...' : 'Add Team Member'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default AddTeamMemberDialog;