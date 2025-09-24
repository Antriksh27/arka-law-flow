import React from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MoreHorizontal, Mail, Phone, Building, MapPin, UserPlus, Edit, Trash2 } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { formatDistanceToNow } from 'date-fns';

interface ContactsGridProps {
  contacts: any[];
  isLoading: boolean;
  onEditContact: (contact: any) => void;
  onConvertToClient: (contact: any) => void;
  onDeleteContact: (contact: any) => void;
  onViewContact?: (contact: any) => void;
}

export const ContactsGrid = ({ 
  contacts, 
  isLoading, 
  onEditContact, 
  onConvertToClient, 
  onDeleteContact,
  onViewContact 
}: ContactsGridProps) => {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {[...Array(8)].map((_, i) => (
          <div key={i} className="h-48 bg-gray-100 animate-pulse rounded-lg" />
        ))}
      </div>
    );
  }

  if (contacts.length === 0) {
    return (
      <div className="text-center py-12 bg-white rounded-2xl shadow-sm border border-gray-200">
        <div className="mx-auto h-12 w-12 text-gray-400 mb-4">
          <Building className="h-12 w-12" />
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">No contacts found</h3>
        <p className="text-gray-500">Get started by adding your first contact.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {contacts.map((contact) => (
        <Card 
          key={contact.id} 
          className="hover:shadow-md transition-shadow cursor-pointer bg-white rounded-2xl shadow-sm border border-gray-200"
          onClick={() => onViewContact?.(contact)}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <div className="flex items-center space-x-3">
              <div className="h-10 w-10 rounded-full bg-slate-100 flex items-center justify-center">
                <span className="text-slate-600 font-medium text-sm">
                  {contact.name?.charAt(0)?.toUpperCase()}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-medium text-gray-900 truncate">{contact.name}</h3>
                {contact.organization && (
                  <p className="text-sm text-gray-500 truncate">{contact.organization}</p>
                )}
              </div>
            </div>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="ghost" 
                  className="h-8 w-8 p-0"
                  onClick={(e) => e.stopPropagation()}
                >
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => onEditContact(contact)}>
                  <Edit className="mr-2 h-4 w-4" />
                  Edit Contact
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onConvertToClient(contact)}>
                  <UserPlus className="mr-2 h-4 w-4" />
                  Convert to Client
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={() => onDeleteContact(contact)}
                  className="text-red-600"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete Contact
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </CardHeader>
          
          <CardContent className="space-y-3">
            <div className="space-y-2">
              {contact.email && (
                <div className="flex items-center gap-2 text-sm">
                  <Mail className="h-3 w-3 text-gray-400" />
                  <span className="text-gray-600 truncate">{contact.email}</span>
                </div>
              )}
              {contact.phone && (
                <div className="flex items-center gap-2 text-sm">
                  <Phone className="h-3 w-3 text-gray-400" />
                  <span className="text-gray-600">{contact.phone}</span>
                </div>
              )}
              {(contact.states?.name || contact.districts?.name) && (
                <div className="flex items-center gap-2 text-sm">
                  <MapPin className="h-3 w-3 text-gray-400" />
                  <span className="text-gray-600 truncate">
                    {[contact.districts?.name, contact.states?.name].filter(Boolean).join(', ')}
                  </span>
                </div>
              )}
            </div>
            
            <div className="flex items-center justify-between">
              {contact.visit_purpose && (
                <Badge variant="outline" className="text-xs">
                  {contact.visit_purpose}
                </Badge>
              )}
              <span className="text-xs text-gray-500">
                {formatDistanceToNow(new Date(contact.last_visited_at), { addSuffix: true })}
              </span>
            </div>
            
            {contact.notes && (
              <p className="text-sm text-gray-500 line-clamp-2">{contact.notes}</p>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
};