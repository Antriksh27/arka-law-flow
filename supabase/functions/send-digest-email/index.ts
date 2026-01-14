import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const APP_BASE_URL = "https://hru-legal.lovable.app";

interface DigestNotification {
  id: string;
  title: string;
  message: string;
  category: string;
  priority: string;
  action_url: string;
  created_at: string;
}

interface DigestEmailRequest {
  email: string;
  userName: string;
  notifications: DigestNotification[];
  frequency: "hourly" | "daily" | "weekly";
}

// Category icons for email
const categoryIcons: Record<string, string> = {
  case: "⚖️",
  hearing: "📅",
  appointment: "📆",
  task: "📋",
  document: "📎",
  client: "👤",
  note: "🗒️",
  team: "👥",
  system: "🔔",
};

// Priority colors
const priorityColors: Record<string, string> = {
  urgent: "#dc2626",
  high: "#ea580c",
  normal: "#3b82f6",
  low: "#6b7280",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
    
    if (!RESEND_API_KEY) {
      console.warn("[send-digest-email] RESEND_API_KEY not configured, skipping email");
      return new Response(
        JSON.stringify({ success: true, skipped: true, reason: "no_resend_key" }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const resend = new Resend(RESEND_API_KEY);
    const { email, userName, notifications, frequency }: DigestEmailRequest = await req.json();

    if (!email || !notifications || notifications.length === 0) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    console.log(`[send-digest-email] Sending ${frequency} digest to ${email} with ${notifications.length} notifications`);

    // Group notifications by category
    const groupedNotifications = notifications.reduce((acc, notif) => {
      const cat = notif.category || "system";
      if (!acc[cat]) acc[cat] = [];
      acc[cat].push(notif);
      return acc;
    }, {} as Record<string, DigestNotification[]>);

    // Build email HTML
    const frequencyLabel = frequency === "hourly" ? "Hourly" : frequency === "daily" ? "Daily" : "Weekly";
    const dateRange = getDateRangeLabel(frequency);

    const notificationRows = Object.entries(groupedNotifications)
      .map(([category, notifs]) => {
        const icon = categoryIcons[category] || "🔔";
        const categoryLabel = category.charAt(0).toUpperCase() + category.slice(1);

        const items = notifs
          .map((n) => {
            const priorityColor = priorityColors[n.priority] || priorityColors.normal;
            const actionButton = n.action_url
              ? `<a href="${n.action_url}" style="color: #3b82f6; text-decoration: none; font-size: 12px;">View →</a>`
              : "";

            return `
              <tr>
                <td style="padding: 12px 0; border-bottom: 1px solid #e5e7eb;">
                  <div style="display: flex; align-items: flex-start; gap: 8px;">
                    <span style="color: ${priorityColor}; font-size: 8px;">●</span>
                    <div style="flex: 1;">
                      <strong style="color: #111827; font-size: 14px;">${escapeHtml(n.title)}</strong>
                      <p style="color: #6b7280; font-size: 13px; margin: 4px 0 0 0;">${escapeHtml(n.message)}</p>
                      <div style="margin-top: 8px;">${actionButton}</div>
                    </div>
                  </div>
                </td>
              </tr>
            `;
          })
          .join("");

        return `
          <tr>
            <td style="padding: 16px 0 8px 0;">
              <span style="font-size: 16px;">${icon}</span>
              <strong style="color: #1e3a8a; font-size: 14px; margin-left: 8px;">${categoryLabel}</strong>
              <span style="color: #9ca3af; font-size: 12px; margin-left: 8px;">(${notifs.length})</span>
            </td>
          </tr>
          ${items}
        `;
      })
      .join("");

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f9fafb;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f9fafb; padding: 20px;">
          <tr>
            <td align="center">
              <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 12px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
                <!-- Header -->
                <tr>
                  <td style="background-color: #1e3a8a; padding: 24px; border-radius: 12px 12px 0 0;">
                    <h1 style="color: #ffffff; font-size: 24px; margin: 0;">HRU Legal</h1>
                    <p style="color: #e0e7ff; font-size: 14px; margin: 8px 0 0 0;">${frequencyLabel} Notification Digest</p>
                  </td>
                </tr>
                
                <!-- Greeting -->
                <tr>
                  <td style="padding: 24px;">
                    <p style="color: #374151; font-size: 16px; margin: 0 0 8px 0;">Hello ${escapeHtml(userName)},</p>
                    <p style="color: #6b7280; font-size: 14px; margin: 0;">
                      Here's your notification summary for ${dateRange}. You have <strong>${notifications.length}</strong> updates.
                    </p>
                  </td>
                </tr>

                <!-- Notifications -->
                <tr>
                  <td style="padding: 0 24px 24px 24px;">
                    <table width="100%" cellpadding="0" cellspacing="0">
                      ${notificationRows}
                    </table>
                  </td>
                </tr>

                <!-- CTA -->
                <tr>
                  <td style="padding: 0 24px 24px 24px;" align="center">
                    <a href="${APP_BASE_URL}/notifications" style="display: inline-block; background-color: #1e3a8a; color: #ffffff; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 500;">
                      View All Notifications
                    </a>
                  </td>
                </tr>

                <!-- Footer -->
                <tr>
                  <td style="padding: 24px; background-color: #f9fafb; border-radius: 0 0 12px 12px; border-top: 1px solid #e5e7eb;">
                    <p style="color: #9ca3af; font-size: 12px; margin: 0; text-align: center;">
                      You're receiving this because you have ${frequency} digests enabled. 
                      <a href="${APP_BASE_URL}/notifications?tab=settings" style="color: #3b82f6;">Manage preferences</a>
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `;

    const emailResponse = await resend.emails.send({
      from: "HRU Legal <notifications@resend.dev>",
      to: [email],
      subject: `${frequencyLabel} Digest: ${notifications.length} notifications`,
      html,
    });

    console.log("[send-digest-email] Email sent successfully:", emailResponse);

    return new Response(
      JSON.stringify({ success: true, emailId: emailResponse.id }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error) {
    console.error("[send-digest-email] Error:", error);
    return new Response(
      JSON.stringify({ error: (error as Error).message, success: false }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
});

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function getDateRangeLabel(frequency: string): string {
  const now = new Date();
  
  if (frequency === "hourly") {
    return "the past hour";
  } else if (frequency === "daily") {
    return now.toLocaleDateString("en-IN", { weekday: "long", month: "short", day: "numeric" });
  } else {
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    return `${weekAgo.toLocaleDateString("en-IN", { month: "short", day: "numeric" })} - ${now.toLocaleDateString("en-IN", { month: "short", day: "numeric" })}`;
  }
}
