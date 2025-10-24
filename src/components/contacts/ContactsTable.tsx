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
import { MoreHorizontal, Mail, Phone, Building, MapPin, UserPlus, Edit, Trash2, ChevronLeft, ChevronRight } from 'lucide-react';
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
  totalCount?: number;
  page?: number;
  pageSize?: number;
  onPageChange?: (page: number) => void;
}

export const ContactsTable = ({ 
  contacts, 
  isLoading, 
  onEditContact, 
  onConvertToClient, 
  onDeleteContact,
  onViewContact,
  totalCount = 0,
  page = 1,
  pageSize = 50,
  onPageChange
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
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="bg-slate-800 text-white">Contact</TableHead>
            <TableHead className="bg-slate-800 text-white">Organization</TableHead>
            <TableHead className="bg-slate-800 text-white">Contact Info</TableHead>
            <TableHead className="bg-slate-800 text-white">Location</TableHead>
            <TableHead className="bg-slate-800 text-white">Purpose</TableHead>
            <TableHead className="bg-slate-800 text-white">Last Visit</TableHead>
            <TableHead className="bg-slate-800 text-white w-[100px]">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {contacts.map((contact) => (
            <TableRow 
              key={contact.id} 
              className="cursor-pointer hover:bg-gray-50"
              onClick={() => onViewContact?.(contact)}
            >
              <TableCell>
                <div className="flex items-center space-x-3">
              <div className="h-10 w-10 rounded-full bg-slate-100 flex items-center justify-center">
                <span className="text-slate-600 font-medium text-sm">
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
      
      {/* Pagination */}
      {onPageChange && Math.ceil(totalCount / pageSize) > 1 && (
        <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200">
          <div className="text-sm text-muted-foreground">
            Page {page} of {Math.ceil(totalCount / pageSize)} (Total: {totalCount} contacts)
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(1)}
              disabled={page === 1}
              className="hidden sm:flex"
            >
              First
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(page - 1)}
              disabled={page === 1}
            >
              <ChevronLeft className="h-4 w-4" />
              <span className="hidden sm:inline ml-1">Previous</span>
            </Button>
            
            <div className="flex items-center gap-1">
              {Array.from({ length: Math.min(Math.ceil(totalCount / pageSize), 5) }, (_, i) => {
                const totalPages = Math.ceil(totalCount / pageSize);
                let pageNum: number;
                if (totalPages <= 5) {
                  pageNum = i + 1;
                } else if (page <= 3) {
                  pageNum = i + 1;
                } else if (page >= totalPages - 2) {
                  pageNum = totalPages - 4 + i;
                } else {
                  pageNum = page - 2 + i;
                }
                
                return (
                  <Button
                    key={pageNum}
                    variant={page === pageNum ? "default" : "ghost"}
                    size="sm"
                    onClick={() => onPageChange(pageNum)}
                    className="min-w-[32px]"
                  >
                    {pageNum}
                  </Button>
                );
              })}
            </div>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(page + 1)}
              disabled={page === Math.ceil(totalCount / pageSize)}
            >
              <span className="hidden sm:inline mr-1">Next</span>
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(Math.ceil(totalCount / pageSize))}
              disabled={page === Math.ceil(totalCount / pageSize)}
              className="hidden sm:flex"
            >
              Last
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};