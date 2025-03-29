import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

// Enable debug logs in development mode
const isDevelopment = import.meta.env.DEV;

// Enhanced Supabase client configuration
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    flowType: 'implicit' // Use implicit flow for simpler auth
  },
  global: {
    headers: {
      'Content-Type': 'application/json',
      'X-Client-Info': 'marketing-reconciliation-app'
    },
    fetch: (...args) => {
      // Add request debugging in development
      if (isDevelopment) {
        console.log('Supabase API Request:', args[0]);
      }
      return fetch(...args);
    }
  }
});

// Export a helper to get detailed error information
export const getSupabaseErrorDetails = (error: any): string => {
  if (!error) return 'Unknown error';
  
  // Handle Supabase-specific error format
  if (error.error_description) return error.error_description;
  if (error.message) return error.message;
  
  // Generic fallback
  return JSON.stringify(error);
};
