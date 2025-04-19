import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type ChatWidgetProps = {
  isDemo?: boolean;
  userId?: string;
  logoUrl?: string;
  primaryColor?: string;
  secondaryColor?: string;
  botName?: string;
  providerName?: string;
  greeting?: string;
  showBranding?: boolean;
  position?: string;
};

type Message = {
  role: "user" | "assistant";
  content: string;
};

// Demo messages for the landing page demonstration
const DEMO_MESSAGES: Message[] = [
  { role: "assistant", content: "👋 Hi there! I'm Sarah, the virtual assistant for North Shore Health Center. How can I help you today?" },
  { role: "user", content: "I'm looking for a primary care doctor who accepts Blue Cross insurance" },
  { role: "assistant", content: "Great! We do accept Blue Cross Blue Shield at North Shore Health Center. We have several primary care physicians currently accepting new patients. Could you tell me a bit about what you're looking for in a doctor? For example, do you prefer a male or female physician?" },
  { role: "user", content: "I'd prefer a female doctor if possible" },
  { role: "assistant", content: "Perfect! Dr. Jessica Martinez and Dr. Emily Chen are both female primary care physicians accepting new patients. Both specialize in preventive care and chronic disease management. Would you like to know more about either of them, or would you prefer to schedule an appointment?" },
  { role: "user", content: "I'd like to schedule with Dr. Chen" },
  { role: "assistant", content: "Excellent choice! Dr. Chen has appointments available next Tuesday and Thursday. To schedule, I'll need a few details from you. Could you provide your name and a contact number or email address?" },
];

export default function ChatWidget({
  isDemo = false,
  userId,
  logoUrl = "https://images.unsplash.com/photo-1559839734-2b71ea197ec2",
  primaryColor = "#4F46E5",
  secondaryColor = "#14B8A6",
  botName = "Sarah",
  providerName = "North Shore Health",
  greeting = "👋 Hi there! I'm Sarah, the virtual assistant for North Shore Health Center. How can I help you today?",
  showBranding = true,
  position = "bottom-right"
}: ChatWidgetProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const chatWindowRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // For demo, load predefined messages
    if (isDemo) {
      setMessages(DEMO_MESSAGES);
    } else {
      // For real widget, just add the initial greeting
      setMessages([{ role: "assistant", content: greeting }]);
    }
  }, [isDemo, greeting]);

  // Scroll to bottom when messages change
  useEffect(() => {
    if (chatWindowRef.current) {
      chatWindowRef.current.scrollTop = chatWindowRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSendMessage = async () => {
    if (!message.trim()) return;
    
    // Add user message
    const userMessage: Message = {
      role: "user",
      content: message
    };
    
    setMessages(prev => [...prev, userMessage]);
    setMessage("");
    
    // For demo, don't actually send messages
    if (isDemo) {
      setTimeout(() => {
        setMessages(prev => [...prev, {
          role: "assistant",
          content: "This is a demo chat. In a real implementation, your message would be processed by our AI assistant."
        }]);
      }, 1000);
      return;
    }
    
    // For real widget, make API call
    try {
      // Generate a random visitor ID if we don't have one
      const visitorId = localStorage.getItem('visitorId') || 
        `visitor-${Math.random().toString(36).substring(2, 10)}`;
      
      // Store visitor ID for future conversations
      if (!localStorage.getItem('visitorId')) {
        localStorage.setItem('visitorId', visitorId);
      }
      
      // Get conversation ID from local storage if it exists
      const conversationId = localStorage.getItem(`conversation-${userId}`);
      
      // Add typing indicator
      setMessages(prev => [...prev, {
        role: "assistant",
        content: "..."
      }]);
      
      // Determine the correct API URL to use
      let apiUrl = '';
      
      // Try to use the globally defined API URL first (set by widget-helper.js)
      if (typeof window.HEALTHCHAT_CHAT_API_URL !== 'undefined') {
        apiUrl = window.HEALTHCHAT_CHAT_API_URL + userId;
        console.log('Sending chat message to:', apiUrl);
      } 
      // Fallback to the regular API path
      else {
        // Import dynamically to avoid circular dependencies
        const { getApiBaseUrl } = await import('@/lib/apiService');
        const baseUrl = getApiBaseUrl();
        apiUrl = `${baseUrl}/chat/${userId}`;
        console.log('Sending chat message to fallback URL:', apiUrl);
      }
      
      // Make API request
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: userMessage.content,
          visitorId,
          conversationId: conversationId ? Number(conversationId) : undefined
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to send message');
      }
      
      const data = await response.json();
      
      // Save conversation ID for future messages
      if (data.conversationId) {
        localStorage.setItem(`conversation-${userId}`, data.conversationId.toString());
      }
      
      // Remove typing indicator and add real response
      setMessages(prev => {
        // Remove the last message if it's the typing indicator
        const newMessages = prev.slice(0, prev.length - 1);
        
        // Add the real response
        return [...newMessages, {
          role: "assistant",
          content: data.message
        }];
      });
    } catch (error) {
      console.error('Error sending message:', error);
      
      // Remove typing indicator and add error message
      setMessages(prev => {
        // Remove the last message if it's the typing indicator
        const newMessages = prev.slice(0, prev.length - 1);
        
        // Add error message
        return [...newMessages, {
          role: "assistant",
          content: "I'm sorry, I'm having trouble connecting right now. Please try again later."
        }];
      });
    }
  };

  const toggleWidget = () => {
    setIsOpen(!isOpen);
  };

  // Handle Enter key press
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const widgetStyles = {
    "--primary-color": primaryColor,
    "--secondary-color": secondaryColor,
  } as React.CSSProperties;

  return (
    <div style={widgetStyles}>
      {/* Floating chat button */}
      {!isOpen && (
        <button 
          className="bg-primary-500 hover:bg-primary-600 text-white rounded-full p-4 shadow-lg flex items-center justify-center pulse-animation"
          style={{ backgroundColor: primaryColor }}
          onClick={toggleWidget}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
          </svg>
        </button>
      )}

      {/* Chat widget */}
      {isOpen && (
        <div className="bg-white rounded-lg shadow-custom">
          {/* Chat header */}
          <div 
            className="p-4 rounded-t-lg flex justify-between items-center text-white"
            style={{ backgroundColor: primaryColor }}
          >
            <div className="flex items-center">
              <img 
                className="h-10 w-10 rounded-full object-cover" 
                src={logoUrl} 
                alt={`${providerName} Logo`} 
              />
              <div className="ml-3">
                <h3 className="text-lg font-medium">{providerName}</h3>
                <div className="flex items-center">
                  <div className="h-2 w-2 bg-green-400 rounded-full mr-2"></div>
                  <span className="text-sm">Online</span>
                </div>
              </div>
            </div>
            <button 
              className="text-white hover:text-gray-200"
              onClick={toggleWidget}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          {/* Chat messages */}
          <div 
            ref={chatWindowRef}
            className="p-4 chat-window overflow-y-auto"
            style={{ maxHeight: "400px" }}
          >
            {messages.map((msg, index) => (
              <div
                key={index}
                className={`chat-bubble ${
                  msg.role === "assistant" ? "ai bg-gray-100 text-gray-800" : "user ml-auto text-white"
                }`}
                style={
                  msg.role === "user" 
                    ? { backgroundColor: primaryColor } 
                    : {}
                }
              >
                <p>{msg.content}</p>
              </div>
            ))}
          </div>
          
          {/* Chat input */}
          <div className="border-t border-gray-200 p-4">
            <div className="flex items-center">
              <Input
                type="text"
                placeholder="Type your message..."
                className="block w-full py-2 px-3 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyDown={handleKeyDown}
              />
              <Button 
                className="ml-3 p-2 rounded-full text-white"
                style={{ backgroundColor: primaryColor }}
                onClick={handleSendMessage}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
                </svg>
              </Button>
            </div>
            {showBranding && (
              <p className="mt-2 text-xs text-gray-500 text-center">
                Powered by HealthChat AI • <a href="#" className="text-primary-500 hover:text-primary-600">Privacy Policy</a>
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
