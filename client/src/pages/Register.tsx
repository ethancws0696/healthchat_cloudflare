import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/context/AuthContext";
import { apiRequest } from "@/lib/queryClient";

export default function Register() {
  const [formData, setFormData] = useState({
    username: "",
    password: "",
    email: "",
    companyName: "",
    websiteUrl: ""
  });
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const [_, setLocation] = useLocation();
  const { login, isAuthenticated, loginWithToken } = useAuth();

  useEffect(() => {
    // Redirect if already logged in
    if (isAuthenticated) {
      setLocation("/dashboard");
    }
  }, [isAuthenticated, setLocation]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Simple validation
    for (const [key, value] of Object.entries(formData)) {
      if (!value) {
        toast({
          title: "Error",
          description: `${key.charAt(0).toUpperCase() + key.slice(1)} is required`,
          variant: "destructive",
        });
        return;
      }
    }
    
    setIsLoading(true);
    
    try {
      const response = await apiRequest("POST", "/api/auth/register", formData);
      const data = await response.json();
      
      toast({
        title: "Success",
        description: "Account created successfully",
      });
      
      // Auto-login after registration
      loginWithToken(data); // Use loginWithToken after successful registration
      setLocation("/dashboard");
    } catch (error) {
      toast({
        title: "Registration Failed",
        description: "There was an error creating your account. Please try again.",
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
            <CardTitle className="text-2xl font-bold text-center">Create Account</CardTitle>
            <CardDescription className="text-center">
              Enter your information to create an account
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <form onSubmit={handleSubmit}>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="companyName">Healthcare Provider Name</Label>
                  <Input 
                    id="companyName" 
                    name="companyName"
                    placeholder="North Shore Health Center" 
                    value={formData.companyName}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="websiteUrl">Website URL</Label>
                  <Input 
                    id="websiteUrl" 
                    name="websiteUrl"
                    placeholder="https://www.yourprovider.com" 
                    value={formData.websiteUrl}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input 
                    id="email" 
                    name="email"
                    type="email" 
                    placeholder="you@example.com" 
                    value={formData.email}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="username">Username</Label>
                  <Input 
                    id="username" 
                    name="username"
                    placeholder="Choose a username" 
                    value={formData.username}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input 
                    id="password" 
                    name="password"
                    type="password" 
                    placeholder="Create a password" 
                    value={formData.password}
                    onChange={handleChange}
                    required
                  />
                </div>
                <Button 
                  type="submit" 
                  className="w-full" 
                  disabled={isLoading}
                >
                  {isLoading ? "Creating Account..." : "Register"}
                </Button>
              </div>
            </form>
          </CardContent>
          <CardFooter className="flex flex-col space-y-4">
            <div className="text-sm text-center">
              Already have an account?{" "}
              <a href="/login" className="text-primary hover:underline">
                Sign in
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
