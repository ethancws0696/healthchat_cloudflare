/**
 * Universal Widget Helper Script
 * This script helps make the Healthcare Chat Widget compatible with any hosting platform
 * including Vercel, Cloudflare Pages, and Replit.
 */

(function() {
    // Check for the current environment
    function detectEnvironment() {
      const hostName = window.location.hostname;
      
      // Check for simulation flag first (highest priority)
      if (window.VERCEL_SIMULATION === true) {
        console.log('Detected Vercel simulation mode');
        return 'vercel';
      }
      
      // Detect Cloudflare Pages
      if (hostName.includes('pages.dev')) {
        return 'cloudflare-pages';
      }
      
      // Detect Vercel
      if (hostName.includes('vercel.app')) {
        return 'vercel';
      }
      
      // Fallback to 'development' or 'unknown' environment
      return window.location.port ? 'development' : 'unknown';
    }
    
    // Set up API URL constants
    function setupApiConstants() {
      // Always use Cloudflare Worker URL for API calls in widget mode
      window.HEALTHCHAT_API_BASE_URL = 'https://healthchat.ethan-c87.workers.dev/api';
      
      // Explicitly expose the chat API endpoint
      window.HEALTHCHAT_CHAT_API_URL = 'https://healthchat.ethan-c87.workers.dev/api/chat/';
      
      // Make the API URL extra globally available
      if (typeof window.healthChatConfig === 'undefined') {
        window.healthChatConfig = {};
      }
      window.healthChatConfig.apiUrl = 'https://healthchat.ethan-c87.workers.dev';
      
      console.log('Set API base URL to:', window.HEALTHCHAT_API_BASE_URL);
      console.log('Set chat API URL to:', window.HEALTHCHAT_CHAT_API_URL);
    }
    
    // Set a flag to indicate we're in widget mode
    function setWidgetMode() {
      // 1. Add HTML attribute
      document.documentElement.setAttribute('data-widget-mode', 'standalone');
      
      // 2. Add meta tag
      const meta = document.createElement('meta');
      meta.name = 'x-widget-mode';
      meta.content = 'standalone';
      document.head.appendChild(meta);
      
      // 3. Add global JavaScript variable
      window.WIDGET_MODE = 'standalone';
      
      // 4. Set localStorage flag
      localStorage.setItem('widget_mode', 'standalone');
      
      // 5. Add custom header via meta tag (for Cloudflare Pages)
      const headerMeta = document.createElement('meta');
      headerMeta.httpEquiv = 'X-Widget-Mode';
      headerMeta.content = 'standalone';
      document.head.appendChild(headerMeta);
      
      console.log('Widget mode flags set by universal widget helper');
    }
  
    // Add specific platform mitigations
    function applyPlatformSpecificFixes(platform) {
      if (platform === 'cloudflare-pages') {
        // Cloudflare Pages specific fixes for JSX/React issues
        console.log('Applying Cloudflare Pages specific fixes');
        
        // Prevent React from initializing by defining a fake React object
        window.preventReactInitialization = true;
        
        // Add special headers through meta tags (CF Pages supports this)
        const headerMeta = document.createElement('meta');
        headerMeta.httpEquiv = 'X-Widget-Mode';
        headerMeta.content = 'standalone'; 
        document.head.appendChild(headerMeta);
      }
      
      if (platform === 'vercel') {
        // Vercel specific fixes if needed
        console.log('Applying Vercel specific fixes');
        // Currently no special fixes needed for Vercel
      }
    }
    
    // Prevent main.tsx from executing in widget context
    function preventMainTsxExecution() {
      // Several guards to prevent main.tsx from executing
      window.STANDALONE_WIDGET_MODE = true;
      window.SKIP_REACT_INITIALIZATION = true;
      
      // This flag is checked in main.tsx
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem('skip_main_tsx', 'true');
      }
      
      console.log('Guards set to prevent main.tsx execution in widget');
    }
    
    // Main initialization
    function init() {
      const platform = detectEnvironment();
      console.log('Detected platform:', platform);
      
      // Apply all mitigations
      setWidgetMode();
      preventMainTsxExecution();
      applyPlatformSpecificFixes(platform);
      setupApiConstants();
      
      console.log('Universal widget helper initialized successfully');
      console.log('Debug info loaded in widget');
    }
    
    // Call initialization immediately
    init();
  })();