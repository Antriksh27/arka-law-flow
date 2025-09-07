import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  console.log('🔧 WebDAV function called');
  
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Parse the request body
    const { operation, filename, content, filePath } = await req.json()
    console.log(`📋 Operation: ${operation}`);

    // Get WebDAV configuration from environment
    const webdavUrl = Deno.env.get('WEBDAV_URL');
    const webdavUsername = Deno.env.get('WEBDAV_USERNAME');
    const webdavPassword = Deno.env.get('WEBDAV_PASSWORD');

    if (!webdavUrl || !webdavUsername || !webdavPassword) {
      console.error('❌ Missing WebDAV configuration');
      return new Response(
        JSON.stringify({
          success: false,
          message: 'WebDAV configuration is not complete',
          error: 'Missing required environment variables: WEBDAV_URL, WEBDAV_USERNAME, or WEBDAV_PASSWORD'
        }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        },
      )
    }

    // Create basic auth header
    const authHeader = 'Basic ' + btoa(`${webdavUsername}:${webdavPassword}`);

    if (operation === 'upload') {
      console.log(`📁 Starting upload of file: ${filename}`);
      
      if (!filename || !content) {
        return new Response(
          JSON.stringify({
            success: false,
            message: 'Missing required parameters for upload',
            error: 'filename and content are required'
          }),
          {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          },
        )
      }

      try {
        // Ensure WebDAV URL ends with /
        const baseUrl = webdavUrl.endsWith('/') ? webdavUrl : `${webdavUrl}/`;
        const uploadUrl = `${baseUrl}${filename}`;

        console.log(`📤 Uploading to: ${uploadUrl}`);
        console.log(`🔑 Auth header present: ${authHeader ? 'Yes' : 'No'}`);

        // First, try to test the WebDAV connection with a PROPFIND request
        console.log(`🧪 Testing WebDAV connection to base URL: ${baseUrl}`);
        const testResponse = await fetch(baseUrl, {
          method: 'PROPFIND',
          headers: {
            'Authorization': authHeader,
            'Depth': '1',
          },
        });

        console.log(`🧪 Test response: ${testResponse.status} ${testResponse.statusText}`);
        
        if (!testResponse.ok && testResponse.status === 404) {
          // Try common WebDAV paths
          const commonPaths = [
            '/webdav/',
            '/remote.php/webdav/',
            '/dav/',
            '/files/'
          ];
          
          let workingPath = null;
          for (const path of commonPaths) {
            const testUrl = webdavUrl.replace(/\/[^\/]*\/$/, path);
            console.log(`🧪 Testing WebDAV path: ${testUrl}`);
            
            const pathTestResponse = await fetch(testUrl, {
              method: 'PROPFIND',
              headers: {
                'Authorization': authHeader,
                'Depth': '1',
              },
            });
            
            if (pathTestResponse.ok || pathTestResponse.status === 207) {
              workingPath = testUrl;
              console.log(`✅ Found working WebDAV path: ${workingPath}`);
              break;
            }
          }
          
          if (workingPath) {
            const correctedUploadUrl = `${workingPath}${workingPath.endsWith('/') ? '' : '/'}${filename}`;
            console.log(`📤 Retrying upload to corrected URL: ${correctedUploadUrl}`);
            
            const uploadResponse = await fetch(correctedUploadUrl, {
              method: 'PUT',
              headers: {
                'Authorization': authHeader,
                'Content-Type': 'application/octet-stream',
              },
              body: content,
            });

            if (!uploadResponse.ok) {
              console.error(`❌ WebDAV upload failed even with corrected path: ${uploadResponse.status} ${uploadResponse.statusText}`);
              const errorText = await uploadResponse.text();
              console.error(`❌ Error details: ${errorText}`);
              
              return new Response(
                JSON.stringify({
                  success: false,
                  message: 'Failed to upload to WebDAV (tried multiple paths)',
                  error: `WebDAV error: ${uploadResponse.status} ${uploadResponse.statusText}`,
                  details: errorText,
                  testedPaths: commonPaths,
                  workingPath: workingPath
                }),
                {
                  status: uploadResponse.status,
                  headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                },
              )
            }

            console.log('✅ Upload successful with corrected path');
            return new Response(
              JSON.stringify({
                success: true,
                message: 'File uploaded successfully to WebDAV',
                path: filename
              }),
              {
                status: 200,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
              },
            )
          } else {
            return new Response(
              JSON.stringify({
                success: false,
                message: 'WebDAV endpoint not found - tried multiple common paths',
                error: `WebDAV 404 error: No working WebDAV endpoint found`,
                details: 'Tested paths: /webdav/, /remote.php/webdav/, /dav/, /files/',
                testedPaths: commonPaths,
                suggestion: 'Please check your WebDAV server configuration and URL'
              }),
              {
                status: 404,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
              },
            )
          }
        }

        // Normal upload to the original URL if PROPFIND test passed
        const uploadResponse = await fetch(uploadUrl, {
          method: 'PUT',
          headers: {
            'Authorization': authHeader,
            'Content-Type': 'application/octet-stream',
          },
          body: content,
        });

        if (!uploadResponse.ok) {
          console.error(`❌ WebDAV upload failed: ${uploadResponse.status} ${uploadResponse.statusText}`);
          const errorText = await uploadResponse.text();
          console.error(`❌ Error details: ${errorText}`);
          
          return new Response(
            JSON.stringify({
              success: false,
              message: 'Failed to upload to WebDAV',
              error: `WebDAV error: ${uploadResponse.status} ${uploadResponse.statusText}`,
              details: errorText
            }),
            {
              status: uploadResponse.status,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            },
          )
        }

        return new Response(
          JSON.stringify({
            success: true,
            message: 'File uploaded successfully to WebDAV',
            path: filename
          }),
          {
            status: 200,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          },
        )

      } catch (error) {
        console.error('❌ WebDAV upload failed:', error.message);
        return new Response(
          JSON.stringify({
            success: false,
            message: 'Failed to upload file',
            error: error.message
          }),
          {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          },
        )
      }

    } else if (operation === 'download') {
      console.log(`📥 Starting download of file: ${filePath}`);
      
      if (!filePath) {
        return new Response(
          JSON.stringify({
            success: false,
            message: 'Missing required parameters for download',
            error: 'filePath is required'
          }),
          {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          },
        )
      }

      try {
        // Ensure WebDAV URL ends with /
        const baseUrl = webdavUrl.endsWith('/') ? webdavUrl : `${webdavUrl}/`;
        const downloadUrl = `${baseUrl}${filePath}`;

        console.log(`📥 Downloading from: ${downloadUrl}`);

        // Download from WebDAV using GET method
        const downloadResponse = await fetch(downloadUrl, {
          method: 'GET',
          headers: {
            'Authorization': authHeader,
          },
        });

        if (!downloadResponse.ok) {
          return new Response(
            JSON.stringify({
              success: false,
              message: 'Failed to download from WebDAV',
              error: `WebDAV error: ${downloadResponse.status} ${downloadResponse.statusText}`
            }),
            {
              status: downloadResponse.status,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            },
          )
        }

        const fileContent = await downloadResponse.text();

        return new Response(
          JSON.stringify({
            success: true,
            message: 'File downloaded successfully from WebDAV',
            content: fileContent
          }),
          {
            status: 200,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          },
        )

      } catch (error) {
        return new Response(
          JSON.stringify({
            success: false,
            message: 'Failed to download file',
            error: error.message
          }),
          {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          },
        )
      }

    } else {
      return new Response(
        JSON.stringify({
          success: false,
          message: 'Invalid operation',
          error: 'Operation must be "upload" or "download"'
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        },
      )
    }

  } catch (error) {
    console.error('❌ General error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        message: 'Internal server error',
        error: error.message
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      },
    )
  }
})