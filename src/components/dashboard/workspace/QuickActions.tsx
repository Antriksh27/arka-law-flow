import { Plus, Calendar, UserPlus, Upload } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { AddCaseDialog } from '@/components/cases/AddCaseDialog';
import { AddClientDialog } from '@/components/clients/AddClientDialog';
import { CreateAppointmentDialog } from '@/components/appointments/CreateAppointmentDialog';
import { useDialog } from '@/hooks/use-dialog';
import { bg, border } from '@/lib/colors';

export const QuickActions = () => {
  const navigate = useNavigate();
  const { openDialog } = useDialog();
  const [showCaseDialog, setShowCaseDialog] = useState(false);
  const [showClientDialog, setShowClientDialog] = useState(false);

  const actions = [
    {
      icon: Plus,
      label: 'Add Case',
      onClick: () => setShowCaseDialog(true),
    },
    {
      icon: Calendar,
      label: 'Schedule',
      onClick: () => openDialog(<CreateAppointmentDialog />),
    },
    {
      icon: UserPlus,
      label: 'Add Client',
      onClick: () => setShowClientDialog(true),
    },
    {
      icon: Upload,
      label: 'Upload',
      onClick: () => navigate('/documents'),
    },
  ];

  return (
    <>
      <Card className="p-4 md:p-6 mb-4 md:mb-6">
        <h2 className="text-lg md:text-xl font-semibold mb-4">Quick Actions</h2>
        
        <div className="grid grid-cols-2 gap-2 md:gap-3">
          {actions.map((action, index) => (
            <button
              key={index}
              onClick={action.onClick}
              className={`flex flex-col items-center justify-center p-3 md:p-4 rounded-lg border ${border.default} hover:border-primary ${bg.hover} transition-all group`}
            >
              <div className={`w-10 h-10 md:w-12 md:h-12 rounded-lg ${bg.muted} group-hover:bg-primary/10 flex items-center justify-center mb-2 transition-colors`}>
                <action.icon className="w-5 h-5 md:w-6 md:h-6 text-muted-foreground group-hover:text-primary transition-colors" />
              </div>
              <span className="text-xs font-medium">{action.label}</span>
            </button>
          ))}
        </div>
      </Card>

      {showCaseDialog && (
        <AddCaseDialog 
          open={showCaseDialog} 
          onClose={() => setShowCaseDialog(false)} 
        />
      )}
      {showClientDialog && (
        <AddClientDialog 
          open={showClientDialog} 
          onOpenChange={setShowClientDialog}
          onSuccess={() => setShowClientDialog(false)} 
        />
      )}
    </>
  );
};
