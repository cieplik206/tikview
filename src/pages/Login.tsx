import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { User, Lock, LogIn, AlertCircle, Wifi } from 'lucide-react';
import { useLogin } from '../hooks/useMikrotikQuery';
import { setAuthData } from '../store/slices/authSlice';

interface Credentials {
  username: string;
  password: string;
}

export const Login: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const loginMutation = useLogin();
  
  const [credentials, setCredentials] = useState<Credentials>({
    username: '',
    password: ''
  });
  const [rememberMe, setRememberMe] = useState(true);

  // Load saved credentials on mount
  useEffect(() => {
    const saved = localStorage.getItem('lastCredentials');
    if (saved) {
      try {
        const { username, remember } = JSON.parse(saved);
        setCredentials(prev => ({ ...prev, username }));
        setRememberMe(remember);
      } catch (e) {
        console.error('Failed to load saved credentials');
      }
    }
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate inputs
    if (!credentials.username || !credentials.password) {
      return;
    }
    
    try {
      const result = await loginMutation.mutateAsync({
        username: credentials.username,
        password: credentials.password
      });
      
      if (result.success) {
        // Update Redux state (without credentials - those stay in sessionStorage only)
        dispatch(setAuthData({
          isAuthenticated: true,
          username: credentials.username
        }));
        
        // Save to sessionStorage for better security (clears when tab closes)
        // Only store base64 credentials here, never in Redux or React Query cache
        sessionStorage.setItem('auth', JSON.stringify({
          username: credentials.username,
          credentials: result.credentials,
          isAuthenticated: true
        }));
        
        // Save username if remember me is checked
        if (rememberMe) {
          localStorage.setItem('lastCredentials', JSON.stringify({
            username: credentials.username,
            remember: true
          }));
        } else {
          localStorage.removeItem('lastCredentials');
        }
        
        // Navigate to dashboard
        navigate('/dashboard/overview', { replace: true });
      }
    } catch (err) {
      console.error('Login error:', err);
      // Error is handled by the mutation
    }
  };

  const handleInputChange = (field: keyof Credentials) => (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    setCredentials(prev => ({
      ...prev,
      [field]: e.target.value
    }));
  };

  return (
    <div className="min-h-screen hero bg-base-200">
      {/* Animated background gradient */}
      <div className="hero-overlay bg-gradient-to-br from-primary/20 via-accent/10 to-secondary/20"></div>
      
      <div className="hero-content flex-col lg:flex-row-reverse">
        {/* Login Card */}
        <div className="card bg-base-100 shadow-2xl w-full max-w-md">
          <div className="card-body">
            {/* Header */}
            <div className="text-center mb-6">
              <h1 className="text-3xl font-bold text-primary mb-2">TikView Login</h1>
              <p className="text-base-content/70 text-sm">Connect to your MikroTik router</p>
            </div>

            {/* Login Form */}
            <form onSubmit={handleLogin} className="space-y-4">
              {/* Username Input */}
              <div className="form-control w-full">
                <label className="label">
                  <span className="label-text">Username</span>
                </label>
                <label className="input input-bordered flex items-center gap-2 w-full">
                  <User className="h-4 w-4 opacity-70" />
                  <input
                    type="text"
                    className="grow"
                    placeholder="Enter username"
                    value={credentials.username}
                    onChange={handleInputChange('username')}
                    disabled={loginMutation.isPending}
                    autoComplete="username"
                  />
                </label>
              </div>

              {/* Password Input */}
              <div className="form-control w-full">
                <label className="label">
                  <span className="label-text">Password</span>
                </label>
                <label className="input input-bordered flex items-center gap-2 w-full">
                  <Lock className="h-4 w-4 opacity-70" />
                  <input
                    type="password"
                    className="grow"
                    placeholder="Enter password"
                    value={credentials.password}
                    onChange={handleInputChange('password')}
                    disabled={loginMutation.isPending}
                    autoComplete="current-password"
                  />
                </label>
              </div>

              {/* Remember Me */}
              <div className="form-control">
                <label className="label cursor-pointer justify-start gap-3">
                  <input
                    type="checkbox"
                    className="checkbox checkbox-primary"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                  />
                  <span className="label-text">Remember me</span>
                </label>
              </div>

              {/* Error Message */}
              {loginMutation.isError && (
                <div className="alert alert-error">
                  <AlertCircle className="h-5 w-5" />
                  <span>{loginMutation.error?.message || 'Login failed. Please check your credentials.'}</span>
                </div>
              )}

              {/* Login Button */}
              <button
                type="submit"
                className="btn btn-primary w-full btn-lg"
                disabled={loginMutation.isPending || !credentials.username || !credentials.password}
              >
                {loginMutation.isPending ? (
                  <>
                    <span className="loading loading-spinner"></span>
                    Connecting...
                  </>
                ) : (
                  <>
                    <LogIn className="h-5 w-5" />
                    Login
                  </>
                )}
              </button>
            </form>

            {/* Footer */}
            <div className="divider">REST API</div>
            <div className="text-center text-sm text-base-content/70">
              <p>Uses MikroTik REST API for secure communication</p>
              <div className="flex gap-2 justify-center mt-2">
                <span className="badge badge-outline">RouterOS 7.x</span>
                <span className="badge badge-outline">REST API</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right side - Hero content */}
        <div className="text-center lg:text-left max-w-lg">
          <h2 className="text-4xl font-bold text-base-content mb-4">Welcome Back!</h2>
          <p className="text-base-content/70 mb-8">
            Access your MikroTik router's dashboard with a modern, responsive interface.
          </p>
          
          <div className="stats stats-vertical lg:stats-horizontal shadow-xl w-full bg-base-100/90">
            <div className="stat">
              <div className="stat-figure text-primary">
                <Wifi className="w-8 h-8" />
              </div>
              <div className="stat-title">Network</div>
              <div className="stat-value text-primary">Ready</div>
              <div className="stat-desc">Real-time monitoring</div>
            </div>
          </div>
        </div>
      </div>

      {/* Copyright Footer */}
      <div className="absolute bottom-4 left-0 right-0 text-center">
        <p className="text-xs text-base-content/60">
          © {new Date().getFullYear()} TikView. All rights reserved. | 
          <a href="https://tikview.net" target="_blank" rel="noopener noreferrer" className="link link-hover ml-1">
            tikview.net
          </a>
        </p>
      </div>

      <style>{`
        /* Add subtle animation to the hero overlay */
        .hero-overlay {
          animation: gradient-shift 15s ease infinite;
          background-size: 200% 200%;
        }
        
        @keyframes gradient-shift {
          0% {
            background-position: 0% 50%;
          }
          50% {
            background-position: 100% 50%;
          }
          100% {
            background-position: 0% 50%;
          }
        }
      `}</style>
    </div>
  );
};