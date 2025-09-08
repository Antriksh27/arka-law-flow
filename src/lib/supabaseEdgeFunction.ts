/**
 * Helper function for calling Supabase Edge Functions with proper authorization
 */

const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhwY25pcGNieW1ydXZzbnFybWp4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDUyNjIzNTMsImV4cCI6MjA2MDgzODM1M30.d65xnv4f9JyaRlrBHaCPl_W4_EiQaYIs97Eph_MEJtY";
const SUPABASE_PROJECT_URL = "https://hpcnipcbymruvsnqrmjx.supabase.co";

/**
 * Call a Supabase Edge Function with proper headers
 * @param fnName - Function name or function name with query params for GET requests
 * @param method - HTTP method (GET, POST, etc.)
 * @param body - Request body for POST requests
 * @returns Response data or blob for file downloads
 */
export async function callSupabaseFunction(
  fnName: string, 
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' = 'POST', 
  body?: any
): Promise<any> {
  const url = `${SUPABASE_PROJECT_URL}/functions/v1/${fnName}`;
  
  const headers: Record<string, string> = {
    "Authorization": `Bearer ${SUPABASE_ANON_KEY}`,
    "Content-Type": "application/json",
  };

  const config: RequestInit = {
    method,
    headers,
  };

  // Add body for non-GET requests
  if (method !== 'GET' && body) {
    config.body = JSON.stringify(body);
  }

  try {
    console.log(`🚀 Calling Supabase function: ${method} ${url}`);
    
    const response = await fetch(url, config);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ Supabase function error (${response.status}):`, errorText);
      throw new Error(`HTTP ${response.status}: ${errorText}`);
    }

    // For file downloads (GET requests), return blob
    if (method === 'GET') {
      const contentType = response.headers.get('content-type');
      
      // If it's JSON (error response), parse as JSON
      if (contentType?.includes('application/json')) {
        const data = await response.json();
        if (data.error) {
          throw new Error(data.error);
        }
        return data;
      }
      
      // Otherwise return as blob for file content
      return await response.blob();
    }

    // For other requests, parse JSON
    const data = await response.json();
    
    console.log(`✅ Supabase function response:`, data);
    
    return data;
    
  } catch (error) {
    console.error(`💥 Error calling Supabase function ${fnName}:`, error);
    throw error;
  }
}

/**
 * Helper function specifically for WebDAV operations
 */
export async function callWebDAVFunction(
  operation: 'upload' | 'download' | 'createFolder',
  params: any
): Promise<any> {
  if (operation === 'download') {
    // For downloads, use GET with query parameters
    const { clientName, caseName, docType, fileName } = params;
    const queryParams = new URLSearchParams({
      clientName,
      caseName, 
      docType,
      fileName
    });
    
    return await callSupabaseFunction(`pydio-webdav?${queryParams.toString()}`, 'GET');
  } else {
    // For uploads and folder creation, use POST
    return await callSupabaseFunction('pydio-webdav', 'POST', params);
  }
}
