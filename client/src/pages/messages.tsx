import { useState, useEffect, useRef } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { getAuthHeaders } from "@/lib/auth";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { 
  Send, 
  Search, 
  MessageCircle, 
  ArrowLeft,
  MoreVertical,
  Shield,
  User,
  Clock,
  CheckCircle
} from "lucide-react";
import { Link } from "wouter";

interface Conversation {
  otherUser: {
    id: number;
    username: string;
    fullName?: string;
    avatar?: string;
    isVerified: boolean;
    lastActive?: string;
  };
  lastMessage: {
    id: number;
    content: string;
    createdAt: string;
    isRead: boolean;
    senderId: number;
  };
}

interface Message {
  id: number;
  senderId: number;
  receiverId: number;
  content: string;
  isRead: boolean;
  createdAt: string;
  sender: {
    id: number;
    username: string;
    fullName?: string;
    avatar?: string;
  };
  receiver: {
    id: number;
    username: string;
    fullName?: string;
    avatar?: string;
  };
}

export default function Messages() {
  const { userId } = useParams();
  const [location, navigate] = useLocation();
  const { user: currentUser, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [newMessage, setNewMessage] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const selectedUserId = userId ? parseInt(userId) : null;

  // Redirect if not authenticated
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center py-12 px-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <Shield className="h-12 w-12 text-primary mx-auto mb-4" />
            <CardTitle>Authentication Required</CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-gray-600">You need to be logged in to access messages.</p>
            <Button asChild>
              <Link href="/login">Sign In</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Fetch conversations
  const { data: conversations, isLoading: conversationsLoading } = useQuery({
    queryKey: ["/api/conversations"],
    queryFn: async () => {
      const response = await fetch("/api/conversations", {
        headers: getAuthHeaders(),
      });
      if (!response.ok) {
        throw new Error("Failed to load conversations");
      }
      return response.json();
    },
  });

  // Fetch messages for selected conversation
  const { data: messages, isLoading: messagesLoading } = useQuery({
    queryKey: ["/api/messages", selectedUserId],
    queryFn: async () => {
      if (!selectedUserId) return [];
      const response = await fetch(`/api/messages/${selectedUserId}`, {
        headers: getAuthHeaders(),
      });
      if (!response.ok) {
        throw new Error("Failed to load messages");
      }
      return response.json();
    },
    enabled: !!selectedUserId,
  });

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: async (content: string) => {
      if (!selectedUserId) throw new Error("No recipient selected");
      const response = await apiRequest("POST", "/api/messages", {
        receiverId: selectedUserId,
        content,
      });
      return response.json();
    },
    onSuccess: () => {
      setNewMessage("");
      queryClient.invalidateQueries({ queryKey: ["/api/messages", selectedUserId] });
      queryClient.invalidateQueries({ queryKey: ["/api/conversations"] });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to send message",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;
    sendMessageMutation.mutate(newMessage.trim());
  };

  const formatMessageTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const hours = diff / (1000 * 60 * 60);

    if (hours < 24) {
      return date.toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      });
    } else {
      return date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      });
    }
  };

  const getSelectedConversation = () => {
    if (!conversations || !selectedUserId) return null;
    return conversations.find((conv: Conversation) => conv.otherUser.id === selectedUserId);
  };

  const selectedConversation = getSelectedConversation();

  const filteredConversations = conversations?.filter((conv: Conversation) => {
    if (!searchQuery) return true;
    const name = conv.otherUser.fullName || conv.otherUser.username;
    return name.toLowerCase().includes(searchQuery.toLowerCase());
  }) || [];

  return (
    <div className="h-screen bg-background flex">
      
      {/* Conversations Sidebar */}
      <div className={`w-full md:w-80 border-r border-border flex flex-col ${selectedUserId ? 'hidden md:flex' : ''}`}>
        
        {/* Header */}
        <div className="p-4 border-b border-border">
          <h1 className="text-xl font-semibold mb-4">Messages</h1>
          
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search conversations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Conversations List */}
        <ScrollArea className="flex-1">
          {conversationsLoading ? (
            <div className="p-4 space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-gray-200 rounded-full animate-pulse" />
                  <div className="flex-1">
                    <div className="h-4 bg-gray-200 rounded w-3/4 mb-2 animate-pulse" />
                    <div className="h-3 bg-gray-200 rounded w-1/2 animate-pulse" />
                  </div>
                </div>
              ))}
            </div>
          ) : filteredConversations.length > 0 ? (
            <div className="divide-y divide-border">
              {filteredConversations.map((conversation: Conversation) => (
                <button
                  key={conversation.otherUser.id}
                  onClick={() => navigate(`/messages/${conversation.otherUser.id}`)}
                  className={`w-full p-4 text-left hover:bg-muted transition-colors ${
                    selectedUserId === conversation.otherUser.id ? "bg-muted" : ""
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <div className="relative">
                      <Avatar className="w-12 h-12">
                        <AvatarImage 
                          src={conversation.otherUser.avatar || ""} 
                          alt={conversation.otherUser.fullName || conversation.otherUser.username} 
                        />
                        <AvatarFallback>
                          {(conversation.otherUser.fullName || conversation.otherUser.username || "U").charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      {conversation.otherUser.isVerified && (
                        <CheckCircle className="absolute -bottom-1 -right-1 h-4 w-4 text-green-500 bg-white rounded-full" />
                      )}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <p className="font-medium text-sm truncate">
                          {conversation.otherUser.fullName || conversation.otherUser.username}
                        </p>
                        <span className="text-xs text-muted-foreground">
                          {formatMessageTime(conversation.lastMessage.createdAt)}
                        </span>
                      </div>
                      
                      <p className="text-sm text-muted-foreground truncate">
                        {conversation.lastMessage.senderId === currentUser?.id ? "You: " : ""}
                        {conversation.lastMessage.content}
                      </p>
                    </div>
                    
                    {!conversation.lastMessage.isRead && 
                     conversation.lastMessage.senderId !== currentUser?.id && (
                      <div className="w-2 h-2 bg-primary rounded-full" />
                    )}
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <div className="p-8 text-center">
              <MessageCircle className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No conversations</h3>
              <p className="text-gray-500 mb-4">
                Start a conversation by messaging someone from their profile.
              </p>
              <Button asChild>
                <Link href="/dashboard">Browse Profiles</Link>
              </Button>
            </div>
          )}
        </ScrollArea>
      </div>

      {/* Chat Area */}
      <div className={`flex-1 flex flex-col ${!selectedUserId ? 'hidden md:flex' : ''}`}>
        
        {selectedUserId && selectedConversation ? (
          <>
            {/* Chat Header */}
            <div className="p-4 border-b border-border flex items-center space-x-3">
              <Button
                variant="ghost"
                size="icon"
                className="md:hidden"
                onClick={() => navigate("/messages")}
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
              
              <Avatar className="w-10 h-10">
                <AvatarImage 
                  src={selectedConversation.otherUser.avatar || ""} 
                  alt={selectedConversation.otherUser.fullName || selectedConversation.otherUser.username} 
                />
                <AvatarFallback>
                  {(selectedConversation.otherUser.fullName || selectedConversation.otherUser.username || "U").charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              
              <div className="flex-1">
                <div className="flex items-center space-x-2">
                  <h2 className="font-semibold">
                    {selectedConversation.otherUser.fullName || selectedConversation.otherUser.username}
                  </h2>
                  {selectedConversation.otherUser.isVerified && (
                    <CheckCircle className="h-4 w-4 text-green-500" />
                  )}
                </div>
                <p className="text-sm text-muted-foreground">
                  {selectedConversation.otherUser.lastActive ? (
                    `Last seen ${formatMessageTime(selectedConversation.otherUser.lastActive)}`
                  ) : (
                    "User"
                  )}
                </p>
              </div>
              
              <Button variant="ghost" size="icon" asChild>
                <Link href={`/profile/${selectedConversation.otherUser.id}`}>
                  <User className="h-4 w-4" />
                </Link>
              </Button>
            </div>

            {/* Messages */}
            <ScrollArea className="flex-1 p-4">
              {messagesLoading ? (
                <div className="space-y-4">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className={`flex ${i % 2 === 0 ? 'justify-end' : 'justify-start'}`}>
                      <div className="max-w-xs">
                        <div className={`h-12 bg-gray-200 rounded-lg animate-pulse ${i % 2 === 0 ? 'ml-auto' : ''}`} />
                      </div>
                    </div>
                  ))}
                </div>
              ) : messages && messages.length > 0 ? (
                <div className="space-y-4">
                  {messages.map((message: Message) => {
                    const isOwn = message.senderId === currentUser?.id;
                    return (
                      <div key={message.id} className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                          isOwn 
                            ? 'bg-primary text-primary-foreground ml-auto' 
                            : 'bg-muted text-muted-foreground mr-auto'
                        }`}>
                          <p className="text-sm">{message.content}</p>
                          <p className={`text-xs mt-1 ${
                            isOwn ? 'text-primary-foreground/70' : 'text-muted-foreground/70'
                          }`}>
                            {formatMessageTime(message.createdAt)}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                  <div ref={messagesEndRef} />
                </div>
              ) : (
                <div className="text-center py-8">
                  <MessageCircle className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Start the conversation</h3>
                  <p className="text-gray-500">
                    Send a message to {selectedConversation.otherUser.fullName || selectedConversation.otherUser.username}
                  </p>
                </div>
              )}
            </ScrollArea>

            {/* Message Input */}
            <div className="p-4 border-t border-border">
              <form onSubmit={handleSendMessage} className="flex space-x-2">
                <Input
                  placeholder="Type a message..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  className="flex-1"
                  disabled={sendMessageMutation.isPending}
                />
                <Button 
                  type="submit" 
                  disabled={!newMessage.trim() || sendMessageMutation.isPending}
                  size="icon"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </form>
            </div>
          </>
        ) : (
          // No conversation selected
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <MessageCircle className="h-24 w-24 text-gray-400 mx-auto mb-6" />
              <h2 className="text-2xl font-semibold text-gray-900 mb-2">Select a conversation</h2>
              <p className="text-gray-500 mb-6">
                Choose a conversation from the sidebar to start messaging.
              </p>
              <Button asChild>
                <Link href="/dashboard">Find People to Message</Link>
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
