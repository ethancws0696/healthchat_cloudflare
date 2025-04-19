import { useState, useEffect, useRef, FormEvent, ChangeEvent, KeyboardEvent } from "react";
import { useParams } from "wouter";
import { getApiBaseUrl } from '../../lib/apiService'; // Import getApiBaseUrl
// Removed unused import: import { getChatApiUrl } from '../../config';
// Removed unused import: import { sendChatMessage } from '../../lib/apiService';

// Define widget parameters type
type WidgetParams = {
  userId: string;
};

// Define message structure
interface Message {
  content: string;
  sender: 'user' | 'assistant';
  timestamp: Date;
}

// Define props for the widget component
interface WidgetProps {
  userId?: number;
  isIframe?: boolean;
  // Any additional route params from wouter
  params?: any;
}

// Simple widget component with no WebSocket functionality
export default function Widget(props: WidgetProps = {}) {
  // Extract props or use defaults
  // Check if we're in an iframe by comparing window vs parent window
  const isReallyInIframe = window !== window.parent;
  // combine prop setting with actual detection
  const { isIframe = isReallyInIframe, userId: propUserId } = props;
  
  // Log iframe status with additional debug info
  console.log("Widget component loaded. isIframe:", isIframe, "reallyInIframe:", isReallyInIframe, "Window size:", window.innerWidth, "x", window.innerHeight);
  console.log("Widget rendering location:", window.location.href);
  
  // Get userId from URL parameters or props
  const params = useParams<WidgetParams>();
  // Use the first found non-null value, with the props.userId taking precedence
  const userId = propUserId || Number(params?.userId || 1);
  
  // Log the userId for debugging
  console.log("Widget using userId:", userId);
  
  // Widget state
  const [isOpen, setIsOpen] = useState(true);
  const [messages, setMessages] = useState<Message[]>([{
    content: "Hi there! How can I help you today?",
    sender: "assistant",
    timestamp: new Date()
  }]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  
  // Handle sending a message
  const handleSendMessage = async (e?: FormEvent) => {
    if (e) e.preventDefault();
    
    if (!input.trim()) return;
    
    // Add user message
    const userMessage: Message = {
      content: input.trim(),
      sender: 'user',
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);
    
    try {
      // Generate a visitor ID if we don't have one already
      if (!localStorage.getItem('healthchat_visitor_id')) {
        localStorage.setItem('healthchat_visitor_id', Date.now().toString() + Math.random().toString(36).substring(2, 15));
      }
      const visitorId = localStorage.getItem('healthchat_visitor_id') || 'unknown-visitor';
      
      // Get conversation ID from local storage if available
      const conversationId = localStorage.getItem('healthchat_conversation_id') 
        ? Number(localStorage.getItem('healthchat_conversation_id'))
        : undefined;
      
      console.log('Sending chat message for userId:', userId);
      console.log('Conversation ID:', conversationId || 'New conversation');
      console.log('Visitor ID:', visitorId);
      
      // Construct the API URL using the centralized function
      const apiBaseUrl = getApiBaseUrl();
      const chatApiUrl = `${apiBaseUrl}/chat/${userId}`;
      
      // Log the actual request for debugging
      console.log('Sending chat request to:', chatApiUrl);
      
      const response = await fetch(chatApiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: userMessage.content,
          visitorId: visitorId,
          conversationId: conversationId
        }),
      });
      
      if (!response.ok) {
        console.error('Error status:', response.status);
        throw new Error('Failed to get response');
      }
      
      const data = await response.json();
      console.log('Chat response:', data);
      
      // Store conversation ID for future messages
      if (data.conversationId) {
        localStorage.setItem('healthchat_conversation_id', data.conversationId.toString());
      }
      
      // Add assistant response
      const assistantMessage: Message = {
        content: data.message || 'Sorry, I could not process your request. Please try again.',
        sender: 'assistant',
        timestamp: new Date()
      };
      
      // Add to local state
      setMessages(prev => [...prev, assistantMessage]);
    } catch (err) {
      console.error('Error sending message:', err);
      
      // Add error message
      const errorMessage: Message = {
        content: 'Sorry, there was an error processing your message. Please try again later.',
        sender: 'assistant',
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Handle input change
  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    setInput(e.target.value);
  };
  
  // Handle input keypress (send on Enter)
  const handleKeyPress = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Effect to listen for messages from parent window when in iframe
  useEffect(() => {
    if (isIframe) {
      // Notify the parent that the widget is ready
      window.parent.postMessage({ type: 'WIDGET_READY', userId }, '*');
      
      // Listen for commands from the parent window
      const handleMessage = (event: MessageEvent) => {
        if (event.data && event.data.type === 'WIDGET_COMMAND') {
          if (event.data.command === 'open') {
            setIsOpen(true);
          } else if (event.data.command === 'close') {
            setIsOpen(false);
          }
        }
      };
      
      window.addEventListener('message', handleMessage);
      return () => window.removeEventListener('message', handleMessage);
    }
  }, [isIframe, userId]);
  
  // Button styling - make more visible in iframe mode
  const buttonStyle = {
    width: isIframe ? '80px' : '60px',
    height: isIframe ? '80px' : '60px',
    borderRadius: '50%',
    backgroundColor: '#4F46E5',
    color: 'white',
    boxShadow: '0 0 0 4px white, 0 4px 8px rgba(0, 0, 0, 0.4)', // Add white border around button
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    position: isIframe ? 'absolute' : 'fixed',
    bottom: isIframe ? '0' : '20px',
    right: isIframe ? '0' : '20px',
    zIndex: 9999,
    border: isIframe ? '2px solid white' : 'none', // Add border when in iframe
  } as React.CSSProperties;
  
  // Chat window styling - adjust based on whether it's embedded in an iframe
  const chatStyle = {
    position: isIframe ? 'absolute' : 'fixed',
    bottom: isIframe ? '0' : '20px',
    right: isIframe ? '0' : '20px',
    width: isIframe ? '100%' : '350px',
    height: isIframe ? '100%' : '500px',
    backgroundColor: 'white', 
    borderRadius: isIframe ? '0' : '8px',
    boxShadow: '0 0 0 4px #4F46E5, 0 4px 20px rgba(0, 0, 0, 0.2)', // Add prominent border for visibility
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
    zIndex: 9999,
    border: '2px solid white', // Add white inner border for contrast
  } as React.CSSProperties;

  // Chat header styling
  const headerStyle = {
    backgroundColor: '#4F46E5',
    color: 'white',
    padding: '12px 16px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  } as React.CSSProperties;
  
  // Content styling
  const contentStyle = {
    flex: 1,
    padding: '16px',
    overflowY: 'auto',
    backgroundColor: '#f9fafb',
  } as React.CSSProperties;
  
  // Show debug info in iframe mode for development
  const DebugInfo = () => {
    if (!isIframe) return null;
    
    return (
      <div style={{
        position: 'absolute',
        top: '4px',
        left: '4px',
        backgroundColor: 'rgba(0,0,0,0.8)',
        color: 'white',
        padding: '4px 8px',
        borderRadius: '4px',
        fontSize: '10px',
        zIndex: 10000,
        fontFamily: 'monospace',
      }}>
        <div>IFRAME MODE</div>
        <div>UserID: {userId}</div>
        <div>Size: {window.innerWidth}x{window.innerHeight}</div>
        <div style={{ color: '#4ade80' }}>Status: Active</div>
        {isLoading && (
          <div style={{ color: '#facc15' }}>Processing...</div>
        )}
      </div>
    );
  };
  
  // Show either chat button or full chat interface
  return (
    <div className="widget-component">
      {/* Always show debug info in iframe mode */}
      <DebugInfo />
      
      {!isOpen ? (
        // Chat button
        <div
          style={buttonStyle}
          onClick={() => setIsOpen(true)}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
          </svg>
        </div>
      ) : (
        // Chat interface
        <div style={chatStyle}>
          {/* Header */}
          <div style={headerStyle}>
            <div>Healthcare Support</div>
            <button 
              onClick={() => setIsOpen(false)}
              style={{
                background: 'none',
                border: 'none',
                color: 'white',
                cursor: 'pointer',
                fontSize: '20px',
              }}
            >
              ×
            </button>
          </div>
          
          {/* Content */}
          <div style={contentStyle}>
            {messages.map((message, index) => (
              <div
                key={index}
                style={{
                  backgroundColor: message.sender === 'assistant' ? 'white' : '#eff6ff',
                  padding: '12px',
                  borderRadius: '8px',
                  marginBottom: '12px',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                  alignSelf: message.sender === 'user' ? 'flex-end' : 'flex-start',
                  maxWidth: '80%',
                  marginLeft: message.sender === 'user' ? 'auto' : '0',
                }}
              >
                <p style={{ margin: '0 0 8px 0' }}>{message.content}</p>
                <small style={{ color: '#6b7280', fontSize: '12px' }}>
                  {message.timestamp.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                </small>
              </div>
            ))}
            
            {isLoading && (
              <div style={{
                backgroundColor: 'white',
                padding: '12px',
                borderRadius: '8px',
                marginBottom: '12px',
                boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                display: 'flex',
                alignItems: 'center',
              }}>
                <div style={{ marginRight: '8px' }}>
                  Thinking...
                </div>
                <div style={{
                  width: '16px',
                  height: '16px',
                  borderRadius: '50%',
                  border: '2px solid #f3f4f6',
                  borderTopColor: '#4F46E5',
                  animation: 'spin 1s linear infinite',
                }}></div>
              </div>
            )}
          </div>
          
          {/* Input area */}
          <form 
            onSubmit={handleSendMessage}
            style={{
              padding: '12px',
              borderTop: '1px solid #e5e7eb',
              display: 'flex',
              backgroundColor: 'white',
            }}
          >
            <input
              type="text"
              value={input}
              onChange={handleInputChange}
              onKeyPress={handleKeyPress}
              placeholder="Type your message..."
              disabled={isLoading}
              style={{
                flex: 1,
                padding: '8px 12px',
                border: '1px solid #d1d5db',
                borderRadius: '4px',
                fontSize: '14px',
              }}
            />
            <button
              type="submit"
              disabled={isLoading || !input.trim()}
              style={{
                backgroundColor: '#4F46E5',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                padding: '0 16px',
                marginLeft: '8px',
                cursor: isLoading || !input.trim() ? 'not-allowed' : 'pointer',
                opacity: isLoading || !input.trim() ? 0.6 : 1,
              }}
            >
              {isLoading ? 'Sending...' : 'Send'}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}