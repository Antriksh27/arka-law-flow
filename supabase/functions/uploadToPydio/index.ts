import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { 
      filename, 
      content, 
      operation = 'upload',
      filePath 
    } = await req.json();

    const pydioApiUrl = Deno.env.get('PYDIO_API_URL');
    const pydioToken = Deno.env.get('PYDIO_API_TOKEN');
    const workspaceId = Deno.env.get('PYDIO_WORKSPACE_ID');

    if (!pydioApiUrl || !pydioToken || !workspaceId) {
      console.error('Missing Pydio configuration');
      return new Response(
        JSON.stringify({ 
          error: 'Pydio configuration incomplete',
          details: 'Missing API URL, token, or workspace ID'
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    if (operation === 'upload') {
      if (!filename || !content) {
        return new Response(
          JSON.stringify({ 
            error: 'Missing required fields',
            details: 'filename and content are required for upload'
          }),
          { 
            status: 400, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
      }

      console.log(`Starting upload of file: ${filename}`);

      // Create form data for file upload
      const formData = new FormData();
      
      // Convert content to blob
      const blob = new Blob([content], { type: 'text/plain' });
      formData.append('file', blob, filename);
      formData.append('workspace', workspaceId);

      // Upload file to Pydio
      const uploadResponse = await fetch(`${pydioApiUrl}/api/v2/files/upload`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${pydioToken}`,
        },
        body: formData,
      });

      if (!uploadResponse.ok) {
        const errorText = await uploadResponse.text();
        console.error('Pydio upload failed:', errorText);
        return new Response(
          JSON.stringify({ 
            error: 'Upload failed',
            details: errorText,
            status: uploadResponse.status
          }),
          { 
            status: uploadResponse.status, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
      }

      const uploadResult = await uploadResponse.json();
      console.log(`Successfully uploaded file: ${filename}`);

      return new Response(
        JSON.stringify({
          success: true,
          message: `File ${filename} uploaded successfully`,
          data: uploadResult
        }),
        { 
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );

    } else if (operation === 'download') {
      if (!filePath) {
        return new Response(
          JSON.stringify({ 
            error: 'Missing required fields',
            details: 'filePath is required for download'
          }),
          { 
            status: 400, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
      }

      console.log(`Starting download of file: ${filePath}`);

      // Download file from Pydio
      const downloadResponse = await fetch(`${pydioApiUrl}/api/v2/files/download`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${pydioToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          workspace: workspaceId,
          path: filePath
        }),
      });

      if (!downloadResponse.ok) {
        const errorText = await downloadResponse.text();
        console.error('Pydio download failed:', errorText);
        return new Response(
          JSON.stringify({ 
            error: 'Download failed',
            details: errorText,
            status: downloadResponse.status
          }),
          { 
            status: downloadResponse.status, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
      }

      const fileContent = await downloadResponse.text();
      console.log(`Successfully downloaded file: ${filePath}`);

      return new Response(
        JSON.stringify({
          success: true,
          message: `File ${filePath} downloaded successfully`,
          content: fileContent,
          path: filePath
        }),
        { 
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );

    } else {
      return new Response(
        JSON.stringify({ 
          error: 'Invalid operation',
          details: 'Operation must be either "upload" or "download"'
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

  } catch (error) {
    console.error('Error in uploadToPydio function:', error);
    return new Response(
      JSON.stringify({
        error: 'Internal server error',
        details: error.message
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
})