import { Platform } from 'react-native';

const DEFAULT_API_URL = 'http://localhost:8000';

// Retrieve the base API URL from environment variable or fallback
export const API_URL = process.env.EXPO_PUBLIC_API_URL || DEFAULT_API_URL;

// Simple storage helper for tokens that handles Web and Mobile environments
const tokenStorage = {
  get: (key: string): string | null => {
    if (Platform.OS === 'web') {
      try {
        return localStorage.getItem(key);
      } catch (e) {
        console.error('Error reading localStorage', e);
      }
    }
    return memoryStore[key] || null;
  },
  set: (key: string, value: string): void => {
    if (Platform.OS === 'web') {
      try {
        localStorage.setItem(key, value);
        return;
      } catch (e) {
        console.error('Error writing localStorage', e);
      }
    }
    memoryStore[key] = value;
  },
  remove: (key: string): void => {
    if (Platform.OS === 'web') {
      try {
        localStorage.removeItem(key);
        return;
      } catch (e) {
        console.error('Error removing localStorage', e);
      }
    }
    delete memoryStore[key];
  }
};

const memoryStore: Record<string, string> = {};

export interface User {
  id: string;
  email: string;
  role: string;
  created_at: string;
}

export interface StandardResponse<T> {
  success: boolean;
  data: T | null;
  error?: {
    code?: string;
    message: string;
    details?: any;
  } | null;
}

export interface TokenData {
  access_token: string;
  refresh_token: string;
  token_type: string;
}

export const apiService = {
  // Store authentication tokens
  setTokens: (accessToken: string, refreshToken: string) => {
    tokenStorage.set('access_token', accessToken);
    tokenStorage.set('refresh_token', refreshToken);
  },

  // Retrieve stored tokens
  getAccessToken: () => tokenStorage.get('access_token'),
  getRefreshToken: () => tokenStorage.get('refresh_token'),

  // Clear stored tokens
  clearTokens: () => {
    tokenStorage.remove('access_token');
    tokenStorage.remove('refresh_token');
  },

  // HTTP POST for User Registration
  signup: async (email: string, password: string): Promise<StandardResponse<User>> => {
    try {
      const response = await fetch(`${API_URL}/auth/signup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password, role: 'user' }),
      });
      const data = await response.json();
      return data;
    } catch (error: any) {
      return {
        success: false,
        data: null,
        error: {
          code: 'NETWORK_ERROR',
          message: error.message || 'Unable to connect to the backend server.',
        },
      };
    }
  },

  // HTTP POST for User Login
  login: async (email: string, password: string): Promise<StandardResponse<TokenData>> => {
    try {
      const response = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });
      const data = await response.json();
      if (data.success && data.data) {
        apiService.setTokens(data.data.access_token, data.data.refresh_token);
      }
      return data;
    } catch (error: any) {
      return {
        success: false,
        data: null,
        error: {
          code: 'NETWORK_ERROR',
          message: error.message || 'Unable to connect to the backend server.',
        },
      };
    }
  },

  // Retrieve details of the currently logged-in user
  getCurrentUser: async (): Promise<StandardResponse<User>> => {
    const token = apiService.getAccessToken();
    if (!token) {
      return {
        success: false,
        data: null,
        error: {
          code: 'UNAUTHORIZED',
          message: 'No active session found.',
        },
      };
    }

    try {
      const response = await fetch(`${API_URL}/users/me`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.status === 401) {
        // Attempt automatic refresh if token has expired
        const refreshed = await apiService.refreshToken();
        if (refreshed) {
          return apiService.getCurrentUser();
        }
        apiService.clearTokens();
      }

      const data = await response.json();
      return data;
    } catch (error: any) {
      return {
        success: false,
        data: null,
        error: {
          code: 'NETWORK_ERROR',
          message: error.message || 'Unable to connect to the server.',
        },
      };
    }
  },

  // Request new tokens using the refresh token
  refreshToken: async (): Promise<boolean> => {
    const refreshToken = apiService.getRefreshToken();
    if (!refreshToken) return false;

    try {
      const response = await fetch(`${API_URL}/auth/refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ refresh_token: refreshToken }),
      });
      const data = await response.json();
      if (data.success && data.data) {
        apiService.setTokens(data.data.access_token, data.data.refresh_token);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Token refresh failed', error);
      return false;
    }
  },
};
