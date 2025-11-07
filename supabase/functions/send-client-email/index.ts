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
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const requestBody = await req.json();
    console.log("Received request body:", requestBody);
    
    const { to, subject, body, clientName }: SendEmailRequest = requestBody;
    console.log("Extracted fields - to:", to, "subject:", subject, "body length:", body?.length);

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

    const emailResponse = await resend.emails.send({
      from: "HRU Legal <onboarding@resend.dev>",
      to: [to],
      subject: subject,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background-color: #1E3A8A; padding: 20px; text-align: center;">
            <h1 style="color: white; margin: 0;">HRU Legal</h1>
          </div>
          <div style="padding: 30px; background-color: #f9fafb;">
            <p style="color: #111827; font-size: 16px; line-height: 1.6; white-space: pre-wrap;">${body}</p>
          </div>
          <div style="background-color: #e5e7eb; padding: 20px; text-align: center; font-size: 12px; color: #6b7280;">
            <p style="margin: 0;">This email was sent from HRU Legal Management System</p>
          </div>
        </div>
      `,
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
