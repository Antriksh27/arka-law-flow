import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { z } from 'https://deno.land/x/zod@v3.22.4/mod.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Allowed file types
const ALLOWED_EXTENSIONS = ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'txt', 'png', 'jpg', 'jpeg', 'gif']
const MAX_FILE_SIZE_MB = 10
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024

// Input validation schema
const uploadSchema = z.object({
  clientName: z.string().trim().min(1).max(255).regex(/^[a-zA-Z0-9\s._-]+$/, "Invalid client name format"),
  caseName: z.string().trim().min(1).max(255).regex(/^[a-zA-Z0-9\s._-]+$/, "Invalid case name format"),
  category: z.string().trim().min(1).max(100).regex(/^[a-zA-Z0-9\s._/()\-]+$/, "Invalid category format"),
  docType: z.string().trim().min(1).max(100).regex(/^[a-zA-Z0-9\s._/()\-]+$/, "Invalid document type format"),
  fileName: z.string().trim().min(1).max(255),
  fileContent: z.string().min(1)
})

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
        const errorMessage = dirError instanceof Error ? dirError.message : String(dirError)
        console.log(`⚠️ Error creating folder ${currentPath}: ${errorMessage}`);
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
    const errorMessage = error instanceof Error ? error.message : String(error)
    console.error('❌ Structured upload failed:', errorMessage);
    return new Response(
      JSON.stringify({
        success: false,
        message: 'Failed to upload file with structured format',
        error: errorMessage
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
    const body = await req.json()
    const { operation, filename, content, filePath } = body
    console.log(`📋 Operation: ${operation || 'hierarchical-upload'}`);
    
    // Handle new hierarchical structured upload format with category
    if (body.clientName && body.caseName && body.category && body.docType && body.fileName && body.fileContent) {
      // Validate input
      const validation = uploadSchema.safeParse(body)
      
      if (!validation.success) {
        console.error('Validation failed:', validation.error.flatten())
        return new Response(JSON.stringify({
          success: false,
          error: 'Invalid input',
          details: validation.error.flatten().fieldErrors
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400,
        });
      }

      const { clientName, caseName, category, docType, fileName, fileContent } = validation.data

      // Validate file extension
      const fileExt = fileName.split('.').pop()?.toLowerCase()
      if (!fileExt || !ALLOWED_EXTENSIONS.includes(fileExt)) {
        console.error('Invalid file type:', fileExt)
        return new Response(JSON.stringify({
          success: false,
          error: 'Invalid file type',
          details: `Allowed types: ${ALLOWED_EXTENSIONS.join(', ')}`,
          receivedExtension: fileExt
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400,
        });
      }

      // Validate file size
      const fileSize = fileContent.length
      if (fileSize > MAX_FILE_SIZE_BYTES) {
        console.error('File too large:', fileSize, 'bytes')
        return new Response(JSON.stringify({
          success: false,
          error: 'File too large',
          details: `Maximum file size: ${MAX_FILE_SIZE_MB}MB`,
          receivedSize: Math.round(fileSize / 1024 / 1024 * 100) / 100 + 'MB'
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 413,
        });
      }

      console.log(`📁 Hierarchical upload: /${clientName}/${caseName}/${category}/${docType}/${fileName}`);
      
      const webdavUrl = Deno.env.get('WEBDAV_URL');
      const webdavUsername = Deno.env.get('WEBDAV_USERNAME');
      const webdavPassword = Deno.env.get('WEBDAV_PASSWORD');
      
      console.log(`🔧 WebDAV Config - URL: ${webdavUrl}, Username: ${webdavUsername ? 'SET' : 'MISSING'}, Password: ${webdavPassword ? 'SET' : 'MISSING'}`);
      
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
        let workingBaseUrl = webdavUrl.endsWith('/') ? webdavUrl.slice(0, -1) : webdavUrl;
        console.log(`🌐 Initial Base URL: ${workingBaseUrl}`);
        
        // Test different WebDAV URL structures to find the working one
        const urlVariations = [
          workingBaseUrl, // Original URL
          workingBaseUrl.replace('/dav', '/remote.php/dav/files/' + webdavUsername),
          workingBaseUrl.replace('/dav', '/remote.php/webdav'),
          workingBaseUrl.replace('/dav', '/webdav'),
          workingBaseUrl + '/files/' + webdavUsername,
          workingBaseUrl + '/' + webdavUsername,
          workingBaseUrl.replace('/dav/', '/dav/' + webdavUsername + '/'),
          workingBaseUrl.replace('/dav', '') + '/' + webdavUsername,
        ];
        
        console.log(`🧪 Testing ${urlVariations.length} URL variations...`);
        let foundWorkingUrl = false;
        
        for (let i = 0; i < urlVariations.length; i++) {
          const testUrl = urlVariations[i];
          console.log(`🧪 Testing variation ${i + 1}/${urlVariations.length}: ${testUrl}`);
          
          try {
            const testResponse = await fetch(testUrl, {
              method: 'PROPFIND',
              headers: {
                'Authorization': `Basic ${btoa(`${webdavUsername}:${webdavPassword}`)}`,
                'Depth': '0',
                'Content-Type': 'text/xml',
              },
            });
            console.log(`📡 Test response ${i + 1}: ${testResponse.status} ${testResponse.statusText}`);
            
            // Accept various success codes for WebDAV
            if (testResponse.ok || testResponse.status === 207 || testResponse.status === 405 || testResponse.status === 403) {
              workingBaseUrl = testUrl;
              foundWorkingUrl = true;
              console.log(`✅ Found working base URL: ${workingBaseUrl}`);
              break;
            }
          } catch (testError) {
            const errorMessage = testError instanceof Error ? testError.message : String(testError)
            console.log(`❌ Test ${i + 1} failed with error: ${errorMessage}`);
            // Continue to next variation
          }
        }
        
        console.log(`🔍 Final working URL: ${workingBaseUrl}, Found working: ${foundWorkingUrl}`);
        console.log(`📋 All tested URLs: ${JSON.stringify(urlVariations)}`);
        
        if (!foundWorkingUrl) {
          console.log(`⚠️ No working URL found from ${urlVariations.length} variations, using original: ${workingBaseUrl}`);
        }
        
        // Create folder structure: {clientName}/{caseName}/{category}/{docType}
        // Use URL encoding for folder names to handle special characters
        const folders = [
          encodeURIComponent(clientName), 
          encodeURIComponent(caseName), 
          encodeURIComponent(category), 
          encodeURIComponent(docType)
        ];
        
        let currentPath = '';
        
        for (const folder of folders) {
          currentPath += `/${folder}`;
          const fullFolderUrl = `${workingBaseUrl}${currentPath}`;
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
        const fullUploadUrl = `${workingBaseUrl}${fullPath}`;
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
        
        // Try the upload with error retry logic
        let uploadResponse;
        let uploadAttempt = 1;
        const maxAttempts = 3;
        
        while (uploadAttempt <= maxAttempts) {
          console.log(`📤 Upload attempt ${uploadAttempt}/${maxAttempts} to: ${fullUploadUrl}`);
          
          try {
            uploadResponse = await fetch(fullUploadUrl, {
              method: 'PUT',
              headers: {
                'Authorization': `Basic ${btoa(`${webdavUsername}:${webdavPassword}`)}`,
                'Content-Type': 'application/octet-stream',
                'Content-Length': fileData.length.toString(),
              },
              body: fileData,
            });
            
            console.log(`📡 Upload response: ${uploadResponse.status} ${uploadResponse.statusText}`);
            
            // If successful or client error (don't retry), break
            if (uploadResponse.ok || uploadResponse.status < 500) {
              break;
            }
            
            // Server error, retry
            if (uploadAttempt < maxAttempts) {
              console.log(`⚠️ Server error ${uploadResponse.status}, retrying in 1 second...`);
              await new Promise(resolve => setTimeout(resolve, 1000));
            }
            
          } catch (fetchError) {
            console.error(`❌ Upload attempt ${uploadAttempt} failed:`, fetchError);
            if (uploadAttempt === maxAttempts) {
              throw fetchError;
            }
            await new Promise(resolve => setTimeout(resolve, 1000));
          }
          
          uploadAttempt++;
        }
        
        if (uploadResponse && (uploadResponse.ok || uploadResponse.status === 201 || uploadResponse.status === 204)) {
          console.log('✅ File uploaded successfully to hierarchical structure');
          return new Response(JSON.stringify({
            success: true,
            message: `File uploaded successfully to ${fullPath}`,
            path: fullPath,
            actualUrl: fullUploadUrl
          }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
          });
        } else if (uploadResponse) {
          const errorText = await uploadResponse.text();
          console.error('❌ Upload failed:', uploadResponse.status, uploadResponse.statusText, errorText);
          
          // Provide more specific error information
          let errorMessage = `Upload failed: ${uploadResponse.status} ${uploadResponse.statusText}`;
          let troubleshooting = '';
          
          if (uploadResponse.status === 404) {
            troubleshooting = `
            
🔍 TROUBLESHOOTING 404 ERROR:
- The WebDAV path '${fullUploadUrl}' was not found
- This usually means either:
  1. The WebDAV base URL is incorrect
  2. The folder structure doesn't exist and couldn't be created
  3. Authentication failed silently
  
💡 SOLUTION:
- Verify your WebDAV URL configuration in Supabase secrets
- Test WebDAV connection manually with these credentials
- Check if the server requires a different path structure`;
          } else if (uploadResponse.status === 401 || uploadResponse.status === 403) {
            troubleshooting = `
            
🔍 AUTHENTICATION ERROR:
- WebDAV credentials are being rejected
- Check username and password are correct in Supabase secrets`;
          }
          
          return new Response(JSON.stringify({
            success: false,
            error: errorMessage,
            details: errorText + troubleshooting,
            uploadUrl: fullUploadUrl,
            baseUrl: workingBaseUrl,
            testedUrls: urlVariations,
            foundWorkingUrl: foundWorkingUrl,
            folderPath: currentPath,
            httpStatus: uploadResponse.status,
            attempts: uploadAttempt - 1
          }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 400,
          });
        } else {
          return new Response(JSON.stringify({
            success: false,
            error: 'Upload failed: No response received',
            details: 'Failed to receive response from server'
          }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 500,
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
            const errorMessage = error instanceof Error ? error.message : String(error)
            console.log(`❌ Error testing ${testUrl}: ${errorMessage}`);
            testResults.push({
              path: testUrl,
              error: errorMessage
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
              const errorMessage = dirError instanceof Error ? dirError.message : String(dirError)
              console.log(`⚠️ Error creating directory ${currentPath}: ${errorMessage}`);
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
        const errorMessage = error instanceof Error ? error.message : String(error)
        console.error('❌ WebDAV upload failed:', errorMessage);
        return new Response(
          JSON.stringify({
            success: false,
            message: 'Failed to upload file',
            error: errorMessage
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
        
        // Clean the file path to avoid duplicate /crmdata/ in the URL
        let cleanFilePath = filePath;
        
        // If the base URL already contains 'crmdata' and the file path starts with '/crmdata/', remove it
        if (baseUrl.includes('/crmdata/') && cleanFilePath.startsWith('/crmdata/')) {
          cleanFilePath = cleanFilePath.substring('/crmdata/'.length);
          console.log(`🧹 Cleaned file path from '${filePath}' to '${cleanFilePath}'`);
        }
        
        // Remove leading slash if present to avoid double slashes
        if (cleanFilePath.startsWith('/')) {
          cleanFilePath = cleanFilePath.substring(1);
        }
        
        const downloadUrl = `${baseUrl}${cleanFilePath}`;

        console.log(`📥 Downloading from: ${downloadUrl}`);
        console.log(`📋 Base URL: ${baseUrl}`);
        console.log(`📋 Clean file path: ${cleanFilePath}`);

        const downloadResponse = await fetch(downloadUrl, {
          method: 'GET',
          headers: {
            'Authorization': authHeader,
          },
        });

        if (!downloadResponse.ok) {
          console.error(`❌ Download failed: ${downloadResponse.status} ${downloadResponse.statusText}`);
          console.error(`❌ Attempted URL: ${downloadUrl}`);
          
          return new Response(
            JSON.stringify({
              success: false,
              message: 'Failed to download from WebDAV',
              error: `WebDAV error: ${downloadResponse.status} ${downloadResponse.statusText}`,
              downloadUrl: downloadUrl,
              originalPath: filePath,
              cleanedPath: cleanFilePath
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

        console.log(`✅ Successfully downloaded file, size: ${uint8Array.length} bytes`);

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
        const errorMessage = error instanceof Error ? error.message : String(error)
        console.error(`❌ Download error: ${errorMessage}`);
        return new Response(
          JSON.stringify({
            success: false,
            message: 'Failed to download file',
            error: errorMessage
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
    const errorMessage = error instanceof Error ? error.message : String(error)
    console.error('❌ General error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        message: 'Internal server error',
        error: errorMessage
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      },
    )
  }
})