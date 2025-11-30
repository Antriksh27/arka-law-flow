import React from 'react';
import { useClientAuth } from '@/contexts/ClientAuthContext';
import { Button } from '@/components/ui/button';
import { LogOut, Scale } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface ClientLayoutProps {
  children: React.ReactNode;
}

export const ClientLayout: React.FC<ClientLayoutProps> = ({ children }) => {
  const { client, signOut } = useClientAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate('/client-login');
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card sticky top-0 z-50 shadow-sm">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <Scale className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h1 className="text-lg font-semibold">Client Portal</h1>
              {client && (
                <p className="text-sm text-muted-foreground">
                  Welcome, {client.full_name}
                </p>
              )}
            </div>
          </div>
          
          <Button
            variant="outline"
            size="sm"
            onClick={handleSignOut}
            className="gap-2"
          >
            <LogOut className="w-4 h-4" />
            Logout
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6">
        {children}
      </main>
    </div>
  );
};