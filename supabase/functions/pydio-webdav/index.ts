import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface StructuredUploadParams {
  clientName: string;
  caseName: string;
  docType: string;
  fileName: string;
  fileContent: string;
  webdavUrl: string | undefined;
  webdavUsername: string | undefined;
  webdavPassword: string | undefined;
}

async function handleStructuredUpload(params: StructuredUploadParams) {
  const { clientName, caseName, docType, fileName, fileContent, webdavUrl, webdavUsername, webdavPassword } = params;

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
  
  try {
    // Ensure WebDAV URL ends with /
    const baseUrl = webdavUrl.endsWith('/') ? webdavUrl : `${webdavUrl}/`;
    
    // Test WebDAV connection first
    console.log(`🧪 Testing WebDAV connection to base URL: ${baseUrl}`);
    const testResponse = await fetch(baseUrl, {
      method: 'PROPFIND',
      headers: {
        'Authorization': authHeader,
        'Depth': '0',
        'Content-Type': 'text/xml',
      },
    });
    
    if (!testResponse.ok && testResponse.status !== 207) {
      throw new Error(`WebDAV connection failed: ${testResponse.status} ${testResponse.statusText}`);
    }
    
    // Build the folder structure: /Clients/{clientName}/{caseName}/{docType}/
    const folderStructure = ['Clients', clientName, caseName, docType];
    let currentPath = baseUrl;
    
    console.log(`📁 Creating folder structure: ${folderStructure.join('/')}`);
    
    // Create each folder in the hierarchy
    for (const folder of folderStructure) {
      currentPath = `${currentPath}${currentPath.endsWith('/') ? '' : '/'}${encodeURIComponent(folder)}`;
      console.log(`📁 Ensuring folder exists: ${currentPath}`);
      
      try {
        // Try to create the folder
        const mkcolResponse = await fetch(currentPath, {
          method: 'MKCOL',
          headers: {
            'Authorization': authHeader,
          },
        });
        
        // 201 = created, 405 = already exists (method not allowed on existing resource)
        if (mkcolResponse.ok || mkcolResponse.status === 405) {
          console.log(`✅ Folder exists or created: ${currentPath}`);
        } else {
          console.log(`⚠️ Folder creation response: ${mkcolResponse.status} ${mkcolResponse.statusText}`);
        }
      } catch (dirError) {
        console.log(`⚠️ Error creating folder ${currentPath}: ${dirError.message}`);
        // Continue anyway, folder might already exist
      }
    }
    
    // Upload the file to the final folder
    const finalUploadPath = `${currentPath}/${encodeURIComponent(fileName)}`;
    console.log(`📤 Uploading file to: ${finalUploadPath}`);
    
    const uploadResponse = await fetch(finalUploadPath, {
      method: 'PUT',
      headers: {
        'Authorization': authHeader,
        'Content-Type': 'application/octet-stream',
      },
      body: fileContent,
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
          uploadPath: finalUploadPath
        }),
        {
          status: uploadResponse.status,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        },
      )
    }

    console.log('✅ Structured upload successful');
    return new Response(
      JSON.stringify({
        success: true,
        message: 'File uploaded successfully to WebDAV',
        path: `Clients/${clientName}/${caseName}/${docType}/${fileName}`,
        uploadPath: finalUploadPath
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      },
    )

  } catch (error) {
    console.error('❌ Structured upload failed:', error.message);
    return new Response(
      JSON.stringify({
        success: false,
        message: 'Failed to upload file with structured format',
        error: error.message
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      },
    )
  }
}

serve(async (req) => {
  console.log('🔧 WebDAV function called');
  
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Parse the request body
    const { operation, filename, content, filePath, clientName, caseName, category, docType, fileName, fileContent } = await req.json()
    console.log(`📋 Operation: ${operation || 'hierarchical-upload'}`);
    
    // Handle new hierarchical structured upload format with category
    if (clientName && caseName && category && docType && fileName && fileContent) {
      console.log(`📁 Hierarchical upload: /${clientName}/${caseName}/${category}/${docType}/${fileName}`);
      
      const webdavUrl = Deno.env.get('WEBDAV_URL');
      const webdavUsername = Deno.env.get('WEBDAV_USERNAME');
      const webdavPassword = Deno.env.get('WEBDAV_PASSWORD');
      
      console.log(`🔧 WebDAV Config - URL: ${webdavUrl ? 'SET' : 'MISSING'}, Username: ${webdavUsername ? 'SET' : 'MISSING'}, Password: ${webdavPassword ? 'SET' : 'MISSING'}`);
      
      if (!webdavUrl || !webdavUsername || !webdavPassword) {
        return new Response(JSON.stringify({
          success: false,
          error: 'WebDAV configuration missing',
          details: 'WebDAV URL, username, or password not configured'
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 500,
        });
      }
      
      try {
        // Ensure WebDAV URL is properly formatted
        const baseUrl = webdavUrl.endsWith('/') ? webdavUrl.slice(0, -1) : webdavUrl;
        console.log(`🌐 Base URL: ${baseUrl}`);
        
        // Create folder structure: {clientName}/{caseName}/{category}/{docType}
        // Use URL encoding for folder names to handle special characters
        // Note: 'crmdata' is already included in the base WebDAV URL
        const folders = [
          encodeURIComponent(clientName), 
          encodeURIComponent(caseName), 
          encodeURIComponent(category), 
          encodeURIComponent(docType)
        ];
        
        let currentPath = '';
        
        for (const folder of folders) {
          currentPath += `/${folder}`;
          const fullFolderUrl = `${baseUrl}${currentPath}`;
          console.log(`📂 Checking/creating folder: ${currentPath} (${fullFolderUrl})`);
          
          // Try to create folder (MKCOL method)
          try {
            const mkcolResponse = await fetch(fullFolderUrl, {
              method: 'MKCOL',
              headers: {
                'Authorization': `Basic ${btoa(`${webdavUsername}:${webdavPassword}`)}`,
                'Content-Type': 'application/xml',
              },
            });
            
            if (mkcolResponse.status === 201) {
              console.log(`✅ Created folder: ${currentPath}`);
            } else if (mkcolResponse.status === 405 || mkcolResponse.status === 409) {
              console.log(`📁 Folder already exists: ${currentPath}`);
            } else {
              console.log(`⚠️ Unexpected response for folder ${currentPath}: ${mkcolResponse.status} ${mkcolResponse.statusText}`);
              // Don't fail on folder creation issues, continue with upload
            }
          } catch (folderError) {
            console.log(`⚠️ Error creating folder ${currentPath}:`, folderError);
            // Continue anyway, folder might already exist
          }
        }
        
        // Upload the file with proper encoding
        const encodedFileName = encodeURIComponent(fileName);
        const fullPath = `${currentPath}/${encodedFileName}`;
        const fullUploadUrl = `${baseUrl}${fullPath}`;
        console.log(`📤 Uploading file to: ${fullPath} (${fullUploadUrl})`);
        
        // Decode base64 content if it appears to be base64
        let fileData;
        try {
          // If it's base64, decode it
          if (typeof fileContent === 'string' && /^[A-Za-z0-9+/]+=*$/.test(fileContent.replace(/\s/g, ''))) {
            const cleanBase64 = fileContent.replace(/\s/g, '');
            fileData = Uint8Array.from(atob(cleanBase64), c => c.charCodeAt(0));
            console.log(`📄 Decoded base64 file, size: ${fileData.length} bytes`);
          } else {
            fileData = new TextEncoder().encode(fileContent);
            console.log(`📄 Text file, size: ${fileData.length} bytes`);
          }
        } catch (decodeError) {
          console.log('⚠️ Base64 decode failed, using content as text');
          fileData = new TextEncoder().encode(fileContent);
        }
        
        console.log(`🔐 Auth header: Basic ${btoa(`${webdavUsername}:${webdavPassword}`).substring(0, 10)}...`);
        
        const uploadResponse = await fetch(fullUploadUrl, {
          method: 'PUT',
          headers: {
            'Authorization': `Basic ${btoa(`${webdavUsername}:${webdavPassword}`)}`,
            'Content-Type': 'application/octet-stream',
          },
          body: fileData,
        });
        
        console.log(`📡 Upload response: ${uploadResponse.status} ${uploadResponse.statusText}`);
        
        if (uploadResponse.ok || uploadResponse.status === 201 || uploadResponse.status === 204) {
          console.log('✅ File uploaded successfully to hierarchical structure');
          return new Response(JSON.stringify({
            success: true,
            message: `File uploaded successfully to ${fullPath}`,
            path: fullPath
          }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
          });
        } else {
          const errorText = await uploadResponse.text();
          console.error('❌ Upload failed:', uploadResponse.status, uploadResponse.statusText, errorText);
          return new Response(JSON.stringify({
            success: false,
            error: `Upload failed: ${uploadResponse.status} ${uploadResponse.statusText}`,
            details: errorText,
            uploadUrl: fullUploadUrl
          }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 400,
          });
        }
      } catch (error) {
        console.error('❌ Error in hierarchical upload:', error);
        return new Response(JSON.stringify({
          success: false,
          error: 'Failed to upload to hierarchical structure',
          details: error instanceof Error ? error.message : 'Unknown error'
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 500,
        });
      }
    }
    
    // Handle legacy structured upload format (without category)
    if (clientName && caseName && docType && fileName && fileContent) {
      console.log(`📁 Legacy structured upload: ${clientName}/${caseName}/${docType}/${fileName}`);
      return await handleStructuredUpload({
        clientName,
        caseName, 
        docType,
        fileName,
        fileContent,
        webdavUrl: Deno.env.get('WEBDAV_URL'),
        webdavUsername: Deno.env.get('WEBDAV_USERNAME'),
        webdavPassword: Deno.env.get('WEBDAV_PASSWORD')
      });
    }

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

        // Create directory structure if filename contains paths
        const uploadUrl = `${workingPath}${workingPath.endsWith('/') ? '' : '/'}${filename}`;
        console.log(`📤 Uploading to verified WebDAV URL: ${uploadUrl}`);
        
        // If filename contains directories, create them first
        if (filename.includes('/')) {
          const pathParts = filename.split('/');
          const directories = pathParts.slice(0, -1); // Remove filename from path
          let currentPath = workingPath;
          
          for (const dir of directories) {
            currentPath = `${currentPath}${currentPath.endsWith('/') ? '' : '/'}${encodeURIComponent(dir)}`;
            console.log(`📁 Creating directory: ${currentPath}`);
            
            try {
              const mkcolResponse = await fetch(currentPath, {
                method: 'MKCOL',
                headers: {
                  'Authorization': authHeader,
                },
              });
              
              // 201 = created, 405 = already exists (method not allowed on existing resource)
              if (mkcolResponse.ok || mkcolResponse.status === 405) {
                console.log(`✅ Directory exists or created: ${currentPath}`);
              } else {
                console.log(`⚠️ Directory creation response: ${mkcolResponse.status} ${mkcolResponse.statusText}`);
              }
            } catch (dirError) {
              console.log(`⚠️ Error creating directory ${currentPath}: ${dirError.message}`);
              // Continue anyway, directory might already exist
            }
          }
        }

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

        // Get file as array buffer for binary files, then convert to base64
        const fileBuffer = await downloadResponse.arrayBuffer();
        
        // Convert to base64 without causing stack overflow for large files
        const uint8Array = new Uint8Array(fileBuffer);
        let binaryString = '';
        
        // Process in chunks to avoid stack overflow
        const chunkSize = 8192; // 8KB chunks
        for (let i = 0; i < uint8Array.length; i += chunkSize) {
          const chunk = uint8Array.subarray(i, i + chunkSize);
          binaryString += String.fromCharCode(...chunk);
        }
        
        const base64Content = btoa(binaryString);

        return new Response(
          JSON.stringify({
            success: true,
            message: 'File downloaded successfully from WebDAV',
            content: base64Content,
            contentType: downloadResponse.headers.get('content-type') || 'application/octet-stream'
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