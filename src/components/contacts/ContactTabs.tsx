import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { ContactOverview } from './ContactOverview';
import { ContactNotes } from './ContactNotes';
import { ContactTasks } from './ContactTasks';
import { ContactDocuments } from './ContactDocuments';
import { ContactQuickActions } from './ContactQuickActions';
import { EditContactDialog } from './EditContactDialog';
import { useIsMobile } from '@/hooks/use-mobile';
import { MobileHeader } from '@/components/mobile/MobileHeader';
import { MobilePageContainer } from '@/components/mobile/MobilePageContainer';
import { border, text } from '@/lib/colors';

import { BarChart3, CheckSquare, StickyNote, FileText, Mail, Phone, Building } from 'lucide-react';

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

  const getInitials = (name: string) => {
    if (!name) return '?';
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  // Mobile Layout
  if (isMobile) {
    return (
      <MobilePageContainer>
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
        
        {/* Mobile Contact Header Card */}
        <div className="px-4 pt-4 pb-2">
          <div className="bg-card rounded-2xl border border-border p-4 shadow-sm">
            <div className="flex items-start gap-4">
              <Avatar className="w-16 h-16 ring-2 ring-primary/10 flex-shrink-0">
                <AvatarFallback className="bg-primary/10 text-primary font-semibold text-lg">
                  {getInitials(contact.name)}
                </AvatarFallback>
              </Avatar>
              
              <div className="flex-1 min-w-0">
                <h2 className="text-lg font-semibold text-foreground truncate">
                  {contact.name}
                </h2>
                <Badge variant="outline" className="mt-1 text-[10px]">
                  Contact
                </Badge>
                
                <div className="mt-3 space-y-1.5">
                  {contact.email && (
                    <a 
                      href={`mailto:${contact.email}`}
                      className="flex items-center gap-2 text-sm text-muted-foreground"
                    >
                      <Mail className="w-4 h-4" />
                      <span className="truncate">{contact.email}</span>
                    </a>
                  )}
                  {contact.phone && (
                    <a 
                      href={`tel:${contact.phone}`}
                      className="flex items-center gap-2 text-sm text-muted-foreground"
                    >
                      <Phone className="w-4 h-4" />
                      <span>{contact.phone}</span>
                    </a>
                  )}
                  {contact.organization && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Building className="w-4 h-4" />
                      <span className="truncate">{contact.organization}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={onTabChange} className="w-full">
          {/* Mobile Tabs */}
          <TabsList className="w-full bg-background border-b border-border h-auto p-0 sticky top-14 z-30">
            <div className="flex overflow-x-auto scrollbar-hide px-4">
              {tabs.map(tab => {
                const IconComponent = tab.icon;
                return (
                  <TabsTrigger 
                    key={tab.value} 
                    value={tab.value} 
                    className="flex items-center gap-2 px-4 py-3 text-sm font-medium text-muted-foreground hover:text-foreground border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:text-primary bg-transparent rounded-none whitespace-nowrap transition-colors min-h-[48px]"
                  >
                    <IconComponent className="w-4 h-4" />
                    {tab.label}
                  </TabsTrigger>
                );
              })}
            </div>
          </TabsList>

          {/* Tab Content */}
          <div className="p-4 pb-8">
            <TabsContent value="overview" className="m-0 animate-fade-in">
              <ContactOverview contactId={contactId} contact={contact} onUpdate={onUpdate} />
            </TabsContent>
            <TabsContent value="notes" className="m-0 animate-fade-in">
              <ContactNotes contactId={contactId} />
            </TabsContent>
            <TabsContent value="tasks" className="m-0 animate-fade-in">
              <ContactTasks contactId={contactId} />
            </TabsContent>
            <TabsContent value="documents" className="m-0 animate-fade-in">
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
      </MobilePageContainer>
    );
  }

  // Desktop Layout
  return (
    <>
      <div className={`bg-white border ${border.default} rounded-2xl shadow-sm m-8`}>
        <Tabs value={activeTab} onValueChange={onTabChange} className="w-full">
          {/* Header section */}
          <div className="p-6 pb-0">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-4 flex-1">
                <Avatar className="w-16 h-16">
                  <AvatarFallback className="bg-muted text-muted-foreground text-lg font-medium">
                    {getInitials(contact.name)}
                  </AvatarFallback>
                </Avatar>
                
                <div className="flex-1">
                  <h1 className={`text-2xl font-semibold ${text.primary} mb-2 flex items-center gap-2`}>
                    {contact.name}
                    <Badge variant="outline" className="ml-2">Contact</Badge>
                  </h1>
                  <div className="space-y-2">
                    <div className={`flex flex-wrap gap-4 text-sm ${text.muted}`}>
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
                      <div className={`flex flex-wrap gap-4 text-sm ${text.muted}`}>
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

          {/* Tabs List */}
          <TabsList className={`w-full bg-white border-b ${border.default} h-auto p-0`}>
            <div className="flex flex-wrap sm:flex-nowrap overflow-x-auto">
              {tabs.map(tab => {
                const IconComponent = tab.icon;
                return (
                  <TabsTrigger 
                    key={tab.value} 
                    value={tab.value} 
                    className={`flex items-center gap-2 px-4 py-3 text-sm font-medium ${text.muted} hover:text-foreground border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:text-primary data-[state=active]:bg-primary/5 bg-transparent rounded-none whitespace-nowrap transition-colors`}
                  >
                    <IconComponent className="w-4 h-4" />
                    {tab.label}
                  </TabsTrigger>
                );
              })}
            </div>
          </TabsList>

          {/* Tab Content */}
          <div className="p-6">
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
    </>
  );
};
