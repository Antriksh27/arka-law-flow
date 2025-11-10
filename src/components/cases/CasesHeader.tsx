import React from 'react';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
interface CasesHeaderProps {
  onAddCase: () => void;
}
export const CasesHeader: React.FC<CasesHeaderProps> = ({
  onAddCase
}) => {
  const {
    role
  } = useAuth();
  const isAdmin = role === 'admin';
  return <div className="flex items-center justify-between">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Cases</h1>
        
      </div>

      <div className="flex items-center gap-3">
        {isAdmin && (
          <Button onClick={onAddCase} className="bg-slate-800 hover:bg-slate-700">
            <Plus className="w-4 h-4 mr-2" />
            New Case
          </Button>
        )}
      </div>
    </div>;
};