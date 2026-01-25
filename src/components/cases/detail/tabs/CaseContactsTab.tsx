import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Plus, Mail, Phone, Trash2, Star, User, Briefcase, MessageSquare } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import { MobileDialogHeader } from '@/components/ui/mobile-dialog-header';
import { useIsMobile } from '@/hooks/use-mobile';
interface ContactTabProps {
  caseId: string;
}
export const ContactTab: React.FC<ContactTabProps> = ({
  caseId
}) => {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    role: '',
    notes: ''
  });
  const isMobile = useIsMobile();
  const queryClient = useQueryClient();
  const {
    data: contacts,
    isLoading
  } = useQuery({
    queryKey: ['case-contacts', caseId],
    queryFn: async () => {
      const {
        data,
        error
      } = await supabase.from('case_contacts').select('*').eq('case_id', caseId).order('created_at', {
        ascending: false
      });
      if (error) throw error;
      return data;
    }
  });
  const addContactMutation = useMutation({
    mutationFn: async (contactData: any) => {
      const {
        data,
        error
      } = await supabase.from('case_contacts').insert([{
        ...contactData,
        case_id: caseId
      }]).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['case-contacts', caseId]
      });
      toast.success('Contact added successfully');
      setIsAddDialogOpen(false);
      setFormData({
        name: '',
        email: '',
        phone: '',
        role: '',
        notes: ''
      });
    },
    onError: () => {
      toast.error('Failed to add contact');
    }
  });
  const deleteContactMutation = useMutation({
    mutationFn: async (contactId: string) => {
      const {
        error
      } = await supabase.from('case_contacts').delete().eq('id', contactId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['case-contacts', caseId]
      });
      toast.success('Contact deleted successfully');
    },
    onError: () => {
      toast.error('Failed to delete contact');
    }
  });
  const toggleMainContactMutation = useMutation({
    mutationFn: async ({
      contactId,
      isMain
    }: {
      contactId: string;
      isMain: boolean;
    }) => {
      const {
        error
      } = await supabase.from('case_contacts').update({
        is_main: isMain
      }).eq('id', contactId);
      if (error) throw error;
      return {
        contactId,
        isMain
      };
    },
    onMutate: async ({
      contactId,
      isMain
    }) => {
      await queryClient.cancelQueries({
        queryKey: ['case-contacts', caseId]
      });
      const previousContacts = queryClient.getQueryData(['case-contacts', caseId]);
      queryClient.setQueryData(['case-contacts', caseId], (old: any) => {
        if (!old) return old;
        return old.map((contact: any) => {
          if (contact.id === contactId) {
            return {
              ...contact,
              is_main: isMain
            };
          }
          if (isMain) {
            return {
              ...contact,
              is_main: false
            };
          }
          return contact;
        });
      });
      return {
        previousContacts
      };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['case-contacts', caseId]
      });
      queryClient.invalidateQueries({
        queryKey: ['main-contact', caseId]
      });
      queryClient.invalidateQueries({
        queryKey: ['case', caseId]
      });
    },
    onError: (err, variables, context) => {
      if (context?.previousContacts) {
        queryClient.setQueryData(['case-contacts', caseId], context.previousContacts);
      }
      toast.error('Failed to update main contact');
    }
  });
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    addContactMutation.mutate(formData);
  };
  const resetAndClose = () => {
    setIsAddDialogOpen(false);
    setFormData({
      name: '',
      email: '',
      phone: '',
      role: '',
      notes: ''
    });
  };
  if (isLoading) {
    return <div className="p-6">Loading contacts...</div>;
  }
  return <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Case Contacts</h3>
        <Button size="sm" onClick={() => setIsAddDialogOpen(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Add Contact
        </Button>
      </div>

      {/* Add Contact Dialog - iOS Style */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent hideCloseButton className="p-0 gap-0 bg-muted">
          <div className="flex flex-col h-full bg-slate-50">
            <MobileDialogHeader title="Add Contact" subtitle="Add a contact to this case" onClose={resetAndClose} />
            
            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-4 py-4 space-y-4 bg-slate-50">
              {/* Name & Role Card */}
              <div className="bg-background rounded-2xl shadow-sm overflow-hidden">
                <div className="p-4 border-b border-border">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-xl bg-violet-100 flex items-center justify-center">
                      <User className="w-5 h-5 text-violet-500" />
                    </div>
                    <div>
                      <Label htmlFor="name" className="text-sm font-semibold text-foreground">
                        Name <span className="text-destructive">*</span>
                      </Label>
                      <p className="text-xs text-muted-foreground">Contact's full name</p>
                    </div>
                  </div>
                  <Input id="name" value={formData.name} onChange={e => setFormData({
                  ...formData,
                  name: e.target.value
                })} placeholder="Enter name" required className="bg-muted border-border h-11 rounded-xl" />
                </div>
                <div className="p-4">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center">
                      <Briefcase className="w-5 h-5 text-amber-500" />
                    </div>
                    <div>
                      <Label htmlFor="role" className="text-sm font-semibold text-foreground">Role</Label>
                      <p className="text-xs text-muted-foreground">e.g., Witness, Expert, etc.</p>
                    </div>
                  </div>
                  <Input id="role" value={formData.role} onChange={e => setFormData({
                  ...formData,
                  role: e.target.value
                })} placeholder="Enter role" className="bg-muted border-border h-11 rounded-xl" />
                </div>
              </div>

              {/* Contact Details Card */}
              <div className="bg-background rounded-2xl shadow-sm overflow-hidden">
                <div className="p-4 border-b border-border">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-xl bg-sky-100 flex items-center justify-center">
                      <Mail className="w-5 h-5 text-sky-500" />
                    </div>
                    <div>
                      <Label htmlFor="email" className="text-sm font-semibold text-foreground">Email</Label>
                      <p className="text-xs text-muted-foreground">Contact's email address</p>
                    </div>
                  </div>
                  <Input id="email" type="email" value={formData.email} onChange={e => setFormData({
                  ...formData,
                  email: e.target.value
                })} placeholder="email@example.com" className="bg-muted border-border h-11 rounded-xl" />
                </div>
                <div className="p-4">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center">
                      <Phone className="w-5 h-5 text-emerald-500" />
                    </div>
                    <div>
                      <Label htmlFor="phone" className="text-sm font-semibold text-foreground">Phone</Label>
                      <p className="text-xs text-muted-foreground">Contact's phone number</p>
                    </div>
                  </div>
                  <Input id="phone" value={formData.phone} onChange={e => setFormData({
                  ...formData,
                  phone: e.target.value
                })} placeholder="+91 98765 43210" className="bg-muted border-border h-11 rounded-xl" />
                </div>
              </div>

              {/* Notes Card */}
              <div className="bg-background rounded-2xl shadow-sm p-4">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-xl bg-rose-100 flex items-center justify-center">
                    <MessageSquare className="w-5 h-5 text-rose-500" />
                  </div>
                  <div>
                    <Label htmlFor="notes" className="text-sm font-semibold text-foreground">Notes</Label>
                    <p className="text-xs text-muted-foreground">Additional information</p>
                  </div>
                </div>
                <Textarea id="notes" value={formData.notes} onChange={e => setFormData({
                ...formData,
                notes: e.target.value
              })} placeholder="Add any additional notes..." rows={3} className="bg-muted border-border rounded-xl resize-none" />
              </div>
            </form>

            {/* Footer */}
            <div className="p-4 border-t border-border bg-background">
              <div className="flex gap-3">
                <Button type="button" variant="outline" onClick={resetAndClose} className="flex-1 h-12 rounded-xl">
                  Cancel
                </Button>
                <Button onClick={handleSubmit} disabled={addContactMutation.isPending || !formData.name} className="flex-1 h-12 rounded-xl">
                  {addContactMutation.isPending ? 'Adding...' : 'Add Contact'}
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {contacts && contacts.length > 0 ? <div className="grid gap-4">
          {contacts.map(contact => <div key={contact.id} className="bg-background border border-border rounded-2xl p-4">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3 flex-1">
                  <div className="flex items-center shrink-0">
                    <Checkbox id={`contact-main-${contact.id}`} checked={contact.is_main === true} onCheckedChange={checked => {
                toggleMainContactMutation.mutate({
                  contactId: contact.id,
                  isMain: checked === true
                });
              }} disabled={toggleMainContactMutation.isPending} className="mr-2" aria-label="Mark as main contact" />
                    {contact.is_main && <Star className="w-4 h-4 text-yellow-500 fill-yellow-500 mr-1" />}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h4 className="font-semibold text-base">{contact.name}</h4>
                      {contact.role && <span className="text-xs bg-muted px-2 py-1 rounded-full">{contact.role}</span>}
                    </div>
                    <div className="space-y-1 text-sm text-muted-foreground">
                      {contact.email && <div className="flex items-center gap-2">
                          <Mail className="w-4 h-4" />
                          <a href={`mailto:${contact.email}`} className="hover:text-primary hover:underline">
                            {contact.email}
                          </a>
                        </div>}
                      {contact.phone && <div className="flex items-center gap-2">
                          <Phone className="w-4 h-4" />
                          <a href={`tel:${contact.phone}`} className="hover:text-primary hover:underline">
                            {contact.phone}
                          </a>
                        </div>}
                      {contact.notes && <p className="mt-2 text-sm">{contact.notes}</p>}
                    </div>
                  </div>
                </div>
                <Button variant="ghost" size="sm" onClick={() => deleteContactMutation.mutate(contact.id)} disabled={deleteContactMutation.isPending} className="rounded-xl">
                  <Trash2 className="w-4 h-4 text-destructive" />
                </Button>
              </div>
            </div>)}
        </div> : <div className="text-center py-12 text-muted-foreground">
          <div className="w-16 h-16 rounded-2xl bg-muted mx-auto mb-4 flex items-center justify-center">
            <User className="w-8 h-8 text-muted-foreground/50" />
          </div>
          <p className="font-medium">No contacts added yet</p>
          <p className="text-sm mt-1">Click "Add Contact" to add a contact to this case</p>
        </div>}
    </div>;
};