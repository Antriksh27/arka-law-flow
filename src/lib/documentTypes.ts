/**
 * Centralized Document Type Hierarchy for Indian Legal Practice
 * 
 * This file defines the complete document categorization structure
 * used throughout the document management system.
 */

export const DOCUMENT_TYPE_HIERARCHY: Record<string, string[]> = {
  'Pleadings': [
    'Plaint',
    'Written Statement',
    'Rejoinder',
    'Applications',
    'Affidavit in Reply',
    'Affidavit in Rejoinder',
    'Affidavit in Sur-Rejoinder',
    'Additional Affidavit',
    'DS Affidavit'
  ],
  'Court Orders': [
    'Interim Orders',
    'Final Orders',
    'Daily Orders'
  ],
  'Evidence': [
    'Affidavits',
    'Exhibits',
    'Annexures',
    'Witness Statements'
  ],
  'Correspondence': [
    'Client',
    'Opponent',
    'Court'
  ],
  'Compliance': [
    'Notices',
    'Replies',
    'Proof of Service'
  ],
  'Financials': [
    'Invoices',
    'Receipts',
    'Expenses'
  ],
  'Research': [
    'Judgments',
    'Case Laws',
    'Notes'
  ],
  'Vakalatnama': [
    'Filed Vakalatnama',
    'Signed Vakalatnama',
    'Draft Vakalatnama'
  ],
  'Paperbook': [
    'Trial Court Paperbook',
    'Appellate Paperbook',
    'Supreme Court Paperbook',
    'Index & Synopsis',
    'List of Dates'
  ],
  'Certified Copies': [
    'Certified Copy of Order',
    'Certified Copy of Judgment',
    'Certified Copy of Pleadings',
    'Certified Copy of Evidence'
  ],
  'Miscellaneous': [
    'Other Documents'
  ]
};

// Get all primary document types
export const PRIMARY_DOCUMENT_TYPES = Object.keys(DOCUMENT_TYPE_HIERARCHY);

// Get sub-types for a given primary type
export const getSubTypes = (primaryType: string): string[] => {
  return DOCUMENT_TYPE_HIERARCHY[primaryType] || [];
};

// Generate folder-safe name (replace spaces with underscores, remove special chars)
export const sanitizeFolderName = (name: string): string => {
  return name
    .replace(/[^a-zA-Z0-9\s_-]/g, '')
    .replace(/\s+/g, '_')
    .trim();
};

// Generate the full storage path for a document
export const generateStoragePath = (params: {
  clientName: string;
  clientId: string;
  caseTitle: string;
  caseNumber?: string | null;
  primaryType: string;
  subType: string;
  fileName: string;
}): string => {
  const { clientName, clientId, caseTitle, caseNumber, primaryType, subType, fileName } = params;
  
  const clientFolder = `${sanitizeFolderName(clientName)}_${clientId.substring(0, 8)}`;
  const caseFolder = caseNumber 
    ? `${sanitizeFolderName(caseTitle)}_${sanitizeFolderName(caseNumber)}`
    : sanitizeFolderName(caseTitle);
  const primaryFolder = sanitizeFolderName(primaryType);
  const subFolder = sanitizeFolderName(subType);
  
  return `Clients/${clientFolder}/Cases/${caseFolder}/${primaryFolder}/${subFolder}/${fileName}`;
};

// Generate display path for preview (human-readable)
export const generateDisplayPath = (params: {
  clientName: string;
  caseTitle: string;
  caseNumber?: string | null;
  primaryType: string;
  subType: string;
}): string => {
  const { clientName, caseTitle, caseNumber, primaryType, subType } = params;
  
  const caseDisplay = caseNumber ? `${caseTitle} (${caseNumber})` : caseTitle;
  
  return `Clients / ${clientName} / Cases / ${caseDisplay} / ${primaryType} / ${subType}`;
};

// Icons for document types (for UI)
export const DOCUMENT_TYPE_ICONS: Record<string, string> = {
  'Pleadings': '📄',
  'Court Orders': '⚖️',
  'Evidence': '🔍',
  'Correspondence': '✉️',
  'Compliance': '✅',
  'Financials': '💰',
  'Research': '📚',
  'Vakalatnama': '📜',
  'Paperbook': '📕',
  'Certified Copies': '🏛️',
  'Miscellaneous': '📁'
};
