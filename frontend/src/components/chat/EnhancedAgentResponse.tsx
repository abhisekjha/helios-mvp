"use client";

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  TrendingUp, 
  TrendingDown, 
  Target, 
  BarChart3, 
  AlertTriangle, 
  CheckCircle2, 
  Lightbulb, 
  Users, 
  Info,
  Eye
} from 'lucide-react';

interface KeyMetric {
  id: string;
  title: string;
  value: string | number;
  subtitle?: string;
  trend?: 'up' | 'down' | 'neutral';
  icon?: React.ReactNode;
  color?: 'green' | 'red' | 'blue' | 'yellow';
  clickable?: boolean;
}

interface Recommendation {
  id: string;
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  action?: string;
  supportingData?: string;
  icon?: React.ReactNode;
}

interface EnhancedAgentResponseProps {
  query: string;
  mainAnswer: string;
  keyMetrics?: KeyMetric[];
  recommendations?: Recommendation[];
  sources?: Array<{
    text: string;
    type: string;
    similarity_score: number;
    metadata?: {
      file_name?: string;
      source?: string;
      rows?: number;
      columns?: string[];
    };
  }>;
  confidence?: number;
  queryType?: string;
  executiveSummary?: string;
}

export function EnhancedAgentResponse({
  query,
  mainAnswer,
  keyMetrics = [],
  recommendations = [],
  sources = [],
  confidence,
  queryType,
  executiveSummary
}: EnhancedAgentResponseProps) {
  const [selectedTab, setSelectedTab] = useState('summary');
  const [selectedMetric, setSelectedMetric] = useState<string | null>(null);

  // Parse key metrics from the response if not provided
  const parsedMetrics = keyMetrics.length > 0 ? keyMetrics : [];
  
  // Parse recommendations from the response if not provided
  const parsedRecommendations = recommendations.length > 0 ? recommendations : [];

  const handleMetricClick = (metric: KeyMetric) => {
    if (metric.clickable) {
      setSelectedMetric(metric.id);
      // Here you could trigger additional actions like showing detailed data
      console.log('Clicked on metric:', metric.title);
    }
  };

  const getMetricIcon = (metric: KeyMetric) => {
    if (metric.icon) return metric.icon;
    
    switch (metric.trend) {
      case 'up':
        return <TrendingUp className="w-5 h-5 text-green-500" />;
      case 'down':
        return <TrendingDown className="w-5 h-5 text-red-500" />;
      default:
        return <BarChart3 className="w-5 h-5 text-blue-500" />;
    }
  };

  const getPriorityIcon = (priority: 'high' | 'medium' | 'low') => {
    switch (priority) {
      case 'high':
        return <AlertTriangle className="w-4 h-4 text-red-500" />;
      case 'medium':
        return <Info className="w-4 h-4 text-yellow-500" />;
      case 'low':
        return <CheckCircle2 className="w-4 h-4 text-green-500" />;
    }
  };

  const getPriorityColor = (priority: 'high' | 'medium' | 'low') => {
    switch (priority) {
      case 'high':
        return 'border-red-200 bg-red-50';
      case 'medium':
        return 'border-yellow-200 bg-yellow-50';
      case 'low':
        return 'border-green-200 bg-green-50';
    }
  };

  return (
    <div className="space-y-6">
      {/* User Query Display */}
      <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
            <Users className="w-4 h-4 text-blue-600" />
          </div>
          <div>
            <p className="font-medium text-gray-900 mb-1">Your Question:</p>
            <p className="text-gray-700">{query}</p>
          </div>
        </div>
      </div>

      {/* Executive Summary Section */}
      {(parsedMetrics.length > 0 || executiveSummary) && (
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Target className="w-5 h-5 text-blue-600" />
            At a Glance
          </h3>
          
          {/* Key Metrics Grid */}
          {parsedMetrics.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              {parsedMetrics.slice(0, 3).map((metric) => (
                <Card 
                  key={metric.id} 
                  className={`border-2 transition-all duration-200 ${
                    metric.clickable ? 'cursor-pointer hover:shadow-lg hover:scale-105' : ''
                  } ${
                    metric.color === 'green' ? 'border-green-200 bg-green-50 hover:bg-green-100' :
                    metric.color === 'red' ? 'border-red-200 bg-red-50 hover:bg-red-100' :
                    metric.color === 'yellow' ? 'border-yellow-200 bg-yellow-50 hover:bg-yellow-100' :
                    'border-blue-200 bg-blue-50 hover:bg-blue-100'
                  } ${selectedMetric === metric.id ? 'ring-2 ring-blue-400' : ''}`}
                  onClick={() => handleMetricClick(metric)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      {getMetricIcon(metric)}
                      {metric.clickable && (
                        <div className="flex items-center gap-1 text-xs text-gray-500">
                          <Eye className="w-3 h-3" />
                          <span>Click to explore</span>
                        </div>
                      )}
                    </div>
                    <div className="text-2xl font-bold text-gray-900 mb-1">
                      {typeof metric.value === 'number' ? metric.value.toLocaleString() : metric.value}
                    </div>
                    <div className="text-sm font-medium text-gray-700 mb-1">{metric.title}</div>
                    {metric.subtitle && (
                      <div className="text-xs text-gray-500">{metric.subtitle}</div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {executiveSummary && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-gray-700 leading-relaxed">{executiveSummary}</p>
            </div>
          )}
        </div>
      )}

      {/* Tabbed Content Area */}
      <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="summary" className="flex items-center gap-2">
            <Lightbulb className="w-4 h-4" />
            Recommendations
          </TabsTrigger>
          <TabsTrigger value="analysis" className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4" />
            Detailed Analysis
          </TabsTrigger>
          <TabsTrigger value="methodology" className="flex items-center gap-2">
            <Info className="w-4 h-4" />
            Data & Methodology
          </TabsTrigger>
        </TabsList>

        {/* Recommendations Tab */}
        <TabsContent value="summary" className="space-y-4">
          {parsedRecommendations.map((rec) => (
            <Card key={rec.id} className={`border-2 ${getPriorityColor(rec.priority)}`}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    {getPriorityIcon(rec.priority)}
                    <CardTitle className="text-lg">{rec.title}</CardTitle>
                  </div>
                  <Badge variant="outline" className={`text-xs ${
                    rec.priority === 'high' ? 'bg-red-100 text-red-700 border-red-300' :
                    rec.priority === 'medium' ? 'bg-yellow-100 text-yellow-700 border-yellow-300' :
                    'bg-green-100 text-green-700 border-green-300'
                  }`}>
                    {rec.priority} priority
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700 mb-3 leading-relaxed">{rec.description}</p>
                {rec.action && (
                  <div className="bg-white border border-gray-200 rounded-md p-3 mb-3">
                    <p className="text-sm font-medium text-gray-900 mb-1">Action:</p>
                    <p className="text-sm text-gray-700">{rec.action}</p>
                  </div>
                )}
                {rec.supportingData && (
                  <div className="text-xs text-gray-500">
                    <span className="font-medium">Data Source:</span> {rec.supportingData}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        {/* Detailed Analysis Tab */}
        <TabsContent value="analysis" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5" />
                  Complete Analysis
                </CardTitle>
                <div className="flex items-center gap-2">
                  {queryType && (
                    <Badge variant="outline" className="text-xs">
                      {queryType}
                    </Badge>
                  )}
                  {confidence && (
                    <Badge variant="outline" className="text-xs">
                      {confidence}% confidence
                    </Badge>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="prose prose-sm max-w-none">
                <div className="whitespace-pre-wrap text-gray-700 leading-relaxed">
                  {mainAnswer}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Data & Methodology Tab */}
        <TabsContent value="methodology" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Info className="w-5 h-5" />
                Data Sources & Methodology
              </CardTitle>
            </CardHeader>
            <CardContent>
              {sources.length > 0 ? (
                <div className="space-y-6">
                  {/* Summary Statistics */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <div className="text-sm font-medium text-blue-900 mb-1">Data Sources</div>
                      <div className="text-2xl font-bold text-blue-700">{sources.length}</div>
                      <div className="text-xs text-blue-600">files analyzed</div>
                    </div>
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                      <div className="text-sm font-medium text-green-900 mb-1">Avg. Relevance</div>
                      <div className="text-2xl font-bold text-green-700">
                        {Math.round(sources.reduce((sum, s) => sum + s.similarity_score, 0) / sources.length * 100)}%
                      </div>
                      <div className="text-xs text-green-600">match accuracy</div>
                    </div>
                    <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                      <div className="text-sm font-medium text-purple-900 mb-1">Data Types</div>
                      <div className="text-2xl font-bold text-purple-700">
                        {[...new Set(sources.map(s => s.type))].length}
                      </div>
                      <div className="text-xs text-purple-600">different formats</div>
                    </div>
                  </div>
                  
                  {/* Files Used Section */}
                  <div className="space-y-4">
                    <h4 className="font-semibold text-gray-900 flex items-center gap-2">
                      <BarChart3 className="w-4 h-4" />
                      Files Used in Analysis:
                    </h4>
                    
                    {/* Group sources by file if metadata available */}
                    {(() => {
                      const fileGroups = sources.reduce((groups, source) => {
                        const fileName = source.metadata?.file_name || 'Unknown File';
                        if (!groups[fileName]) {
                          groups[fileName] = [];
                        }
                        groups[fileName].push(source);
                        return groups;
                      }, {} as Record<string, typeof sources>);

                      return Object.entries(fileGroups).map(([fileName, fileSources], idx) => (
                        <div key={idx} className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2">
                              <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                                <BarChart3 className="w-4 h-4 text-blue-600" />
                              </div>
                              <div>
                                <div className="font-medium text-gray-900">{fileName}</div>
                                <div className="text-sm text-gray-500">
                                  {fileSources[0].metadata?.rows ? `${fileSources[0].metadata.rows.toLocaleString()} rows` : 'Data file'}
                                  {fileSources[0].metadata?.columns?.length ? ` • ${fileSources[0].metadata.columns.length} columns` : ''}
                                </div>
                              </div>
                            </div>
                            <div className="text-right">
                              <Badge variant="secondary" className="text-xs">
                                {fileSources[0].type}
                              </Badge>
                              <div className="text-xs text-gray-500 mt-1">
                                {Math.round(fileSources.reduce((sum, s) => sum + s.similarity_score, 0) / fileSources.length * 100)}% relevance
                              </div>
                            </div>
                          </div>
                          
                          {/* Show column information if available */}
                          {fileSources[0].metadata?.columns && fileSources[0].metadata.columns.length > 0 && (
                            <div className="mt-3 pt-3 border-t border-gray-200">
                              <div className="text-sm text-gray-700 mb-2">
                                <span className="font-medium">Key columns analyzed:</span>
                              </div>
                              <div className="flex flex-wrap gap-1">
                                {fileSources[0].metadata.columns.slice(0, 8).map((col: string, colIdx: number) => (
                                  <Badge key={colIdx} variant="outline" className="text-xs">
                                    {col}
                                  </Badge>
                                ))}
                                {fileSources[0].metadata.columns.length > 8 && (
                                  <Badge variant="outline" className="text-xs">
                                    +{fileSources[0].metadata.columns.length - 8} more
                                  </Badge>
                                )}
                              </div>
                            </div>
                          )}
                          
                          {/* Show sample data insight */}
                          {fileSources[0].text && (
                            <div className="mt-3 pt-3 border-t border-gray-200">
                              <div className="text-sm text-gray-700 mb-1">
                                <span className="font-medium">Sample insight:</span>
                              </div>
                              <div className="text-sm text-gray-600 bg-white p-2 rounded border">
                                {fileSources[0].text.length > 150 ? `${fileSources[0].text.substring(0, 150)}...` : fileSources[0].text}
                              </div>
                            </div>
                          )}
                        </div>
                      ));
                    })()}
                  </div>

                  {/* Analysis Methodology */}
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <h4 className="font-semibold text-blue-900 mb-2 flex items-center gap-2">
                      <Target className="w-4 h-4" />
                      Analysis Methodology
                    </h4>
                    <div className="text-sm text-blue-800 space-y-2">
                      <div>• <strong>Multi-file Analysis:</strong> Data from {sources.length} source file{sources.length !== 1 ? 's' : ''} was cross-referenced and analyzed</div>
                      <div>• <strong>Relevance Scoring:</strong> Each data point was scored for relevance to your query</div>
                      <div>• <strong>Pattern Recognition:</strong> AI identified trends, outliers, and correlations across datasets</div>
                      <div>• <strong>Confidence Assessment:</strong> Analysis confidence based on data quality and consistency</div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <Info className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-500 mb-2">No source data available for this response</p>
                  <p className="text-sm text-gray-400">This may be a general query not requiring specific data analysis</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
