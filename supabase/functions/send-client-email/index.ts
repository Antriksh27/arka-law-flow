import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface SendEmailRequest {
  to: string;
  subject: string;
  body: string;
  clientName: string;
  cc?: string;
  bcc?: string;
  attachments?: Array<{
    filename: string;
    content: string;
    type: string;
  }>;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const requestBody = await req.json();
    console.log("Received request body:", requestBody);
    
    const { to, subject, body, clientName, cc, bcc, attachments }: SendEmailRequest = requestBody;
    console.log("Extracted fields - to:", to, "subject:", subject, "body length:", body?.length, "cc:", cc, "bcc:", bcc, "attachments:", attachments?.length);

    if (!to || !subject || !body) {
      console.error("Missing fields validation failed. to:", !!to, "subject:", !!subject, "body:", !!body);
      return new Response(
        JSON.stringify({ error: "Missing required fields: to, subject, or body" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    // Parse CC and BCC emails
    const ccEmails = cc ? cc.split(',').map(email => email.trim()).filter(Boolean) : undefined;
    const bccEmails = bcc ? bcc.split(',').map(email => email.trim()).filter(Boolean) : undefined;

    // Prepare attachments for Resend
    const resendAttachments = attachments?.map(att => ({
      filename: att.filename,
      content: att.content,
    }));

    const emailResponse = await resend.emails.send({
      from: "HRU Legal <office@hrulegal.com>",
      to: [to],
      cc: ccEmails,
      bcc: bccEmails,
      subject: subject,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background-color: #18212f; padding: 20px; text-align: center;">
            <img src="https://crm.hrulegal.com/lovable-uploads/89ea18cf-8c73-4793-9dcc-1a192855a630.png" alt="HRU Legal" style="height: 88px; width: auto; display: inline-block;" />
          </div>
          <div style="padding: 30px; background-color: #f9fafb;">
            <p style="color: #111827; font-size: 16px; line-height: 1.6; white-space: pre-wrap;">${body}</p>
          </div>
          <div style="background-color: #e5e7eb; padding: 20px; text-align: center; font-size: 12px; color: #6b7280;">
            <p style="margin: 0;">This email was sent from HRU Legal Management System</p>
          </div>
        </div>
      `,
      attachments: resendAttachments,
    });

    console.log("Email sent successfully:", emailResponse);

    return new Response(JSON.stringify(emailResponse), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error in send-client-email function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
