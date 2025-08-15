import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { TrendingUp, TrendingDown, Target, BarChart3, AlertCircle, CheckCircle } from 'lucide-react';

export interface InsightData {
  type: 'chart' | 'trend' | 'metric' | 'insight' | 'recommendation';
  title: string;
  value?: number | string;
  description?: string;
  trend?: 'up' | 'down' | 'neutral';
  confidence?: number;
  priority?: 'high' | 'medium' | 'low';
  category?: string;
  data?: Array<{ label: string; value: number }>;
}

interface DataVisualizationPanelProps {
  insights: InsightData[];
  title?: string;
  className?: string;
}

export const DataVisualizationPanel: React.FC<DataVisualizationPanelProps> = ({ 
  insights, 
  title = "Data Insights",
  className = "" 
}) => {
  const renderInsightCard = (insight: InsightData, index: number) => {
    const getTrendIcon = (trend?: string) => {
      switch (trend) {
        case 'up':
          return <TrendingUp className="h-4 w-4 text-green-500" />;
        case 'down':
          return <TrendingDown className="h-4 w-4 text-red-500" />;
        default:
          return <BarChart3 className="h-4 w-4 text-blue-500" />;
      }
    };

    const getPriorityColor = (priority?: string) => {
      switch (priority) {
        case 'high':
          return 'bg-red-100 text-red-800 border-red-200';
        case 'medium':
          return 'bg-yellow-100 text-yellow-800 border-yellow-200';
        case 'low':
          return 'bg-green-100 text-green-800 border-green-200';
        default:
          return 'bg-blue-100 text-blue-800 border-blue-200';
      }
    };

    return (
      <Card key={index} className="mb-4 hover:shadow-md transition-shadow">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {getTrendIcon(insight.trend)}
              <CardTitle className="text-lg">{insight.title}</CardTitle>
            </div>
            <div className="flex gap-2">
              {insight.confidence && (
                <Badge variant="outline" className="text-xs">
                  {insight.confidence}% confident
                </Badge>
              )}
              {insight.priority && (
                <Badge className={`text-xs ${getPriorityColor(insight.priority)}`}>
                  {insight.priority} priority
                </Badge>
              )}
              {insight.category && (
                <Badge variant="secondary" className="text-xs">
                  {insight.category}
                </Badge>
              )}
            </div>
          </div>
        </CardHeader>
        
        <CardContent>
          {insight.value && (
            <div className="mb-3">
              <div className="text-2xl font-bold text-gray-900">
                {typeof insight.value === 'number' 
                  ? insight.value.toLocaleString() 
                  : insight.value
                }
              </div>
            </div>
          )}
          
          {insight.description && (
            <p className="text-gray-600 mb-3">{insight.description}</p>
          )}
          
          {insight.confidence && (
            <div className="mb-3">
              <div className="flex justify-between text-sm text-gray-500 mb-1">
                <span>Confidence Level</span>
                <span>{insight.confidence}%</span>
              </div>
              <Progress value={insight.confidence} className="h-2" />
            </div>
          )}
          
          {insight.data && insight.data.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-gray-700">Data Breakdown:</h4>
              {insight.data.slice(0, 5).map((item, idx) => (
                <div key={idx} className="flex justify-between items-center text-sm">
                  <span className="text-gray-600">{item.label}</span>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{item.value.toLocaleString()}</span>
                    <div className="w-20">
                      <Progress 
                        value={(item.value / Math.max(...insight.data!.map(d => d.value))) * 100} 
                        className="h-1" 
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="flex items-center gap-2 mb-4">
        <BarChart3 className="h-5 w-5 text-blue-600" />
        <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
        <Badge variant="outline" className="ml-auto">
          {insights.length} insights
        </Badge>
      </div>
      
      {insights.length > 0 ? (
        <div className="space-y-4">
          {insights.map((insight, index) => renderInsightCard(insight, index))}
        </div>
      ) : (
        <Card>
          <CardContent className="py-8 text-center">
            <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-500">No insights available yet</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

// Helper function to parse insights from text responses
export const parseInsightsFromText = (text: string): InsightData[] => {
  const insights: InsightData[] = [];
  
  // Extract key metrics (numbers with context)
  const metricPattern = /(\d+(?:,\d{3})*(?:\.\d+)?)\s*(?:%|percent|units?|sales?|items?|dollars?|\$|customers?|orders?)/gi;
  const metrics = text.match(metricPattern);
  
  if (metrics) {
    metrics.slice(0, 3).forEach((metric, index) => {
      const value = parseFloat(metric.replace(/[,%$]/g, ''));
      insights.push({
        type: 'metric',
        title: `Key Metric ${index + 1}`,
        value: value,
        description: `Extracted from analysis: ${metric}`,
        confidence: 85,
        category: 'metrics'
      });
    });
  }
  
  // Extract trends (increase, decrease, improvement, etc.)
  const trendPattern = /(increase[sd]?|decrease[sd]?|improve[sd]?|decline[sd]?|grow[sn]?|drop[sp]?)/gi;
  const trends = text.match(trendPattern);
  
  if (trends) {
    trends.slice(0, 2).forEach((trend, index) => {
      const trendDirection = /increase|improve|grow/i.test(trend) ? 'up' : 'down';
      insights.push({
        type: 'trend',
        title: `Trend Analysis ${index + 1}`,
        description: `Detected trend: ${trend}`,
        trend: trendDirection,
        confidence: 75,
        category: 'trends'
      });
    });
  }
  
  // Extract recommendations (should, recommend, suggest)
  const sentences = text.split(/[.!?]+/);
  const recommendations = sentences.filter(sentence => 
    /should|recommend|suggest|consider|implement/i.test(sentence)
  ).slice(0, 3);
  
  recommendations.forEach((rec, index) => {
    insights.push({
      type: 'recommendation',
      title: `Recommendation ${index + 1}`,
      description: rec.trim(),
      priority: index === 0 ? 'high' : index === 1 ? 'medium' : 'low',
      category: 'recommendations'
    });
  });
  
  return insights;
};
