import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ContactOverview } from './ContactOverview';
import { ContactNotes } from './ContactNotes';
import { ContactTasks } from './ContactTasks';
import { ContactDocuments } from './ContactDocuments';
import { ContactQuickActions } from './ContactQuickActions';
import { EditContactDialog } from './EditContactDialog';
import { useIsMobile } from '@/hooks/use-mobile';
import { MobileHeader } from '@/components/mobile/MobileHeader';
import { BottomNavBar } from '@/components/mobile/BottomNavBar';
import { BarChart3, CheckSquare, StickyNote, FileText, User, Mail, Phone, Building } from 'lucide-react';

interface ContactTabsProps {
  contactId: string;
  contact: any;
  activeTab: string;
  onTabChange: (tab: string) => void;
  onUpdate: () => void;
}

export const ContactTabs: React.FC<ContactTabsProps> = ({
  contactId,
  contact,
  activeTab,
  onTabChange,
  onUpdate
}) => {
  const isMobile = useIsMobile();
  const [showEditDialog, setShowEditDialog] = useState(false);

  const tabs = [
    { value: 'overview', label: 'Overview', icon: BarChart3 },
    { value: 'notes', label: 'Notes', icon: StickyNote },
    { value: 'tasks', label: 'Tasks', icon: CheckSquare },
    { value: 'documents', label: 'Documents', icon: FileText },
  ];

  return (
    <>
      {/* Mobile Header */}
      {isMobile && (
        <MobileHeader 
          title={contact.name}
          showBack={true}
          actions={
            <ContactQuickActions 
              contactId={contact.id} 
              contactName={contact.name} 
              contactEmail={contact.email}
              onAction={onUpdate} 
            />
          }
        />
      )}

      <div className={isMobile ? "" : "bg-white border border-gray-200 rounded-2xl shadow-sm m-8"}>
        <Tabs value={activeTab} onValueChange={onTabChange} className="w-full">
          {/* Header section - Desktop only */}
          {!isMobile && (
            <div className="p-6 pb-0">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-4 flex-1">
                  <Avatar className="w-16 h-16">
                    <AvatarFallback className="bg-gray-100 text-gray-600 text-lg font-medium">
                      {contact.name?.split(' ').map((n: string) => n[0]).join('').toUpperCase() || 'C'}
                    </AvatarFallback>
                  </Avatar>
                  
                  <div className="flex-1">
                    <h1 className="text-2xl font-semibold text-gray-900 mb-2 flex items-center gap-2">
                      {contact.name}
                      <Badge variant="outline" className="ml-2">Contact</Badge>
                    </h1>
                    <div className="space-y-2">
                      <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                        {contact.email && (
                          <div className="flex items-center gap-1">
                            <Mail className="w-4 h-4" />
                            <span>{contact.email}</span>
                          </div>
                        )}
                        {contact.phone && (
                          <div className="flex items-center gap-1">
                            <Phone className="w-4 h-4" />
                            <span>{contact.phone}</span>
                          </div>
                        )}
                        {contact.organization && (
                          <div className="flex items-center gap-1">
                            <Building className="w-4 h-4" />
                            <span>{contact.organization}</span>
                          </div>
                        )}
                      </div>
                      {(contact.referred_by_name || contact.source) && (
                        <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                          {contact.referred_by_name && (
                            <div>
                              <span className="font-medium">Referred By:</span> {contact.referred_by_name}
                            </div>
                          )}
                          {contact.source && (
                            <div>
                              <span className="font-medium">Source:</span> {contact.source}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-4">
                  <ContactQuickActions 
                    contactId={contact.id} 
                    contactName={contact.name} 
                    contactEmail={contact.email} 
                    onAction={onUpdate} 
                  />
                </div>
              </div>
            </div>
          )}

          {/* Tabs List */}
          <TabsList className={`w-full bg-white border-b border-gray-200 h-auto p-0 ${isMobile ? 'sticky top-14 z-30' : ''}`}>
            <div className={`flex ${isMobile ? 'overflow-x-auto scrollbar-hide' : 'flex-wrap sm:flex-nowrap overflow-x-auto'}`}>
              {tabs.map(tab => {
                const IconComponent = tab.icon;
                return (
                  <TabsTrigger 
                    key={tab.value} 
                    value={tab.value} 
                    className={`flex items-center gap-2 ${
                      isMobile 
                        ? 'px-3 py-2.5 text-xs flex-shrink-0' 
                        : 'px-4 py-3 text-sm'
                    } font-medium text-gray-600 hover:text-gray-900 border-b-2 border-transparent data-[state=active]:border-blue-700 data-[state=active]:text-blue-800 data-[state=active]:bg-blue-50 bg-transparent rounded-none whitespace-nowrap transition-colors`}
                  >
                    <IconComponent className="w-4 h-4" />
                    {tab.label}
                  </TabsTrigger>
                );
              })}
            </div>
          </TabsList>

          {/* Tab Content */}
          <div className={isMobile ? "p-4 pb-20" : "p-6"}>
            <TabsContent value="overview" className="m-0">
              <ContactOverview contactId={contactId} contact={contact} onUpdate={onUpdate} />
            </TabsContent>
            <TabsContent value="notes" className="m-0">
              <ContactNotes contactId={contactId} />
            </TabsContent>
            <TabsContent value="tasks" className="m-0">
              <ContactTasks contactId={contactId} />
            </TabsContent>
            <TabsContent value="documents" className="m-0">
              <ContactDocuments contactId={contactId} />
            </TabsContent>
          </div>
        </Tabs>

        {/* Edit Dialog */}
        {showEditDialog && (
          <EditContactDialog 
            open={showEditDialog} 
            onOpenChange={setShowEditDialog} 
            contact={contact} 
          />
        )}
      </div>
      
      {/* Mobile Bottom Nav */}
      {isMobile && <BottomNavBar />}
    </>
  );
};
