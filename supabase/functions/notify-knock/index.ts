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
    const KNOCK_API_KEY = Deno.env.get("KNOCK_API_KEY");
    if (!KNOCK_API_KEY) throw new Error("KNOCK_API_KEY not configured");

    const body = await req.json();
    const { table, eventType, record } = body;

    console.log("Incoming DB event:", { table, eventType });

    const subscriberId = determineSubscriberId(table, record);
    if (!subscriberId) {
      console.warn("No subscriber ID found, skipping notification");
      return jsonResponse({ status: "skipped", reason: "No subscriber ID" });
    }

    const { subject, body: messageBody, data } = constructMessageAndPayload(table, eventType, record);

    // Choose workflow dynamically (or keep one universal workflow)
    const workflowKey = "new-appointment-notification"; // ✅ your Knock workflow slug

    console.log("Sending notification:", { subscriberId, subject });

    const response = await fetch(`https://api.knock.app/v1/workflows/${workflowKey}/trigger`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${KNOCK_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        recipients: [subscriberId],
        data: {
          subject,
          body: messageBody,
          ...data,
        },
      }),
    });

    const result = await response.json();
    console.log("Knock response:", result);

    return jsonResponse({ status: "ok", result });
  } catch (err) {
    console.error("Error in notify-knock:", err);
    return jsonResponse({ error: err.message }, 500);
  }
});

function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

// 🧠 Builds dynamic subject, body & data payload
function constructMessageAndPayload(table, eventType, record) {
  let subject = "";
  let body = "";
  let data = {};

  switch (table) {
    case "appointments": {
      const clientName = record.client_name || "a client";
      const caseTitle = record.case_title || "a case";
      const date = record.appointment_date ? new Date(record.appointment_date).toLocaleDateString() : "upcoming";
      const time = record.appointment_time || "unspecified time";

      subject = `New appointment with ${clientName}`;
      body = `📅 You have a new appointment for **${caseTitle}** on **${date}** at **${time}**.`;
      data = { clientName, caseTitle, date, time };
      break;
    }

    case "cases": {
      subject = `Case ${eventType === "INSERT" ? "created" : "updated"}: ${record.case_title || "Untitled Case"}`;
      body = `Case **${record.case_title || "Untitled"}** (${record.case_number || "no number"}) was ${eventType.toLowerCase()}.`;
      data = { caseTitle: record.case_title, caseNumber: record.case_number, eventType };
      break;
    }

    case "tasks": {
      subject = `Task ${eventType === "INSERT" ? "assigned" : "updated"}: ${record.title}`;
      body = `Task **${record.title || "Untitled"}** is now **${record.status || "pending"}**.`;
      data = { title: record.title, status: record.status, dueDate: record.due_date };
      break;
    }

    case "hearings": {
      const hearingDate = record.hearing_date ? new Date(record.hearing_date).toLocaleDateString() : "upcoming";
      subject = `Hearing scheduled for ${hearingDate}`;
      body = `A new hearing for **${record.case_title || "a case"}** is scheduled on **${hearingDate}**.`;
      data = { hearingDate, caseTitle: record.case_title };
      break;
    }

    case "documents": {
      subject = `New document uploaded: ${record.file_name || "Unnamed file"}`;
      body = `📄 Document **${record.file_name || "Untitled"}** has been uploaded.`;
      data = { fileName: record.file_name, uploadedBy: record.uploaded_by };
      break;
    }

    case "clients": {
      subject = `New client added: ${record.full_name || "Unnamed Client"}`;
      body = `👤 Client **${record.full_name || "Unnamed"}** was added to the system.`;
      data = { clientName: record.full_name, contact: record.email || record.phone };
      break;
    }

    default: {
      subject = `Update in ${table}`;
      body = `A record in **${table}** was ${eventType.toLowerCase()}.`;
      data = { table, eventType };
    }
  }

  return { subject, body, data };
}

// 🔍 Finds the correct Knock user recipient
function determineSubscriberId(table, record) {
  return (
    record.user_id ||
    record.assigned_to ||
    record.created_by ||
    record.lawyer_id ||
    (Array.isArray(record.assigned_users) && record.assigned_users[0]) ||
    null
  );
}
