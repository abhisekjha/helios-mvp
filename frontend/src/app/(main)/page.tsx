"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  TrendingUp, 
  Shield, 
  Zap, 
  DollarSign, 
  Activity, 
  Clock,
  AlertTriangle,
  CheckCircle,
  Eye,
  ThumbsUp,
  ThumbsDown
} from "lucide-react";

interface ActivityItem {
  id: string;
  agent: "Insight" | "Planning" | "Auditor" | "Treasurer";
  action: string;
  details: string;
  timestamp: Date;
  status: "success" | "warning" | "pending" | "action_required";
  actionButton?: {
    label: string;
    variant: "default" | "destructive" | "outline";
  };
}

export default function MissionControlPage() {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [activities, setActivities] = useState<ActivityItem[]>([
    {
      id: "1",
      agent: "Insight",
      action: "Sales Spike Detected",
      details: "15% sales increase for Product X in the Northeast region. Correlation with recent marketing campaign identified.",
      timestamp: new Date(Date.now() - 300000), // 5 minutes ago
      status: "success"
    },
    {
      id: "2", 
      agent: "Planning",
      action: "Strategic Plans Generated",
      details: "3 new strategic plans created for 'Q4 Market Share' goal. Plans focus on digital expansion, partnership development, and customer retention.",
      timestamp: new Date(Date.now() - 600000), // 10 minutes ago
      status: "success"
    },
    {
      id: "3",
      agent: "Auditor", 
      action: "Claims Validation Complete",
      details: "Automatically validated 487 claims with 99.2% accuracy. 12 claims flagged for manual review due to anomalies.",
      timestamp: new Date(Date.now() - 900000), // 15 minutes ago
      status: "warning"
    },
    {
      id: "4",
      agent: "Treasurer",
      action: "Budget Reallocation Recommendation", 
      details: "Recommends reallocating $50k from underperforming 'Social Media Boost' campaign to high-performing 'Northeast Expansion'.",
      timestamp: new Date(Date.now() - 1200000), // 20 minutes ago
      status: "action_required",
      actionButton: { label: "Approve", variant: "default" }
    },
    {
      id: "5",
      agent: "Insight",
      action: "Customer Behavior Analysis",
      details: "Identified 23% increase in mobile app usage during evening hours. Recommending targeted evening promotions.",
      timestamp: new Date(Date.now() - 1800000), // 30 minutes ago
      status: "success"
    }
  ]);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // KPI Data (condensed from original dashboard)
  const kpis = {
    portfolioROI: { current: 12.5, target: 10.0, trend: "+2.3%" },
    revenueProtection: { amount: 1.24, currency: "M", growth: "+18%" },
    efficiencyGains: { hours: 2847, growth: "+34%" }
  };

  const getAgentIcon = (agent: string) => {
    switch (agent) {
      case "Insight": return <TrendingUp className="w-4 h-4" />;
      case "Planning": return <Zap className="w-4 h-4" />;
      case "Auditor": return <Shield className="w-4 h-4" />;
      case "Treasurer": return <DollarSign className="w-4 h-4" />;
      default: return <Activity className="w-4 h-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "success": return "bg-green-100 text-green-800 border-green-200";
      case "warning": return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "pending": return "bg-blue-100 text-blue-800 border-blue-200";
      case "action_required": return "bg-red-100 text-red-800 border-red-200";
      default: return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "success": return <CheckCircle className="w-4 h-4" />;
      case "warning": return <AlertTriangle className="w-4 h-4" />;
      case "pending": return <Clock className="w-4 h-4" />;
      case "action_required": return <AlertTriangle className="w-4 h-4" />;
      default: return <Activity className="w-4 h-4" />;
    }
  };

  const handleActivityAction = (activityId: string, action: "approve" | "deny") => {
    setActivities(prev => prev.map(activity => 
      activity.id === activityId 
        ? { ...activity, status: action === "approve" ? "success" : "warning" as const, actionButton: undefined }
        : activity
    ));
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Mission Control</h1>
          <p className="text-slate-600 mt-1">
            Live Agent Activity • {currentTime.toLocaleDateString('en-US', { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}
          </p>
        </div>
        <div className="flex items-center space-x-2 bg-green-50 px-4 py-2 rounded-lg border border-green-200">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
          <span className="text-sm font-medium text-green-700">All Agents Online</span>
        </div>
      </div>

      {/* Compact KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">Portfolio ROI</p>
                <p className="text-2xl font-bold text-slate-900">{kpis.portfolioROI.current}%</p>
                <p className="text-xs text-green-600">{kpis.portfolioROI.trend} vs target</p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">Revenue Protection</p>
                <p className="text-2xl font-bold text-slate-900">${kpis.revenueProtection.amount}{kpis.revenueProtection.currency}</p>
                <p className="text-xs text-green-600">{kpis.revenueProtection.growth} vs Q3</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                <Shield className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">Efficiency Gains</p>
                <p className="text-2xl font-bold text-slate-900">{kpis.efficiencyGains.hours}h</p>
                <p className="text-xs text-green-600">{kpis.efficiencyGains.growth} vs Q3</p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                <Zap className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Activity Feed */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Activity className="w-5 h-5" />
            <span>Helios Activity Feed</span>
            <Badge variant="secondary" className="ml-auto">Live</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {activities.map((activity) => (
              <div
                key={activity.id}
                className="flex items-start space-x-4 p-4 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
              >
                {/* Agent Icon */}
                <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-r from-purple-600 to-blue-600 rounded-full flex items-center justify-center text-white">
                  {getAgentIcon(activity.agent)}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2 mb-1">
                    <span className="font-semibold text-slate-900">{activity.agent} Agent</span>
                    <Badge variant="outline" className={getStatusColor(activity.status)}>
                      {getStatusIcon(activity.status)}
                      <span className="ml-1 capitalize">{activity.status.replace('_', ' ')}</span>
                    </Badge>
                    <span className="text-xs text-slate-500">
                      {activity.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  
                  <h3 className="font-medium text-slate-900 mb-1">{activity.action}</h3>
                  <p className="text-sm text-slate-600 mb-3">{activity.details}</p>
                  
                  <div className="flex items-center space-x-2">
                    <Button variant="outline" size="sm">
                      <Eye className="w-4 h-4 mr-1" />
                      View Details
                    </Button>
                    
                    {activity.actionButton && activity.status === "action_required" && (
                      <div className="flex space-x-2">
                        <Button 
                          size="sm"
                          onClick={() => handleActivityAction(activity.id, "approve")}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          <ThumbsUp className="w-4 h-4 mr-1" />
                          Approve
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleActivityAction(activity.id, "deny")}
                        >
                          <ThumbsDown className="w-4 h-4 mr-1" />
                          Deny
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          {/* Load More */}
          <div className="text-center mt-6">
            <Button variant="outline">
              Load Earlier Activities
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Status Bar */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between text-sm text-slate-600">
            <div className="flex items-center space-x-6">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                <span>System Operational</span>
              </div>
              <span>Last Updated: {currentTime.toLocaleTimeString()}</span>
            </div>
            <span>Helios Autonomous TPM Agent</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}