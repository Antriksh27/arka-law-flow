"use client";

import React, { useState, useEffect } from "react";
import {
  Eye,
  EyeOff,
  Github,
  Twitter,
  Linkedin,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import "../../index.css";

const LoginPage: React.FC = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isEmailFocused, setIsEmailFocused] = useState(false);
  const [isPasswordFocused, setIsPasswordFocused] = useState(false);
  const [isEmailValid, setIsEmailValid] = useState(true);
  const [isFormSubmitted, setIsFormSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const { signIn } = useAuth();
  const { toast } = useToast();

  // Email validation
  const validateEmail = (email: string) => {
    const re =
      /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    return re.test(String(email).toLowerCase());
  };

  // Handle email change
  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value);
    if (e.target.value) {
      setIsEmailValid(validateEmail(e.target.value));
    } else {
      setIsEmailValid(true);
    }
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsFormSubmitted(true);

    if (email && password && validateEmail(email)) {
      setIsLoading(true);
      console.log("Attempting to sign in with:", { email, password, rememberMe });
      
      try {
        const { error } = await signIn(email, password);
        
        if (error) {
          console.error("Sign in error:", error);
          toast({
            variant: "destructive",
            title: "Sign in failed",
            description: error.message || "An error occurred during sign in",
          });
        } else {
          // Success feedback
          const form = document.querySelector(".login-form") as HTMLElement;
          if (form) {
            form.classList.add("form-success");
            setTimeout(() => {
              form.classList.remove("form-success");
            }, 1500);
          }
          
          toast({
            title: "Success",
            description: "You have been signed in successfully",
          });
        }
      } catch (error) {
        console.error("Unexpected error:", error);
        toast({
          variant: "destructive",
          title: "Sign in failed",
          description: "An unexpected error occurred",
        });
      } finally {
        setIsLoading(false);
      }
    } else {
      toast({
        variant: "destructive",
        title: "Invalid form",
        description: "Please enter a valid email and password",
      });
    }
  };

  // Set dark mode on component mount
  useEffect(() => {
    document.documentElement.classList.add("dark-mode");
  }, []);

  // Create particles
  useEffect(() => {
    const canvas = document.getElementById("particles") as HTMLCanvasElement;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Set canvas size
    const setCanvasSize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    setCanvasSize();
    window.addEventListener("resize", setCanvasSize);

    // Particle class
    class Particle {
      x: number;
      y: number;
      size: number;
      speedX: number;
      speedY: number;
      color: string;

      constructor() {
        this.x = Math.random() * canvas.width;
        this.y = Math.random() * canvas.height;
        this.size = Math.random() * 3 + 1;
        this.speedX = (Math.random() - 0.5) * 0.5;
        this.speedY = (Math.random() - 0.5) * 0.5;
        this.color = `rgba(255, 255, 255, ${Math.random() * 0.2})`;
      }

      update() {
        this.x += this.speedX;
        this.y += this.speedY;

        if (this.x > canvas.width) this.x = 0;
        if (this.x < 0) this.x = canvas.width;
        if (this.y > canvas.height) this.y = 0;
        if (this.y < 0) this.y = canvas.height;
      }

      draw() {
        if (!ctx) return;
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    const particles: Particle[] = [];
    const particleCount = Math.min(
      100,
      Math.floor((canvas.width * canvas.height) / 15000)
    );

    for (let i = 0; i < particleCount; i++) {
      particles.push(new Particle());
    }

    const animate = () => {
      if (!ctx) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      for (const particle of particles) {
        particle.update();
        particle.draw();
      }

      requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener("resize", setCanvasSize);
    };
  }, []);

  return (
    <div className="login-container dark">
      <canvas id="particles" className="particles-canvas"></canvas>

      <div className="login-card">
        <div className="login-card-inner">
          <div className="login-header">
            <h1>Welcome</h1>
            <p>Please sign in to continue</p>
          </div>

          <form className="login-form" onSubmit={handleSubmit}>
            <div
              className={`form-field ${
                isEmailFocused || email ? "active" : ""
              } ${!isEmailValid && email ? "invalid" : ""}`}
            >
              <input
                type="email"
                id="email"
                value={email}
                onChange={handleEmailChange}
                onFocus={() => setIsEmailFocused(true)}
                onBlur={() => setIsEmailFocused(false)}
                required
                disabled={isLoading}
              />
              <label htmlFor="email">Email Address</label>
              {!isEmailValid && email && (
                <span className="error-message">
                  Please enter a valid email
                </span>
              )}
            </div>

            <div
              className={`form-field ${
                isPasswordFocused || password ? "active" : ""
              }`}
            >
              <input
                type={showPassword ? "text" : "password"}
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onFocus={() => setIsPasswordFocused(true)}
                onBlur={() => setIsPasswordFocused(false)}
                required
                disabled={isLoading}
              />
              <label htmlFor="password">Password</label>
              <button
                type="button"
                className="toggle-password"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? "Hide password" : "Show password"}
                disabled={isLoading}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>

            <div className="form-options">
              <label className="remember-me">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={() => setRememberMe(!rememberMe)}
                  disabled={isLoading}
                />
                <span className="checkmark"></span>
                Remember me
              </label>

              <a href="#" className="forgot-password">
                Forgot Password?
              </a>
            </div>

            <button
              type="submit"
              className="login-button"
              disabled={
                isLoading || (isFormSubmitted && (!email || !password || !isEmailValid))
              }
            >
              {isLoading ? "Signing In..." : "Sign In"}
            </button>
          </form>

          <div className="separator">
            <span>or continue with</span>
          </div>

          <div className="social-login">
            <button className="social-button github" disabled={isLoading}>
              <Github size={18} />
            </button>
            <button className="social-button twitter" disabled={isLoading}>
              <Twitter size={18} />
            </button>
            <button className="social-button linkedin" disabled={isLoading}>
              <Linkedin size={18} />
            </button>
          </div>

          <p className="signup-prompt">
            Don't have an account? <a href="#">Sign up</a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
