import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

/**
 * Process Queued Notifications
 * 
 * This function processes notifications that were queued during quiet hours
 * and marks them as delivered when the quiet hours period has ended.
 * 
 * Should be called via cron job every 5-15 minutes.
 */
serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    console.log("[process-queued-notifications] Starting processing...");

    // Find all pending notifications where snoozed_until has passed
    const now = new Date().toISOString();
    
    const { data: queuedNotifications, error: fetchError } = await supabase
      .from("notifications")
      .select("*")
      .eq("delivery_status", "pending")
      .not("snoozed_until", "is", null)
      .lte("snoozed_until", now)
      .limit(100);

    if (fetchError) {
      console.error("[process-queued-notifications] Error fetching queued notifications:", fetchError);
      throw fetchError;
    }

    if (!queuedNotifications || queuedNotifications.length === 0) {
      console.log("[process-queued-notifications] No queued notifications to process");
      return new Response(
        JSON.stringify({ success: true, processed: 0 }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    console.log(`[process-queued-notifications] Found ${queuedNotifications.length} notifications to deliver`);

    let deliveredCount = 0;
    let errorCount = 0;

    // Update each notification to delivered status
    for (const notification of queuedNotifications) {
      const { error: updateError } = await supabase
        .from("notifications")
        .update({
          delivery_status: "delivered",
          snoozed_until: null,
          delivered_at: new Date().toISOString(),
        })
        .eq("id", notification.id);

      if (updateError) {
        console.error(`[process-queued-notifications] Error delivering notification ${notification.id}:`, updateError);
        errorCount++;
      } else {
        deliveredCount++;
        console.log(`[process-queued-notifications] Delivered notification ${notification.id} to user ${notification.recipient_id}`);
      }
    }

    console.log(`[process-queued-notifications] Processing complete: ${deliveredCount} delivered, ${errorCount} errors`);

    return new Response(
      JSON.stringify({
        success: true,
        processed: queuedNotifications.length,
        delivered: deliveredCount,
        errors: errorCount,
      }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error) {
    console.error("[process-queued-notifications] Error:", error);
    return new Response(
      JSON.stringify({ error: (error as Error).message, success: false }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
});
