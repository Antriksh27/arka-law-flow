import { useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

export default function ZohoCallback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  useEffect(() => {
    const handleCallback = async () => {
      const code = searchParams.get("code");
      const error = searchParams.get("error");

      if (error) {
        console.error("Zoho authorization failed:", error);
        navigate("/invoices?zoho=error&message=" + encodeURIComponent("Authorization failed"));
        return;
      }

      if (code) {
        try {
          console.log("Exchanging Zoho authorization code...");
          
          const { data, error } = await supabase.functions.invoke("zoho-token", {
            body: { code },
          });

          if (error) {
            console.error("Edge function error:", error);
            throw error;
          }

          if (data?.error) {
            console.error("Zoho API error:", data.error);
            throw new Error(data.error);
          }

          console.log("Zoho connected successfully");
          // Redirect back to invoices with success parameter
          navigate("/invoices?zoho=success");
        } catch (err: any) {
          console.error("Error exchanging Zoho token:", err);
          const errorMessage = err.message || "Failed to connect Zoho";
          navigate("/invoices?zoho=error&message=" + encodeURIComponent(errorMessage));
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
