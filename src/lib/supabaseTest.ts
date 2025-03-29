import { supabase, getSupabaseErrorDetails } from './supabase';

/**
 * Utility function to test the Supabase connection
 * This can be helpful for debugging authentication issues
 */
export const testSupabaseConnection = async (): Promise<boolean> => {
  try {
    // Try to get the current user's session info
    console.log('Testing Supabase connection...');
    
    // We can't directly access protected properties, so let's just check connection
    console.log('Supabase configuration check initiated');
    
    // Test auth endpoints
    const { data, error } = await supabase.auth.getSession();
    
    if (error) {
      console.error('Supabase connection test failed:', getSupabaseErrorDetails(error));
      return false;
    }
    
    console.log('Supabase connection test successful:', data);
    return true;
  } catch (error) {
    console.error('Unexpected error during Supabase connection test:', error);
    return false;
  }
};

/**
 * Utility to test password requirements
 * This can help debug 422 errors during signup
 */
export const checkPasswordRequirements = (password: string): { 
  valid: boolean; 
  issues: string[];
} => {
  const issues: string[] = [];
  
  if (password.length < 6) {
    issues.push('Password must be at least 6 characters long');
  }
  
  if (!/[A-Z]/.test(password)) {
    issues.push('Password should contain at least one uppercase letter');
  }
  
  if (!/[a-z]/.test(password)) {
    issues.push('Password should contain at least one lowercase letter');
  }
  
  if (!/[0-9]/.test(password)) {
    issues.push('Password should contain at least one number');
  }
  
  return {
    valid: issues.length === 0,
    issues
  };
};
