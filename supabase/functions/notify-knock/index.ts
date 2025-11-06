import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const KNOCK_API_KEY = Deno.env.get("KNOCK_API_KEY");
    if (!KNOCK_API_KEY) throw new Error("KNOCK_API_KEY not configured");

    const supabase = createClient(supabaseUrl, supabaseKey);
    const body = await req.json();
    const { table, eventType, record, oldRecord } = body;

    console.log("Incoming DB event:", { table, eventType, recordId: record?.id });

    const recipients = await determineRecipients(table, record, supabase);
    if (!recipients || recipients.length === 0) {
      console.warn("No recipients found, skipping notification");
      return jsonResponse({ status: "skipped", reason: "No recipients" });
    }

    const { subject, body: messageBody, data } = await constructMessageAndPayload(
      table, 
      eventType, 
      record, 
      oldRecord,
      supabase
    );

    const workflowKey = "new-appointment-notification";

    console.log("Sending notification:", { recipients, subject });

    const response = await fetch(`https://api.knock.app/v1/workflows/${workflowKey}/trigger`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${KNOCK_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        recipients: recipients,
        data: {
          subject,
          body: messageBody,
          ...data,
        },
      }),
    });

    const result = await response.json();
    console.log("Knock response:", result);

    return jsonResponse({ status: "ok", result, recipientCount: recipients.length });
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

// 📅 Helper: Format date
function formatDate(dateString: string | null): string {
  if (!dateString) return "Not specified";
  const date = new Date(dateString);
  return date.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

// 👤 Helper: Get user name
async function getUserName(userId: string | null, supabase: any): Promise<string> {
  if (!userId) return "Someone";
  const { data } = await supabase
    .from("profiles")
    .select("full_name")
    .eq("id", userId)
    .single();
  return data?.full_name || "A team member";
}

// 🔗 Helper: Get related entity name
async function getRelatedEntityName(table: string, id: string | null, supabase: any): Promise<string> {
  if (!id) return "Unknown";
  
  if (table === "cases") {
    const { data } = await supabase.from("cases").select("case_title").eq("id", id).single();
    return data?.case_title || "a case";
  }
  
  if (table === "clients") {
    const { data } = await supabase.from("clients").select("full_name").eq("id", id).single();
    return data?.full_name || "a client";
  }
  
  return "Unknown";
}

// 🧠 Builds dynamic subject, body & data payload with smart templates
async function constructMessageAndPayload(table: string, eventType: string, record: any, oldRecord: any, supabase: any) {
  let subject = "";
  let body = "";
  let data: any = {};

  switch (table) {
    case "clients": {
      const fullName = record.full_name || "Unnamed Client";
      const createdBy = await getUserName(record.created_by, supabase);
      
      if (eventType === "INSERT") {
        subject = `🧍‍♂️ New client added: ${fullName}`;
        body = `${createdBy} added a new client record for **${fullName}** (${record.phone || "No phone"} / ${record.email || "No email"}).`;
        data = { clientId: record.id, clientName: fullName, module: "clients" };
      } else {
        subject = `🧍‍♂️ Client details updated for ${fullName}`;
        body = `Information updated by ${createdBy}. Review the changes.`;
        data = { clientId: record.id, clientName: fullName, module: "clients" };
      }
      break;
    }

    case "contacts": {
      const name = record.name || "Unnamed Contact";
      const createdBy = await getUserName(record.created_by, supabase);
      
      if (eventType === "INSERT") {
        subject = `📇 New contact added: ${name}`;
        body = `${createdBy} created a new contact record (${record.phone || "No phone"} / ${record.email || "No email"}).`;
        data = { contactId: record.id, contactName: name, module: "contacts" };
      } else {
        subject = `📇 Contact updated: ${name}`;
        body = `Details were modified by ${createdBy}.`;
        data = { contactId: record.id, contactName: name, module: "contacts" };
      }
      break;
    }

    case "cases": {
      const caseTitle = record.case_title || "Untitled Case";
      const caseNumber = record.case_number || "No case number";
      const createdBy = await getUserName(record.created_by, supabase);
      const clientName = await getRelatedEntityName("clients", record.client_id, supabase);
      
      if (eventType === "INSERT") {
        subject = `⚖️ New case added: ${caseTitle}`;
        body = `${createdBy} added case **${caseTitle}** (Case No: ${caseNumber}) for client ${clientName}.`;
        data = { caseId: record.id, caseTitle, caseNumber, module: "cases" };
      } else if (oldRecord && oldRecord.status !== record.status) {
        subject = `📈 Case status changed: ${caseTitle}`;
        body = `Case stage updated to "**${record.stage || record.status}**" (${record.status}).`;
        data = { caseId: record.id, caseTitle, status: record.status, module: "cases" };
      } else {
        subject = `⚖️ Case updated: ${caseTitle}`;
        body = `${createdBy} updated case details. Review the latest activity.`;
        data = { caseId: record.id, caseTitle, module: "cases" };
      }
      break;
    }

    case "case_orders": {
      const caseTitle = await getRelatedEntityName("cases", record.case_id, supabase);
      const orderTitle = record.order_title || record.order_summary || "Unnamed Order";
      const orderDate = formatDate(record.order_date);
      
      subject = `🧾 New court order uploaded for ${caseTitle}`;
      body = `Court order titled "**${orderTitle}**" added on ${orderDate}.`;
      data = { caseId: record.case_id, orderId: record.id, orderTitle, module: "cases" };
      break;
    }

    case "appointments": {
      const clientName = record.client_name || await getRelatedEntityName("clients", record.client_id, supabase);
      const date = formatDate(record.appointment_date);
      const time = record.appointment_time || "unspecified time";
      const createdBy = await getUserName(record.created_by, supabase);
      const meetingMode = record.meeting_mode || "In-person";

      if (eventType === "INSERT") {
        subject = `📅 New appointment scheduled with ${clientName}`;
        body = `Appointment created by ${createdBy} on **${date}** at **${time}** (${meetingMode}).`;
        data = { appointmentId: record.id, clientName, date, time, module: "appointments" };
      } else {
        subject = `📅 Appointment rescheduled for ${clientName}`;
        body = `Appointment moved to **${date}** at **${time}**.`;
        data = { appointmentId: record.id, clientName, date, time, module: "appointments" };
      }
      break;
    }

    case "hearings": {
      const caseTitle = await getRelatedEntityName("cases", record.case_id, supabase);
      const hearingDate = formatDate(record.hearing_date);
      const courtName = record.court_name || "Court";
      const lawyerName = await getUserName(record.lawyer_id, supabase);
      
      subject = `⚖️ Hearing scheduled for ${caseTitle}`;
      body = `Hearing set for **${hearingDate}** at ${courtName}. Counsel: ${lawyerName}.`;
      data = { hearingId: record.id, caseId: record.case_id, caseTitle, hearingDate, module: "hearings" };
      break;
    }

    case "tasks": {
      const title = record.title || "Untitled Task";
      const assignedBy = await getUserName(record.created_by, supabase);
      const dueDate = formatDate(record.due_date);
      
      if (eventType === "INSERT") {
        subject = `📋 New task assigned: ${title}`;
        body = `${assignedBy} assigned you a task. Deadline: **${dueDate}**.`;
        data = { taskId: record.id, title, dueDate, module: "tasks" };
      } else if (oldRecord && oldRecord.status !== record.status && record.status === "completed") {
        const updatedBy = await getUserName(record.updated_by, supabase);
        subject = `✅ Task completed: ${title}`;
        body = `Task "**${title}**" marked as done by ${updatedBy}.`;
        data = { taskId: record.id, title, module: "tasks" };
      } else {
        subject = `📋 Task updated: ${title}`;
        body = `Task status is now **${record.status || "pending"}**.`;
        data = { taskId: record.id, title, status: record.status, module: "tasks" };
      }
      break;
    }

    case "documents": {
      const fileName = record.file_name || "Unnamed file";
      const uploadedBy = await getUserName(record.uploaded_by, supabase);
      const caseTitle = await getRelatedEntityName("cases", record.case_id, supabase);
      
      subject = `📎 New document uploaded: ${fileName}`;
      body = `"**${fileName}**" uploaded to case ${caseTitle} by ${uploadedBy}.`;
      data = { documentId: record.id, fileName, caseId: record.case_id, module: "documents" };
      break;
    }

    case "notes_v2": {
      const noteTitle = record.title || "Untitled Note";
      const createdBy = await getUserName(record.created_by, supabase);
      const relatedTo = record.case_id 
        ? await getRelatedEntityName("cases", record.case_id, supabase)
        : record.client_id
        ? await getRelatedEntityName("clients", record.client_id, supabase)
        : "General";
      
      subject = `🗒️ New note added to ${relatedTo}`;
      body = `${createdBy} added a note titled "**${noteTitle}**".`;
      data = { 
        noteId: record.id, 
        noteTitle, 
        caseId: record.case_id, 
        clientId: record.client_id,
        module: "notes" 
      };
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

// 🔍 Determines recipient(s) for notifications
async function determineRecipients(table: string, record: any, supabase: any): Promise<string[]> {
  const recipients = new Set<string>();

  // Direct assignment fields
  if (record.assigned_to) recipients.add(record.assigned_to);
  if (record.lawyer_id) recipients.add(record.lawyer_id);
  if (record.assigned_lawyer_id) recipients.add(record.assigned_lawyer_id);
  if (record.uploaded_by) recipients.add(record.uploaded_by);
  
  // Array of assigned users
  if (Array.isArray(record.assigned_users)) {
    record.assigned_users.forEach((userId: string) => recipients.add(userId));
  }

  // For cases, notify assigned lawyer from cases table
  if (table === "case_orders" || table === "documents" || table === "hearings") {
    if (record.case_id) {
      const { data: caseData } = await supabase
        .from("cases")
        .select("assigned_lawyer_id")
        .eq("id", record.case_id)
        .single();
      if (caseData?.assigned_lawyer_id) recipients.add(caseData.assigned_lawyer_id);
    }
  }

  // For clients module, notify assigned lawyer
  if (table === "clients" && record.assigned_lawyer_id) {
    recipients.add(record.assigned_lawyer_id);
  }

  // For tasks, notify assignee
  if (table === "tasks" && record.assigned_to) {
    recipients.add(record.assigned_to);
  }

  // Remove null/undefined values
  const validRecipients = Array.from(recipients).filter(Boolean);
  
  return validRecipients;
}
