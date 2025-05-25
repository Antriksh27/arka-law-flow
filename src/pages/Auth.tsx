
import React from 'react';
import { AuthForm } from '@/components/auth/AuthForm';

const Auth = () => {
  return (
    <div className="min-h-screen bg-legal-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <img 
            src="/lovable-uploads/a3cdf643-6752-4129-b6b5-dd61377068d4.png" 
            alt="Arka Legal" 
            className="h-12 w-auto mx-auto mb-4"
          />
          <h1 className="text-3xl font-bold text-legal-text">Arka Legal</h1>
          <p className="text-gray-600 mt-2">Legal CRM Platform</p>
        </div>
        <AuthForm />
      </div>
    </div>
  );
};

export default Auth;
