import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DetailsTab } from './tabs/DetailsTab';
import { ContactTab } from './tabs/ContactTab';
import { NotesTab } from './tabs/NotesTab';
import { TasksTab } from './tabs/TasksTab';
import { DocumentsTab } from './tabs/DocumentsTab';

interface CaseDetailTabsProps {
  caseId: string;
  caseData: any;
  legalkartData?: any;
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export const CaseDetailTabs: React.FC<CaseDetailTabsProps> = ({
  caseId,
  caseData,
  legalkartData,
  activeTab,
  onTabChange
}) => {
  return (
    <div className="bg-white rounded-lg shadow-sm">
      <div className="border-b border-[#E5E7EB]">
        <nav className="-mb-px flex space-x-6 px-6">
          <button
            onClick={() => onTabChange('details')}
            className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'details'
                ? 'border-[#1173d4] text-[#1173d4]'
                : 'border-transparent text-[#6B7280] hover:text-[#1F2937] hover:border-gray-300'
            }`}
          >
            Case Details
          </button>
          <button
            onClick={() => onTabChange('contact')}
            className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'contact'
                ? 'border-[#1173d4] text-[#1173d4]'
                : 'border-transparent text-[#6B7280] hover:text-[#1F2937] hover:border-gray-300'
            }`}
          >
            Contact
          </button>
          <button
            onClick={() => onTabChange('documents')}
            className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'documents'
                ? 'border-[#1173d4] text-[#1173d4]'
                : 'border-transparent text-[#6B7280] hover:text-[#1F2937] hover:border-gray-300'
            }`}
          >
            Documents
          </button>
          <button
            onClick={() => onTabChange('notes')}
            className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'notes'
                ? 'border-[#1173d4] text-[#1173d4]'
                : 'border-transparent text-[#6B7280] hover:text-[#1F2937] hover:border-gray-300'
            }`}
          >
            Notes
          </button>
          <button
            onClick={() => onTabChange('tasks')}
            className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'tasks'
                ? 'border-[#1173d4] text-[#1173d4]'
                : 'border-transparent text-[#6B7280] hover:text-[#1F2937] hover:border-gray-300'
            }`}
          >
            Tasks
          </button>
        </nav>
      </div>

      <div className="p-6">
        {activeTab === 'details' && <DetailsTab caseData={caseData} legalkartData={legalkartData} caseId={caseId} />}
        {activeTab === 'contact' && <ContactTab caseData={caseData} />}
        {activeTab === 'notes' && <NotesTab caseId={caseId} />}
        {activeTab === 'tasks' && <TasksTab caseId={caseId} />}
        {activeTab === 'documents' && <DocumentsTab caseId={caseId} />}
      </div>
    </div>
  );
};
