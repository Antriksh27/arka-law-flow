import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { ContactsHeader } from './ContactsHeader';
import { ContactsTable } from './ContactsTable';
import { ContactsFilters } from './ContactsFilters';
import { ContactsGrid } from './ContactsGrid';
import { AddContactDialog } from './AddContactDialog';
import { EditContactDialog } from './EditContactDialog';
import { ConvertToClientDialog } from './ConvertToClientDialog';
import { DeleteContactDialog } from './DeleteContactDialog';
import { ContactDetailsDialog } from './ContactDetailsDialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export const ContactList = () => {
  const { firmId } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showConvertDialog, setShowConvertDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [selectedContact, setSelectedContact] = useState<any>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('table');
  const [page, setPage] = useState(1);
  const pageSize = 50;

  const { data: queryResult, isLoading } = useQuery({
    queryKey: ['contacts', firmId, searchTerm, page],
    queryFn: async () => {
      if (!firmId) return { contacts: [], totalCount: 0 };
      
      const startIndex = (page - 1) * pageSize;
      const endIndex = startIndex + pageSize - 1;
      
      let query = supabase
        .from('contacts')
        .select('*, states(name), districts(name)', { count: 'exact' })
        .eq('firm_id', firmId)
        .order('created_at', { ascending: false })
        .range(startIndex, endIndex);

      if (searchTerm) {
        query = query.or(`name.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%,phone.ilike.%${searchTerm}%,organization.ilike.%${searchTerm}%`);
      }

      const { data, error, count } = await query;
      if (error) {
        console.error('Error fetching contacts:', error);
        throw error;
      }
      return {
        contacts: data || [],
        totalCount: count || 0
      };
    },
    enabled: !!firmId,
  });

  const contacts = queryResult?.contacts || [];
  const totalCount = queryResult?.totalCount || 0;

  const handleAddContact = () => {
    setShowAddDialog(true);
  };

  const handleEditContact = (contact: any) => {
    setSelectedContact(contact);
    setShowEditDialog(true);
  };

  const handleConvertToClient = (contact: any) => {
    setSelectedContact(contact);
    setShowConvertDialog(true);
  };

  const handleDeleteContact = (contact: any) => {
    setSelectedContact(contact);
    setShowDeleteDialog(true);
  };

  const handleViewContact = (contact: any) => {
    setSelectedContact(contact);
    setShowDetailsDialog(true);
  };

  return (
    <div className="space-y-6">
      <ContactsHeader 
        onAddContact={handleAddContact}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
      />
      
      <ContactsFilters
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
      />

      <Tabs defaultValue="all" className="w-full">
        <TabsList className="grid w-full grid-cols-2 bg-white rounded-2xl shadow-sm border border-gray-200">
          <TabsTrigger value="all" className="data-[state=active]:bg-slate-800 data-[state=active]:text-white">All Contacts ({contacts.length})</TabsTrigger>
          <TabsTrigger value="recent" className="data-[state=active]:bg-slate-800 data-[state=active]:text-white">Recent</TabsTrigger>
        </TabsList>
        
        <TabsContent value="all" className="mt-6">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200">
            {viewMode === 'table' ? (
              <ContactsTable
                contacts={contacts}
                isLoading={isLoading}
                onEditContact={handleEditContact}
                onConvertToClient={handleConvertToClient}
                onDeleteContact={handleDeleteContact}
                onViewContact={handleViewContact}
                totalCount={totalCount}
                page={page}
                pageSize={pageSize}
                onPageChange={setPage}
              />
            ) : (
              <div className="p-6">
                <ContactsGrid
                  contacts={contacts}
                  isLoading={isLoading}
                  onEditContact={handleEditContact}
                  onConvertToClient={handleConvertToClient}
                  onDeleteContact={handleDeleteContact}
                  onViewContact={handleViewContact}
                />
              </div>
            )}
          </div>
        </TabsContent>
        
        <TabsContent value="recent" className="mt-6">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200">
            {viewMode === 'table' ? (
              <ContactsTable
                contacts={contacts.filter(contact => {
                  const lastVisited = new Date(contact.last_visited_at);
                  const thirtyDaysAgo = new Date();
                  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
                  return lastVisited > thirtyDaysAgo;
                })}
                isLoading={isLoading}
                onEditContact={handleEditContact}
                onConvertToClient={handleConvertToClient}
                onDeleteContact={handleDeleteContact}
                onViewContact={handleViewContact}
                totalCount={totalCount}
                page={page}
                pageSize={pageSize}
                onPageChange={setPage}
              />
            ) : (
              <div className="p-6">
                <ContactsGrid
                  contacts={contacts.filter(contact => {
                    const lastVisited = new Date(contact.last_visited_at);
                    const thirtyDaysAgo = new Date();
                    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
                    return lastVisited > thirtyDaysAgo;
                  })}
                  isLoading={isLoading}
                  onEditContact={handleEditContact}
                  onConvertToClient={handleConvertToClient}
                  onDeleteContact={handleDeleteContact}
                  onViewContact={handleViewContact}
                />
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>

      <AddContactDialog
        open={showAddDialog}
        onOpenChange={setShowAddDialog}
      />

      {selectedContact && (
        <>
          <EditContactDialog
            open={showEditDialog}
            onOpenChange={setShowEditDialog}
            contact={selectedContact}
          />
          
          <ConvertToClientDialog
            open={showConvertDialog}
            onOpenChange={setShowConvertDialog}
            contact={selectedContact}
          />
          
          <DeleteContactDialog
            open={showDeleteDialog}
            onOpenChange={setShowDeleteDialog}
            contact={selectedContact}
          />

          <ContactDetailsDialog
            open={showDetailsDialog}
            onOpenChange={setShowDetailsDialog}
            contact={selectedContact}
            onConvertToClient={handleConvertToClient}
            onEditContact={handleEditContact}
            onDeleteContact={handleDeleteContact}
          />
        </>
      )}
    </div>
  );
};