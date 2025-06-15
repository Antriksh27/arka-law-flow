
import React from "react";
import { useFirms } from "./useFirms";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";

interface SetupFirmProps {
  user: User;
}

export function SetupFirm({ user }: SetupFirmProps) {
  const { data: firms, isLoading } = useFirms();

  const handleJoinFirm = async (firmId: string) => {
    if (!user) return;

    toast.info("Attempting to join firm...");

    const { error } = await supabase.from("team_members").insert({
      user_id: user.id,
      firm_id: firmId,
      role: "admin",
      status: "active",
      full_name: user.user_metadata?.full_name || user.email,
      email: user.email,
    });

    if (error) {
      console.error("Error joining firm:", error);
      toast.error(`Failed to join firm: ${error.message}`);
    } else {
      toast.success("Successfully joined firm! Reloading page to apply changes...");
      setTimeout(() => window.location.reload(), 1500);
    }
  };
  
  const handleCreateFirm = async () => {
    toast.info("This feature is not yet available from this screen. Please contact support to create a new firm.");
  }

  return (
    <div className="container max-w-2xl flex h-full w-full flex-col items-center justify-center gap-6 py-12 bg-slate-50">
      <Card className="w-full shadow-lg">
        <CardHeader>
          <CardTitle className="text-2xl">Join a Firm</CardTitle>
          <p className="text-muted-foreground pt-2">
            Your account isn't associated with a law firm yet. To access the team directory, please join an existing firm from the list below.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          {isLoading ? (
            <div className="space-y-4">
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
            </div>
          ) : firms && firms.length > 0 ? (
            firms.map((firm) => (
              <div key={firm.id} className="flex items-center justify-between p-4 border rounded-lg bg-background">
                <div>
                  <h3 className="font-semibold text-primary">{firm.name}</h3>
                  <p className="text-sm text-muted-foreground">{firm.address || 'No address provided'}</p>
                </div>
                <Button onClick={() => handleJoinFirm(firm.id)}>Join this Firm</Button>
              </div>
            ))
          ) : (
            <div className="text-center py-8 px-4 border-dashed border-2 rounded-lg">
                <p className="text-muted-foreground">No firms found. You might need to create one.</p>
            </div>
          )}
        </CardContent>
        <CardFooter className="border-t pt-6">
            <Button variant="outline" onClick={handleCreateFirm} disabled>Create a New Firm</Button>
            <p className="text-xs text-muted-foreground ml-4">Creating new firms from here is coming soon.</p>
        </CardFooter>
      </Card>
    </div>
  );
}
