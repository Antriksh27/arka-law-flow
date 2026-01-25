import { UserPlus, Phone, Calendar, ArrowRight } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import TimeUtils from '@/lib/timeUtils';
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';

interface Contact {
  id: string;
  name: string;
  phone?: string;
  last_visited_at?: string;
}

interface RecentContactsCardProps {
  contacts: Contact[];
  isLoading: boolean;
}

export const RecentContactsCard = ({ contacts, isLoading }: RecentContactsCardProps) => {
  const navigate = useNavigate();
  const [convertingContactId, setConvertingContactId] = useState<string | null>(null);

  const handleConvertToClient = (contactId: string) => {
    setConvertingContactId(contactId);
  };

  return (
    <>
      <Card className="bg-white border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-medium flex items-center gap-2">
              <UserPlus className="w-5 h-5 text-primary" />
              Recent Contacts
            </CardTitle>
            <Button variant="link" size="sm" className="text-primary" onClick={() => navigate('/contacts')}>
              View All
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}
            </div>
          ) : contacts.length === 0 ? (
            <div className="text-center py-8">
              <UserPlus className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <p className="text-sm text-slate-500">No recent contacts</p>
            </div>
          ) : (
            <div className="space-y-3">
              {contacts.slice(0, 5).map((contact) => (
                <div key={contact.id} className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <h4 className="font-medium text-sm">{contact.name}</h4>
                      {contact.phone && (
                        <div className="flex items-center gap-1 text-xs text-slate-600 mt-1">
                          <Phone className="w-3 h-3" />
                          {contact.phone}
                        </div>
                      )}
                    </div>
                    <Button 
                      size="sm" 
                      variant="outline" 
                      className="text-xs h-7"
                      onClick={() => handleConvertToClient(contact.id)}
                    >
                      Convert
                      <ArrowRight className="w-3 h-3 ml-1" />
                    </Button>
                  </div>
                  {contact.last_visited_at && (
                    <div className="flex items-center gap-1 text-xs text-slate-500">
                      <Calendar className="w-3 h-3" />
                      Visited {TimeUtils.formatRelative(contact.last_visited_at)}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {convertingContactId && (
        <Dialog open={!!convertingContactId} onOpenChange={() => setConvertingContactId(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Convert to Client</DialogTitle>
              <DialogDescription>
                This feature will convert the contact to a client. Navigate to contacts page to complete the conversion.
              </DialogDescription>
            </DialogHeader>
            <Button onClick={() => {
              setConvertingContactId(null);
              navigate('/contacts');
            }}>
              Go to Contacts
            </Button>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
};
