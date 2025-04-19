import { useEffect, useState } from 'react';
import { useLocation } from 'wouter';
import { useAuth } from '@/context/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { getWidgetScriptUrl } from '@/config';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

// Add type definitions for the global window object extensions
declare global {
  interface Window {
    toggleHealthChat?: () => void;
    healthChatConfig?: Record<string, any>;
    healthChatWidgetLoaded?: boolean;
  }
}

export default function WidgetDemo() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [widgetLoaded, setWidgetLoaded] = useState(false);
  const [activeTab, setActiveTab] = useState('preview');
  const [manuallyOpened, setManuallyOpened] = useState(false);

  // Define widget settings type
  type WidgetSettings = {
    id?: number;
    userId: number;
    primaryColor: string;
    secondaryColor: string;
    fontFamily: string;
    position: string;
    greeting: string;
    logoUrl: string | null;
    botName: string;
    showBranding: boolean;
  };

  // Check for temp settings from customizer
  const [tempSettings, setTempSettings] = useState<WidgetSettings | null>(null);
  
  useEffect(() => {
    // Try to get temporary settings from localStorage
    const storedSettings = localStorage.getItem('temp_widget_settings');
    if (storedSettings) {
      try {
        const parsedSettings = JSON.parse(storedSettings);
        setTempSettings(parsedSettings);
        // Clear the temp settings to avoid reusing them on page refresh
        localStorage.removeItem('temp_widget_settings');
      } catch (e) {
        console.error('Error parsing temporary widget settings:', e);
      }
    }
  }, []);
  
  // Fetch widget settings to display in demo
  const { data: fetchedSettings } = useQuery<WidgetSettings>({
    queryKey: [`/api/widget-settings/${user?.id}`],
    enabled: !!user && !tempSettings, // Only fetch when user is available and no temp settings
  });
  
  // Use temporary settings if available, otherwise use fetched settings
  const settings = tempSettings || fetchedSettings;

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!user) {
      setLocation('/login');
    }
  }, [user, setLocation]);

  // Inject widget script in this demo page
  useEffect(() => {
    if (user) {
      const scriptId = 'healthchat-widget-script';
      
      // Remove existing script if any
      const existingScript = document.getElementById(scriptId);
      if (existingScript) {
        existingScript.remove();
        setWidgetLoaded(false);
      }
      
      // Clear any existing window.healthChatConfig
      // @ts-ignore
      window.healthChatConfig = undefined;
      // @ts-ignore 
      window.healthChatWidgetLoaded = undefined;
      
      // Set up a configuration object for customizing the widget
      // @ts-ignore
      window.healthChatConfig = {
        autoOpen: false, // Don't auto-open in demo mode
        delayLoad: 1000 // Slight delay for better effect
      };
      
      // Create script element
      const script = document.createElement('script');
      script.id = scriptId;
      // Get the correct widget script URL based on environment
      script.src = getWidgetScriptUrl(user.id);
      console.log('Loading widget script from:', script.src);
      
      // Listen for script load
      script.onload = () => {
        console.log('Widget script loaded successfully');
        setWidgetLoaded(true);
      };
      
      script.onerror = (err) => {
        console.error('Failed to load widget script:', err);
      };
      
      // Append to body
      document.body.appendChild(script);
      
      // Cleanup on unmount
      return () => {
        const scriptToRemove = document.getElementById(scriptId);
        if (scriptToRemove) {
          scriptToRemove.remove();
        }
        
        // Clean up any widget elements that might have been created
        const widgetContainer = document.getElementById('healthchat-widget-container');
        if (widgetContainer) {
          widgetContainer.remove();
        }
        
        // Reset widget state
        setWidgetLoaded(false);
        setManuallyOpened(false);
      };
    }
  }, [user]);

  // Function to manually toggle the widget
  const toggleWidget = () => {
    if (typeof window.toggleHealthChat === 'function') {
      window.toggleHealthChat();
      setManuallyOpened(!manuallyOpened);
    } else {
      console.error('toggleHealthChat function not available');
    }
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <div className="max-w-5xl mx-auto p-4 md:p-8">
        <Card className="mb-6">
          <CardHeader>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <CardTitle className="text-2xl font-bold text-gray-900">Widget Embed Demo</CardTitle>
                <CardDescription>
                  Test how your chat widget will appear on your website
                </CardDescription>
              </div>
              <Button 
                onClick={() => setLocation('/dashboard')}
                variant="outline"
              >
                Back to Dashboard
              </Button>
            </div>
          </CardHeader>
          
          <CardContent>
            <Tabs defaultValue="preview" value={activeTab} onValueChange={setActiveTab} className="mb-6">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="preview">Live Preview</TabsTrigger>
                <TabsTrigger value="code">Embed Code</TabsTrigger>
                <TabsTrigger value="controls">Controls</TabsTrigger>
              </TabsList>
              
              <TabsContent value="preview" className="pt-4">
                <div className="prose max-w-none dark:prose-invert">
                  <h3>Widget Preview</h3>
                  <p>
                    This page demonstrates how the HealthChat AI widget will appear when embedded on your healthcare website.
                    The chat button should appear in the bottom-right corner of this page.
                  </p>
                  
                  <div className="flex items-center gap-2 my-4">
                    <span>Widget Status:</span>
                    {widgetLoaded ? (
                      <Badge className="bg-green-500 text-white">Loaded</Badge>
                    ) : (
                      <Badge variant="destructive">Not Loaded</Badge>
                    )}
                  </div>
                  
                  <Button 
                    onClick={toggleWidget}
                    disabled={!widgetLoaded}
                    className="mb-8"
                  >
                    {manuallyOpened ? 'Close Widget' : 'Open Widget'}
                  </Button>
                </div>
                
                <div className="prose max-w-none dark:prose-invert border-t pt-4">
                  <h4>Example Healthcare Content (for Demo)</h4>
                  <p>
                    Below is some example content to simulate a healthcare website. The chat widget should stay fixed in the 
                    bottom right corner as you scroll through this content.
                  </p>
                </div>
              </TabsContent>
              
              <TabsContent value="code" className="space-y-4 pt-4">
                <div className="prose max-w-none dark:prose-invert">
                  <h3>Implementation Instructions</h3>
                  <p>
                    To add this widget to your own website, simply add the following script tag to your website's HTML, 
                    preferably just before the closing <code>&lt;/body&gt;</code> tag:
                  </p>
                </div>
                
                <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-md font-mono text-sm overflow-x-auto">
                  <code>{`<script src="${getWidgetScriptUrl(user.id)}"></script>`}</code>
                </div>
                
                <div className="prose max-w-none dark:prose-invert">
                  <h4>Advanced Configuration</h4>
                  <p>
                    You can customize the widget behavior by adding a configuration object before loading the script:
                  </p>
                </div>
                
                <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-md font-mono text-sm overflow-x-auto">
                  <code>{`<script>
  // Optional: Configure widget before loading
  window.healthChatConfig = {
    position: "${settings?.position ?? 'bottom-right'}", // 'bottom-right', 'bottom-left', 'top-right', 'top-left'
    autoOpen: false,                     // Automatically open widget when loaded
    delayOpen: 2000,                     // Delay in ms before auto-opening (if autoOpen is true)
    delayLoad: 1000,                     // Delay in ms before showing the widget button
    disableMobile: false                 // Disable widget on mobile devices
  };
</script>
<script src="${getWidgetScriptUrl(user.id)}"></script>`}</code>
                </div>
                
                <div className="prose max-w-none dark:prose-invert">
                  <h4>Programmatic Control</h4>
                  <p>
                    The widget can be programmatically opened or closed using the following JavaScript function:
                  </p>
                </div>
                
                <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-md font-mono text-sm">
                  <code>{`<button onclick="window.toggleHealthChat()">Chat with us</button>`}</code>
                </div>
              </TabsContent>
              
              <TabsContent value="controls" className="pt-4">
                <div className="prose max-w-none dark:prose-invert">
                  <h3>Widget Controls</h3>
                  <p>
                    Test the widget functionality using these controls:
                  </p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 my-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Toggle Widget</CardTitle>
                      <CardDescription>Open or close the chat widget</CardDescription>
                    </CardHeader>
                    <CardFooter>
                      <Button 
                        onClick={toggleWidget}
                        disabled={!widgetLoaded}
                        className="w-full"
                      >
                        {manuallyOpened ? 'Close Widget' : 'Open Widget'}
                      </Button>
                    </CardFooter>
                  </Card>
                  
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Reset Widget</CardTitle>
                      <CardDescription>Reload the widget script</CardDescription>
                    </CardHeader>
                    <CardFooter>
                      <Button 
                        onClick={() => {
                          // Force reload of the widget script
                          const existingScript = document.getElementById('healthchat-widget-script');
                          if (existingScript) {
                            existingScript.remove();
                          }
                          
                          // Clean up any widget elements that might have been created
                          const widgetContainer = document.getElementById('healthchat-widget-container');
                          if (widgetContainer) {
                            widgetContainer.remove();
                          }
                          
                          // Reset state
                          setWidgetLoaded(false);
                          setManuallyOpened(false);
                          
                          // Reload script after a brief delay
                          setTimeout(() => {
                            const script = document.createElement('script');
                            script.id = 'healthchat-widget-script';
                            // Get the correct widget script URL based on environment
                            script.src = getWidgetScriptUrl(user.id);
                            console.log('Reloading widget script from:', script.src);
                            script.onload = () => setWidgetLoaded(true);
                            document.body.appendChild(script);
                          }, 500);
                        }}
                        variant="outline"
                        className="w-full"
                      >
                        Reset Widget
                      </Button>
                    </CardFooter>
                  </Card>
                </div>
                
                <div className="prose max-w-none dark:prose-invert">
                  <h4>Current Settings</h4>
                  <p>
                    These are the current settings for your widget:
                  </p>
                </div>
                
                <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-md mt-4">
                  <pre className="text-xs overflow-auto">
                    {JSON.stringify(settings, null, 2) || 'Loading settings...'}
                  </pre>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
        
        {/* Example healthcare website content for the demo */}
        <div className="bg-white rounded-lg shadow-sm p-6 prose max-w-none">
          <h2>North Shore Healthcare</h2>
          <p className="lead">
            Providing compassionate care for our community since 1985.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <h3>Our Services</h3>
              <ul>
                <li>Primary Care & Family Medicine</li>
                <li>Pediatrics & Child Development</li>
                <li>Mental Health & Counseling</li>
                <li>Preventive Care & Wellness</li>
                <li>Chronic Disease Management</li>
                <li>Women's Health</li>
                <li>Senior Care & Geriatrics</li>
              </ul>
              
              <h3>Insurance We Accept</h3>
              <ul>
                <li>Blue Cross Blue Shield</li>
                <li>Aetna</li>
                <li>Cigna</li>
                <li>UnitedHealthcare</li>
                <li>Medicare</li>
                <li>Medicaid</li>
                <li>And many more - contact us to verify your coverage</li>
              </ul>
            </div>
            
            <div>
              <h3>Patient Resources</h3>
              <p>
                We are dedicated to providing comprehensive resources to our patients.
                Visit our patient portal to access your medical records, schedule appointments,
                and communicate with your healthcare providers.
              </p>
              
              <h4>New Patients</h4>
              <p>
                We're currently accepting new patients! Please contact our office to schedule 
                your first appointment. You can also download and complete our new patient 
                forms before your visit to save time.
              </p>
              
              <h3>Contact Information</h3>
              <p>
                <strong>Main Office:</strong> 123 Healthcare Drive<br />
                <strong>Phone:</strong> (555) 123-4567<br />
                <strong>Email:</strong> info@northshore-healthcare.com<br />
                <strong>Hours:</strong> Monday-Friday, 8am-5pm
              </p>
              
              <h4>Emergency Information</h4>
              <p>
                For medical emergencies, please call 911 or go to your nearest emergency room.
                For urgent but non-emergency issues after hours, please call our main number 
                for the on-call provider.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}