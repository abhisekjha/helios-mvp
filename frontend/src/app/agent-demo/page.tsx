"use client";

import React, { useState, useEffect } from 'react';
import { AgentActivityDemo } from '@/components/AgentActivityDemo';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function AgentDemoPage() {
  const [currentStep, setCurrentStep] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(false);

  useEffect(() => {
    if (isAutoPlaying) {
      const interval = setInterval(() => {
        setCurrentStep(prev => {
          if (prev >= 7) {
            setIsAutoPlaying(false);
            return 0;
          }
          return prev + 1;
        });
      }, 1500);

      return () => clearInterval(interval);
    }
  }, [isAutoPlaying]);

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            🎭 Enhanced Multi-Agent Chat Interface
          </h1>
          <p className="text-lg text-gray-600 mb-6">
            Real-time agent activity visualization for better user experience
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Demo Component */}
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Live Agent Activity Demo</CardTitle>
              </CardHeader>
              <CardContent>
                <AgentActivityDemo currentStep={currentStep} />
                
                <div className="flex justify-center space-x-2 mt-6">
                  <Button
                    onClick={() => setCurrentStep(prev => Math.max(0, prev - 1))}
                    disabled={currentStep === 0}
                    variant="outline"
                    size="sm"
                  >
                    Previous
                  </Button>
                  <Button
                    onClick={() => setIsAutoPlaying(!isAutoPlaying)}
                    variant={isAutoPlaying ? "destructive" : "default"}
                    size="sm"
                  >
                    {isAutoPlaying ? "Stop Auto" : "Auto Play"}
                  </Button>
                  <Button
                    onClick={() => setCurrentStep(prev => Math.min(7, prev + 1))}
                    disabled={currentStep === 7}
                    variant="outline"
                    size="sm"
                  >
                    Next
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Features List */}
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>🚀 Enhanced Features</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-start space-x-3">
                    <div className="w-2 h-2 bg-blue-500 rounded-full mt-2" />
                    <div>
                      <h4 className="font-medium">Real-time Agent Tracking</h4>
                      <p className="text-sm text-gray-600">
                        See which agent is currently processing your query
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-3">
                    <div className="w-2 h-2 bg-green-500 rounded-full mt-2" />
                    <div>
                      <h4 className="font-medium">Progress Visualization</h4>
                      <p className="text-sm text-gray-600">
                        Dynamic progress bar showing completion percentage
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-3">
                    <div className="w-2 h-2 bg-purple-500 rounded-full mt-2" />
                    <div>
                      <h4 className="font-medium">Query Classification</h4>
                      <p className="text-sm text-gray-600">
                        Shows query type and confidence level
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-3">
                    <div className="w-2 h-2 bg-orange-500 rounded-full mt-2" />
                    <div>
                      <h4 className="font-medium">Agent Pipeline View</h4>
                      <p className="text-sm text-gray-600">
                        Visual representation of the 3-agent workflow
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-3">
                    <div className="w-2 h-2 bg-red-500 rounded-full mt-2" />
                    <div>
                      <h4 className="font-medium">Step-by-Step Feedback</h4>
                      <p className="text-sm text-gray-600">
                        Clear descriptions of current processing step
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>🔄 Agent Workflow</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 text-sm">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                      <span className="text-blue-700 font-medium">1</span>
                    </div>
                    <div>
                      <div className="font-medium">Router Agent</div>
                      <div className="text-gray-600">Classifies query and creates execution plan</div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                      <span className="text-green-700 font-medium">2</span>
                    </div>
                    <div>
                      <div className="font-medium">Retrieval Agent</div>
                      <div className="text-gray-600">Searches and aggregates relevant data</div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                      <span className="text-purple-700 font-medium">3</span>
                    </div>
                    <div>
                      <div className="font-medium">Synthesizer Agent</div>
                      <div className="text-gray-600">Generates insights and recommendations</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        <Card className="mt-8">
          <CardHeader>
            <CardTitle>💡 Implementation Benefits</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm">
              <div>
                <h4 className="font-medium mb-2">Enhanced Transparency</h4>
                <p className="text-gray-600">
                  Users can see exactly what&apos;s happening behind the scenes, building trust in the AI system.
                </p>
              </div>
              <div>
                <h4 className="font-medium mb-2">Improved UX</h4>
                <p className="text-gray-600">
                  No more black box processing - users get real-time feedback and expectations.
                </p>
              </div>
              <div>
                <h4 className="font-medium mb-2">Debug-Friendly</h4>
                <p className="text-gray-600">
                  Developers and users can identify where processing might be slow or failing.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="text-center mt-8 text-sm text-gray-600">
          <p>🎯 This enhanced interface is now integrated into your Helios chat system!</p>
          <p>Try asking: &ldquo;What are the trends in our sales data and what strategic recommendations do you have?&rdquo;</p>
        </div>
      </div>
    </div>
  );
}
