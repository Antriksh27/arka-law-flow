import React from 'react';
import { SignIn1 } from '@/components/ui/modern-stunning-sign-in';
import { useAuth } from '@/contexts/AuthContext';
import { Navigate } from 'react-router-dom';

const Auth: React.FC = () => {
  const { user, loading } = useAuth();

  // If already authenticated, redirect away from the auth page
  if (!loading && user) {
    return <Navigate to="/" replace />;
  }

  return <SignIn1 />;
};

export default Auth;
