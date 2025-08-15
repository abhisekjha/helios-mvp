import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { TrendingUp, TrendingDown, Target, AlertCircle, CheckCircle, BarChart3 } from 'lucide-react';

interface DataPoint {
  label: string;
  value: number | string;
  trend?: 'up' | 'down' | 'stable';
  percentage?: number;
  color?: 'green' | 'red' | 'blue' | 'yellow' | 'purple';
}

interface InsightSection {
  title: string;
  type: 'metrics' | 'analysis' | 'recommendations' | 'trends';
  data: DataPoint[];
  description?: string;
}

interface DataVisualizationCardProps {
  sections: InsightSection[];
  confidence: number;
  processingTime: string;
  dataSource: string;
}

export const DataVisualizationCard: React.FC<DataVisualizationCardProps> = ({
  sections,
  confidence,
  processingTime,
  dataSource
}) => {
  const getIconForType = (type: string) => {
    switch (type) {
      case 'metrics': return <BarChart3 className="w-5 h-5" />;
      case 'analysis': return <Target className="w-5 h-5" />;
      case 'recommendations': return <CheckCircle className="w-5 h-5" />;
      case 'trends': return <TrendingUp className="w-5 h-5" />;
      default: return <AlertCircle className="w-5 h-5" />;
    }
  };

  const getColorClass = (color?: string) => {
    switch (color) {
      case 'green': return 'text-green-600 bg-green-50 border-green-200';
      case 'red': return 'text-red-600 bg-red-50 border-red-200';
      case 'blue': return 'text-blue-600 bg-blue-50 border-blue-200';
      case 'yellow': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'purple': return 'text-purple-600 bg-purple-50 border-purple-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getTrendIcon = (trend?: string) => {
    switch (trend) {
      case 'up': return <TrendingUp className="w-4 h-4 text-green-500" />;
      case 'down': return <TrendingDown className="w-4 h-4 text-red-500" />;
      default: return null;
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 80) return 'text-green-600';
    if (confidence >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className="space-y-6">
      {/* Header with Confidence and Metadata */}
      <Card className="border-l-4 border-l-blue-500">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-semibold text-gray-800">
              📊 Data Analysis Results
            </CardTitle>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className={getConfidenceColor(confidence)}>
                {confidence}% Confidence
              </Badge>
              <Badge variant="secondary">
                {processingTime}
              </Badge>
            </div>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <span>📁 Source: {dataSource}</span>
          </div>
          <Progress value={confidence} className="h-2 mt-2" />
        </CardHeader>
      </Card>

      {/* Dynamic Sections */}
      {sections.map((section, sectionIndex) => (
        <Card key={sectionIndex} className="shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              {getIconForType(section.type)}
              <CardTitle className="text-lg font-semibold text-gray-800">
                {section.title}
              </CardTitle>
            </div>
            {section.description && (
              <p className="text-sm text-gray-600 mt-1">{section.description}</p>
            )}
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {section.data.map((dataPoint, index) => (
                <div 
                  key={index}
                  className={`p-4 rounded-lg border-2 ${getColorClass(dataPoint.color)}`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">{dataPoint.label}</span>
                    {getTrendIcon(dataPoint.trend)}
                  </div>
                  <div className="text-2xl font-bold mb-1">
                    {typeof dataPoint.value === 'number' 
                      ? dataPoint.value.toLocaleString() 
                      : dataPoint.value
                    }
                  </div>
                  {dataPoint.percentage !== undefined && (
                    <div className="text-xs text-gray-600">
                      {dataPoint.percentage > 0 ? '+' : ''}{dataPoint.percentage}% change
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default DataVisualizationCard;
