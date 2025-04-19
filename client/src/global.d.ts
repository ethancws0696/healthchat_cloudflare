// Type declarations for global variables used by the widget

interface Window {
    // API URL constants set by widget-helper.js
    HEALTHCHAT_API_BASE_URL?: string;
    HEALTHCHAT_CHAT_API_URL?: string;
    
    // Widget mode flags
    STANDALONE_WIDGET_MODE?: boolean;
    SKIP_REACT_INITIALIZATION?: boolean;
    WIDGET_MODE?: string;
    
    // Environment flags
    VERCEL_SIMULATION?: boolean;
    
    // Widget configuration
    healthChatConfig?: {
      apiUrl?: string;
      widgetId?: string;
      primaryColor?: string;
      [key: string]: any;
    };
  }