import React, { useState } from 'react';
import { useClientAuth } from '@/contexts/ClientAuthContext';
import { Navigate, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

const ClientAuth: React.FC = () => {
  const { user, loading, signInWithPhone } = useClientAuth();
  const navigate = useNavigate();
  const [phone, setPhone] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  if (!loading && user) {
    return <Navigate to="/client/cases" replace />;
  }

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate phone number
    const phoneRegex = /^[6-9]\d{9}$/;
    if (!phoneRegex.test(phone)) {
      setError('Please enter a valid 10-digit mobile number starting with 6-9');
      return;
    }

    setError('');
    setIsLoading(true);
    const formattedPhone = `+91${phone}`;
    
    const result = await signInWithPhone(formattedPhone);
    
    if (result.success) {
      toast.success('Login successful!');
      navigate('/client/cases');
    } else {
      setError(result.error || 'Login failed. Please check your mobile number.');
      toast.error(result.error || 'Login failed');
    }
    
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-800 relative overflow-hidden w-full rounded-xl">
      {/* Centered glass card */}
      <div className="relative z-10 w-full max-w-sm rounded-3xl bg-gradient-to-r from-[#ffffff10] to-slate-800 backdrop-blur-sm shadow-2xl p-8 flex flex-col items-center">
        {/* Logo */}
        <div className="mb-6">
          <img src="/lovable-uploads/30e004e6-73ad-4686-9de7-5e4312987f74.png" alt="HRU Legal" className="h-16 w-auto" />
        </div>
        
        {/* Form */}
        <form onSubmit={handleSignIn} className="flex flex-col w-full gap-4">
          <div className="w-full flex flex-col gap-3">
            <div className="flex gap-2">
              <div className="flex items-center justify-center px-3 py-3 rounded-xl bg-white/10 text-white text-sm font-medium">
                +91
              </div>
              <input 
                placeholder="Mobile Number" 
                type="tel" 
                value={phone}
                className="flex-1 px-5 py-3 rounded-xl bg-white/10 text-white placeholder-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-gray-400" 
                onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                maxLength={10}
                disabled={isLoading}
                required
              />
            </div>
            {error && <div className="text-sm text-red-400 text-left">{error}</div>}
          </div>
          <hr className="opacity-10" />
          <div>
            <button 
              type="submit"
              disabled={isLoading || phone.length !== 10}
              className="w-full bg-white/10 font-medium px-5 py-3 rounded-full shadow hover:bg-white/20 transition mb-3 text-sm disabled:opacity-50 disabled:cursor-not-allowed text-white flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Signing in...
                </>
              ) : (
                'Sign in to Client Portal'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ClientAuth;