import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

/**
 * Send Test Notification
 * 
 * Creates a test notification to verify the notification system is working.
 * This bypasses normal triggers and directly inserts a notification.
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

    const { userId, testType = "basic" } = await req.json();

    if (!userId) {
      return new Response(
        JSON.stringify({ error: "userId is required" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    console.log(`[send-test-notification] Sending ${testType} test notification to user ${userId}`);

    // Get user profile for personalization
    const { data: profile } = await supabase
      .from("profiles")
      .select("full_name, email")
      .eq("id", userId)
      .single();

    const userName = profile?.full_name || "User";
    const timestamp = new Date().toLocaleTimeString("en-IN", { 
      hour: "2-digit", 
      minute: "2-digit",
      hour12: true 
    });

    let notification;

    switch (testType) {
      case "urgent":
        notification = {
          recipient_id: userId,
          notification_type: "test_urgent",
          title: "🚨 Urgent Test Notification",
          message: `This is an urgent priority test notification sent at ${timestamp}. If you see this, urgent notifications are working!`,
          category: "system",
          priority: "urgent",
          delivery_status: "delivered",
          delivery_channel: ["in_app"],
          read: false,
          metadata: { test: true, testType: "urgent" },
        };
        break;

      case "quiet_hours":
        // Test quiet hours by creating a pending notification
        notification = {
          recipient_id: userId,
          notification_type: "test_quiet_hours",
          title: "🌙 Quiet Hours Test",
          message: `This notification was queued during quiet hours testing at ${timestamp}.`,
          category: "system",
          priority: "normal",
          delivery_status: "pending",
          delivery_channel: ["in_app"],
          read: false,
          snoozed_until: new Date(Date.now() + 60000).toISOString(), // 1 minute from now
          metadata: { test: true, testType: "quiet_hours" },
        };
        break;

      case "digest":
        // Test digest by creating a digest batch notification
        notification = {
          recipient_id: userId,
          notification_type: "test_digest",
          title: "📧 Digest Test Notification",
          message: `This notification is part of a test digest batch created at ${timestamp}.`,
          category: "system",
          priority: "normal",
          delivery_status: "pending",
          delivery_channel: ["email"],
          read: false,
          digest_batch_id: `test_digest_${userId}_${new Date().toISOString().split("T")[0]}`,
          metadata: { test: true, testType: "digest" },
        };
        break;

      case "all_categories":
        // Create multiple notifications for different categories
        const categories = ["case", "hearing", "task", "appointment", "document"];
        const notifications = categories.map((cat, index) => ({
          recipient_id: userId,
          notification_type: `test_${cat}`,
          title: `${getCategoryIcon(cat)} Test ${cat.charAt(0).toUpperCase() + cat.slice(1)} Notification`,
          message: `This is a test notification for the ${cat} category.`,
          category: cat,
          priority: index === 0 ? "high" : "normal",
          delivery_status: "delivered",
          delivery_channel: ["in_app"],
          read: false,
          metadata: { test: true, testType: "all_categories", category: cat },
        }));

        const { error: bulkError } = await supabase
          .from("notifications")
          .insert(notifications);

        if (bulkError) throw bulkError;

        return new Response(
          JSON.stringify({
            success: true,
            message: `Sent ${categories.length} test notifications across all categories`,
            count: categories.length,
          }),
          { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );

      default:
        notification = {
          recipient_id: userId,
          notification_type: "test_notification",
          title: "🔔 Test Notification",
          message: `Hello ${userName}! This is a test notification sent at ${timestamp}. Your notification system is working correctly.`,
          category: "system",
          priority: "normal",
          action_url: "/notifications",
          delivery_status: "delivered",
          delivery_channel: ["in_app"],
          read: false,
          metadata: { test: true, testType: "basic" },
        };
    }

    const { error: insertError } = await supabase
      .from("notifications")
      .insert(notification);

    if (insertError) {
      console.error("[send-test-notification] Error inserting notification:", insertError);
      throw insertError;
    }

    console.log(`[send-test-notification] Successfully sent ${testType} test notification`);

    return new Response(
      JSON.stringify({
        success: true,
        message: `Test notification sent successfully`,
        testType,
        notification: {
          title: notification.title,
          priority: notification.priority,
          delivery_status: notification.delivery_status,
        },
      }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error) {
    console.error("[send-test-notification] Error:", error);
    return new Response(
      JSON.stringify({ error: (error as Error).message, success: false }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
});

function getCategoryIcon(category: string): string {
  const icons: Record<string, string> = {
    case: "⚖️",
    hearing: "📅",
    task: "📋",
    appointment: "📆",
    document: "📎",
    client: "👤",
    note: "🗒️",
    team: "👥",
    system: "🔔",
  };
  return icons[category] || "🔔";
}
