'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { getPlans, approvePlan, Plan } from '@/api/plans';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function ReviewPlansPage() {
  const { goalId } = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (typeof goalId === 'string') {
      getPlans(goalId)
        .then(setPlans)
        .catch((err) => console.error('Failed to fetch plans', err))
        .finally(() => setLoading(false));
    }
  }, [goalId]);

  const handleApprove = async (planId: string) => {
    try {
      await approvePlan(planId);
      router.push(`/goals/${goalId}`);
    } catch (error) {
      console.error('Failed to approve plan', error);
      // You might want to show an error message to the user
    }
  };

  if (loading) {
    return <div>Loading plans...</div>;
  }

  if (plans.length === 0) {
    return <div>No plans available for review at this time.</div>;
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Review Strategic Plans</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {plans.map((plan) => (
          <Card key={plan.id}>
            <CardHeader>
              <CardTitle>Plan Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="mb-4">{plan.summary}</p>
              <div className="mb-4">
                <h4 className="font-semibold">PnL Forecast</h4>
                <ul>
                  {Object.entries(plan.pnl_forecast).map(([key, value]) => (
                    <li key={key}>
                      {key}: {value}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="mb-4">
                <h4 className="font-semibold">Risk Assessment</h4>
                <p>{plan.risk_assessment}</p>
              </div>
              {user?.role === 'director' && (
                <Button onClick={() => handleApprove(plan.id)}>
                  Approve
                </Button>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}