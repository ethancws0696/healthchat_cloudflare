import { useState, useEffect } from "react";
import { useLocation, useParams, useRoute } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/context/AuthContext";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { queryClient } from "@/lib/queryClient";
import Sidebar from "@/components/dashboard/Sidebar";
import StatsCards from "@/components/dashboard/StatsCards";
import LeadsTable from "@/components/dashboard/LeadsTable";
import WidgetCustomizer from "@/components/dashboard/WidgetCustomizer";
import ProfileManager from "@/components/dashboard/ProfileManager";
import Chat from "@/components/dashboard/Chat";

type DashboardParams = {
  tab?: string;
};

export default function Dashboard() {
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const [_, setLocation] = useLocation();
  const params = useParams<DashboardParams>();
  const activeTab = params.tab || "overview";
  const [useCloudflare, setUseCloudflare] = useState(() => {
    // Default to true if not set yet
    if (localStorage.getItem('healthchat_cloudflare_mode') === null) {
      localStorage.setItem('healthchat_cloudflare_mode', 'true');
      return true;
    }
    return localStorage.getItem('healthchat_cloudflare_mode') === 'true';
  });
  
  // Handle toggling between API modes
  const handleApiModeToggle = (checked: boolean) => {
    setUseCloudflare(checked);
    localStorage.setItem('healthchat_cloudflare_mode', checked ? 'true' : 'false');
    
    // Invalidate all queries to force refetch with new API base URL
    queryClient.invalidateQueries();
    
    toast({
      title: checked ? "Using Cloudflare API" : "Using Local API",
      description: checked 
        ? "Now using Cloudflare Worker for all API requests" 
        : "Now using local Express server for all API requests",
    });
  };
  
  // Fetch data
  const { data: leads = [], isLoading: isLeadsLoading } = useQuery({
    queryKey: ["/api/leads"],
    enabled: !!isAuthenticated,
  });
  
  const { data: conversations = [], isLoading: isConversationsLoading } = useQuery({
    queryKey: ["/api/conversations"],
    enabled: !!isAuthenticated,
  });
  
  const { data: widgetSettings, isLoading: isSettingsLoading } = useQuery({
    queryKey: [`/api/widget-settings/${user?.id}`],
    enabled: !!user?.id,
  });
  
  const { data: providerProfile, isLoading: isProfileLoading } = useQuery({
    queryKey: [`/api/provider-profile/${user?.id}`],
    enabled: !!user?.id,
  });

  useEffect(() => {
    // Redirect to login if not authenticated
    if (!isAuthenticated && !localStorage.getItem("user")) {
      toast({
        title: "Authentication Required",
        description: "Please login to access the dashboard",
        variant: "destructive",
      });
      setLocation("/login");
    }
  }, [isAuthenticated, setLocation, toast]);

  if (!isAuthenticated) {
    return <div className="h-screen w-full flex items-center justify-center">Loading...</div>;
  }

  return (
    <div className="flex h-screen bg-gray-100">
      <Sidebar activeTab={activeTab} />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-white shadow">
          <div className="px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-center justify-between">
              <h1 className="text-2xl font-bold text-gray-900">
                {activeTab === "overview" && "Dashboard"}
                {activeTab === "conversations" && "Conversations"}
                {activeTab === "leads" && "Leads Management"}
                {activeTab === "widget" && "Widget Settings"}
                {activeTab === "profile" && "Provider Profile"}
              </h1>
              <div className="flex items-center space-x-4">
                {/* API Mode Toggle */}
                <div className="flex items-center space-x-2">
                  <Label htmlFor="api-mode" className="text-xs text-gray-500">
                    {useCloudflare ? "Cloudflare API" : "Local API"}
                  </Label>
                  <Switch
                    id="api-mode"
                    checked={useCloudflare}
                    onCheckedChange={handleApiModeToggle}
                    className="data-[state=checked]:bg-green-500"
                  />
                </div>
                
                <span className="text-sm text-gray-500">
                  {user?.companyName}
                </span>
                <div className="h-8 w-8 rounded-full bg-primary-100 flex items-center justify-center">
                  <span className="text-primary-600 font-medium">
                    {user?.username.charAt(0).toUpperCase()}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </header>
        
        <main className="flex-1 overflow-auto bg-gray-50 p-4 sm:p-6 lg:p-8">
          {activeTab === "overview" && (
            <div className="space-y-6">
              <StatsCards 
                leads={leads} 
                conversations={conversations} 
                isLoading={isLeadsLoading || isConversationsLoading} 
              />
              <LeadsTable 
                leads={leads.slice(0, 5)} 
                isLoading={isLeadsLoading} 
                isPreview={true} 
              />
            </div>
          )}
          
          {activeTab === "conversations" && (
            <Chat conversations={conversations} isLoading={isConversationsLoading} />
          )}
          
          {activeTab === "leads" && (
            <LeadsTable 
              leads={leads} 
              isLoading={isLeadsLoading} 
              isPreview={false} 
            />
          )}
          
          {activeTab === "widget" && (
            <WidgetCustomizer 
              settings={widgetSettings} 
              isLoading={isSettingsLoading} 
              userId={user?.id} 
            />
          )}
          
          {activeTab === "profile" && (
            <ProfileManager 
              profile={providerProfile} 
              isLoading={isProfileLoading} 
            />
          )}
        </main>
      </div>
    </div>
  );
}
