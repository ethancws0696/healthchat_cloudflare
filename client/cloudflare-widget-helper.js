/**
 * Cloudflare Pages Widget Helper
 * 
 * This file contains special handling for the widget in Cloudflare Pages environment.
 * It addresses the "Unexpected token '<'" error that occurs specifically in the 
 * Cloudflare Pages deployment environment.
 * 
 * The issue happens because Cloudflare tries to include the main.tsx when processing
 * the widget.html file, which results in an error since main.tsx contains JSX that
 * can't be directly processed as JavaScript.
 */

// Special function to prevent main.tsx from executing in widget contexts
function preventMainTsxExecution() {
    // This will be called before any imports in main.tsx
    if (document.currentScript) {
      const headersAttr = document.currentScript.getAttribute('data-headers');
      if (headersAttr === 'X-Widget-Mode: standalone') {
        console.log("Widget mode detected via script header");
        return true;
      }
    }
    
    // Additional checks in case the header approach doesn't work
    const isInIframe = window.self !== window.top;
    const isWidgetPath = window.location.pathname.startsWith('/widget/');
    const hasWidgetFlag = localStorage.getItem('widget_standalone_mode') === 'true';
    
    let hasWidgetModeFlag = false;
    try {
      // @ts-ignore - Accessing dynamic property that might be set in widget.html
      hasWidgetModeFlag = window.WIDGET_ONLY_MODE === true;
    } catch (e) {
      // Ignore error if property doesn't exist
    }
    
    const isStandaloneMode = (isInIframe && isWidgetPath) || hasWidgetFlag || hasWidgetModeFlag;
    
    if (isStandaloneMode) {
      console.log("Widget standalone mode detected - preventing main.tsx execution", {
        isInIframe,
        isWidgetPath,
        hasWidgetFlag,
        hasWidgetModeFlag
      });
      return true;
    }
    
    return false;
  }
  
  // When in Cloudflare Pages, we'll use this instead of allowing main.tsx to run
  // This keeps the widget working correctly in that environment
  if (preventMainTsxExecution()) {
    console.log("[Cloudflare Helper] Running in widget mode, preventing main.tsx execution");
    
    // Create a global flag that can be checked elsewhere
    window.WIDGET_ONLY_MODE = true;
    
    // Set this in localStorage to persist across page loads
    try {
      localStorage.setItem('widget_standalone_mode', 'true');
    } catch (e) {
      // Ignore if localStorage is not available
    }
    
    // Add a class to help with styling
    document.body.classList.add('widget-only-mode');
  }