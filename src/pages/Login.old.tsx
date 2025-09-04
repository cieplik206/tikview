import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { User, Lock, LogIn, AlertCircle, Wifi } from 'lucide-react';
import { loginAsync, selectAuthLoading, selectAuthError, selectIsAuthenticated } from '../store/slices/authSlice';
import type { AppDispatch } from '../store';

interface Credentials {
  username: string;
  password: string;
}

export const Login: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();
  const loading = useSelector(selectAuthLoading);
  const error = useSelector(selectAuthError);
  const isAuthenticated = useSelector(selectIsAuthenticated);

  const [credentials, setCredentials] = useState<Credentials>({
    username: '',
    password: ''
  });
  const [rememberMe, setRememberMe] = useState(true);

  useEffect(() => {
    // If already authenticated, redirect to dashboard
    if (isAuthenticated) {
      navigate('/dashboard/overview', { replace: true });
      return;
    }

    // Load saved username if available
    const saved = localStorage.getItem('lastCredentials');
    if (saved) {
      try {
        const { username, remember } = JSON.parse(saved);
        if (remember) {
          setCredentials(prev => ({ ...prev, username: username || '' }));
          setRememberMe(true);
        }
      } catch (e) {
        // Ignore parse errors
      }
    }
  }, [isAuthenticated, navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate inputs
    if (!credentials.username || !credentials.password) {
      return;
    }
    
    try {
      const result = await dispatch(loginAsync({
        username: credentials.username,
        password: credentials.password
      }));
      
      if (loginAsync.fulfilled.match(result)) {
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
              <p className="text-base-content/70">Connect to your MikroTik router</p>
            </div>

            {/* Login Form */}
            <form onSubmit={handleLogin} className="space-y-4">
              {/* Username Field */}
              <div className="form-control">
                <label className="label">
                  <span className="label-text">Username</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Enter username"
                    className="input input-bordered input-lg w-full pl-12"
                    value={credentials.username}
                    onChange={handleInputChange('username')}
                    disabled={loading}
                    required
                  />
                  <User className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-base-content/50" />
                </div>
              </div>

              {/* Password Field */}
              <div className="form-control">
                <label className="label">
                  <span className="label-text">Password</span>
                </label>
                <div className="relative">
                  <input
                    type="password"
                    placeholder="Enter password"
                    className="input input-bordered input-lg w-full pl-12"
                    value={credentials.password}
                    onChange={handleInputChange('password')}
                    disabled={loading}
                    required
                  />
                  <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-base-content/50" />
                </div>
              </div>

              {/* Remember Me */}
              <div className="form-control">
                <label className="label cursor-pointer justify-start gap-3">
                  <input 
                    type="checkbox" 
                    className="checkbox checkbox-primary checkbox-sm"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    disabled={loading}
                  />
                  <span className="label-text">Remember me</span>
                </label>
              </div>

              {/* Error Alert */}
              {error && (
                <div className="alert alert-error">
                  <AlertCircle className="h-5 w-5" />
                  <span>{error}</span>
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading || !credentials.username || !credentials.password}
                className="btn btn-primary btn-block btn-lg"
              >
                {!loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <LogIn className="h-5 w-5" />
                    Login
                  </span>
                ) : (
                  <span className="flex items-center justify-center gap-2">
                    <span className="loading loading-spinner loading-sm"></span>
                    Connecting...
                  </span>
                )}
              </button>
            </form>

            {/* Footer Info */}
            <div className="divider">REST API</div>
            <div className="text-center">
              <p className="text-sm text-base-content/60">
                Uses MikroTik REST API for secure communication
              </p>
              <div className="mt-2">
                <div className="badge badge-ghost badge-sm">RouterOS 7.x</div>
                <div className="badge badge-ghost badge-sm ml-2">REST API</div>
              </div>
            </div>
          </div>
        </div>

        {/* Side Info (visible on large screens) */}
        <div className="text-center lg:text-left hidden lg:block max-w-md">
          <h2 className="text-5xl font-bold text-base-content mb-4">Welcome Back!</h2>
          <p className="text-lg text-base-content/70 mb-6">
            Access your MikroTik router's dashboard with a modern, responsive interface.
          </p>
          <div className="stats shadow bg-base-100/50 backdrop-blur">
            <div className="stat">
              <div className="stat-figure text-primary">
                <Wifi className="h-8 w-8" />
              </div>
              <div className="stat-title">Network</div>
              <div className="stat-value text-primary">Ready</div>
              <div className="stat-desc">Real-time monitoring</div>
            </div>
          </div>
        </div>
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

        /* Add glow effect to the card on hover */
        .card {
          transition: all 0.3s ease;
        }

        .card:hover {
          transform: translateY(-2px);
          box-shadow: 0 20px 40px -15px rgba(0, 0, 0, 0.3);
        }
      `}</style>
    </div>
  );
};