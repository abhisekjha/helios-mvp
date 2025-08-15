import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Bot } from 'lucide-react';

interface AgentActivityDemoProps {
  currentStep: number;
}

export function AgentActivityDemo({ currentStep }: AgentActivityDemoProps) {
  // Simulate different agent activity states
  const activityStates = [
    {
      currentAgent: "Router Agent",
      step: "Analyzing query classification",
      progress: 15,
      queryType: "TREND_ANALYSIS",
      confidence: 92,
      isComplete: false
    },
    {
      currentAgent: "Router Agent", 
      step: "Query classification complete",
      progress: 30,
      queryType: "TREND_ANALYSIS",
      confidence: 92,
      isComplete: false
    },
    {
      currentAgent: "Router Agent",
      step: "Creating execution plan",
      progress: 45,
      queryType: "TREND_ANALYSIS",
      confidence: 92,
      isComplete: false
    },
    {
      currentAgent: "Retrieval Agent",
      step: "Searching knowledge base",
      progress: 60,
      queryType: "TREND_ANALYSIS",
      confidence: 92,
      isComplete: false
    },
    {
      currentAgent: "Retrieval Agent",
      step: "Data retrieval complete",
      progress: 75,
      queryType: "TREND_ANALYSIS",
      confidence: 92,
      isComplete: false
    },
    {
      currentAgent: "Synthesizer Agent",
      step: "Generating insights",
      progress: 85,
      queryType: "TREND_ANALYSIS",
      confidence: 92,
      isComplete: false
    },
    {
      currentAgent: "Synthesizer Agent",
      step: "Creating strategic recommendations", 
      progress: 95,
      queryType: "TREND_ANALYSIS",
      confidence: 92,
      isComplete: false
    },
    {
      currentAgent: "Complete",
      step: "Analysis finished",
      progress: 100,
      queryType: "TREND_ANALYSIS",
      confidence: 92,
      isComplete: true
    }
  ];

  const activity = activityStates[Math.min(currentStep, activityStates.length - 1)];

  return (
    <div className="w-full max-w-md mx-auto p-4">
      <h3 className="text-lg font-semibold mb-4 text-center">
        Enhanced Agent Activity Visualization
      </h3>
      
      {/* Chat Message Container */}
      <div className="flex justify-start mb-4">
        <div className="flex max-w-[85%]">
          <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-[#0F1F3D] flex items-center justify-center mr-3">
            <Bot className="w-5 h-5 text-white" />
          </div>
          <div className="flex flex-col space-y-2">
            <div className="bg-[#F7F8FA] p-4 rounded-xl text-[#111827]">
              <p className="text-base leading-relaxed">
                What are the trends in our sales data and what strategic recommendations do you have?
              </p>
            </div>
            
            {/* Enhanced Agent Activity Indicator */}
            {!activity.isComplete && (
              <div className="mt-3">
                <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200">
                  <CardContent className="p-4">
                    <div className="space-y-3">
                      {/* Agent Status Header */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
                          <span className="text-sm font-medium text-blue-700">
                            {activity.currentAgent}
                          </span>
                          {activity.queryType && (
                            <Badge variant="outline" className="text-xs bg-blue-100 text-blue-700 border-blue-300">
                              {activity.queryType}
                            </Badge>
                          )}
                        </div>
                        {activity.confidence > 0 && (
                          <span className="text-xs text-blue-600">
                            {activity.confidence}% confidence
                          </span>
                        )}
                      </div>
                      
                      {/* Progress Bar */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-blue-700">
                            {activity.step}
                          </span>
                          <span className="text-xs text-blue-600">
                            {activity.progress}%
                          </span>
                        </div>
                        <div className="w-full bg-blue-100 rounded-full h-2">
                          <div 
                            className="bg-gradient-to-r from-blue-500 to-indigo-500 h-2 rounded-full transition-all duration-500 ease-out"
                            style={{ width: `${activity.progress}%` }}
                          />
                        </div>
                      </div>
                      
                      {/* Agent Steps Visualization */}
                      <div className="flex items-center justify-between text-xs">
                        <div className={`flex items-center space-x-1 ${
                          activity.progress >= 30 ? 'text-blue-700' : 'text-gray-400'
                        }`}>
                          <div className={`w-3 h-3 rounded-full ${
                            activity.progress >= 30 ? 'bg-blue-500' : 'bg-gray-300'
                          }`} />
                          <span>Router</span>
                        </div>
                        <div className={`flex items-center space-x-1 ${
                          activity.progress >= 60 ? 'text-blue-700' : 'text-gray-400'
                        }`}>
                          <div className={`w-3 h-3 rounded-full ${
                            activity.progress >= 60 ? 'bg-blue-500' : 'bg-gray-300'
                          }`} />
                          <span>Retrieval</span>
                        </div>
                        <div className={`flex items-center space-x-1 ${
                          activity.progress >= 85 ? 'text-blue-700' : 'text-gray-400'
                        }`}>
                          <div className={`w-3 h-3 rounded-full ${
                            activity.progress >= 85 ? 'bg-blue-500' : 'bg-gray-300'
                          }`} />
                          <span>Synthesizer</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
            
            {activity.isComplete && (
              <div className="mt-3">
                <Card className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200">
                  <CardContent className="p-4">
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full" />
                      <span className="text-sm font-medium text-green-700">
                        Analysis Complete
                      </span>
                      <Badge variant="outline" className="text-xs bg-green-100 text-green-700 border-green-300">
                        100% Complete
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Control Buttons */}
      <div className="text-center text-sm text-gray-600">
        Step {currentStep + 1} of {activityStates.length}
        <br />
        <span className="text-xs">
          Real-time agent activity tracking in enhanced chat interface
        </span>
      </div>
    </div>
  );
}
