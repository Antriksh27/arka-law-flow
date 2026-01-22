import React from 'react';

interface HighlightedTextProps {
  text: string;
  query: string;
}

export const HighlightedText: React.FC<HighlightedTextProps> = ({ text, query }) => {
  if (!query.trim()) return <span>{text}</span>;
  
  try {
    const escapedQuery = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const parts = text.split(new RegExp(`(${escapedQuery})`, 'gi'));
    
    return (
      <span>
        {parts.map((part, i) => 
          part.toLowerCase() === query.toLowerCase() 
            ? <mark key={i} className="bg-yellow-200 text-yellow-900 rounded px-0.5">{part}</mark>
            : part
        )}
      </span>
    );
  } catch {
    return <span>{text}</span>;
  }
};
