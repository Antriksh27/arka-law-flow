
import React from 'react';
import { DocumentCard } from './DocumentCard';

interface DocumentGridProps {
  documents: any[];
  onRefresh: () => void;
}

export const DocumentGrid: React.FC<DocumentGridProps> = ({ documents, onRefresh }) => {
  return (
    <div className="p-6">
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
        {documents.map((document) => (
          <DocumentCard
            key={document.id}
            document={document}
            onRefresh={onRefresh}
          />
        ))}
      </div>
    </div>
  );
};
