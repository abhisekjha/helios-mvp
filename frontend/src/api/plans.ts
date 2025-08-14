import { z } from 'zod';
import axiosInstance from '@/lib/axios';

const planSchema = z.object({
  id: z.string(),
  goal_id: z.string(),
  plan_name: z.string().optional(),
  summary: z.string(),
  pnl_forecast: z.record(z.string(), z.number()),
  risk_assessment: z.string(),
  status: z.string(),
  created_at: z.string().optional(),
  linked_insight_ids: z.array(z.string()).optional(),
});

export type Plan = z.infer<typeof planSchema>;

export async function getPlans(goalId: string): Promise<Plan[]> {
  const response = await axiosInstance.get(
    `/api/v1/goals/${goalId}/plans`
  );

  const data = response.data;
  return z.array(planSchema).parse(data);
}

export async function approvePlan(planId: string): Promise<void> {
  await axiosInstance.post(
    `/api/v1/plans/${planId}/approve`,
    {}
  );
}