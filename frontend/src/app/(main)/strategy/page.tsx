"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { 
  Plus, 
  Target, 
  Calendar, 
  DollarSign, 
  Users, 
  FileText, 
  MessageCircle,
  Clock,
  CheckCircle,
  AlertCircle,
  TrendingUp
} from "lucide-react";

interface Goal {
  id: string;
  title: string;
  description: string;
  budget: number;
  startDate: string;
  endDate: string;
  status: "draft" | "processing" | "awaiting_review" | "complete";
  progress: number;
  owner: string;
  plans: number;
  dataUploads: number;
  conversationHistory: ConversationItem[];
}

interface ConversationItem {
  id: string;
  type: "user" | "agent";
  content: string;
  timestamp: Date;
}

const columns = [
  { id: "draft", title: "Draft", color: "bg-slate-100" },
  { id: "processing", title: "Processing", color: "bg-blue-100" },
  { id: "awaiting_review", title: "Awaiting Review", color: "bg-yellow-100" },
  { id: "complete", title: "Complete", color: "bg-green-100" }
];

const mockGoals: Goal[] = [
  {
    id: "1",
    title: "Q4 Market Share Expansion",
    description: "Increase market share in Northeast region by 15% through targeted campaigns and partnerships",
    budget: 500000,
    startDate: "2024-10-01",
    endDate: "2024-12-31",
    status: "processing",
    progress: 65,
    owner: "Sarah Johnson",
    plans: 3,
    dataUploads: 5,
    conversationHistory: [
      { id: "1", type: "user", content: "Create a goal to expand market share in Northeast", timestamp: new Date(Date.now() - 86400000) },
      { id: "2", type: "agent", content: "I've analyzed the Northeast market data and created a comprehensive expansion strategy with 3 execution plans.", timestamp: new Date(Date.now() - 86300000) }
    ]
  },
  {
    id: "2", 
    title: "Customer Retention Initiative",
    description: "Improve customer retention rate by 20% through enhanced loyalty programs and personalized experiences",
    budget: 300000,
    startDate: "2024-09-15",
    endDate: "2025-03-15",
    status: "awaiting_review",
    progress: 80,
    owner: "Mike Chen",
    plans: 2,
    dataUploads: 8,
    conversationHistory: [
      { id: "1", type: "user", content: "We need to focus on customer retention this quarter", timestamp: new Date(Date.now() - 172800000) },
      { id: "2", type: "agent", content: "I've identified key churn indicators and developed targeted retention strategies. Ready for your review.", timestamp: new Date(Date.now() - 172700000) }
    ]
  },
  {
    id: "3",
    title: "Digital Transformation",
    description: "Modernize core business processes and implement AI-driven automation",
    budget: 750000,
    startDate: "2024-08-01", 
    endDate: "2025-02-01",
    status: "complete",
    progress: 100,
    owner: "Lisa Park",
    plans: 4,
    dataUploads: 12,
    conversationHistory: [
      { id: "1", type: "user", content: "Let's plan our digital transformation roadmap", timestamp: new Date(Date.now() - 259200000) },
      { id: "2", type: "agent", content: "Digital transformation roadmap complete! All automation targets achieved ahead of schedule.", timestamp: new Date(Date.now() - 86400000) }
    ]
  },
  {
    id: "4",
    title: "Product Launch - AI Analytics",
    description: "Launch new AI-powered analytics platform for enterprise customers",
    budget: 1200000,
    startDate: "2024-11-01",
    endDate: "2025-04-30", 
    status: "draft",
    progress: 25,
    owner: "David Rodriguez",
    plans: 1,
    dataUploads: 2,
    conversationHistory: [
      { id: "1", type: "user", content: "Initial planning for AI analytics product launch", timestamp: new Date(Date.now() - 43200000) }
    ]
  }
];

export default function StrategyPage() {
  const [selectedGoal, setSelectedGoal] = useState<Goal | null>(null);
  const [isDetailsPanelOpen, setIsDetailsPanelOpen] = useState(false);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "draft": return <FileText className="w-4 h-4 text-slate-500" />;
      case "processing": return <Clock className="w-4 h-4 text-blue-500" />;
      case "awaiting_review": return <AlertCircle className="w-4 h-4 text-yellow-500" />;
      case "complete": return <CheckCircle className="w-4 h-4 text-green-500" />;
      default: return <Target className="w-4 h-4" />;
    }
  };

  const handleGoalClick = (goal: Goal) => {
    setSelectedGoal(goal);
    setIsDetailsPanelOpen(true);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Strategy Workspace</h1>
          <p className="text-slate-600 mt-1">Manage goals and strategic plans across all initiatives</p>
        </div>
        <Button className="bg-gradient-to-r from-purple-600 to-blue-600">
          <Plus className="w-4 h-4 mr-2" />
          New Goal
        </Button>
      </div>

      {/* Kanban Board */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {columns.map((column) => (
          <div key={column.id} className="space-y-4">
            {/* Column Header */}
            <div className={`${column.color} rounded-lg p-4 border border-slate-200`}>
              <h2 className="font-semibold text-slate-900 mb-2">{column.title}</h2>
              <p className="text-sm text-slate-600">
                {mockGoals.filter(goal => goal.status === column.id).length} goals
              </p>
            </div>

            {/* Goal Cards */}
            <div className="space-y-3">
              {mockGoals
                .filter(goal => goal.status === column.id)
                .map((goal) => (
                  <Card 
                    key={goal.id} 
                    className="cursor-pointer hover:shadow-md transition-all duration-200 hover:border-purple-300"
                    onClick={() => handleGoalClick(goal)}
                  >
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <CardTitle className="text-sm font-medium text-slate-900 leading-tight">
                          {goal.title}
                        </CardTitle>
                        {getStatusIcon(goal.status)}
                      </div>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <p className="text-xs text-slate-600 mb-3 line-clamp-2">
                        {goal.description}
                      </p>
                      
                      {/* Progress Bar */}
                      <div className="mb-3">
                        <div className="flex justify-between text-xs text-slate-600 mb-1">
                          <span>Progress</span>
                          <span>{goal.progress}%</span>
                        </div>
                        <div className="w-full bg-slate-200 rounded-full h-2">
                          <div 
                            className="bg-gradient-to-r from-purple-600 to-blue-600 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${goal.progress}%` }}
                          />
                        </div>
                      </div>

                      {/* Metadata */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-xs">
                          <div className="flex items-center text-slate-600">
                            <DollarSign className="w-3 h-3 mr-1" />
                            {formatCurrency(goal.budget)}
                          </div>
                          <div className="flex items-center text-slate-600">
                            <Calendar className="w-3 h-3 mr-1" />
                            {new Date(goal.endDate).toLocaleDateString()}
                          </div>
                        </div>
                        
                        <div className="flex items-center justify-between text-xs">
                          <div className="flex items-center text-slate-600">
                            <FileText className="w-3 h-3 mr-1" />
                            {goal.plans} plans
                          </div>
                          <div className="flex items-center text-slate-600">
                            <TrendingUp className="w-3 h-3 mr-1" />
                            {goal.dataUploads} datasets
                          </div>
                        </div>

                        <div className="flex items-center text-xs text-slate-600">
                          <Users className="w-3 h-3 mr-1" />
                          {goal.owner}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              }
            </div>
          </div>
        ))}
      </div>

      {/* Goal Details Panel */}
      <Sheet open={isDetailsPanelOpen} onOpenChange={setIsDetailsPanelOpen}>
        <SheetContent className="w-[600px] sm:max-w-[600px]">
          {selectedGoal && (
            <>
              <SheetHeader>
                <SheetTitle className="flex items-center space-x-2">
                  {getStatusIcon(selectedGoal.status)}
                  <span>{selectedGoal.title}</span>
                </SheetTitle>
              </SheetHeader>
              
              <div className="mt-6 space-y-6">
                {/* Goal Overview */}
                <div className="space-y-4">
                  <h3 className="font-semibold text-slate-900">Overview</h3>
                  <p className="text-sm text-slate-600">{selectedGoal.description}</p>
                  
                  {/* Key Metrics */}
                  <div className="grid grid-cols-2 gap-4">
                    <Card>
                      <CardContent className="p-4">
                        <div className="text-center">
                          <DollarSign className="w-8 h-8 mx-auto mb-2 text-green-600" />
                          <p className="text-lg font-bold text-slate-900">{formatCurrency(selectedGoal.budget)}</p>
                          <p className="text-xs text-slate-600">Budget</p>
                        </div>
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardContent className="p-4">
                        <div className="text-center">
                          <Target className="w-8 h-8 mx-auto mb-2 text-blue-600" />
                          <p className="text-lg font-bold text-slate-900">{selectedGoal.progress}%</p>
                          <p className="text-xs text-slate-600">Complete</p>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>

                {/* Data Uploads */}
                <div className="space-y-3">
                  <h3 className="font-semibold text-slate-900">Data Uploads ({selectedGoal.dataUploads})</h3>
                  <div className="space-y-2">
                    {["Market Analysis Q4.csv", "Customer Segments.xlsx", "Competitor Research.pdf"].map((file, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                        <div className="flex items-center space-x-3">
                          <FileText className="w-4 h-4 text-slate-500" />
                          <span className="text-sm text-slate-700">{file}</span>
                        </div>
                        <Button variant="outline" size="sm">View</Button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Generated Plans */}
                <div className="space-y-3">
                  <h3 className="font-semibold text-slate-900">Generated Plans ({selectedGoal.plans})</h3>
                  <div className="space-y-2">
                    {["Digital Marketing Strategy", "Partnership Development", "Customer Engagement Plan"].slice(0, selectedGoal.plans).map((plan, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-blue-50 rounded-lg border border-blue-200">
                        <div className="flex items-center space-x-3">
                          <Target className="w-4 h-4 text-blue-600" />
                          <span className="text-sm text-slate-700">{plan}</span>
                        </div>
                        <Button variant="outline" size="sm">Review</Button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Conversation History */}
                <div className="space-y-3">
                  <h3 className="font-semibold text-slate-900 flex items-center">
                    <MessageCircle className="w-4 h-4 mr-2" />
                    Conversation History
                  </h3>
                  <div className="space-y-3 max-h-60 overflow-y-auto">
                    {selectedGoal.conversationHistory.map((item) => (
                      <div 
                        key={item.id} 
                        className={`p-3 rounded-lg ${
                          item.type === "user" 
                            ? "bg-purple-50 border border-purple-200 ml-8" 
                            : "bg-slate-50 border border-slate-200 mr-8"
                        }`}
                      >
                        <div className="flex items-center space-x-2 mb-1">
                          <span className="text-xs font-medium text-slate-600">
                            {item.type === "user" ? "You" : "Helios Agent"}
                          </span>
                          <span className="text-xs text-slate-500">
                            {item.timestamp.toLocaleDateString()}
                          </span>
                        </div>
                        <p className="text-sm text-slate-700">{item.content}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
