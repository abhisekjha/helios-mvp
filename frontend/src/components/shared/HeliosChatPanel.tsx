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
  agentActivity?: {
    currentAgent: string;
    step: string;
    progress: number;
    queryType?: string;
    confidence?: number;
    isComplete: boolean;
  };
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
        : `Hello! I'm Helios, your autonomous TPM agent. I can help you with trade promotion management tasks.

Here's what I can do:
• Analyze your uploaded data and generate insights
• Answer questions about your goals and promotions
• Help with strategy recommendations
• Provide performance summaries

Try asking me:
"What goals do I have?"
"Show me my latest data uploads"
"Which promotion is performing best?"
"What insights do you have for me?"

What would you like to explore today?`,
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

  const handleGeneralQuery = async (query: string) => {
    // Simulate processing time
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const lowerQuery = query.toLowerCase();
    let response = "";

    if (lowerQuery.includes("goals") || lowerQuery.includes("goal")) {
      response = `I can help you with your goals! To analyze specific goal data, you'll need to navigate to a particular goal from your goals page. 

In the meantime, I can help with:
• General TPM strategy questions
• Best practices for trade promotions
• Data analysis techniques
• Goal setting recommendations

Try asking: "What makes a successful trade promotion?" or "How should I structure my promotional goals?"`;
    } else if (lowerQuery.includes("data") || lowerQuery.includes("upload")) {
      response = `To analyze your uploaded data, please navigate to a specific goal where your data is stored. Each goal contains its own data uploads and insights.

I can still help you with:
• Data preparation best practices
• Understanding TPM metrics
• Promotion planning strategies

What would you like to learn about?`;
    } else if (lowerQuery.includes("help") || lowerQuery.includes("what can you do")) {
      response = `I'm your autonomous TPM agent! Here's how I can assist you:

**With a specific goal selected:**
• Analyze uploaded promotional data
• Generate AI-powered insights
• Answer questions about goal performance
• Provide strategy recommendations

**General assistance:**
• TPM best practices and strategies
• Promotion planning guidance
• Data analysis methodologies
• Goal optimization tips

To unlock my full analytical capabilities, navigate to a specific goal and I'll help you dive deep into your promotional data!`;
    } else if (lowerQuery.includes("promotion") || lowerQuery.includes("strategy")) {
      response = `Great question about promotional strategies! Here are some key principles for successful trade promotions:

• **Clear Objectives**: Define specific, measurable goals
• **Data-Driven Decisions**: Use historical performance data
• **Channel Optimization**: Align promotions with channel strengths
• **Timing Strategy**: Consider seasonality and market conditions
• **ROI Focus**: Monitor return on promotional investment

For specific analysis of your promotional data, navigate to a goal and I can provide detailed insights based on your actual performance metrics!`;
    } else {
      response = `I'd be happy to help! While I can provide general TPM guidance right now, my full analytical power is unlocked when you navigate to a specific goal.

For immediate assistance, try asking about:
• "What makes a good promotional strategy?"
• "How do I measure promotion success?"
• "What data should I track for TPM?"

Or navigate to a specific goal where I can analyze your actual data and provide personalized insights!`;
    }

    const agentMessage: Message = {
      id: (Date.now() + 1).toString(),
      type: "agent",
      content: response,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, agentMessage]);
  };

  const handleSendMessage = async () => {
    if (!inputValue.trim()) return;

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
      // Handle common queries without requiring a goal
      if (!goalId) {
        await handleGeneralQuery(currentQuery);
        return;
      }

      // Get auth token for goal-specific queries
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found');
      }

      // Create agent message placeholder
      const agentMessageId = (Date.now() + 1).toString();
      let agentContent = "";
      let sources: Array<{ text: string; type: string; similarity_score: number }> = [];
      let agentActivity = {
        currentAgent: "Router",
        step: "Analyzing query...",
        progress: 0,
        queryType: "",
        confidence: 0,
        isComplete: false
      };

      const agentMessage: Message = {
        id: agentMessageId,
        type: "agent",
        content: "",
        timestamp: new Date(),
        sources: [],
        agentActivity
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
              const jsonData = line.slice(6);
              if (jsonData.trim() === '[DONE]') break;
              
              const data = JSON.parse(jsonData);
              
              if (data.type === 'sources') {
                sources = data.sources;
              } else if (data.type === 'content' || data.type === 'chunk') {
                // Handle both 'content' and 'chunk' types
                const contentData = data.content || '';
                agentContent += contentData;
                
                // Parse agent activity from content
                const content = contentData;
                
                // Update agent activity based on content patterns
                if (content.includes('🧠 Analyzing your question')) {
                  agentActivity = {
                    ...agentActivity,
                    currentAgent: "Router Agent",
                    step: "Analyzing query classification",
                    progress: 15
                  };
                } else if (content.includes('Query classified as:')) {
                  const queryTypeMatch = content.match(/QueryType\.(\w+)/);
                  const confidenceMatch = content.match(/(\d+)%/);
                  agentActivity = {
                    ...agentActivity,
                    currentAgent: "Router Agent", 
                    step: "Query classification complete",
                    progress: 30,
                    queryType: queryTypeMatch ? queryTypeMatch[1] : "",
                    confidence: confidenceMatch ? parseInt(confidenceMatch[1]) : 0
                  };
                } else if (content.includes('Planning') && content.includes('processing steps')) {
                  agentActivity = {
                    ...agentActivity,
                    currentAgent: "Router Agent",
                    step: "Creating execution plan",
                    progress: 45
                  };
                } else if (content.includes('Step 1: Search for relevant information')) {
                  agentActivity = {
                    ...agentActivity,
                    currentAgent: "Retrieval Agent",
                    step: "Searching knowledge base",
                    progress: 60
                  };
                } else if (content.includes('Retrieved') && content.includes('relevant data points')) {
                  agentActivity = {
                    ...agentActivity,
                    currentAgent: "Retrieval Agent",
                    step: "Data retrieval complete",
                    progress: 75
                  };
                } else if (content.includes('Step 2: Generate comprehensive response')) {
                  agentActivity = {
                    ...agentActivity,
                    currentAgent: "Synthesizer Agent",
                    step: "Generating insights",
                    progress: 85
                  };
                } else if (content.includes('Synthesizing comprehensive response')) {
                  agentActivity = {
                    ...agentActivity,
                    currentAgent: "Synthesizer Agent",
                    step: "Creating strategic recommendations", 
                    progress: 95
                  };
                } else if (content.includes('Processing completed')) {
                  agentActivity = {
                    ...agentActivity,
                    currentAgent: "Complete",
                    step: "Analysis finished",
                    progress: 100,
                    isComplete: true
                  };
                }
                
                // Update the message in real-time
                setMessages(prev => prev.map(msg => 
                  msg.id === agentMessageId 
                    ? { ...msg, content: agentContent, sources, agentActivity }
                    : msg
                ));
              } else if (data.type === 'complete') {
                // Mark as complete
                agentActivity = {
                  ...agentActivity,
                  currentAgent: "Complete",
                  step: "Analysis finished",
                  progress: 100,
                  isComplete: true
                };
                setMessages(prev => prev.map(msg => 
                  msg.id === agentMessageId 
                    ? { ...msg, content: agentContent, sources, agentActivity }
                    : msg
                ));
                break;
              } else if (data.type === 'error') {
                throw new Error(data.error);
              }
            } catch (parseError) {
              // Handle non-JSON data (legacy format)
              const rawData = line.slice(6);
              if (rawData && rawData !== '[DONE]') {
                agentContent += rawData;
                
                // Try to parse agent activity from raw content
                if (rawData.includes('🧠 Analyzing your question')) {
                  agentActivity = {
                    ...agentActivity,
                    currentAgent: "Router Agent",
                    step: "Analyzing query classification",
                    progress: 15
                  };
                }
                // Update message with raw content
                setMessages(prev => prev.map(msg => 
                  msg.id === agentMessageId 
                    ? { ...msg, content: agentContent, sources, agentActivity }
                    : msg
                ));
              }
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
                <h2 className="text-lg font-semibold text-[#111827]">Helios AgentSpace</h2>
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
                  
                  {/* Agent Activity Indicator - Show for agent messages with activity, whether complete or not */}
                  {message.type === "agent" && (message.agentActivity || message.content.includes('🧠') || message.content.includes('Query classified')) && (
                    <div className="mt-3">
                      {/* Debug info - remove this later */}
                      <div className="text-xs text-gray-500 mb-2 font-mono">
                        Debug: Agent={message.agentActivity?.currentAgent || 'Unknown'}, Progress={message.agentActivity?.progress || 0}%, Complete={message.agentActivity?.isComplete ? 'true' : 'false'}
                      </div>
                      
                      <Card className={`${
                        message.agentActivity?.isComplete 
                          ? "bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200"
                          : "bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200"
                      }`}>
                        <CardContent className="p-4">
                          <div className="space-y-3">
                            {/* Agent Status Header */}
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-2">
                                <div className={`w-2 h-2 rounded-full ${
                                  message.agentActivity?.isComplete ? 'bg-green-500' : 'bg-blue-500 animate-pulse'
                                }`} />
                                <span className={`text-sm font-medium ${
                                  message.agentActivity?.isComplete ? 'text-green-700' : 'text-blue-700'
                                }`}>
                                  {message.agentActivity?.currentAgent || 'Agent'}
                                </span>
                                {message.agentActivity?.queryType && (
                                  <Badge variant="outline" className={`text-xs ${
                                    message.agentActivity?.isComplete 
                                      ? 'bg-green-100 text-green-700 border-green-300'
                                      : 'bg-blue-100 text-blue-700 border-blue-300'
                                  }`}>
                                    {message.agentActivity.queryType}
                                  </Badge>
                                )}
                              </div>
                              {message.agentActivity?.confidence && message.agentActivity.confidence > 0 && (
                                <span className={`text-xs ${
                                  message.agentActivity?.isComplete ? 'text-green-600' : 'text-blue-600'
                                }`}>
                                  {message.agentActivity.confidence}% confidence
                                </span>
                              )}
                            </div>
                            
                            {/* Progress Bar - Show unless complete */}
                            {!message.agentActivity?.isComplete && (
                              <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                  <span className="text-sm text-blue-700">
                                    {message.agentActivity?.step || 'Processing...'}
                                  </span>
                                  <span className="text-xs text-blue-600">
                                    {message.agentActivity?.progress || 0}%
                                  </span>
                                </div>
                                <div className="w-full bg-blue-100 rounded-full h-2">
                                  <div 
                                    className="bg-gradient-to-r from-blue-500 to-indigo-500 h-2 rounded-full transition-all duration-500 ease-out"
                                    style={{ width: `${message.agentActivity?.progress || 0}%` }}
                                  />
                                </div>
                              </div>
                            )}
                            
                            {/* Agent Steps Visualization */}
                            <div className="flex items-center justify-between text-xs">
                              <div className={`flex items-center space-x-1 ${
                                (message.agentActivity?.progress || 0) >= 30 ? 'text-blue-700' : 'text-gray-400'
                              }`}>
                                <div className={`w-3 h-3 rounded-full ${
                                  (message.agentActivity?.progress || 0) >= 30 ? 'bg-blue-500' : 'bg-gray-300'
                                }`} />
                                <span>Router</span>
                              </div>
                              <div className={`flex items-center space-x-1 ${
                                (message.agentActivity?.progress || 0) >= 60 ? 'text-blue-700' : 'text-gray-400'
                              }`}>
                                <div className={`w-3 h-3 rounded-full ${
                                  (message.agentActivity?.progress || 0) >= 60 ? 'bg-blue-500' : 'bg-gray-300'
                                }`} />
                                <span>Retrieval</span>
                              </div>
                              <div className={`flex items-center space-x-1 ${
                                (message.agentActivity?.progress || 0) >= 85 ? 'text-blue-700' : 'text-gray-400'
                              }`}>
                                <div className={`w-3 h-3 rounded-full ${
                                  (message.agentActivity?.progress || 0) >= 85 ? 'bg-blue-500' : 'bg-gray-300'
                                }`} />
                                <span>Synthesizer</span>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  )}
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
              placeholder={goalId ? "Ask about your data..." : "Ask me anything about TPM..."}
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
              "
            />
            <Button
              onClick={handleSendMessage}
              disabled={!inputValue.trim() || isTyping}
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
              : "Ask me about TPM strategies, best practices, or navigate to a goal for data analysis"
            }
          </p>
        </div>
      </div>
    </div>
  );
}
