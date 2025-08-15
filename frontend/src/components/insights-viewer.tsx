"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface InsightsViewerProps {
  insights: string | null | undefined;
  fileName: string;
  uploadDate: string;
  status: string;
}

interface ParsedInsight {
  text: string;
  type: string;
  category: 'growth' | 'competitive' | 'seasonal' | 'recommendation' | 'general';
  confidence: number;
}

export function InsightsViewer({ insights, fileName, uploadDate, status }: InsightsViewerProps) {
  const [activeInsightTab, setActiveInsightTab] = useState("all");

  const parseInsights = (insightsText: string): ParsedInsight[] => {
    const sentences = insightsText.split(/\.\s+/).filter(sentence => sentence.trim());
    
    return sentences.map(sentence => {
      const cleanSentence = sentence.trim();
      const lowerSentence = cleanSentence.toLowerCase();
      
      let category: ParsedInsight['category'] = 'general';
      let confidence = 0.8;
      
      if (lowerSentence.includes('growth') || lowerSentence.includes('increase') || lowerSentence.includes('rising')) {
        category = 'growth';
        confidence = 0.9;
      } else if (lowerSentence.includes('competitor') || lowerSentence.includes('price') || lowerSentence.includes('competitive')) {
        category = 'competitive';
        confidence = 0.85;
      } else if (lowerSentence.includes('seasonal') || lowerSentence.includes('pattern') || lowerSentence.includes('week')) {
        category = 'seasonal';
        confidence = 0.8;
      } else if (lowerSentence.includes('recommend') || lowerSentence.includes('consider') || lowerSentence.includes('should')) {
        category = 'recommendation';
        confidence = 0.95;
      }
      
      return {
        text: cleanSentence.endsWith('.') ? cleanSentence : cleanSentence + '.',
        type: category.charAt(0).toUpperCase() + category.slice(1),
        category,
        confidence
      };
    });
  };

  const getInsightIcon = (category: string) => {
    switch (category) {
      case 'growth': return '📈';
      case 'competitive': return '🏆';
      case 'seasonal': return '📅';
      case 'recommendation': return '💡';
      default: return '📊';
    }
  };

  const getInsightGradient = (category: string) => {
    switch (category) {
      case 'growth': return 'from-green-400 to-emerald-500';
      case 'competitive': return 'from-blue-400 to-indigo-500';
      case 'seasonal': return 'from-purple-400 to-violet-500';
      case 'recommendation': return 'from-yellow-400 to-orange-500';
      default: return 'from-gray-400 to-gray-500';
    }
  };

  const getInsightBg = (category: string) => {
    switch (category) {
      case 'growth': return 'from-green-50 to-emerald-50 border-green-200';
      case 'competitive': return 'from-blue-50 to-indigo-50 border-blue-200';
      case 'seasonal': return 'from-purple-50 to-violet-50 border-purple-200';
      case 'recommendation': return 'from-yellow-50 to-orange-50 border-yellow-200';
      default: return 'from-gray-50 to-gray-50 border-gray-200';
    }
  };

  if (!insights) {
    return (
      <Card className="shadow-lg">
        <CardHeader className="bg-gradient-to-r from-gray-50 to-gray-100">
          <CardTitle className="text-xl flex items-center space-x-2">
            <span>📄</span>
            <span>{fileName}</span>
          </CardTitle>
          <CardDescription>
            Uploaded on {new Date(uploadDate).toLocaleDateString()} • Status: {status}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12">
            <div className="text-6xl mb-4">🔍</div>
            <h3 className="text-xl font-semibold text-gray-700 mb-2">No Insights Available</h3>
            <p className="text-gray-500 mb-4">Generate insights to see detailed analysis here</p>
            <div className="inline-flex items-center space-x-2 text-sm text-gray-400">
              <span>⚡</span>
              <span>AI-powered insights ready to generate</span>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const parsedInsights = parseInsights(insights);
  const insightCategories = [...new Set(parsedInsights.map(insight => insight.category))];

  return (
    <div className="space-y-6">
      {/* File Header */}
      <Card className="shadow-lg border-0 bg-gradient-to-r from-indigo-500 to-purple-600 text-white">
        <CardHeader>
          <CardTitle className="text-2xl flex items-center space-x-3">
            <span className="text-3xl">📄</span>
            <div>
              <div>{fileName}</div>
              <div className="text-indigo-100 text-sm font-normal">
                Uploaded {new Date(uploadDate).toLocaleDateString()} • {parsedInsights.length} insights discovered
              </div>
            </div>
          </CardTitle>
        </CardHeader>
      </Card>

      {/* Insights Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {insightCategories.map(category => {
          const categoryInsights = parsedInsights.filter(insight => insight.category === category);
          const avgConfidence = categoryInsights.reduce((sum, insight) => sum + insight.confidence, 0) / categoryInsights.length;
          
          return (
            <Card key={category} className={`bg-gradient-to-br ${getInsightBg(category)} shadow-md hover:shadow-lg transition-shadow`}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="text-2xl">{getInsightIcon(category)}</span>
                    <div>
                      <div className="font-semibold capitalize">{category}</div>
                      <div className="text-sm text-gray-600">{categoryInsights.length} insights</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-gray-500">Confidence</div>
                    <div className="font-bold text-sm">{Math.round(avgConfidence * 100)}%</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Detailed Insights with Tabs */}
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <span>🧠</span>
            <span>Detailed Analysis</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs value={activeInsightTab} onValueChange={setActiveInsightTab}>
            <TabsList className="grid grid-cols-5 mb-6">
              <TabsTrigger value="all">All Insights</TabsTrigger>
              {insightCategories.map(category => (
                <TabsTrigger key={category} value={category} className="capitalize">
                  <span className="mr-1">{getInsightIcon(category)}</span>
                  {category}
                </TabsTrigger>
              ))}
            </TabsList>

            <TabsContent value="all" className="space-y-4">
              {parsedInsights.map((insight, index) => (
                <div
                  key={index}
                  className={`p-6 rounded-xl border-2 bg-gradient-to-r ${getInsightBg(insight.category)} hover:shadow-lg transition-all duration-200 hover:scale-[1.01]`}
                >
                  <div className="flex items-start space-x-4">
                    <div className={`w-12 h-12 rounded-full bg-gradient-to-r ${getInsightGradient(insight.category)} flex items-center justify-center text-white text-xl shadow-lg`}>
                      {getInsightIcon(insight.category)}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-3">
                        <Badge variant="outline" className="capitalize font-medium">
                          {insight.type}
                        </Badge>
                        <div className="flex items-center space-x-2">
                          <span className="text-xs text-gray-500">Confidence:</span>
                          <span className="text-sm font-bold text-gray-700">{Math.round(insight.confidence * 100)}%</span>
                        </div>
                      </div>
                      <p className="text-gray-800 leading-relaxed text-lg">
                        {insight.text}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </TabsContent>

            {insightCategories.map(category => (
              <TabsContent key={category} value={category} className="space-y-4">
                {parsedInsights
                  .filter(insight => insight.category === category)
                  .map((insight, index) => (
                    <div
                      key={index}
                      className={`p-6 rounded-xl border-2 bg-gradient-to-r ${getInsightBg(insight.category)} hover:shadow-lg transition-all duration-200 hover:scale-[1.01]`}
                    >
                      <div className="flex items-start space-x-4">
                        <div className={`w-12 h-12 rounded-full bg-gradient-to-r ${getInsightGradient(insight.category)} flex items-center justify-center text-white text-xl shadow-lg`}>
                          {getInsightIcon(insight.category)}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-3">
                            <Badge variant="outline" className="capitalize font-medium">
                              {insight.type}
                            </Badge>
                            <div className="flex items-center space-x-2">
                              <span className="text-xs text-gray-500">Confidence:</span>
                              <span className="text-sm font-bold text-gray-700">{Math.round(insight.confidence * 100)}%</span>
                            </div>
                          </div>
                          <p className="text-gray-800 leading-relaxed text-lg">
                            {insight.text}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
              </TabsContent>
            ))}
          </Tabs>
        </CardContent>
      </Card>

      {/* Insights Metadata */}
      <Card className="bg-gray-50">
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-gray-700">{parsedInsights.length}</div>
              <div className="text-sm text-gray-500">Total Insights</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-green-600">
                {Math.round((parsedInsights.reduce((sum, insight) => sum + insight.confidence, 0) / parsedInsights.length) * 100)}%
              </div>
              <div className="text-sm text-gray-500">Average Confidence</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-blue-600">{insightCategories.length}</div>
              <div className="text-sm text-gray-500">Categories Identified</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
