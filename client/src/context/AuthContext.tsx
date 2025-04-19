import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useToast } from "@/hooks/use-toast";
import { config } from "../config";
import { apiRequest } from "../lib/queryClient";

interface User {
  id: number;
  username: string;
  email: string;
  companyName: string;
  websiteUrl: string;
  role: string;
}

interface AuthTokenData {
  token: string;
  user: User;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  login: (username: string, password: string) => Promise<void>;
  loginWithToken: (tokenData: AuthTokenData) => void;
  logout: () => void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  isAuthenticated: false,
  login: async () => {},
  loginWithToken: () => {},
  logout: () => {},
  loading: true,
});

export const useAuth = () => useContext(AuthContext);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  // Check for user in localStorage on initial load
  useEffect(() => {
    const storedUser = localStorage.getItem(config.auth.userStorageKey);
    const storedToken = localStorage.getItem(config.auth.tokenStorageKey);
    
    if (storedUser && storedToken) {
      try {
        const parsedUser = JSON.parse(storedUser);
        setUser(parsedUser);
      } catch (error) {
        console.error("Failed to parse stored user:", error);
        localStorage.removeItem(config.auth.userStorageKey);
        localStorage.removeItem(config.auth.tokenStorageKey);
      }
    }
    
    setLoading(false);
  }, []);

  // Handles login by making API request to server
  const login = async (username: string, password: string) => {
    try {
      console.log('[Login] Attempting login...');
      
      // Always use Cloudflare Worker for login in production
      const endpoint = config.environment === 'production' || localStorage.getItem('healthchat_cloudflare_mode') === 'true'
        ? 'https://healthchat.ethan-c87.workers.dev/api/auth/login' // Corrected path
        : '/api/auth/login';
      
      console.log(`[Login] Using endpoint: ${endpoint}`);
      
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
        credentials: 'include'
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('[Login] Login error response:', errorText);
        throw new Error(`Login failed: ${response.status} ${errorText || response.statusText}`);
      }
      
      const data = await response.json();
      console.log('[Login] Login response received');
      
      if (data.token && data.user) {
        setUser(data.user);
        localStorage.setItem(config.auth.tokenStorageKey, data.token);
        localStorage.setItem(config.auth.userStorageKey, JSON.stringify(data.user));
        
        toast({
          title: "Login successful",
          description: `Welcome back, ${data.user.companyName || data.user.company_name || username}!`,
        });
      } else {
        console.error('[Login] Invalid response from server', data);
        throw new Error('Invalid response from server');
      }
    } catch (error) {
      console.error('[Login] Login error:', error);
      toast({
        title: "Login failed",
        description: error instanceof Error ? error.message : 'An unknown error occurred',
        variant: "destructive"
      });
      throw error;
    }
  };

  // Used for demo login without API call
  const loginWithToken = (tokenData: AuthTokenData) => {
    setUser(tokenData.user);
    localStorage.setItem(config.auth.tokenStorageKey, tokenData.token);
    localStorage.setItem(config.auth.userStorageKey, JSON.stringify(tokenData.user));
    
    toast({
      title: "Login successful",
      description: `Welcome back, ${tokenData.user.companyName}!`,
    });
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem(config.auth.userStorageKey);
    localStorage.removeItem(config.auth.tokenStorageKey);
    
    toast({
      title: "Logged out",
      description: "You have been successfully logged out",
    });
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        login,
        loginWithToken,
        logout,
        loading,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
