import { Users, Phone, Mail, Briefcase } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useNavigate } from 'react-router-dom';

interface Client {
  id: string;
  full_name: string;
  email?: string;
  phone?: string;
  status: string;
  case_count?: number;
}

interface RecentClientsCardProps {
  clients: Client[];
  isLoading: boolean;
}

export const RecentClientsCard = ({ clients, isLoading }: RecentClientsCardProps) => {
  const navigate = useNavigate();

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  };

  return (
    <Card className="bg-white border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-medium flex items-center gap-2">
            <Users className="w-5 h-5 text-primary" />
            Recent Clients
          </CardTitle>
          <Button variant="link" size="sm" className="text-primary" onClick={() => navigate('/clients')}>
            View All
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}
          </div>
        ) : clients.length === 0 ? (
          <div className="text-center py-8">
            <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-sm text-gray-500">No clients yet</p>
            <Button variant="outline" size="sm" className="mt-3" onClick={() => navigate('/clients')}>
              Add Client
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {clients.slice(0, 5).map((client) => (
              <div 
                key={client.id} 
                className="p-3 bg-gray-50 rounded-lg border border-gray-200 cursor-pointer hover:bg-gray-100 transition-colors"
                onClick={() => navigate(`/clients/${client.id}`)}
              >
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-primary text-white rounded-full flex items-center justify-center text-sm font-medium flex-shrink-0">
                    {getInitials(client.full_name)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-medium text-sm truncate">{client.full_name}</h4>
                      <Badge className={`text-xs ${client.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                        {client.status}
                      </Badge>
                    </div>
                    <div className="space-y-1">
                      {client.email && (
                        <div className="flex items-center gap-1 text-xs text-gray-600 truncate">
                          <Mail className="w-3 h-3" />
                          {client.email}
                        </div>
                      )}
                      {client.phone && (
                        <div className="flex items-center gap-1 text-xs text-gray-600">
                          <Phone className="w-3 h-3" />
                          {client.phone}
                        </div>
                      )}
                      {client.case_count !== undefined && (
                        <div className="flex items-center gap-1 text-xs text-gray-500">
                          <Briefcase className="w-3 h-3" />
                          {client.case_count} {client.case_count === 1 ? 'case' : 'cases'}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
