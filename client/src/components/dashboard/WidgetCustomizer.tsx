import { useState, useEffect } from "react";
import { ChromePicker } from "react-color";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";
import { config } from "@/config";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import ChatWidget from "@/components/ChatWidget";

interface WidgetSettings {
  id: number;
  userId: number;
  primaryColor: string;
  secondaryColor: string;
  fontFamily: string;
  position: string;
  greeting: string;
  logoUrl: string | null;
  botName: string;
  showBranding: boolean;
}

interface WidgetCustomizerProps {
  settings: WidgetSettings | undefined;
  isLoading: boolean;
  userId: number | undefined;
}

export default function WidgetCustomizer({ settings, isLoading, userId }: WidgetCustomizerProps) {
  const { toast } = useToast();
  const [showColorPicker, setShowColorPicker] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [formValues, setFormValues] = useState<Partial<WidgetSettings>>({
    primaryColor: "#4F46E5",
    secondaryColor: "#14B8A6",
    fontFamily: "Inter, sans-serif",
    position: "bottom-right",
    greeting: "👋 Hi there! How can I help you today?",
    logoUrl: "",
    botName: "Assistant",
    showBranding: true
  });

  // Load settings when available
  useEffect(() => {
    if (settings) {
      setFormValues({
        primaryColor: settings.primaryColor,
        secondaryColor: settings.secondaryColor,
        fontFamily: settings.fontFamily,
        position: settings.position,
        greeting: settings.greeting,
        logoUrl: settings.logoUrl || "",
        botName: settings.botName,
        showBranding: settings.showBranding
      });
    }
  }, [settings]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormValues(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }));
  };

  const handleSwitchChange = (checked: boolean) => {
    setFormValues(prev => ({
      ...prev,
      showBranding: checked
    }));
  };

  const handleColorChange = (color: any, colorType: string) => {
    setFormValues(prev => ({
      ...prev,
      [colorType]: color.hex
    }));
  };

  const handleSave = async () => {
    if (!userId) {
      toast({
        title: "Error",
        description: "User ID is required to save settings",
        variant: "destructive",
      });
      return;
    }

    setIsSaving(true);
    console.log(`Attempting to save widget settings for userId=${userId}`, formValues);

    try {
      // First, verify if the token is in localStorage and if the user is logged in
      const token = localStorage.getItem(config.auth.tokenStorageKey);
      if (!token) {
        throw new Error("You must be logged in to save settings");
      }
      
      // Also store current settings in localStorage to ensure they're available in the demo
      const currentSettings = { ...formValues, userId };
      localStorage.setItem('temp_widget_settings', JSON.stringify(currentSettings));
      
      const result = await apiRequest('PUT', `/api/widget-settings/${userId}`, formValues);
      console.log("Widget settings save response:", result);
      
      toast({
        title: "Success",
        description: "Widget settings have been saved successfully",
      });
      
      // Refresh settings data
      queryClient.invalidateQueries({ queryKey: [`/api/widget-settings/${userId}`] });
    } catch (error) {
      console.error("Error saving widget settings:", error);
      
      // Display more detailed error message
      let errorMessage = "Failed to save widget settings";
      if (error instanceof Error) {
        errorMessage = error.message;
      }
      
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
      
      // Save to localStorage as a backup anyway
      const currentSettings = { ...formValues, userId };
      localStorage.setItem('temp_widget_settings', JSON.stringify(currentSettings));
      console.log("Settings saved to localStorage as fallback");
    } finally {
      setIsSaving(false);
    }
  };

  const positionOptions = [
    { value: "bottom-right", label: "Bottom Right" },
    { value: "bottom-left", label: "Bottom Left" },
    { value: "top-right", label: "Top Right" },
    { value: "top-left", label: "Top Left" }
  ];

  const fontOptions = [
    { value: "Inter, sans-serif", label: "Inter" },
    { value: "Arial, sans-serif", label: "Arial" },
    { value: "Helvetica, sans-serif", label: "Helvetica" },
    { value: "Georgia, serif", label: "Georgia" },
    { value: "Times New Roman, serif", label: "Times New Roman" },
    { value: "system-ui, sans-serif", label: "System UI" }
  ];

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 space-y-6">
        <Card>
          <CardContent className="p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Widget Customization</h2>
            <Tabs defaultValue="appearance">
              <TabsList className="grid grid-cols-3 mb-6">
                <TabsTrigger value="appearance">Appearance</TabsTrigger>
                <TabsTrigger value="content">Content</TabsTrigger>
                <TabsTrigger value="behavior">Behavior</TabsTrigger>
              </TabsList>
              
              <TabsContent value="appearance" className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Primary Color */}
                  <div>
                    <Label htmlFor="primaryColor">Primary Color</Label>
                    <div className="mt-1 flex">
                      <div 
                        className="w-10 h-10 rounded border border-gray-300 cursor-pointer"
                        style={{ backgroundColor: formValues.primaryColor }}
                        onClick={() => setShowColorPicker(showColorPicker === "primary" ? "" : "primary")}
                      ></div>
                      <Input 
                        id="primaryColor"
                        name="primaryColor"
                        className="ml-2"
                        value={formValues.primaryColor}
                        onChange={handleInputChange}
                      />
                    </div>
                    {showColorPicker === "primary" && (
                      <div className="absolute z-10 mt-2">
                        <div 
                          className="fixed inset-0" 
                          onClick={() => setShowColorPicker("")}
                        />
                        <ChromePicker 
                          color={formValues.primaryColor} 
                          onChange={(color) => handleColorChange(color, "primaryColor")} 
                        />
                      </div>
                    )}
                  </div>
                  
                  {/* Secondary Color */}
                  <div>
                    <Label htmlFor="secondaryColor">Secondary Color</Label>
                    <div className="mt-1 flex">
                      <div 
                        className="w-10 h-10 rounded border border-gray-300 cursor-pointer"
                        style={{ backgroundColor: formValues.secondaryColor }}
                        onClick={() => setShowColorPicker(showColorPicker === "secondary" ? "" : "secondary")}
                      ></div>
                      <Input 
                        id="secondaryColor"
                        name="secondaryColor"
                        className="ml-2"
                        value={formValues.secondaryColor}
                        onChange={handleInputChange}
                      />
                    </div>
                    {showColorPicker === "secondary" && (
                      <div className="absolute z-10 mt-2">
                        <div 
                          className="fixed inset-0" 
                          onClick={() => setShowColorPicker("")}
                        />
                        <ChromePicker 
                          color={formValues.secondaryColor} 
                          onChange={(color) => handleColorChange(color, "secondaryColor")} 
                        />
                      </div>
                    )}
                  </div>
                  
                  {/* Font Family */}
                  <div>
                    <Label htmlFor="fontFamily">Font Family</Label>
                    <select
                      id="fontFamily"
                      name="fontFamily"
                      className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm rounded-md"
                      value={formValues.fontFamily}
                      onChange={handleInputChange}
                    >
                      {fontOptions.map(option => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  {/* Position */}
                  <div>
                    <Label htmlFor="position">Position</Label>
                    <select
                      id="position"
                      name="position"
                      className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm rounded-md"
                      value={formValues.position}
                      onChange={handleInputChange}
                    >
                      {positionOptions.map(option => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  {/* Logo URL */}
                  <div className="md:col-span-2">
                    <Label htmlFor="logoUrl">Logo URL (Optional)</Label>
                    <Input 
                      id="logoUrl"
                      name="logoUrl"
                      className="mt-1"
                      placeholder="https://example.com/logo.png"
                      value={formValues.logoUrl || ""}
                      onChange={handleInputChange}
                    />
                    <p className="mt-1 text-sm text-gray-500">
                      Provide a URL to your logo image. Recommended size: 64x64px.
                    </p>
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="content" className="space-y-6">
                {/* Bot Name */}
                <div>
                  <Label htmlFor="botName">Bot Name</Label>
                  <Input 
                    id="botName"
                    name="botName"
                    className="mt-1"
                    placeholder="Assistant"
                    value={formValues.botName}
                    onChange={handleInputChange}
                  />
                  <p className="mt-1 text-sm text-gray-500">
                    This name will be used in the chat interface.
                  </p>
                </div>
                
                {/* Greeting Message */}
                <div>
                  <Label htmlFor="greeting">Greeting Message</Label>
                  <Textarea 
                    id="greeting"
                    name="greeting"
                    className="mt-1"
                    placeholder="👋 Hi there! How can I help you today?"
                    rows={3}
                    value={formValues.greeting}
                    onChange={handleInputChange}
                  />
                  <p className="mt-1 text-sm text-gray-500">
                    This message will be displayed when a user first opens the chat.
                  </p>
                </div>
                
                {/* Show Branding */}
                <div className="flex items-center space-x-2">
                  <Switch 
                    id="showBranding" 
                    checked={formValues.showBranding}
                    onCheckedChange={handleSwitchChange}
                  />
                  <Label htmlFor="showBranding">Show "Powered by HealthChat AI" branding</Label>
                </div>
              </TabsContent>
              
              <TabsContent value="behavior" className="space-y-6">
                <div className="bg-yellow-50 p-4 rounded-md">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <svg className="h-5 w-5 text-yellow-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-yellow-800">Coming Soon</h3>
                      <div className="mt-2 text-sm text-yellow-700">
                        <p>Advanced behavior settings are under development. Soon you'll be able to configure:</p>
                        <ul className="list-disc pl-5 mt-1 space-y-1">
                          <li>Auto-open triggers</li>
                          <li>Chat timeouts</li>
                          <li>Custom lead qualification rules</li>
                          <li>Integration webhooks</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
        
        <div className="flex justify-between">
          <Button 
            variant="outline"
            onClick={() => {
              // Store current widget settings in localStorage before navigating
              const currentSettings = { ...formValues, userId };
              localStorage.setItem('temp_widget_settings', JSON.stringify(currentSettings));
              window.open('/widget-demo', '_blank');
              console.log('Opening widget demo page with stored settings');
            }}
          >
            Test Widget on Demo Page
          </Button>
          <Button 
            onClick={handleSave}
            disabled={isSaving}
          >
            {isSaving ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </div>
      
      {/* Preview and Installation */}
      <div className="lg:col-span-1 space-y-6">
        <Card>
          <CardContent className="p-6 space-y-4">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Widget Preview</h2>
            <div className="rounded-lg border border-gray-200 p-4 h-[400px] flex items-center justify-center relative">
              <div className="absolute bottom-4 right-4">
                <ChatWidget 
                  isDemo={true}
                  primaryColor={formValues.primaryColor}
                  secondaryColor={formValues.secondaryColor}
                  botName={formValues.botName}
                  providerName="Your Healthcare"
                  greeting={formValues.greeting}
                  logoUrl={formValues.logoUrl || undefined}
                  showBranding={formValues.showBranding}
                />
              </div>
            </div>
            <div className="text-center">
              <p className="text-sm text-gray-500">
                This is how your chat widget will appear on your website.
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6 space-y-4">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Widget Installation</h2>
            <div>
              <p className="mb-2 text-sm text-gray-600">
                Copy and paste this code snippet into your website's HTML, just before the closing <code>&lt;/body&gt;</code> tag:
              </p>
              <div className="relative">
                <pre className="p-4 bg-gray-100 rounded-md text-xs overflow-x-auto">
                  {`<script src="${window.location.origin}/api/widget/${userId}.js"></script>`}
                </pre>
                <Button 
                  size="sm"
                  variant="outline"
                  className="absolute top-2 right-2"
                  onClick={() => {
                    navigator.clipboard.writeText(`<script src="${window.location.origin}/api/widget/${userId}.js"></script>`);
                    toast({
                      title: "Copied!",
                      description: "Widget code copied to clipboard",
                    });
                  }}
                >
                  Copy
                </Button>
              </div>
              <div className="mt-4">
                <p className="text-sm text-gray-600 mb-2">You can verify your widget works by visiting:</p>
                <Button 
                  variant="link" 
                  className="p-0 h-auto text-primary"
                  onClick={() => {
                    // Store current widget settings in localStorage before navigating
                    const currentSettings = { ...formValues, userId };
                    localStorage.setItem('temp_widget_settings', JSON.stringify(currentSettings));
                    window.open('/widget-demo', '_blank');
                    console.log('Opening widget demo page with stored settings');
                  }}
                >
                  Widget Demo Page
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
