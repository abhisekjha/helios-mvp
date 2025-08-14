'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { getPlans, approvePlan, Plan } from '@/api/plans';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Calendar, 
  AlertTriangle,
  CheckCircle,
  Shield
} from 'lucide-react';

interface EnhancedPlan extends Plan {
  plan_name?: string;
  created_at?: string;
  roi_percentage?: number;
  risk_level?: 'Low' | 'Medium' | 'High';
}

export default function ReviewPlansPage() {
  const { goalId } = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const [plans, setPlans] = useState<EnhancedPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [approving, setApproving] = useState<string | null>(null);

  useEffect(() => {
    if (typeof goalId === 'string') {
      getPlans(goalId)
        .then((fetchedPlans) => {
          // Enhance plans with calculated data
          const enhancedPlans = fetchedPlans.map((plan, index) => ({
            ...plan,
            plan_name: plan.plan_name || `Plan ${String.fromCharCode(65 + index)}`, // A, B, C
            roi_percentage: calculateROI(plan.pnl_forecast),
            risk_level: assessRiskLevel(plan.risk_assessment),
          }));
          setPlans(enhancedPlans);
        })
        .catch((err) => console.error('Failed to fetch plans', err))
        .finally(() => setLoading(false));
    }
  }, [goalId]);

  const calculateROI = (pnlForecast: Record<string, number | string>): number => {
    const totalRevenue = Object.values(pnlForecast)
      .filter((val): val is number => typeof val === 'number' && val > 0)
      .reduce((sum, val) => sum + val, 0);
    
    const totalInvestment = typeof pnlForecast.total_investment === 'number' ? pnlForecast.total_investment : 0;
    
    if (totalInvestment === 0) return 0;
    return ((totalRevenue - totalInvestment) / totalInvestment) * 100;
  };

  const assessRiskLevel = (riskAssessment: string): 'Low' | 'Medium' | 'High' => {
    const lowRiskWords = ['low', 'minimal', 'stable', 'conservative'];
    const highRiskWords = ['high', 'aggressive', 'volatile', 'uncertain'];
    
    const assessment = riskAssessment.toLowerCase();
    
    if (highRiskWords.some(word => assessment.includes(word))) return 'High';
    if (lowRiskWords.some(word => assessment.includes(word))) return 'Low';
    return 'Medium';
  };

  const getRiskColor = (riskLevel: string) => {
    switch (riskLevel) {
      case 'Low': return 'bg-green-100 text-green-800';
      case 'Medium': return 'bg-yellow-100 text-yellow-800';
      case 'High': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getRiskIcon = (riskLevel: string) => {
    switch (riskLevel) {
      case 'Low': return <Shield className="h-4 w-4" />;
      case 'Medium': return <AlertTriangle className="h-4 w-4" />;
      case 'High': return <AlertTriangle className="h-4 w-4" />;
      default: return <AlertTriangle className="h-4 w-4" />;
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const handleApprove = async (planId: string) => {
    if (!user || user.role !== 'director') {
      alert('Only directors can approve plans');
      return;
    }

    setApproving(planId);
    try {
      await approvePlan(planId);
      alert('Plan approved successfully! Redirecting to goal details...');
      router.push(`/goals/${goalId}`);
    } catch (error) {
      console.error('Failed to approve plan', error);
      alert('Failed to approve plan. Please try again.');
    } finally {
      setApproving(null);
    }
  };

  const getQuarterlyData = (pnlForecast: Record<string, number | string>) => {
    return [
      { quarter: 'Q1', revenue: typeof pnlForecast.q1_revenue === 'number' ? pnlForecast.q1_revenue : 0 },
      { quarter: 'Q2', revenue: typeof pnlForecast.q2_revenue === 'number' ? pnlForecast.q2_revenue : 0 },
      { quarter: 'Q3', revenue: typeof pnlForecast.q3_revenue === 'number' ? pnlForecast.q3_revenue : 0 },
      { quarter: 'Q4', revenue: typeof pnlForecast.q4_revenue === 'number' ? pnlForecast.q4_revenue : 0 },
    ];
  };

  if (loading) {
    return (
      <div className="container mx-auto p-4">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p>Loading strategic plans...</p>
          </div>
        </div>
      </div>
    );
  }

  if (plans.length === 0) {
    return (
      <div className="container mx-auto p-4">
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>No Plans Available</AlertTitle>
          <AlertDescription>
            No strategic plans are available for review at this time. 
            Plans may still be generating or there might be an issue with data processing.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 max-w-7xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Strategic Plan Review</h1>
        <p className="text-gray-600">
          Compare and select the best strategic approach for your goal. 
          {user?.role === 'director' ? ' Click "Approve" to finalize your selection.' : ' Only directors can approve plans.'}
        </p>
      </div>

      <Tabs defaultValue="comparison" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="comparison">Plan Comparison</TabsTrigger>
          <TabsTrigger value="detailed">Detailed View</TabsTrigger>
        </TabsList>

        <TabsContent value="comparison" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {plans.map((plan) => (
              <Card key={plan.id} className={`relative ${selectedPlan === plan.id ? 'ring-2 ring-blue-500' : ''}`}>
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start">
                    <CardTitle className="text-lg">{plan.plan_name}</CardTitle>
                    <Badge className={getRiskColor(plan.risk_level!)}>
                      {getRiskIcon(plan.risk_level!)}
                      <span className="ml-1">{plan.risk_level} Risk</span>
                    </Badge>
                  </div>
                </CardHeader>
                
                <CardContent className="space-y-4">
                  {/* ROI Highlight */}
                  <div className="bg-blue-50 p-3 rounded-lg">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-blue-700">Projected ROI</span>
                      <div className="flex items-center">
                        {plan.roi_percentage! > 0 ? (
                          <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
                        ) : (
                          <TrendingDown className="h-4 w-4 text-red-500 mr-1" />
                        )}
                        <span className={`font-bold ${plan.roi_percentage! > 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {plan.roi_percentage!.toFixed(1)}%
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Key Metrics */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="text-center p-2 bg-gray-50 rounded">
                      <DollarSign className="h-4 w-4 mx-auto mb-1 text-gray-600" />
                      <p className="text-xs text-gray-600">Total Investment</p>
                      <p className="font-semibold text-sm">
                        {formatCurrency(typeof plan.pnl_forecast.total_investment === 'number' ? plan.pnl_forecast.total_investment : 0)}
                      </p>
                    </div>
                    <div className="text-center p-2 bg-gray-50 rounded">
                      <Calendar className="h-4 w-4 mx-auto mb-1 text-gray-600" />
                      <p className="text-xs text-gray-600">Break-even</p>
                      <p className="font-semibold text-sm">
                        Month {typeof plan.pnl_forecast.break_even_month === 'number' ? plan.pnl_forecast.break_even_month : 'N/A'}
                      </p>
                    </div>
                  </div>

                  {/* Quarterly Revenue Chart */}
                  <div>
                    <p className="text-sm font-medium mb-2">Quarterly Revenue Forecast</p>
                    <div className="space-y-2">
                      {getQuarterlyData(plan.pnl_forecast).map((data) => (
                        <div key={data.quarter} className="flex justify-between items-center">
                          <span className="text-xs text-gray-600">{data.quarter}</span>
                          <div className="flex-1 mx-2 bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-blue-500 h-2 rounded-full"
                              style={{ 
                                width: `${Math.max(10, (data.revenue / Math.max(...getQuarterlyData(plan.pnl_forecast).map(d => d.revenue))) * 100)}%` 
                              }}
                            ></div>
                          </div>
                          <span className="text-xs font-medium">
                            {formatCurrency(data.revenue)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Plan Summary */}
                  <div>
                    <p className="text-sm font-medium mb-1">Strategy Summary</p>
                    <p className="text-sm text-gray-600 line-clamp-3">{plan.summary}</p>
                  </div>

                  {/* Action Buttons */}
                  <div className="pt-2 space-y-2">
                    <Button 
                      variant="outline" 
                      className="w-full"
                      onClick={() => setSelectedPlan(selectedPlan === plan.id ? null : plan.id)}
                    >
                      {selectedPlan === plan.id ? 'Hide Details' : 'View Details'}
                    </Button>
                    
                    {user?.role === 'director' && (
                      <Button 
                        className="w-full" 
                        onClick={() => handleApprove(plan.id)}
                        disabled={approving === plan.id}
                      >
                        {approving === plan.id ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                            Approving...
                          </>
                        ) : (
                          <>
                            <CheckCircle className="h-4 w-4 mr-2" />
                            Approve Plan
                          </>
                        )}
                      </Button>
                    )}
                  </div>
                </CardContent>

                {/* Detailed View for Selected Plan */}
                {selectedPlan === plan.id && (
                  <CardContent className="border-t bg-gray-50">
                    <div className="space-y-3">
                      <div>
                        <h4 className="font-semibold text-sm mb-2">Risk Assessment</h4>
                        <p className="text-sm text-gray-700">{plan.risk_assessment}</p>
                      </div>
                      
                      <div>
                        <h4 className="font-semibold text-sm mb-2">Financial Breakdown</h4>
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          {Object.entries(plan.pnl_forecast).map(([key, value]) => (
                            <div key={key} className="flex justify-between">
                              <span className="capitalize">{key.replace(/_/g, ' ')}:</span>
                              <span className="font-medium">
                                {typeof value === 'number' ? formatCurrency(value) : value}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                )}
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="detailed" className="space-y-6">
          {plans.map((plan) => (
            <Card key={plan.id}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-xl">{plan.plan_name}</CardTitle>
                    <p className="text-gray-600 mt-1">Strategic Plan Analysis</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge className={getRiskColor(plan.risk_level!)}>
                      {getRiskIcon(plan.risk_level!)}
                      <span className="ml-1">{plan.risk_level} Risk</span>
                    </Badge>
                    <Badge variant="outline">
                      <TrendingUp className="h-3 w-3 mr-1" />
                      {plan.roi_percentage!.toFixed(1)}% ROI
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-6">
                <div>
                  <h3 className="font-semibold mb-2">Strategy Overview</h3>
                  <p className="text-gray-700">{plan.summary}</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="font-semibold mb-3">Financial Forecast</h3>
                    <div className="space-y-2">
                      {getQuarterlyData(plan.pnl_forecast).map((data) => (
                        <div key={data.quarter} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                          <span>{data.quarter} Revenue</span>
                          <span className="font-medium">{formatCurrency(data.revenue)}</span>
                        </div>
                      ))}
                      <div className="border-t pt-2 mt-3">
                        <div className="flex justify-between items-center p-2 bg-blue-50 rounded">
                          <span className="font-medium">Total Investment</span>
                          <span className="font-bold">{formatCurrency(typeof plan.pnl_forecast.total_investment === 'number' ? plan.pnl_forecast.total_investment : 0)}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="font-semibold mb-3">Risk Analysis</h3>
                    <div className="p-4 bg-gray-50 rounded">
                      <p className="text-sm text-gray-700">{plan.risk_assessment}</p>
                    </div>
                  </div>
                </div>

                {user?.role === 'director' && (
                  <div className="pt-4 border-t">
                    <Button 
                      onClick={() => handleApprove(plan.id)}
                      disabled={approving === plan.id}
                      size="lg"
                    >
                      {approving === plan.id ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          Approving Plan...
                        </>
                      ) : (
                        <>
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Approve This Plan
                        </>
                      )}
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </TabsContent>
      </Tabs>
    </div>
  );
}
