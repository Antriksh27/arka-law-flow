import React from 'react';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface CaseMobileFABProps {
  onClick: () => void;
}

export const CaseMobileFAB: React.FC<CaseMobileFABProps> = ({ onClick }) => {
  return (
    <Button
      onClick={onClick}
      className="fixed bottom-20 right-4 z-40 h-14 w-14 rounded-full bg-slate-800 hover:bg-slate-700 shadow-lg sm:hidden p-0 flex items-center justify-center"
      aria-label="Add new case"
    >
      <Plus className="w-6 h-6 text-white" />
    </Button>
  );
};
