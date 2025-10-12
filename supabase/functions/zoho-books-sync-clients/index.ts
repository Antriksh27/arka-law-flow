import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error("No authorization header");
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: authHeader },
        },
      }
    );

    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    
    if (userError || !user) {
      throw new Error("Failed to get user");
    }

    const { data: teamMember, error: teamError } = await supabaseClient
      .from('team_members')
      .select('firm_id')
      .eq('user_id', user.id)
      .single();

    if (teamError || !teamMember) {
      throw new Error("Failed to get user's firm");
    }

    const { data: tokenData, error: tokenError } = await supabaseClient
      .from('zoho_tokens')
      .select('*')
      .eq('firm_id', teamMember.firm_id)
      .single();

    if (tokenError || !tokenData) {
      throw new Error("Zoho not connected");
    }

    let accessToken = tokenData.access_token;
    const expiresAt = new Date(tokenData.expires_at);
    const now = new Date();

    if (expiresAt <= now) {
      const zohoClientId = Deno.env.get('ZOHO_CLIENT_ID');
      const zohoClientSecret = Deno.env.get('ZOHO_CLIENT_SECRET');

      const refreshResponse = await fetch(
        "https://accounts.zoho.in/oauth/v2/token",
        {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: new URLSearchParams({
            refresh_token: tokenData.refresh_token,
            client_id: zohoClientId!,
            client_secret: zohoClientSecret!,
            grant_type: "refresh_token",
          }),
        }
      );

      if (!refreshResponse.ok) {
        throw new Error("Token refresh failed");
      }

      const refreshData = await refreshResponse.json();
      accessToken = refreshData.access_token;
      
      await supabaseClient
        .from('zoho_tokens')
        .update({
          access_token: accessToken,
          expires_at: new Date(Date.now() + refreshData.expires_in * 1000).toISOString(),
        })
        .eq('firm_id', teamMember.firm_id);
    }

    const organizationId = tokenData.organization_id;
    
    if (!organizationId) {
      throw new Error("Organization ID not configured");
    }

    // Fetch all clients for this firm
    const { data: clients, error: clientsError } = await supabaseClient
      .from('clients')
      .select('*')
      .eq('firm_id', teamMember.firm_id);

    if (clientsError) {
      throw new Error(`Failed to fetch clients: ${clientsError.message}`);
    }

    console.log(`Found ${clients?.length || 0} clients to sync`);

    // Fetch existing Zoho contacts to avoid duplicates
    const existingContactsResponse = await fetch(
      `https://www.zohoapis.in/books/v3/contacts?organization_id=${organizationId}`,
      {
        method: "GET",
        headers: {
          "Authorization": `Zoho-oauthtoken ${accessToken}`,
        },
      }
    );

    if (!existingContactsResponse.ok) {
      throw new Error("Failed to fetch existing Zoho contacts");
    }

    const existingContactsData = await existingContactsResponse.json();
    const existingContacts = existingContactsData.contacts || [];
    
    console.log(`Found ${existingContacts.length} existing contacts in Zoho Books`);

    const results = {
      total: clients?.length || 0,
      created: 0,
      skipped: 0,
      errors: [] as any[],
    };

    // Helper to check if contact exists
    const normalize = (s?: string) => (s || '').toLowerCase().replace(/[^a-z0-9]/g, '');
    
    const contactExists = (client: any) => {
      const clientEmail = client.email?.toLowerCase();
      const clientName = normalize(client.full_name);
      
      return existingContacts.some((contact: any) => {
        // Check email match
        if (clientEmail && contact.email?.toLowerCase() === clientEmail) {
          return true;
        }
        // Check name match
        const contactName = normalize(contact.contact_name);
        const companyName = normalize(contact.company_name);
        return contactName === clientName || companyName === clientName;
      });
    };

    // Sync each client
    for (const client of clients || []) {
      try {
        // Skip if already exists
        if (contactExists(client)) {
          console.log(`Skipping existing contact: ${client.full_name}`);
          results.skipped++;
          continue;
        }

        // Prepare contact data for Zoho Books
        const contactData: any = {
          contact_name: client.full_name,
          contact_type: "customer",
        };

        // Add optional fields if available
        if (client.email) contactData.email = client.email;
        if (client.phone) contactData.phone = client.phone;
        if (client.organization) contactData.company_name = client.organization;
        
        // Build address
        const addressParts = [
          client.address,
          client.city,
          client.district,
          client.state
        ].filter(Boolean);
        
        if (addressParts.length > 0) {
          contactData.billing_address = {
            address: addressParts.join(', '),
            city: client.city || '',
            state: client.state || '',
            country: 'India',
          };
        }

        // Add notes/additional info
        const notes = [];
        if (client.notes) notes.push(client.notes);
        if (client.type) notes.push(`Type: ${client.type}`);
        if (client.source) notes.push(`Source: ${client.source}`);
        if (notes.length > 0) {
          contactData.notes = notes.join('\n');
        }

        console.log(`Creating contact in Zoho Books: ${client.full_name}`);

        // Create contact in Zoho Books
        const createResponse = await fetch(
          `https://www.zohoapis.in/books/v3/contacts?organization_id=${organizationId}`,
          {
            method: "POST",
            headers: {
              "Authorization": `Zoho-oauthtoken ${accessToken}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify(contactData),
          }
        );

        if (!createResponse.ok) {
          const errorText = await createResponse.text();
          console.error(`Failed to create contact ${client.full_name}: ${errorText}`);
          results.errors.push({
            client: client.full_name,
            error: errorText,
          });
        } else {
          console.log(`Successfully created contact: ${client.full_name}`);
          results.created++;
        }

        // Rate limiting - wait 200ms between requests
        await new Promise(resolve => setTimeout(resolve, 200));

      } catch (error) {
        console.error(`Error processing client ${client.full_name}:`, error);
        results.errors.push({
          client: client.full_name,
          error: error.message,
        });
      }
    }

    console.log('Sync completed:', results);

    return new Response(
      JSON.stringify({ 
        success: true,
        results,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error) {
    console.error("Error in zoho-books-sync-clients:", error);
    return new Response(
      JSON.stringify({ 
        error: error.message || "Internal server error"
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
