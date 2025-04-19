// IMPORTANT: This special guard prevents execution in widget contexts 
// across multiple deployment platforms (Cloudflare Pages, Vercel, etc.)
// First check for the existence of universal widget helper variables/flags

// Check if we're in the widget URL path
const isWidgetPath = window.location.pathname.startsWith('/widget/');

// Check if our universal widget helper has set flags - but ONLY if we're in the widget path
// This prevents these checks from affecting the main application
if (isWidgetPath) {
  const skipMainTsx = localStorage.getItem('skip_main_tsx') === 'true';
  const widgetMode = localStorage.getItem('widget_mode') === 'standalone';
  const isInIframe = window.self !== window.top;
  
  // Guard check for standalone widget mode
  if (
    // Check if we're in an iframe in the widget path - this is the most reliable indicator
    (isInIframe && isWidgetPath) ||
    // Check flags set by universal widget helper
    skipMainTsx || 
    widgetMode ||
    // @ts-ignore - dynamic properties
    window.STANDALONE_WIDGET_MODE === true ||
    // @ts-ignore - dynamic properties
    window.SKIP_REACT_INITIALIZATION === true ||
    // @ts-ignore - dynamic properties
    window.preventReactInitialization === true ||
    // Legacy check for script header attribute (Cloudflare Pages compatibility)
    (document.currentScript && document.currentScript.getAttribute('data-headers') === 'X-Widget-Mode: standalone')
  ) {
    console.log("Standalone widget mode detected - exiting main.tsx");
    // This special case prevents any further execution
    throw new Error("WIDGET_STANDALONE_MODE - This error is expected and can be ignored");
  }
}

import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

// Function to initialize the app
function init() {
  try {
    // Check if we're in the standalone widget mode
    
    // 1. Check if we're in an iframe in the widget path
    const isInIframe = window.self !== window.top;
    const isWidgetPath = window.location.pathname.startsWith('/widget/');
    
    // Only run these checks if we're in the widget path to prevent affecting the main app
    let hasWidgetFlag = false;
    let hasWidgetModeFlag = false;
    
    if (isWidgetPath) {
      // 2. Check if localStorage flag is set by widget.html
      hasWidgetFlag = localStorage.getItem('widget_standalone_mode') === 'true';
      
      // 3. Check if window object has the WIDGET_ONLY_MODE property (safely)
      try {
        // @ts-ignore - Accessing dynamic property that's set in widget.html
        hasWidgetModeFlag = window.WIDGET_ONLY_MODE === true;
      } catch (e) {
        // Ignore error if property doesn't exist
      }
    }
    
    // Skip React rendering completely for the widget iframe case
    const isStandaloneMode = (isInIframe && isWidgetPath) || hasWidgetFlag || hasWidgetModeFlag;
    
    if (isStandaloneMode) {
      console.log("Standalone widget mode detected - not rendering React app", {
        isInIframe,
        isWidgetPath,
        hasWidgetFlag,
        hasWidgetModeFlag
      });
      return;
    }
    
    // For the main application, determine if we're in widget mode
    // (viewing the widget in the main window, not in an iframe)
    const isWidgetMode = 
      document.body.classList.contains('widget-only-mode') || 
      isWidgetPath;

    // Add global class to aid styling when in widget mode
    if (isWidgetMode) {
      document.body.classList.add('widget-only-mode');
    }

    // Render the React app
    const rootElement = document.getElementById("root");
    
    if (rootElement) {
      createRoot(rootElement).render(
        <App isWidgetMode={isWidgetMode} />
      );
    } else {
      console.error("Root element not found!");
    }
  } catch (error) {
    console.error("Error initializing application:", error);
    
    // Attempt to display a user-friendly error in the DOM
    const rootElement = document.getElementById("root");
    if (rootElement) {
      rootElement.innerHTML = `
        <div style="padding: 20px; font-family: sans-serif; color: #333;">
          <h2 style="color: #e53e3e;">Application Error</h2>
          <p>Sorry, there was a problem loading the application. Please try again later.</p>
          <p style="font-size: 12px; color: #666;">Technical details: ${error instanceof Error ? error.message : String(error)}</p>
        </div>
      `;
    }
  }
}

// Call the init function
init();
