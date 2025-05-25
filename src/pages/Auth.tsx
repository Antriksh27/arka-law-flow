import React from 'react';
import { AuthForm } from '@/components/auth/AuthForm';
const Auth = () => {
  return <div className="min-h-screen bg-legal-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <img src="/lovable-uploads/a3cdf643-6752-4129-b6b5-dd61377068d4.png" alt="Arka Legal" className="h-12 w-auto mx-auto mb-4" />
          
          
        </div>
        <AuthForm />
      </div>
    </div>;
};
export default Auth;