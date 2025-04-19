import { useState } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from '@/context/AuthContext';
import { apiRequest } from '@/lib/apiService';
import { useQueryClient } from '@tanstack/react-query';

export default function ProviderProfileSetup() {
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [isCreating, setIsCreating] = useState(false);
  const [creationMethod, setCreationMethod] = useState<'scan' | 'manual' | 'upload'>('manual');
  const [manualFormData, setManualFormData] = useState({
    services: 'Primary Care, Pediatrics, Mental Health',
    locations: [{ name: '', address: '', serviceArea: '' }],
    insurance: 'Medicare, Medicaid, Blue Cross Blue Shield',
    intake: 'New patients can complete our intake forms online or at the clinic.',
    contact: {
      phone: '',
      email: '',
      hours: 'Monday - Friday: 8AM - 6PM'
    }
  });
  const [websiteUrl, setWebsiteUrl] = useState('');
  const [documentText, setDocumentText] = useState('');

  // Handle website scanning
  const handleScanWebsite = async () => {
    if (!websiteUrl) {
      toast({
        title: "Error",
        description: "Please enter a website URL",
        variant: "destructive",
      });
      return;
    }

    setIsCreating(true);
    try {
      // Format website URL if needed
      let formattedUrl = websiteUrl;
      if (!formattedUrl.startsWith('http')) {
        formattedUrl = 'https://' + formattedUrl;
      }

      // First fetch website content
      const scrapeResponse = await apiRequest('POST', `/api/scrape-website`, { url: formattedUrl });
      
      if (typeof scrapeResponse === 'object' && scrapeResponse && 'content' in scrapeResponse) {
        // Then process it with AI to extract healthcare information
        const profileData = await apiRequest('POST', `/api/process-website-content`, { 
          content: scrapeResponse.content as string
        });
        
        // Finally, create the provider profile
        await apiRequest('POST', `/api/provider-profile`, {
          // Only spread if profileData is an object
          ...(typeof profileData === 'object' ? profileData : {}),
          userId: user?.id,
          lastScanned: new Date().toISOString(),
          rawContent: scrapeResponse.content as string
        });
      } else {
        throw new Error("Failed to fetch website content");
      }
      
      toast({
        title: "Success",
        description: "Provider profile created successfully",
      });
      
      // Refresh profile data
      queryClient.invalidateQueries({ queryKey: [`/api/provider-profile/${user?.id}`] });
    } catch (error) {
      console.error(error);
      toast({
        title: "Error",
        description: "Failed to scan website and create profile",
        variant: "destructive",
      });
    } finally {
      setIsCreating(false);
    }
  };

  // Handle manual creation
  const handleManualCreate = async () => {
    if (!manualFormData.contact.phone || !manualFormData.contact.email) {
      toast({
        title: "Error",
        description: "Please fill in contact information",
        variant: "destructive",
      });
      return;
    }

    if (manualFormData.locations[0].name === '' || manualFormData.locations[0].address === '') {
      toast({
        title: "Error",
        description: "Please add at least one location with name and address",
        variant: "destructive",
      });
      return;
    }

    setIsCreating(true);
    try {
      // Format data
      const servicesArray = manualFormData.services.split(',').map(s => s.trim()).filter(s => s);
      const insuranceArray = manualFormData.insurance.split(',').map(i => i.trim()).filter(i => i);
      
      // Create profile
      await apiRequest('POST', `/api/provider-profile`, {
        userId: user?.id,
        services: servicesArray,
        locations: manualFormData.locations,
        insurance: insuranceArray,
        intake: manualFormData.intake,
        contact: manualFormData.contact,
        lastScanned: new Date().toISOString(),
        rawContent: "Manually created profile"
      });
      
      toast({
        title: "Success",
        description: "Provider profile created successfully",
      });
      
      // Refresh profile data
      queryClient.invalidateQueries({ queryKey: [`/api/provider-profile/${user?.id}`] });
    } catch (error) {
      console.error(error);
      toast({
        title: "Error",
        description: "Failed to create profile manually",
        variant: "destructive",
      });
    } finally {
      setIsCreating(false);
    }
  };

  // Handle document upload/paste
  const handleDocumentUpload = async () => {
    if (!documentText) {
      toast({
        title: "Error",
        description: "Please paste document text",
        variant: "destructive",
      });
      return;
    }

    setIsCreating(true);
    try {
      // Process document content with AI to extract healthcare information
      const profileData = await apiRequest('POST', `/api/process-website-content`, { 
        content: documentText 
      });
      
      // Create the provider profile
      await apiRequest('POST', `/api/provider-profile`, {
        // Only spread if profileData is an object
        ...(typeof profileData === 'object' ? profileData : {}),
        userId: user?.id,
        lastScanned: new Date().toISOString(),
        rawContent: documentText
      });
      
      toast({
        title: "Success",
        description: "Provider profile created successfully from document",
      });
      
      // Refresh profile data
      queryClient.invalidateQueries({ queryKey: [`/api/provider-profile/${user?.id}`] });
    } catch (error) {
      console.error(error);
      toast({
        title: "Error",
        description: "Failed to process document and create profile",
        variant: "destructive",
      });
    } finally {
      setIsCreating(false);
    }
  };

  // Update location fields
  const handleLocationChange = (index: number, field: string, value: string) => {
    const updatedLocations = [...manualFormData.locations];
    updatedLocations[index] = { 
      ...updatedLocations[index], 
      [field]: value 
    };
    
    setManualFormData({
      ...manualFormData,
      locations: updatedLocations
    });
  };

  // Update contact fields
  const handleContactChange = (field: string, value: string) => {
    setManualFormData({
      ...manualFormData,
      contact: {
        ...manualFormData.contact,
        [field]: value
      }
    });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="p-6">
          <div className="text-center py-6">
            <h3 className="text-lg font-medium text-gray-900">No Provider Profile Found</h3>
            <p className="mt-2 text-sm text-gray-500">
              You need to create a provider profile to power your AI chat widget
            </p>
            
            <div className="mt-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <Button
                  variant={creationMethod === "scan" ? "default" : "outline"}
                  className="h-auto py-6 flex flex-col space-y-2"
                  onClick={() => setCreationMethod("scan")}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect width="18" height="10" x="3" y="3" rx="2"/>
                    <rect width="18" height="7" x="3" y="14" rx="2"/>
                    <path d="M7 7h.01"/>
                    <path d="M7 17h.01"/>
                  </svg>
                  <span className="font-medium">Scan Website</span>
                  <span className="text-xs">Analyze your website content to create profile</span>
                </Button>
                
                <Button
                  variant={creationMethod === "manual" ? "default" : "outline"}
                  className="h-auto py-6 flex flex-col space-y-2"
                  onClick={() => setCreationMethod("manual")}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 20h9"/>
                    <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/>
                  </svg>
                  <span className="font-medium">Manual Creation</span>
                  <span className="text-xs">Manually enter your provider details</span>
                </Button>
                
                <Button
                  variant={creationMethod === "upload" ? "default" : "outline"}
                  className="h-auto py-6 flex flex-col space-y-2"
                  onClick={() => setCreationMethod("upload")}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/>
                    <polyline points="14 2 14 8 20 8"/>
                  </svg>
                  <span className="font-medium">Upload Document</span>
                  <span className="text-xs">Upload or paste document text</span>
                </Button>
              </div>
              
              {/* Website Scan Form */}
              {creationMethod === "scan" && (
                <div className="mt-6 p-4 border rounded-md">
                  <h4 className="font-medium mb-2">Scan Your Healthcare Website</h4>
                  <p className="text-sm text-gray-500 mb-4">
                    Enter your website URL and we'll automatically extract your healthcare services, locations, and other information.
                  </p>
                  
                  <div className="space-y-4">
                    <div>
                      <Input 
                        placeholder="Enter website URL (e.g., www.northshorehealth.com)" 
                        value={websiteUrl} 
                        onChange={(e) => setWebsiteUrl(e.target.value)}
                      />
                    </div>
                    
                    <Button 
                      className="w-full" 
                      onClick={handleScanWebsite}
                      disabled={isCreating}
                    >
                      {isCreating ? "Scanning Website..." : "Start Scan"}
                    </Button>
                  </div>
                </div>
              )}
              
              {/* Manual Creation Form */}
              {creationMethod === "manual" && (
                <div className="mt-6 p-4 border rounded-md">
                  <h4 className="font-medium mb-2">Create Provider Profile Manually</h4>
                  <p className="text-sm text-gray-500 mb-4">
                    Enter your healthcare provider details manually.
                  </p>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Services (comma separated)</label>
                      <Input 
                        placeholder="Primary Care, Pediatrics, Mental Health, etc." 
                        value={manualFormData.services} 
                        onChange={(e) => setManualFormData({...manualFormData, services: e.target.value})}
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                      <div className="space-y-2">
                        <Input 
                          placeholder="Location Name (e.g., Main Clinic)" 
                          value={manualFormData.locations[0].name} 
                          onChange={(e) => handleLocationChange(0, 'name', e.target.value)}
                        />
                        <Input 
                          placeholder="Address" 
                          value={manualFormData.locations[0].address} 
                          onChange={(e) => handleLocationChange(0, 'address', e.target.value)}
                        />
                        <Input 
                          placeholder="Service Area (e.g., Greater Boston Area)" 
                          value={manualFormData.locations[0].serviceArea} 
                          onChange={(e) => handleLocationChange(0, 'serviceArea', e.target.value)}
                        />
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Insurance Plans (comma separated)</label>
                      <Input 
                        placeholder="Medicare, Medicaid, Blue Cross Blue Shield, etc." 
                        value={manualFormData.insurance} 
                        onChange={(e) => setManualFormData({...manualFormData, insurance: e.target.value})}
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Intake Instructions</label>
                      <Textarea 
                        placeholder="Instructions for new patients" 
                        value={manualFormData.intake} 
                        onChange={(e) => setManualFormData({...manualFormData, intake: e.target.value})}
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Contact Information</label>
                      <div className="space-y-2">
                        <Input 
                          placeholder="Phone Number" 
                          value={manualFormData.contact.phone} 
                          onChange={(e) => handleContactChange('phone', e.target.value)}
                        />
                        <Input 
                          placeholder="Email" 
                          value={manualFormData.contact.email} 
                          onChange={(e) => handleContactChange('email', e.target.value)}
                        />
                        <Input 
                          placeholder="Business Hours" 
                          value={manualFormData.contact.hours} 
                          onChange={(e) => handleContactChange('hours', e.target.value)}
                        />
                      </div>
                    </div>
                    
                    <Button 
                      className="w-full" 
                      onClick={handleManualCreate}
                      disabled={isCreating}
                    >
                      {isCreating ? "Creating Profile..." : "Create Profile"}
                    </Button>
                  </div>
                </div>
              )}
              
              {/* Document Upload Form */}
              {creationMethod === "upload" && (
                <div className="mt-6 p-4 border rounded-md">
                  <h4 className="font-medium mb-2">Create from Document</h4>
                  <p className="text-sm text-gray-500 mb-4">
                    Paste text from your brochure, website, or other documentation.
                  </p>
                  
                  <div className="space-y-4">
                    <Textarea 
                      className="min-h-[200px]"
                      placeholder="Paste document text here..." 
                      value={documentText} 
                      onChange={(e) => setDocumentText(e.target.value)}
                    />
                    
                    <Button 
                      className="w-full" 
                      onClick={handleDocumentUpload}
                      disabled={isCreating}
                    >
                      {isCreating ? "Processing Document..." : "Create from Document"}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}