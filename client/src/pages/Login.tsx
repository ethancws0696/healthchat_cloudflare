import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/context/AuthContext";
import { config } from "../config";

export default function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const [_, setLocation] = useLocation();
  const { login, loginWithToken, isAuthenticated } = useAuth();

  useEffect(() => {
    // Redirect if already logged in
    if (isAuthenticated) {
      setLocation("/dashboard");
    }
  }, [isAuthenticated, setLocation]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!username || !password) {
      toast({
        title: "Error",
        description: "Username and password are required",
        variant: "destructive",
      });
      return;
    }
    
    setIsLoading(true);
    
    try {
      // For development mode, we'll use a demo login without API call
      if (config.environment === 'development' && username === 'northshore' && password === 'password123') {
        // Create a mock JWT token for demonstration purposes
        const mockToken = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsImlhdCI6MTY5ODc2NTQzMiwiZXhwIjoxNjk4ODUxODMyfQ.mock-signature";
        
        const demoUser = {
          id: 1,
          username: "northshore",
          email: "info@northshorehealthcare.com",
          companyName: "North Shore Healthcare",
          websiteUrl: "https://northshorehealthcare.com",
          role: "provider"
        };
        
        loginWithToken({ token: mockToken, user: demoUser });
        setLocation("/dashboard");
      } else {
        // For production, use the real API
        await login(username, password);
        setLocation("/dashboard");
      }
    } catch (error) {
      toast({
        title: "Login Failed",
        description: "Invalid username or password",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Card>
          <CardHeader className="space-y-1">
            <div className="flex items-center justify-center mb-2">
              <svg className="h-9 w-9 text-primary" viewBox="0 0 24 24" fill="currentColor">
                <path d="M20.25 8.511c.884.284 1.5 1.128 1.5 2.097v4.286c0 1.136-.847 2.1-1.98 2.193-.34.027-.68.052-1.02.072v3.091l-3-3c-1.354 0-2.694-.055-4.02-.163a2.115 2.115 0 01-.825-.242m9.345-8.334L12 2.25l-8.25 2.25 10.5 4.5 6.75-3.75z"/>
                <path d="M12.75 15.75h-4.5a.75.75 0 01-.75-.75 3 3 0 013-3h3a.75.75 0 01.75.75m0 3h-7.5c-.414 0-.75.336-.75.75a3 3 0 003 3h6a.75.75 0 00.75-.75v-4.5a.75.75 0 00-.75-.75h-1.5"/>
              </svg>
              <span className="ml-2 text-xl font-bold text-gray-900">HealthChat AI</span>
            </div>
            <CardTitle className="text-2xl font-bold text-center">Sign In</CardTitle>
            <CardDescription className="text-center">
              Enter your credentials to access your account
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <form onSubmit={handleSubmit}>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="username">Username</Label>
                  <Input 
                    id="username" 
                    placeholder="Enter your username" 
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input 
                    id="password" 
                    type="password" 
                    placeholder="Enter your password" 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
                <Button 
                  type="submit" 
                  className="w-full" 
                  disabled={isLoading}
                >
                  {isLoading ? "Signing In..." : "Sign In"}
                </Button>
              </div>
            </form>
          </CardContent>
          <CardFooter className="flex flex-col space-y-4">
            <div className="text-sm text-center">
              Don't have an account?{" "}
              <a href="/register" className="text-primary hover:underline">
                Register
              </a>
            </div>
            <div className="text-center">
              <a href="/" className="text-sm text-gray-500 hover:text-gray-700">
                Back to Home
              </a>
            </div>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
