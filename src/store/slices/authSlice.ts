import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { MikrotikAPI } from '../../services/mikrotik-api';

interface AuthState {
  isAuthenticated: boolean;
  username: string;
  api: MikrotikAPI | null;
  // credentials removed - always read from sessionStorage
  error: string | null;
  loading: boolean;
}

interface LoginCredentials {
  username: string;
  password: string;
}

interface LoginResult {
  success: boolean;
  error?: string;
  api?: MikrotikAPI;
  username?: string;
}

// Check for existing auth on initialization
const getInitialAuthState = (): AuthState => {
  const defaultState: AuthState = {
    isAuthenticated: false,
    username: '',
    api: null,
    error: null,
    loading: true, // Start with loading true to check auth
  };
  
  // Try to get auth from sessionStorage
  try {
    const auth = sessionStorage.getItem('auth');
    if (auth) {
      const { username, credentials, isAuthenticated } = JSON.parse(auth);
      if (isAuthenticated && credentials) {
        // Don't recreate API here, let checkAuthAsync do it
        return {
          ...defaultState,
          loading: true, // Will be set to false after checkAuthAsync
        };
      }
    }
  } catch (error) {
    // Ignore errors and return default state
  }
  
  return { ...defaultState, loading: false };
};

const initialState: AuthState = getInitialAuthState();

// Async thunks
export const loginAsync = createAsyncThunk<
  LoginResult,
  LoginCredentials,
  { rejectValue: string }
>(
  'auth/login',
  async ({ username, password }, { rejectWithValue, dispatch }) => {
    try {
      // Create API instance - host will be determined by environment
      // In production, it's the current host; in dev, the proxy handles it
      const api = new MikrotikAPI(username, password);
      
      // Test connection
      const result = await api.testConnection();
      
      if (result.success) {
        // Discover router capabilities
        dispatch(discoverCapabilities(api));
        
        // Generate base64 credentials for RTK Query
        const credentials = btoa(`${username}:${password}`);
        
        // Save to sessionStorage for better security
        // Only store base64 credentials, not the password
        sessionStorage.setItem('auth', JSON.stringify({
          username,
          credentials, // Store only base64 credentials, not password
          isAuthenticated: true
        }));
        
        return { success: true, api, username };
      } else {
        return rejectWithValue(result.error || 'Connection failed');
      }
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

export const checkAuthAsync = createAsyncThunk<
  { username: string; api: MikrotikAPI } | null,
  void,
  { rejectValue: string }
>(
  'auth/checkAuth',
  async (_, { rejectWithValue }) => {
    try {
      const auth = sessionStorage.getItem('auth');
      if (auth) {
        const { username, credentials, isAuthenticated } = JSON.parse(auth);
        if (isAuthenticated && credentials) {
          // Recreate API instance from base64 credentials
          const [user, pass] = atob(credentials).split(':');
          const api = new MikrotikAPI(user, pass);
          return { username, api };
        }
      }
      return null;
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

// This action will need to be imported from capabilities slice
const discoverCapabilities = createAsyncThunk(
  'capabilities/discover',
  async (api: MikrotikAPI) => {
    // Implementation will be in capabilities slice
    return api;
  }
);

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setApi: (state, action: PayloadAction<MikrotikAPI>) => {
      state.api = action.payload;
    },
    setAuthData: (state, action: PayloadAction<{ isAuthenticated: boolean; username: string }>) => {
      state.isAuthenticated = action.payload.isAuthenticated;
      state.username = action.payload.username;
    },
    logout: (state) => {
      state.isAuthenticated = false;
      state.username = '';
      state.api = null;
      state.error = null;
      state.loading = false;
      sessionStorage.removeItem('auth');
      // Note: Reset capabilities will need to be handled by capabilities slice
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Login
      .addCase(loginAsync.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loginAsync.fulfilled, (state, action) => {
        state.loading = false;
        if (action.payload.success) {
          state.isAuthenticated = true;
          state.username = action.payload.username || '';
          state.api = action.payload.api || null;
          state.error = null;
        }
      })
      .addCase(loginAsync.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Login failed';
        state.isAuthenticated = false;
        state.username = '';
        state.api = null;
      })
      // Check auth
      .addCase(checkAuthAsync.pending, (state) => {
        state.loading = true;
      })
      .addCase(checkAuthAsync.fulfilled, (state, action) => {
        state.loading = false;
        if (action.payload) {
          state.isAuthenticated = true;
          state.username = action.payload.username;
          state.api = action.payload.api;
        }
      })
      .addCase(checkAuthAsync.rejected, (state) => {
        state.loading = false;
        state.isAuthenticated = false;
        state.username = '';
        state.api = null;
      });
  },
});

export const { setApi, setAuthData, logout, clearError } = authSlice.actions;

// Selectors
export const selectAuth = (state: { auth: AuthState }) => state.auth;
export const selectIsAuthenticated = (state: { auth: AuthState }) => state.auth.isAuthenticated;
export const selectUsername = (state: { auth: AuthState }) => state.auth.username;
export const selectAuthError = (state: { auth: AuthState }) => state.auth.error;
export const selectAuthLoading = (state: { auth: AuthState }) => state.auth.loading;
export const selectApi = (state: { auth: AuthState }) => state.auth.api;

export default authSlice.reducer;