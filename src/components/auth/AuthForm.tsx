import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/ui/use-toast';
import { sanitizeInput, isValidEmail, validatePasswordStrength, RateLimiter } from '@/lib/security';
type AuthMode = 'login' | 'signup';
// Rate limiter for login attempts
const loginRateLimiter = new RateLimiter(5, 15 * 60 * 1000); // 5 attempts per 15 minutes

export const AuthForm: React.FC = () => {
  const [mode, setMode] = useState<AuthMode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const {
    signIn,
    signUp
  } = useAuth();
  const {
    toast
  } = useToast();
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Sanitize inputs
    const sanitizedEmail = sanitizeInput(email).toLowerCase();
    const sanitizedFullName = sanitizeInput(fullName);
    
    // Validate inputs
    if (!isValidEmail(sanitizedEmail)) {
      toast({
        title: 'Invalid Email',
        description: 'Please enter a valid email address.',
        variant: 'destructive'
      });
      return;
    }
    
    // Rate limiting for login attempts
    if (mode === 'login' && !loginRateLimiter.isAllowed(sanitizedEmail)) {
      const remainingTime = Math.ceil(loginRateLimiter.getRemainingTime(sanitizedEmail) / 1000 / 60);
      toast({
        title: 'Too Many Attempts',
        description: `Please wait ${remainingTime} minutes before trying again.`,
        variant: 'destructive'
      });
      return;
    }
    
    // Validate password strength for signup
    if (mode === 'signup') {
      const passwordValidation = validatePasswordStrength(password);
      if (!passwordValidation.isValid) {
        toast({
          title: 'Weak Password',
          description: passwordValidation.errors.join(' '),
          variant: 'destructive'
        });
        return;
      }
    }
    
    setLoading(true);
    try {
      if (mode === 'login') {
        const { error } = await signIn(sanitizedEmail, password);
        if (error) {
          toast({
            title: 'Login Failed',
            description: error.message || 'Please check your credentials and try again.',
            variant: 'destructive'
          });
        }
      } else {
        const { error } = await signUp(sanitizedEmail, password, sanitizedFullName);
        if (error) {
          toast({
            title: 'Signup Failed',
            description: error.message || 'Please try again with different credentials.',
            variant: 'destructive'
          });
        } else {
          toast({
            title: 'Account Created',
            description: 'Please check your email to verify your account.'
          });
          setMode('login');
          // Clear form
          setEmail('');
          setPassword('');
          setFullName('');
        }
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'An unexpected error occurred. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };
  return <Card className="w-full max-w-md">
      <CardHeader className="text-center bg-slate-900">
        <CardTitle className="text-2xl font-bold">
          {mode === 'login' ? 'Welcome Back' : 'Create Account'}
        </CardTitle>
        <CardDescription>
          {mode === 'login' ? 'Sign in to your Arka Legal account' : 'Sign up for a new Arka Legal account'}
        </CardDescription>
      </CardHeader>
      <CardContent className="bg-gray-50">
        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === 'signup' && <div className="space-y-2">
              <Label htmlFor="fullName">Full Name</Label>
              <Input id="fullName" type="text" value={fullName} onChange={e => setFullName(e.target.value)} placeholder="Enter your full name" required />
            </div>}
          
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="Enter your email" required />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <div className="relative">
              <Input 
                id="password" 
                type={showPassword ? "text" : "password"} 
                value={password} 
                onChange={e => setPassword(e.target.value)} 
                placeholder={mode === 'signup' ? "Enter a strong password (12+ chars)" : "Enter your password"}
                required 
                minLength={mode === 'signup' ? 12 : 6}
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? "Hide" : "Show"}
              </Button>
            </div>
            {mode === 'signup' && (
              <p className="text-sm text-muted-foreground">
                Must contain uppercase, lowercase, numbers, and symbols (12+ characters)
              </p>
            )}
          </div>
          
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? 'Please wait...' : mode === 'login' ? 'Sign In' : 'Create Account'}
          </Button>
        </form>
        
        <div className="mt-4 text-center">
          <Button variant="link" onClick={() => setMode(mode === 'login' ? 'signup' : 'login')} className="text-sm">
            {mode === 'login' ? "Don't have an account? Sign up" : 'Already have an account? Sign in'}
          </Button>
        </div>
      </CardContent>
    </Card>;
};