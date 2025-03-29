import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../../hooks';
import { signIn, signUp, clearError } from '../../store/slices/authSlice';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { Lock, Mail, KeyRound, UserPlus, LogIn, AlertCircle, LayoutDashboard } from 'lucide-react';
import { addNotification } from '../../store/slices/uiSlice';
import { checkPasswordRequirements, testSupabaseConnection } from '../../lib/supabaseTest';
import { createTestUser, checkSupabaseAuthConfig } from '../../lib/devTools';

export function Auth() {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const [isRegistering, setIsRegistering] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [validationError, setValidationError] = useState<string | null>(null);
  
  // Get auth state from Redux
  const { isLoading, error: authError, user } = useAppSelector(state => {
    const auth = state.auth as { 
      isLoading: boolean;
      error: string | null;
      user: any;
    };
    return auth;
  });

  // Clear errors when toggling between login/signup
  useEffect(() => {
    dispatch(clearError());
    setValidationError(null);
  }, [isRegistering, dispatch]);

  // Redirect to dashboard if user is already logged in
  useEffect(() => {
    if (user) {
      navigate('/');
    }
  }, [user, navigate]);

  // Development mode flag 
  const isDevelopment = import.meta.env.DEV;

  // Test the Supabase connection in development mode
  const handleTestConnection = async () => {
    const result = await testSupabaseConnection();
    dispatch(addNotification({
      type: result ? 'success' : 'error',
      message: result ? 'Supabase connection successful!' : 'Supabase connection failed, check console logs',
    }));
  };

  const validateInputs = (): boolean => {
    setValidationError(null);

    // Email validation
    if (!email) {
      setValidationError('Email is required');
      return false;
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setValidationError('Please enter a valid email address');
      return false;
    }

    // Password validation
    if (!password) {
      setValidationError('Password is required');
      return false;
    }
    
    // Use our enhanced password validation
    const passwordCheck = checkPasswordRequirements(password);
    if (!passwordCheck.valid) {
      setValidationError(passwordCheck.issues[0]); // Show first issue
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    // Client-side validation before sending to the server
    if (!validateInputs()) {
      return;
    }

    try {
      if (isRegistering) {
        const result = await dispatch(signUp({ email, password }));
        // If signup was successful, navigate to dashboard
        if (!result.type.endsWith('/rejected')) {
          dispatch(addNotification({
            type: 'success',
            message: 'Account created successfully!',
          }));
        }
      } else {
        const result = await dispatch(signIn({ email, password }));
        // If login was successful, we'll be redirected by the useEffect
        if (!result.type.endsWith('/rejected')) {
          dispatch(addNotification({
            type: 'success',
            message: 'Signed in successfully!',
          }));
        }
      }
    } catch (error) {
      console.error('Error in auth flow:', error);
      // This catch block handles exceptions that aren't caught by the thunk
      dispatch(addNotification({
        type: 'error',
        message: error instanceof Error ? error.message : 'An unexpected error occurred',
      }));
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary-100">
          <Lock className="h-6 w-6 text-primary-600" />
        </div>
        <h2 className="mt-6 text-center text-3xl font-bold tracking-tight text-gray-900">
          HCP Targeter
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          {isRegistering ? 'Create your account' : 'Sign in to your account'}
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <form className="space-y-6" onSubmit={handleSubmit}>
            <Input
              id="email"
              name="email"
              type="email"
              label="Email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              fullWidth
              leftIcon={<Mail className="h-4 w-4 text-gray-400" />}
            />

            <Input
              id="password"
              name="password"
              type="password"
              label="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              fullWidth
              leftIcon={<KeyRound className="h-4 w-4 text-gray-400" />}
            />

            {(validationError || authError) && (
              <div className="rounded-md bg-red-50 p-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <AlertCircle className="h-5 w-5 text-red-400" aria-hidden="true" />
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-red-700">{validationError || authError}</p>
                  </div>
                </div>
              </div>
            )}

            <div className="flex flex-col space-y-3">
              <Button
                type="submit"
                isLoading={isLoading}
                fullWidth
                variant="default"
                leftIcon={isRegistering ? <UserPlus className="h-4 w-4" /> : <LogIn className="h-4 w-4" />}
              >
                {isRegistering ? 'Sign up' : 'Sign in'}
              </Button>
              
              <Button
                type="button"
                onClick={() => { setIsRegistering(!isRegistering); setValidationError(null); }}
                variant="link"
                className="text-sm"
              >
                {isRegistering 
                  ? 'Already have an account? Sign in' 
                  : 'Need an account? Sign up'}
              </Button>
              
              {/* Debug buttons only visible in development */}
              {isDevelopment && (
                <div className="mt-4 space-y-2 border-t pt-4">
                  <p className="text-xs text-gray-500 font-medium">Development Tools:</p>
                  <Button
                    type="button"
                    onClick={handleTestConnection}
                    variant="outline"
                    size="sm"
                    className="text-xs w-full"
                    leftIcon={<LayoutDashboard className="h-3 w-3" />}
                  >
                    Test Supabase Connection
                  </Button>
                  
                  <Button
                    type="button"
                    onClick={async () => {
                      const result = await createTestUser();
                      if (result.success && result.email && result.password) {
                        setEmail(result.email);
                        setPassword(result.password);
                        dispatch(addNotification({
                          type: 'success',
                          message: `Test user created: ${result.email}`,
                        }));
                      } else {
                        dispatch(addNotification({
                          type: 'error',
                          message: result.message,
                        }));
                      }
                    }}
                    variant="outline"
                    size="sm"
                    className="text-xs w-full"
                    leftIcon={<UserPlus className="h-3 w-3" />}
                  >
                    Create Test User
                  </Button>
                  
                  <Button
                    type="button"
                    onClick={async () => {
                      const result = await checkSupabaseAuthConfig();
                      dispatch(addNotification({
                        type: result.enabled ? 'success' : 'error',
                        message: result.details,
                      }));
                    }}
                    variant="outline"
                    size="sm"
                    className="text-xs w-full"
                    leftIcon={<Lock className="h-3 w-3" />}
                  >
                    Check Auth Config
                  </Button>
                </div>
              )}
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
