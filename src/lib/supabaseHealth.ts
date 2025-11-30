import { supabase } from '@/integrations/supabase/client';

export interface HealthCheckResult {
  success: boolean;
  authWorking: boolean;
  databaseWorking: boolean;
  error?: string;
  latency?: number;
}

export async function checkSupabaseHealth(): Promise<HealthCheckResult> {
  const startTime = Date.now();
  
  try {
    // Test 1: Check if auth endpoint is reachable
    const { data: { session }, error: authError } = await Promise.race([
      supabase.auth.getSession(),
      new Promise<any>((_, reject) => 
        setTimeout(() => reject(new Error('Auth timeout')), 15000)
      )
    ]);
    
    if (authError) {
      return {
        success: false,
        authWorking: false,
        databaseWorking: false,
        error: `Auth check failed: ${authError.message}`
      };
    }
    
    // Test 2: Check if database queries work with a simple public query
    const { data: dbData, error: dbError } = await Promise.race([
      supabase.from('law_firms').select('id').limit(1),
      new Promise<any>((_, reject) => 
        setTimeout(() => reject(new Error('Database timeout')), 15000)
      )
    ]);
    
    if (dbError) {
      return {
        success: false,
        authWorking: true,
        databaseWorking: false,
        error: `Database check failed: ${dbError.message}`,
        latency: Date.now() - startTime
      };
    }
    
    return {
      success: true,
      authWorking: true,
      databaseWorking: true,
      latency: Date.now() - startTime
    };
    
  } catch (error: any) {
    return {
      success: false,
      authWorking: false,
      databaseWorking: false,
      error: `Health check failed: ${error.message}`
    };
  }
}

export async function retryQuery<T>(
  queryFn: () => Promise<T>,
  maxRetries: number = 3,
  delayMs: number = 1000
): Promise<T> {
  let lastError: Error | null = null;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`🔄 Query attempt ${attempt}/${maxRetries}`);
      const result = await Promise.race([
        queryFn(),
        new Promise<never>((_, reject) => 
          setTimeout(() => reject(new Error('Query timeout')), 15000)
        )
      ]);
      console.log(`✅ Query succeeded on attempt ${attempt}`);
      return result;
    } catch (error: any) {
      lastError = error;
      console.warn(`❌ Query attempt ${attempt} failed:`, error.message);
      
      if (attempt < maxRetries) {
        const delay = delayMs * Math.pow(2, attempt - 1); // Exponential backoff
        console.log(`⏳ Retrying in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  
  throw lastError || new Error('Query failed after all retries');
}
