import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const novuApiKey = Deno.env.get("NOVU_API_KEY");
    if (!novuApiKey) {
      throw new Error("NOVU_API_KEY not configured");
    }

    const body = await req.json();
    console.log("📩 Incoming request:", JSON.stringify(body).substring(0, 200));

    // Handle subscriber hash generation for authenticated Inbox
    if (body.action === 'get_subscriber_hash') {
      const subscriberId = body.subscriberId;
      if (!subscriberId) {
        return new Response(JSON.stringify({ status: "error", message: "subscriberId required" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const hmacSecret = Deno.env.get("NOVU_HMAC_SECRET") || novuApiKey;
      const encoder = new TextEncoder();
      const key = await crypto.subtle.importKey(
        "raw",
        encoder.encode(hmacSecret),
        { name: "HMAC", hash: "SHA-256" },
        false,
        ["sign"]
      );
      const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(subscriberId));
      const subscriberHash = Array.from(new Uint8Array(signature))
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');

      console.log("✅ Generated subscriber hash for:", subscriberId);
      return new Response(JSON.stringify({ status: "ok", subscriberHash }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Handle test notification trigger
    if (body.action === 'trigger_test') {
      const subscriberId = body.subscriberId;
      if (!subscriberId) {
        return new Response(JSON.stringify({ status: "error", message: "subscriberId required" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      console.log("🧪 Sending test notification to:", subscriberId);
      const response = await fetch("https://api.novu.co/v1/events/trigger", {
        method: "POST",
        headers: {
          Authorization: `ApiKey ${novuApiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: "in-app",
          to: { subscriberId },
          payload: {
            subject: "Test Notification",
            body: "This is a test notification from HRU Legal CMS",
            data: {
              timestamp: new Date().toISOString(),
              test: true,
            },
          },
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        console.log("❌ Test notification failed:", data);
        return new Response(JSON.stringify({ status: "error", data }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      console.log("✅ Test notification sent:", data);
      return new Response(JSON.stringify({ status: "ok", data }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Handle subscriber registration
    if (body.action === 'register_subscriber') {
      console.log("Registering subscriber:", body.subscriberId);
      
      const response = await fetch("https://api.novu.co/v1/subscribers", {
        method: "POST",
        headers: {
          Authorization: `ApiKey ${novuApiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          subscriberId: body.subscriberId,
          email: body.email,
          firstName: body.firstName,
          lastName: body.lastName,
          channels: [
            {
              providerId: "in_app",
              credentials: {},
            }
          ],
        }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        console.log("❌ Subscriber registration failed:", data);
        return new Response(JSON.stringify({ status: "error", data }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      
      console.log("✅ Subscriber registered:", data);
      return new Response(JSON.stringify({ status: "ok", data }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Handle notification triggers from DB
    const { table, eventType, record } = body;
    
    if (!table || !eventType || !record) {
      console.warn("⚠️ Invalid payload structure:", { table, eventType, record: !!record });
      return new Response(JSON.stringify({ status: "skipped", reason: "Invalid payload" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const message = constructMessage(table, eventType, record);
    const subscriberId = determineSubscriberId(table, record);

    if (!subscriberId) {
      console.warn("⚠️ No subscriber ID found — skipping notification");
      return new Response(JSON.stringify({ status: "skipped", reason: "No subscriber ID" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log("🚀 Sending notification to Novu:", { subscriberId, message });

    const response = await fetch("https://api.novu.co/v1/events/trigger", {
      method: "POST",
      headers: {
        Authorization: `ApiKey ${novuApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: "in-app", // 👈 must match your Novu workflow name
        to: { subscriberId },
        payload: {
          subject: message,
          body: message,
          data: {
            table,
            eventType,
            recordId: record.id,
            timestamp: new Date().toISOString(),
          },
        },
      }),
    });

    const data = await response.json();
    
    if (!response.ok) {
      console.log("❌ Novu event trigger failed:", data);
      return new Response(JSON.stringify({ status: "error", data }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    
    console.log("✅ Novu API response:", data);
    return new Response(JSON.stringify({ status: "ok", data }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("❌ Error in notify-novu function:", err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

function constructMessage(table, eventType, record) {
  switch (table) {
    case "cases":
      return eventType === "INSERT"
        ? `New case "${record.case_title || "Untitled"}" has been created.`
        : `Case "${record.case_title || "Untitled"}" was updated.`;

    case "tasks":
      if (eventType === "INSERT") return `New task "${record.title || "Untitled"}" assigned to you.`;
      if (eventType === "UPDATE" && record.status === "completed")
        return `Task "${record.title || "Untitled"}" has been completed.`;
      return `Task "${record.title || "Untitled"}" updated.`;

    case "appointments":
      if (eventType === "INSERT") {
        const date = record.appointment_date || record.start_time;
        return `New appointment scheduled for ${date ? new Date(date).toLocaleDateString() : "upcoming"}.`;
      }
      return "Appointment details updated.";

    case "hearings":
      if (eventType === "INSERT") {
        const hearingDate = record.hearing_date ? new Date(record.hearing_date).toLocaleDateString() : "upcoming";
        return `New hearing scheduled for ${hearingDate}.`;
      }
      return "Hearing updated.";

    case "documents":
      return `New document "${record.file_name || "document"}" uploaded.`;

    case "clients":
      return `New client "${record.full_name || "client"}" added.`;

    default:
      return `Update in ${table}: ${eventType}`;
  }
}

function determineSubscriberId(table, record) {
  return (
    record.user_id ||
    record.assigned_to ||
    record.created_by ||
    record.lawyer_id ||
    (Array.isArray(record.assigned_users) ? record.assigned_users[0] : null)
  );
}
