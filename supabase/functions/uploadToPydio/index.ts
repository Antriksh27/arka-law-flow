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
        
        // Try multiple WebDAV endpoint configurations for better compatibility
        const webdavPaths = [
          '', // Try the base URL as-is
          'webdav/',
          'remote.php/webdav/',
          'dav/',
          'files/',
          'public.php/webdav/',
          'remote.php/dav/files/',
          'index.php/apps/files_external/ajax/upload.php',
        ];
        
        let workingPath = null;
        let testResults = [];
        
        for (const path of webdavPaths) {
          const testUrl = webdavUrl.endsWith('/') ? 
            `${webdavUrl}${path}` : 
            `${webdavUrl}/${path}`;
          
          console.log(`🧪 Testing WebDAV path: ${testUrl}`);
          
          try {
            // Test with PROPFIND first
            const propfindResponse = await fetch(testUrl, {
              method: 'PROPFIND',
              headers: {
                'Authorization': authHeader,
                'Depth': '0',
                'Content-Type': 'text/xml',
              },
            });
            
            testResults.push({
              path: testUrl,
              method: 'PROPFIND',
              status: propfindResponse.status,
              statusText: propfindResponse.statusText
            });
            
            console.log(`🧪 PROPFIND ${testUrl}: ${propfindResponse.status} ${propfindResponse.statusText}`);
            
            if (propfindResponse.ok || propfindResponse.status === 207 || propfindResponse.status === 405) {
              workingPath = testUrl;
              console.log(`✅ Found working WebDAV path: ${workingPath}`);
              break;
            }
            
            // If PROPFIND fails, try OPTIONS to see if WebDAV methods are supported
            const optionsResponse = await fetch(testUrl, {
              method: 'OPTIONS',
              headers: {
                'Authorization': authHeader,
              },
            });
            
            console.log(`🧪 OPTIONS ${testUrl}: ${optionsResponse.status} ${optionsResponse.statusText}`);
            const allowHeader = optionsResponse.headers.get('Allow') || '';
            
            if (allowHeader.includes('PUT') || allowHeader.includes('PROPFIND')) {
              workingPath = testUrl;
              console.log(`✅ Found WebDAV-capable path via OPTIONS: ${workingPath}`);
              break;
            }
            
          } catch (error) {
            console.log(`❌ Error testing ${testUrl}: ${error.message}`);
            testResults.push({
              path: testUrl,
              error: error.message
            });
          }
        }
        
        if (!workingPath) {
          console.error('❌ No working WebDAV endpoint found');
          return new Response(
            JSON.stringify({
              success: false,
              message: 'WebDAV endpoint not accessible - no working path found',
              error: `Tested ${webdavPaths.length} different WebDAV paths, none responded correctly`,
              testResults: testResults,
              suggestion: 'Please verify your WebDAV server URL and credentials. Common WebDAV endpoints: /webdav/, /remote.php/webdav/, /dav/'
            }),
            {
              status: 404,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            },
          )
        }

        // Upload to the working WebDAV path
        const uploadUrl = `${workingPath}${workingPath.endsWith('/') ? '' : '/'}${filename}`;
        console.log(`📤 Uploading to verified WebDAV URL: ${uploadUrl}`);

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
              details: errorText,
              workingPath: workingPath,
              uploadUrl: uploadUrl
            }),
            {
              status: uploadResponse.status,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            },
          )
        }

        console.log('✅ Upload successful');
        return new Response(
          JSON.stringify({
            success: true,
            message: 'File uploaded successfully to WebDAV',
            path: filename,
            uploadUrl: uploadUrl
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