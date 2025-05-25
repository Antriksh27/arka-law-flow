import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/ui/use-toast';
type AuthMode = 'login' | 'signup';
export const AuthForm: React.FC = () => {
  const [mode, setMode] = useState<AuthMode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);
  const {
    signIn,
    signUp
  } = useAuth();
  const {
    toast
  } = useToast();
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (mode === 'login') {
        const {
          error
        } = await signIn(email, password);
        if (error) {
          toast({
            title: 'Login Failed',
            description: error.message || 'Please check your credentials and try again.',
            variant: 'destructive'
          });
        }
      } else {
        const {
          error
        } = await signUp(email, password, fullName);
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
      <CardContent>
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
            <Input id="password" type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Enter your password" required minLength={6} />
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