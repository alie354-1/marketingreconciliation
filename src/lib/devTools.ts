import { supabase } from './supabase';

/**
 * DEV ONLY: Create a test user account
 * This function helps with development and testing by creating a user
 * with known credentials that you can use to sign in.
 */
export const createTestUser = async (): Promise<{
  success: boolean;
  message: string;
  email?: string;
  password?: string;
}> => {
  if (import.meta.env.PROD) {
    return {
      success: false,
      message: 'This function is only available in development mode'
    };
  }

  try {
    // Generate deterministic but unique credentials
    const timestamp = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const testEmail = `test_${timestamp}@example.com`;
    const testPassword = `Test123!${timestamp}`;
    
    console.log('Creating test user with credentials:', {
      email: testEmail,
      password: testPassword,
    });

    // Attempt to create the user without email confirmation
    const { data, error } = await supabase.auth.signUp({
      email: testEmail,
      password: testPassword,
      options: {
        data: {
          is_test_account: true,
        }
      }
    });

    if (error) {
      console.error('Error creating test user:', error);
      return {
        success: false,
        message: `Failed to create test user: ${error.message}`
      };
    }

    return {
      success: true,
      message: 'Test user created successfully!',
      email: testEmail,
      password: testPassword
    };
  } catch (error) {
    console.error('Unexpected error creating test user:', error);
    return {
      success: false,
      message: `Unexpected error: ${error instanceof Error ? error.message : String(error)}`
    };
  }
};

/**
 * Check if Supabase email auth is properly enabled
 * This can help identify if the project is correctly configured
 */
export const checkSupabaseAuthConfig = async (): Promise<{
  enabled: boolean;
  details: string;
}> => {
  try {
    // Try to get the auth configuration (this is a workaround since there's no direct API for this)
    const { data, error } = await supabase.auth.getSession();
    
    if (error) {
      return {
        enabled: false,
        details: `Error checking auth config: ${error.message}`
      };
    }

    // If we can get the session info, auth is likely working at some level
    return {
      enabled: true,
      details: 'Supabase auth appears to be properly configured'
    };
  } catch (error) {
    return {
      enabled: false,
      details: `Error checking auth config: ${error instanceof Error ? error.message : String(error)}`
    };
  }
};
