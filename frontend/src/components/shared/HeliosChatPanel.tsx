"use client";

import { useState, useRef, useEffect } from "react";
import { X, Send, Bot, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface Message {
  id: string;
  type: "user" | "agent";
  content: string;
  timestamp: Date;
  component?: React.ReactNode;
  sources?: Array<{
    text: string;
    type: string;
    similarity_score: number;
  }>;
}

interface HeliosChatPanelProps {
  isOpen: boolean;
  onClose: () => void;
  goalId?: string; // Add goal context
}

export function HeliosChatPanel({ isOpen, onClose, goalId }: HeliosChatPanelProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      type: "agent",
      content: goalId 
        ? "Hello! I'm Helios, your autonomous TPM agent. I can help you analyze the data you've uploaded for this goal and answer questions about it. What would you like to know?"
        : "Hello! I'm Helios, your autonomous TPM agent. To get started, please open a specific goal so I can help you analyze its data.",
      timestamp: new Date(),
    }
  ]);
  const [inputValue, setInputValue] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async () => {
    if (!inputValue.trim() || !goalId) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      type: "user",
      content: inputValue,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    const currentQuery = inputValue;
    setInputValue("");
    setIsTyping(true);

    try {
      // Get auth token
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found');
      }

      // Create agent message placeholder
      const agentMessageId = (Date.now() + 1).toString();
      let agentContent = "";
      let sources: Array<{ text: string; type: string; similarity_score: number }> = [];

      const agentMessage: Message = {
        id: agentMessageId,
        type: "agent",
        content: "",
        timestamp: new Date(),
        sources: []
      };

      setMessages(prev => [...prev, agentMessage]);

      // Make streaming API call
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/v1/agent/query`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          goal_id: goalId,
          query: currentQuery,
          stream: true
        })
      });

      if (!response.ok) {
        throw new Error(`API Error: ${response.status}`);
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('No response reader available');
      }

      // Process streaming response
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = new TextDecoder().decode(value);
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));
              
              if (data.type === 'sources') {
                sources = data.sources;
              } else if (data.type === 'content') {
                agentContent += data.content;
                
                // Update the message in real-time
                setMessages(prev => prev.map(msg => 
                  msg.id === agentMessageId 
                    ? { ...msg, content: agentContent, sources }
                    : msg
                ));
              } else if (data.type === 'complete') {
                break;
              } else if (data.type === 'error') {
                throw new Error(data.error);
              }
            } catch {
              // Skip invalid JSON lines
            }
          }
        }
      }

    } catch (error) {
      console.error('Chat error:', error);
      const errorMessage: Message = {
        id: (Date.now() + 2).toString(),
        type: "agent",
        content: `I encountered an error processing your request: ${error instanceof Error ? error.message : 'Unknown error'}. Please try again.`,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsTyping(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-40 flex">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      
      {/* Premium Enterprise Chat Panel - Fully Opaque */}
      <div 
        className="
          fixed right-0 top-0 h-full w-[440px] 
          bg-white opacity-100 
          border-l border-[#E5E7EB] 
          shadow-[0_1px_2px_rgba(17,24,39,0.04)]
          z-40 isolate
          flex flex-col
        "
      >
        {/* Header - Professional Brand Styling */}
        <div className="p-6 border-b border-[#E5E7EB] bg-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-[#0F1F3D] rounded-lg flex items-center justify-center">
                <Bot className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-[#111827]">Helios Agent</h2>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-[#0F1F3D] rounded-full" />
                  <span className="text-sm text-[#4B5563]">Online & Ready</span>
                </div>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="
                text-[#4B5563] hover:text-[#111827] hover:bg-[#F7F8FA]
                h-10 w-10 p-0 rounded-lg
                focus:ring-2 focus:ring-[#0F1F3D] focus:ring-offset-2 focus:outline-none
              "
            >
              <X className="w-5 h-5" />
            </Button>
          </div>
        </div>

        {/* Messages Container - Independent Scroll */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-white">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.type === "user" ? "justify-end" : "justify-start"}`}
            >
              <div className={`flex max-w-[85%] ${message.type === "user" ? "flex-row-reverse" : "flex-row"}`}>
                <div className={`flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center ${
                  message.type === "user" 
                    ? "bg-[#F7F8FA] ml-3" 
                    : "bg-[#0F1F3D] mr-3"
                }`}>
                  {message.type === "user" ? (
                    <User className="w-5 h-5 text-[#4B5563]" />
                  ) : (
                    <Bot className="w-5 h-5 text-white" />
                  )}
                </div>
                <div className="flex flex-col space-y-2">
                  <div className={`p-4 rounded-xl ${
                    message.type === "user"
                      ? "bg-[#0F1F3D] text-white"
                      : "bg-[#F7F8FA] text-[#111827]"
                  }`}>
                    <p className="text-base leading-relaxed whitespace-pre-wrap">{message.content}</p>
                  </div>
                  {message.component && (
                    <div className="mt-2">
                      {message.component}
                    </div>
                  )}
                  {message.sources && message.sources.length > 0 && (
                    <div className="mt-3">
                      <Card className="bg-white border border-[#E5E7EB]">
                        <CardHeader className="pb-3 pt-4 px-4">
                          <CardTitle className="text-sm text-[#4B5563] font-medium">Sources</CardTitle>
                        </CardHeader>
                        <CardContent className="pt-0 px-4 pb-4">
                          <div className="space-y-3">
                            {message.sources.slice(0, 3).map((source, idx) => (
                              <div key={idx} className="text-sm text-[#4B5563] p-3 bg-[#F7F8FA] rounded-lg border border-[#E5E7EB]">
                                <div className="flex items-center justify-between mb-2">
                                  <Badge variant="secondary" className="text-xs bg-white text-[#4B5563] border border-[#E5E7EB]">
                                    {source.type}
                                  </Badge>
                                  <span className="text-xs text-[#4B5563]">
                                    {(source.similarity_score * 100).toFixed(0)}% match
                                  </span>
                                </div>
                                <p className="text-sm text-[#111827] leading-relaxed">{source.text}</p>
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  )}
                  <span className="text-xs text-[#4B5563] mt-2 px-1">
                    {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </div>
            </div>
          ))}
          
          {isTyping && (
            <div className="flex justify-start">
              <div className="flex max-w-[85%]">
                <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-[#0F1F3D] flex items-center justify-center mr-3">
                  <Bot className="w-5 h-5 text-white" />
                </div>
                <div className="bg-[#F7F8FA] p-4 rounded-xl">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-[#4B5563] rounded-full animate-bounce" />
                    <div className="w-2 h-2 bg-[#4B5563] rounded-full animate-bounce delay-100" />
                    <div className="w-2 h-2 bg-[#4B5563] rounded-full animate-bounce delay-200" />
                  </div>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area - Professional Enterprise Styling */}
        <div className="p-6 border-t border-[#E5E7EB] bg-white">
          <div className="flex space-x-3">
            <Input
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder={goalId ? "Ask about your data..." : "Select a goal first"}
              disabled={!goalId}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage();
                }
              }}
              className="
                flex-1 bg-white border border-[#E5E7EB] text-[#111827] text-base
                placeholder:text-[#4B5563] rounded-lg px-4 py-3 min-h-[48px]
                focus:ring-2 focus:ring-[#0F1F3D] focus:border-[#0F1F3D] focus:outline-none
                disabled:bg-[#F7F8FA] disabled:text-[#4B5563]
              "
            />
            <Button
              onClick={handleSendMessage}
              disabled={!inputValue.trim() || isTyping || !goalId}
              className="
                bg-[#0F1F3D] text-white hover:bg-[#152C57] 
                disabled:bg-[#E5E7EB] disabled:text-[#4B5563]
                px-4 py-3 min-h-[48px] rounded-lg
                focus:ring-2 focus:ring-[#0F1F3D] focus:ring-offset-2 focus:outline-none
                transition-colors duration-200
              "
            >
              <Send className="w-5 h-5" />
            </Button>
          </div>
          <p className="text-sm text-[#4B5563] mt-4 text-center leading-relaxed">
            {goalId 
              ? "Ask questions about your uploaded data and promotional strategies"
              : "Select a goal to start chatting with Helios"
            }
          </p>
        </div>
      </div>
    </div>
  );
}
