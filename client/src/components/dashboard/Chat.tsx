import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface ChatMessage {
  role: "user" | "assistant" | "system";
  content: string;
  timestamp: string;
}

interface Conversation {
  id: number;
  userId: number;
  visitorId: string;
  messages: ChatMessage[];
  startedAt: string;
  endedAt: string | null;
  isQualified: boolean;
  leadId: number | null;
}

interface ChatProps {
  conversations: Conversation[];
  isLoading: boolean;
}

export default function Chat({ conversations, isLoading }: ChatProps) {
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [showDialog, setShowDialog] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeFilter, setActiveFilter] = useState<string | null>(null);

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  // Format timestamp for messages
  const formatMessageTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // Handle conversation view
  const handleViewConversation = (conversation: Conversation) => {
    setSelectedConversation(conversation);
    setShowDialog(true);
  };

  // Filter conversations
  const filteredConversations = conversations.filter(conversation => {
    let matchesSearch = true;
    let matchesFilter = true;

    // Search filter
    if (searchTerm) {
      matchesSearch = conversation.messages.some(msg => 
        msg.content.toLowerCase().includes(searchTerm.toLowerCase())
      ) || conversation.visitorId.toLowerCase().includes(searchTerm.toLowerCase());
    }

    // Qualified/Unqualified filter
    if (activeFilter === "qualified") {
      matchesFilter = conversation.isQualified;
    } else if (activeFilter === "unqualified") {
      matchesFilter = !conversation.isQualified;
    }

    return matchesSearch && matchesFilter;
  });

  // Get conversation preview
  const getConversationPreview = (conversation: Conversation) => {
    const lastUserMessage = [...conversation.messages]
      .reverse()
      .find(msg => msg.role === "user");
    
    return lastUserMessage 
      ? lastUserMessage.content.substring(0, 60) + (lastUserMessage.content.length > 60 ? "..." : "")
      : "No messages";
  };

  // Handle search
  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  // Handle filter
  const handleFilter = (filter: string | null) => {
    setActiveFilter(filter === activeFilter ? null : filter);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2 items-center">
            <div className="relative w-full">
              <svg
                className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z"
                  clipRule="evenodd"
                />
              </svg>
              <Input
                className="pl-10"
                placeholder="Search conversations..."
                value={searchTerm}
                onChange={handleSearch}
              />
            </div>
            <div className="flex space-x-2">
              <Button
                variant={activeFilter === "qualified" ? "default" : "outline"}
                size="sm"
                onClick={() => handleFilter("qualified")}
              >
                Qualified
              </Button>
              <Button
                variant={activeFilter === "unqualified" ? "default" : "outline"}
                size="sm"
                onClick={() => handleFilter("unqualified")}
              >
                Unqualified
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {filteredConversations.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <svg
              className="mx-auto h-12 w-12 text-gray-400"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
              />
            </svg>
            <h3 className="mt-2 text-lg font-medium text-gray-900">No conversations found</h3>
            <p className="mt-1 text-sm text-gray-500">
              {searchTerm || activeFilter
                ? "Try adjusting your search or filters"
                : "Start engaging with your website visitors to generate conversations"}
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <ul className="divide-y divide-gray-200">
            {filteredConversations.map((conversation) => (
              <li key={conversation.id} className="px-4 py-3 hover:bg-gray-50">
                <div className="flex items-center justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <span className="inline-block h-10 w-10 rounded-full bg-gray-100 overflow-hidden">
                          <svg className="h-full w-full text-gray-400" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M24 20.993V24H0v-2.996A14.977 14.977 0 0112.004 15c4.904 0 9.26 2.354 11.996 5.993zM16.002 8.999a4 4 0 11-8 0 4 4 0 018 0z" />
                          </svg>
                        </span>
                      </div>
                      <div className="ml-4">
                        <div className="flex items-center">
                          <h3 className="text-sm font-medium text-gray-900">Visitor: {conversation.visitorId}</h3>
                          {conversation.isQualified && (
                            <Badge className="ml-2 bg-green-100 text-green-800 hover:bg-green-100">
                              Qualified Lead
                            </Badge>
                          )}
                        </div>
                        <div className="mt-1 text-sm text-gray-500">
                          <p>{getConversationPreview(conversation)}</p>
                        </div>
                        <div className="mt-1 text-xs text-gray-400">
                          Started: {formatDate(conversation.startedAt)}
                        </div>
                      </div>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleViewConversation(conversation)}
                  >
                    View
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        </Card>
      )}

      {/* Conversation detail dialog */}
      {selectedConversation && (
        <Dialog open={showDialog} onOpenChange={setShowDialog}>
          <DialogContent className="sm:max-w-2xl">
            <DialogHeader>
              <DialogTitle>Conversation Details</DialogTitle>
              <DialogDescription>
                Visitor ID: {selectedConversation.visitorId}
              </DialogDescription>
            </DialogHeader>
            
            <Tabs defaultValue="messages">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="messages">Messages</TabsTrigger>
                <TabsTrigger value="details">Details</TabsTrigger>
              </TabsList>
              
              <TabsContent value="messages" className="space-y-4 mt-4">
                <div className="bg-gray-50 p-4 rounded-lg h-96 overflow-y-auto">
                  {selectedConversation.messages.map((message, index) => (
                    <div 
                      key={index} 
                      className={`mb-4 flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
                    >
                      <div 
                        className={`max-w-[75%] rounded-lg px-4 py-2 ${
                          message.role === "user" 
                            ? "bg-primary-100 text-primary-800" 
                            : message.role === "system"
                              ? "bg-gray-200 text-gray-800" 
                              : "bg-white border border-gray-200 text-gray-800"
                        }`}
                      >
                        <div className="text-xs text-gray-500 mb-1">
                          {message.role === "user" ? "Visitor" : message.role === "system" ? "System" : "Assistant"} 
                          {" • "}
                          {formatMessageTime(message.timestamp)}
                        </div>
                        <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </TabsContent>
              
              <TabsContent value="details" className="space-y-4 mt-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h4 className="text-sm font-medium text-gray-500">Started</h4>
                    <p className="mt-1 text-sm">{formatDate(selectedConversation.startedAt)}</p>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-gray-500">Ended</h4>
                    <p className="mt-1 text-sm">
                      {selectedConversation.endedAt 
                        ? formatDate(selectedConversation.endedAt) 
                        : "Conversation still active"}
                    </p>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-gray-500">Visitor ID</h4>
                    <p className="mt-1 text-sm">{selectedConversation.visitorId}</p>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-gray-500">Status</h4>
                    <div className="mt-1">
                      {selectedConversation.isQualified ? (
                        <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
                          Qualified Lead
                        </Badge>
                      ) : (
                        <Badge className="bg-gray-100 text-gray-800 hover:bg-gray-100">
                          Not Qualified
                        </Badge>
                      )}
                    </div>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-gray-500">Lead ID</h4>
                    <p className="mt-1 text-sm">
                      {selectedConversation.leadId || "Not assigned to a lead"}
                    </p>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-gray-500">Message Count</h4>
                    <p className="mt-1 text-sm">{selectedConversation.messages.length}</p>
                  </div>
                </div>
                
                <div>
                  <h4 className="text-sm font-medium text-gray-500 mb-2">AI Analysis</h4>
                  <div className="bg-yellow-50 p-3 rounded-md">
                    <div className="flex">
                      <div className="flex-shrink-0">
                        <svg className="h-5 w-5 text-yellow-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <div className="ml-3">
                        <p className="text-sm text-yellow-800">
                          Advanced conversation analytics are coming soon. You'll be able to see sentiment analysis, key topics, and AI recommendations.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
            
            <div className="flex justify-end space-x-2 mt-4">
              <Button variant="ghost" onClick={() => setShowDialog(false)}>
                Close
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
