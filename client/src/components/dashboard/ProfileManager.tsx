import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { apiRequest } from "@/lib/apiService";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle, 
  CardDescription 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ProviderProfileSetup from "./ProviderProfileSetup";

interface ProviderProfile {
  id: number;
  userId: number;
  services: string[];
  locations: {
    name: string;
    address: string;
    serviceArea?: string;
  }[];
  insurance: string[];
  intake: string;
  contact: {
    phone: string;
    email: string;
    hours?: string;
  };
  lastScanned: string;
  rawContent: string;
  customRules?: {
    excludedLocations?: string[];
    specialRequirements?: string[];
    ageRestrictions?: string;
    patientTypes?: string[];
    notes?: string;
  };
}

interface ProfileManagerProps {
  profile: ProviderProfile | undefined;
  isLoading: boolean;
}

export default function ProfileManager({ profile, isLoading }: ProfileManagerProps) {
  const { toast } = useToast();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("overview");
  
  // Format date for display
  const formatDate = (dateString?: string) => {
    if (!dateString) return "Never";
    return new Date(dateString).toLocaleString();
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  if (!profile) {
    // Use the new ProviderProfileSetup component instead
    return <ProviderProfileSetup />;
  }

  const handleRescanClick = async () => {
    if (!user) {
      toast({
        title: "Error",
        description: "You must be logged in to update profile",
        variant: "destructive",
      });
      return;
    }

    try {
      toast({
        title: "Processing",
        description: "Rescanning website content...",
      });
      
      await apiRequest("POST", "/api/rescan-website", {
        userId: user.id
      });
      
      toast({
        title: "Success",
        description: "Provider profile has been updated successfully",
      });
      
      // Refresh profile data
      queryClient.invalidateQueries({ queryKey: [`/api/provider-profile/${user.id}`] });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to rescan website and update profile",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Provider Profile</CardTitle>
          <CardDescription>
            This information powers your AI chat widget and helps it answer questions about your healthcare practice
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Profile last scanned info */}
          <div className="flex justify-between items-center">
            <div>
              <p className="text-sm text-gray-500">
                Last updated: {formatDate(profile.lastScanned)}
              </p>
            </div>
            <Button onClick={handleRescanClick}>
              Rescan Website
            </Button>
          </div>
          
          <Tabs defaultValue={activeTab} onValueChange={setActiveTab} className="mt-6">
            <TabsList className="grid grid-cols-4 mb-4">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="services">Services</TabsTrigger>
              <TabsTrigger value="locations">Locations</TabsTrigger>
              <TabsTrigger value="insurance">Insurance</TabsTrigger>
            </TabsList>
            
            <TabsContent value="overview" className="space-y-4">
              <div>
                <h3 className="text-sm font-medium mb-2">Practice Overview</h3>
                <div className="p-4 bg-gray-50 rounded-md">
                  <div className="mb-3">
                    <h4 className="text-xs font-medium text-gray-500">Contact Information</h4>
                    <div className="mt-1 text-sm">
                      <p><span className="font-medium">Phone:</span> {profile.contact.phone}</p>
                      <p><span className="font-medium">Email:</span> {profile.contact.email}</p>
                      {profile.contact.hours && (
                        <p><span className="font-medium">Hours:</span> {profile.contact.hours}</p>
                      )}
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="text-xs font-medium text-gray-500">Intake Process</h4>
                    <p className="mt-1 text-sm">{profile.intake}</p>
                  </div>
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="services" className="space-y-4">
              <div>
                <h3 className="text-sm font-medium mb-2">Services Offered</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {profile.services.map((service, index) => (
                    <div key={index} className="p-3 border rounded-md">
                      {service}
                    </div>
                  ))}
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="locations" className="space-y-4">
              <div>
                <h3 className="text-sm font-medium mb-2">Locations</h3>
                <div className="grid grid-cols-1 gap-4">
                  {profile.locations.map((location, index) => (
                    <div key={index} className="p-4 border rounded-md">
                      <h4 className="font-medium">{location.name}</h4>
                      <p className="text-sm mt-1">{location.address}</p>
                      {location.serviceArea && (
                        <p className="text-sm text-gray-500 mt-1">Service area: {location.serviceArea}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="insurance" className="space-y-4">
              <div>
                <h3 className="text-sm font-medium mb-2">Insurance Plans Accepted</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {profile.insurance.map((plan, index) => (
                    <div key={index} className="p-3 border rounded-md">
                      {plan}
                    </div>
                  ))}
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}