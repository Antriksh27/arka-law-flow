"use client";

import * as React from "react";
import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
const SignIn1 = () => {
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [error, setError] = React.useState("");
  const [isLoading, setIsLoading] = React.useState(false);
  const {
    signIn
  } = useAuth();
  const {
    toast
  } = useToast();
  const validateEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };
  const handleSignIn = async () => {
    if (!email || !password) {
      setError("Please enter both email and password.");
      return;
    }
    if (!validateEmail(email)) {
      setError("Please enter a valid email address.");
      return;
    }
    setError("");
    setIsLoading(true);
    try {
      const {
        error
      } = await signIn(email, password);
      if (error) {
        setError(error.message || "Sign in failed. Please try again.");
        toast({
          variant: "destructive",
          title: "Sign in failed",
          description: error.message || "An error occurred during sign in"
        });
      } else {
        toast({
          title: "Success",
          description: "You have been signed in successfully"
        });
      }
    } catch (error) {
      setError("An unexpected error occurred. Please try again.");
      toast({
        variant: "destructive",
        title: "Sign in failed",
        description: "An unexpected error occurred"
      });
    } finally {
      setIsLoading(false);
    }
  };
  return <div className="min-h-screen flex flex-col items-center justify-center bg-slate-800 relative overflow-hidden w-full rounded-xl">
      {/* Centered glass card */}
      <div className="relative z-10 w-full max-w-sm rounded-3xl bg-gradient-to-r from-[#ffffff10] to-slate-800 backdrop-blur-sm shadow-2xl p-8 flex flex-col items-center">
        {/* Logo */}
        
        {/* Title */}
        <h2 className="text-2xl font-semibold text-white mb-6 text-center">
          Arka Legal
        </h2>
        {/* Form */}
        <div className="flex flex-col w-full gap-4">
          <div className="w-full flex flex-col gap-3">
            <input placeholder="Email" type="email" value={email} className="w-full px-5 py-3 rounded-xl bg-white/10 text-white placeholder-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-gray-400" onChange={e => setEmail(e.target.value)} disabled={isLoading} />
            <input placeholder="Password" type="password" value={password} className="w-full px-5 py-3 rounded-xl bg-white/10 text-white placeholder-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-gray-400" onChange={e => setPassword(e.target.value)} disabled={isLoading} />
            {error && <div className="text-sm text-red-400 text-left">{error}</div>}
          </div>
          <hr className="opacity-10" />
          <div>
            <button onClick={handleSignIn} disabled={isLoading} className="w-full bg-white/10 text-white font-medium px-5 py-3 rounded-full shadow hover:bg-white/20 transition mb-3 text-sm disabled:opacity-50 disabled:cursor-not-allowed">
              {isLoading ? "Signing in..." : "Sign in"}
            </button>
            {/* Google Sign In */}
            
            <div className="w-full text-center mt-2">
              
            </div>
          </div>
        </div>
      </div>
      {/* User count and avatars */}
      
    </div>;
};
export { SignIn1 };