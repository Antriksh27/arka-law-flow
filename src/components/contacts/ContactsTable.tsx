import React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
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

interface ContactsTableProps {
  contacts: any[];
  isLoading: boolean;
  onEditContact: (contact: any) => void;
  onConvertToClient: (contact: any) => void;
  onDeleteContact: (contact: any) => void;
  onViewContact?: (contact: any) => void;
}

export const ContactsTable = ({ 
  contacts, 
  isLoading, 
  onEditContact, 
  onConvertToClient, 
  onDeleteContact,
  onViewContact 
}: ContactsTableProps) => {
  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-16 bg-gray-100 animate-pulse rounded-lg" />
        ))}
      </div>
    );
  }

  if (contacts.length === 0) {
    return (
      <div className="text-center py-12 bg-white rounded-lg border">
        <div className="mx-auto h-12 w-12 text-gray-400 mb-4">
          <Building className="h-12 w-12" />
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">No contacts found</h3>
        <p className="text-gray-500">Get started by adding your first contact.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Contact</TableHead>
            <TableHead>Organization</TableHead>
            <TableHead>Contact Info</TableHead>
            <TableHead>Location</TableHead>
            <TableHead>Purpose</TableHead>
            <TableHead>Last Visit</TableHead>
            <TableHead className="w-[100px]">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {contacts.map((contact) => (
            <TableRow 
              key={contact.id} 
              className="cursor-pointer hover:bg-muted/50"
              onClick={() => onViewContact?.(contact)}
            >
              <TableCell>
                <div className="flex items-center space-x-3">
                  <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                    <span className="text-blue-600 font-medium text-sm">
                      {contact.name?.charAt(0)?.toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <div className="font-medium text-gray-900">{contact.name}</div>
                    {contact.notes && (
                      <div className="text-sm text-gray-500 truncate max-w-[200px]">
                        {contact.notes}
                      </div>
                    )}
                  </div>
                </div>
              </TableCell>
              
              <TableCell>
                {contact.organization && (
                  <div className="flex items-center gap-2">
                    <Building className="h-4 w-4 text-gray-400" />
                    <span className="text-sm">{contact.organization}</span>
                  </div>
                )}
              </TableCell>
              
              <TableCell>
                <div className="space-y-1">
                  {contact.email && (
                    <div className="flex items-center gap-2 text-sm">
                      <Mail className="h-3 w-3 text-gray-400" />
                      <span className="text-gray-600">{contact.email}</span>
                    </div>
                  )}
                  {contact.phone && (
                    <div className="flex items-center gap-2 text-sm">
                      <Phone className="h-3 w-3 text-gray-400" />
                      <span className="text-gray-600">{contact.phone}</span>
                    </div>
                  )}
                </div>
              </TableCell>
              
              <TableCell>
                {(contact.states?.name || contact.districts?.name) && (
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-gray-400" />
                    <span className="text-sm text-gray-600">
                      {[contact.districts?.name, contact.states?.name].filter(Boolean).join(', ')}
                    </span>
                  </div>
                )}
              </TableCell>
              
              <TableCell>
              {contact.visit_purpose && (
                <Badge variant="outline" className="text-xs">
                  {contact.visit_purpose}
                </Badge>
              )}
              </TableCell>
              
              <TableCell>
                <span className="text-sm text-gray-500">
                  {formatDistanceToNow(new Date(contact.last_visited_at), { addSuffix: true })}
                </span>
              </TableCell>
              
              <TableCell>
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
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};