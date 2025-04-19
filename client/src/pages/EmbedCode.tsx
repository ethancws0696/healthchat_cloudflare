import { useAuth } from "@/context/AuthContext";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Toaster } from "@/components/ui/toaster";
import { useToast } from "@/hooks/use-toast";
import { config, getWidgetScriptUrl } from "../config";

export default function EmbedCode() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [position, setPosition] = useState<string>("bottom-right");
  const [delayLoad, setDelayLoad] = useState<boolean>(false);
  const [disableMobile, setDisableMobile] = useState<boolean>(false);
  const [autohideTimeout, setAutohideTimeout] = useState<string>("0");
  const [hostUrl, setHostUrl] = useState<string>(() => {
    // Determine the appropriate host URL for the widget
    if (config.environment === 'production') {
      // Use the correct Cloudflare worker URL
      return "https://healthchat.ethan-c87.workers.dev";
    }
    return window.location.origin;
  });
  
  // Get the proper widget script URL from config
  const standardCode = `<script src="${user ? getWidgetScriptUrl(user.id) : `${hostUrl}/widget/demo.js`}"></script>`;
  
  // Generate advanced code with options
  const getAdvancedCode = () => {
    // Start with basic script tag
    let code = `<!-- HealthChat Widget Code -->
<script>
  // HealthChat Widget Configuration
  window.healthChatConfig = {
    userId: "${user?.id}",`;
    
    // Add position if not default
    if (position !== "bottom-right") {
      code += `
    position: "${position}",`;
    }
    
    // Add delay option if checked
    if (delayLoad) {
      code += `
    delayLoad: 3000, // Show widget 3 seconds after page load`;
    }
    
    // Add mobile disable option if checked
    if (disableMobile) {
      code += `
    disableMobile: true, // Don't show on mobile devices`;
    }
    
    // Add autohide option if selected
    if (autohideTimeout !== "0") {
      code += `
    autohide: ${autohideTimeout}, // Autohide widget after inactivity (in milliseconds)`;
    }
    
    // Close configuration object
    code += `
  };
</script>
<script src="${user ? getWidgetScriptUrl(user.id) : `${hostUrl}/widget/demo.js`}"></script>`;
    
    return code;
  };
  
  const triggerChatFunctionCode = `// Function to programmatically open the chat widget
function openHealthChat() {
  if (window.toggleHealthChat) {
    window.toggleHealthChat();
  }
}

// Example: Open chat when a button is clicked
document.getElementById("chat-button").addEventListener("click", openHealthChat);`;
  
  const handleCopyToClipboard = (code: string, type: string) => {
    navigator.clipboard.writeText(code);
    toast({
      title: "Copied to clipboard",
      description: `${type} code has been copied to your clipboard.`,
      duration: 3000,
    });
  };
  
  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
      <h1 className="text-3xl font-bold tracking-tight text-gray-900">Widget Embed Code</h1>
      <p className="mt-4 text-lg text-gray-600">
        Add the HealthChat AI-powered assistant to your healthcare website by including the script tag below.
      </p>
      
      <div className="mt-8">
        <Tabs defaultValue="standard" className="w-full">
          <TabsList className="w-full grid grid-cols-3 mb-8">
            <TabsTrigger value="standard">Standard Installation</TabsTrigger>
            <TabsTrigger value="advanced">Advanced Configuration</TabsTrigger>
            <TabsTrigger value="custom">Custom Integration</TabsTrigger>
          </TabsList>
          
          {/* Standard Installation Tab */}
          <TabsContent value="standard" className="p-6 border rounded-lg">
            <h2 className="text-xl font-medium text-gray-900 mb-4">Standard Installation</h2>
            <p className="text-gray-600 mb-6">
              Copy and paste this script tag at the end of your website's &lt;body&gt; tag to add the HealthChat widget to your site.
              The widget will appear as a chat button in the bottom right corner of your website.
            </p>
            
            <div className="bg-gray-900 text-gray-100 font-mono p-4 rounded-md overflow-x-auto">
              <code>{standardCode}</code>
            </div>
            
            <Button 
              className="mt-4 inline-flex items-center"
              onClick={() => handleCopyToClipboard(standardCode, "Standard")}
            >
              <svg className="w-4 h-4 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
              </svg>
              Copy to clipboard
            </Button>
          </TabsContent>
          
          {/* Advanced Configuration Tab */}
          <TabsContent value="advanced" className="p-6 border rounded-lg">
            <h2 className="text-xl font-medium text-gray-900 mb-4">Advanced Configuration</h2>
            <p className="text-gray-600 mb-6">
              Customize how the widget appears and behaves on your website.
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-2">Widget Position</h3>
                <select 
                  value={position}
                  onChange={(e) => setPosition(e.target.value)}
                  className="w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                >
                  <option value="bottom-right">Bottom Right (Default)</option>
                  <option value="bottom-left">Bottom Left</option>
                  <option value="top-right">Top Right</option>
                  <option value="top-left">Top Left</option>
                </select>
              </div>
              
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-2">Auto-hide Timeout (ms)</h3>
                <select 
                  value={autohideTimeout}
                  onChange={(e) => setAutohideTimeout(e.target.value)}
                  className="w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                >
                  <option value="0">Never auto-hide</option>
                  <option value="30000">30 seconds</option>
                  <option value="60000">1 minute</option>
                  <option value="300000">5 minutes</option>
                </select>
              </div>
            </div>
            
            <div className="space-y-4 mb-6">
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="delayLoad" 
                  checked={delayLoad} 
                  onCheckedChange={(checked) => setDelayLoad(checked as boolean)} 
                />
                <label htmlFor="delayLoad" className="text-sm font-medium text-gray-700">
                  Delay widget loading (improves page load performance)
                </label>
              </div>
              
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="disableMobile" 
                  checked={disableMobile} 
                  onCheckedChange={(checked) => setDisableMobile(checked as boolean)}
                />
                <label htmlFor="disableMobile" className="text-sm font-medium text-gray-700">
                  Disable on mobile devices
                </label>
              </div>
            </div>
            
            <div className="bg-gray-900 text-gray-100 font-mono p-4 rounded-md overflow-x-auto">
              <code className="whitespace-pre-wrap">{getAdvancedCode()}</code>
            </div>
            
            <Button 
              className="mt-4 inline-flex items-center"
              onClick={() => handleCopyToClipboard(getAdvancedCode(), "Advanced")}
            >
              <svg className="w-4 h-4 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
              </svg>
              Copy to clipboard
            </Button>
          </TabsContent>
          
          {/* Custom Integration Tab */}
          <TabsContent value="custom" className="p-6 border rounded-lg">
            <h2 className="text-xl font-medium text-gray-900 mb-4">Custom Integration</h2>
            <p className="text-gray-600 mb-6">
              Trigger the chat widget from custom elements on your website, such as buttons or links.
            </p>
            
            <h3 className="text-lg font-medium text-gray-800 mb-2">HTML Button Example</h3>
            <div className="bg-gray-900 text-gray-100 font-mono p-4 rounded-md overflow-x-auto mb-6">
              <code>{`<button id="chat-button" class="your-button-class">
  Chat with our Healthcare Assistant
</button>`}</code>
            </div>
            
            <h3 className="text-lg font-medium text-gray-800 mb-2">JavaScript Integration</h3>
            <div className="bg-gray-900 text-gray-100 font-mono p-4 rounded-md overflow-x-auto">
              <code className="whitespace-pre-wrap">{triggerChatFunctionCode}</code>
            </div>
            
            <Button 
              className="mt-4 inline-flex items-center"
              onClick={() => handleCopyToClipboard(triggerChatFunctionCode, "Custom integration")}
            >
              <svg className="w-4 h-4 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
              </svg>
              Copy to clipboard
            </Button>
            
            <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-md">
              <h3 className="text-md font-medium text-blue-800 mb-2">Important Note</h3>
              <p className="text-sm text-blue-700">
                Make sure to include the standard or advanced widget code on your page before trying to use the custom integration functions.
              </p>
            </div>
          </TabsContent>
        </Tabs>
        
        <Separator className="my-8" />
        
        <div className="bg-gray-50 rounded-lg p-6">
          <h2 className="text-xl font-medium text-gray-900 mb-4">Testing Your Integration</h2>
          <p className="text-gray-600 mb-4">
            After adding the widget to your website, you can test it by:
          </p>
          <ol className="list-decimal list-inside space-y-2 text-gray-600">
            <li>Opening your website in a browser</li>
            <li>Looking for the chat icon in the selected position (default is bottom right)</li>
            <li>Clicking the icon to open the chat interface</li>
            <li>Typing a message to test the AI response</li>
          </ol>
          <p className="mt-4 text-gray-600">
            All interactions with your widget will be logged in your HealthChat dashboard, and qualified leads will be captured automatically.
          </p>
        </div>
      </div>
      <Toaster />
    </div>
  );
}