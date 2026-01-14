import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface DigestBatch {
  userId: string;
  userEmail: string;
  userName: string;
  batchId: string;
  notifications: Array<{
    id: string;
    title: string;
    message: string;
    category: string;
    priority: string;
    action_url: string;
    created_at: string;
  }>;
}

/**
 * Process Notification Digest
 * 
 * This function processes pending digest notifications and sends them as
 * batched email summaries using the send-digest-email edge function.
 * 
 * Should be called via cron job based on user digest preferences:
 * - Hourly: Every hour
 * - Daily: Once per day (e.g., 8 AM)
 * - Weekly: Once per week (e.g., Monday 8 AM)
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

    // Get digest frequency from query params or default to 'daily'
    const url = new URL(req.url);
    const frequency = url.searchParams.get("frequency") || "daily";

    console.log(`[process-notification-digest] Processing ${frequency} digests...`);

    // Find all pending notifications with digest_batch_id
    const { data: pendingNotifications, error: fetchError } = await supabase
      .from("notifications")
      .select(`
        id,
        recipient_id,
        title,
        message,
        category,
        priority,
        action_url,
        digest_batch_id,
        created_at
      `)
      .eq("delivery_status", "pending")
      .not("digest_batch_id", "is", null)
      .order("created_at", { ascending: true })
      .limit(500);

    if (fetchError) {
      console.error("[process-notification-digest] Error fetching notifications:", fetchError);
      throw fetchError;
    }

    if (!pendingNotifications || pendingNotifications.length === 0) {
      console.log("[process-notification-digest] No pending digest notifications");
      return new Response(
        JSON.stringify({ success: true, batches: 0, notifications: 0 }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    console.log(`[process-notification-digest] Found ${pendingNotifications.length} pending notifications`);

    // Group notifications by user
    const userBatches = new Map<string, DigestBatch>();

    for (const notification of pendingNotifications) {
      const userId = notification.recipient_id;
      
      if (!userBatches.has(userId)) {
        // Fetch user profile for email
        const { data: profile } = await supabase
          .from("profiles")
          .select("email, full_name")
          .eq("id", userId)
          .single();

        if (!profile?.email) {
          console.warn(`[process-notification-digest] No email found for user ${userId}`);
          continue;
        }

        // Check user's digest preferences
        const { data: prefs } = await supabase
          .from("notification_preferences")
          .select("digest_frequency, delivery_preferences")
          .eq("user_id", userId)
          .single();

        // Skip if user's digest frequency doesn't match or email is disabled
        const userFrequency = prefs?.digest_frequency || "daily";
        const emailEnabled = prefs?.delivery_preferences?.email !== false;

        if (userFrequency !== frequency || !emailEnabled) {
          console.log(`[process-notification-digest] Skipping user ${userId} - frequency: ${userFrequency}, email: ${emailEnabled}`);
          continue;
        }

        userBatches.set(userId, {
          userId,
          userEmail: profile.email,
          userName: profile.full_name || "User",
          batchId: notification.digest_batch_id,
          notifications: [],
        });
      }

      const batch = userBatches.get(userId);
      if (batch) {
        batch.notifications.push({
          id: notification.id,
          title: notification.title,
          message: notification.message,
          category: notification.category || "general",
          priority: notification.priority || "normal",
          action_url: notification.action_url || "",
          created_at: notification.created_at,
        });
      }
    }

    console.log(`[process-notification-digest] Processing ${userBatches.size} user batches`);

    let sentBatches = 0;
    let sentNotifications = 0;
    let errors = 0;

    // Process each user's batch
    for (const [userId, batch] of userBatches) {
      if (batch.notifications.length === 0) continue;

      try {
        // Call send-digest-email function
        const { error: sendError } = await supabase.functions.invoke("send-digest-email", {
          body: {
            email: batch.userEmail,
            userName: batch.userName,
            notifications: batch.notifications,
            frequency,
          },
        });

        if (sendError) {
          console.error(`[process-notification-digest] Error sending digest to ${batch.userEmail}:`, sendError);
          errors++;
          continue;
        }

        // Mark notifications as delivered
        const notificationIds = batch.notifications.map((n) => n.id);
        const { error: updateError } = await supabase
          .from("notifications")
          .update({
            delivery_status: "delivered",
            delivered_at: new Date().toISOString(),
          })
          .in("id", notificationIds);

        if (updateError) {
          console.error(`[process-notification-digest] Error updating notifications:`, updateError);
        }

        sentBatches++;
        sentNotifications += batch.notifications.length;
        console.log(`[process-notification-digest] Sent digest to ${batch.userEmail} with ${batch.notifications.length} notifications`);
      } catch (err) {
        console.error(`[process-notification-digest] Error processing batch for user ${userId}:`, err);
        errors++;
      }
    }

    console.log(`[process-notification-digest] Complete: ${sentBatches} batches, ${sentNotifications} notifications, ${errors} errors`);

    return new Response(
      JSON.stringify({
        success: true,
        batches: sentBatches,
        notifications: sentNotifications,
        errors,
      }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error) {
    console.error("[process-notification-digest] Error:", error);
    return new Response(
      JSON.stringify({ error: (error as Error).message, success: false }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
});
