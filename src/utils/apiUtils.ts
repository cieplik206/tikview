import { logout } from '../store/slices/authSlice';
import { store } from '../store';

/**
 * Handle API errors, specifically 401 unauthorized responses
 */
export const handleApiError = (error: any): void => {
  if (error.status === 401) {
    // Clear auth data and redirect to login
    store.dispatch(logout());
    
    // Redirect to login page if not already there
    if (window.location.pathname !== '/login') {
      window.location.href = '/login';
    }
  }
};

/**
 * Enhanced fetch wrapper that handles authentication errors
 */
export const authenticatedFetch = async (
  url: string,
  options: RequestInit = {}
): Promise<Response> => {
  try {
    const response = await fetch(url, options);
    
    if (!response.ok && response.status === 401) {
      handleApiError({ status: 401 });
      throw new Error('Unauthorized - Please login again');
    }
    
    return response;
  } catch (error: any) {
    // If it's a network error or other error, still check if it might be auth-related
    if (error.message?.includes('Unauthorized') || error.message?.includes('401')) {
      handleApiError({ status: 401 });
    }
    throw error;
  }
};