import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useIsMobile } from '@/hooks/use-mobile';
import { ContactsHeader } from './ContactsHeader';
import { ContactsTable } from './ContactsTable';
import { ContactsFilters } from './ContactsFilters';
import { ContactsGrid } from './ContactsGrid';
import { MobileContactCard } from './MobileContactCard';
import { AddContactDialog } from './AddContactDialog';
import { EditContactDialog } from './EditContactDialog';
import { ConvertToClientDialog } from './ConvertToClientDialog';
import { DeleteContactDialog } from './DeleteContactDialog';
import { ContactDetailsDialog } from './ContactDetailsDialog';
import { MobileHeader } from '@/components/mobile/MobileHeader';
import { MobileFAB } from '@/components/mobile/MobileFAB';
import { MobilePageContainer } from '@/components/mobile/MobilePageContainer';
import { Skeleton } from '@/components/ui/skeleton';
import { Plus, Search, Users } from 'lucide-react';

export const ContactList = () => {
  const navigate = useNavigate();
  const { firmId } = useAuth();
  const isMobile = useIsMobile();
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

  const { data: queryResult, isLoading, refetch } = useQuery({
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
    navigate(`/contacts/${contact.id}`);
  };

  // Mobile Layout
  if (isMobile) {
    return (
      <MobilePageContainer>
        <MobileHeader 
          title="Contacts" 
          actions={
            <span className="text-sm text-muted-foreground">
              {totalCount} total
            </span>
          }
        />
        
        {/* Mobile Search - Sticky below header */}
        <div className="sticky top-14 z-30 bg-background px-4 py-3 border-b border-border">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <input 
              type="text" 
              className="w-full rounded-xl bg-muted pl-10 pr-4 py-3 text-base border-0 focus:ring-2 focus:ring-primary outline-none min-h-[48px]" 
              placeholder="Search contacts..." 
              value={searchTerm} 
              onChange={e => setSearchTerm(e.target.value)} 
            />
          </div>
        </div>
        
        {/* Contact Cards */}
        <div className="px-4 py-3 space-y-3">
          {isLoading ? (
            <>
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-28 w-full rounded-2xl" />
              ))}
            </>
          ) : contacts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 px-4">
              <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
                <Users className="w-8 h-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-medium text-foreground mb-1">No contacts yet</h3>
              <p className="text-sm text-muted-foreground text-center mb-4">
                Add your first contact to get started
              </p>
            </div>
          ) : (
            contacts.map((contact: any) => (
              <MobileContactCard
                key={contact.id}
                contact={contact}
                onClick={() => handleViewContact(contact)}
              />
            ))
          )}
        </div>
        
        {/* FAB */}
        <MobileFAB 
          onClick={handleAddContact} 
          icon={Plus}
        />
        
        {/* Dialogs */}
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
      </MobilePageContainer>
    );
  }

  // Desktop Layout
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
            onRefetch={refetch}
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