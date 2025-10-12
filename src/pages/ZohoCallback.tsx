import { useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export default function ZohoCallback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  useEffect(() => {
    const handleCallback = async () => {
      const code = searchParams.get("code");
      const error = searchParams.get("error");

      if (error) {
        toast.error("Zoho authorization failed");
        navigate("/invoices");
        return;
      }

      if (code) {
        try {
          // Send the authorization code to your backend to exchange for tokens
          const { data, error } = await supabase.functions.invoke("zoho-token", {
            body: { code },
          });

          if (error) throw error;

          toast.success("Zoho connected successfully");
          navigate("/invoices");
        } catch (err) {
          console.error("Error exchanging Zoho token:", err);
          toast.error("Failed to connect Zoho");
          navigate("/invoices");
        }
      }
    };

    handleCallback();
  }, [searchParams, navigate]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
        <p className="text-muted-foreground">Authorizing Zoho...</p>
      </div>
    </div>
  );
}
