import axiosInstance from '@/lib/axios';

export interface Goal {
  id: string;
  objective_text: string;
  budget: number;
  start_date: string;
  end_date: string;
  status: string;
  owner_id: string;
}

export interface GoalCreate {
  objective_text: string;
  budget: number;
  start_date: string;
  end_date: string;
  owner_id?: string;
}

export interface User {
  id: string;
  email: string;
  role: string;
}

export const getGoals = async (): Promise<Goal[]> => {
  const response = await axiosInstance.get('/api/v1/goals/');
  return response.data;
};

export const getUsers = async (): Promise<User[]> => {
  const response = await axiosInstance.get('/api/v1/users/');
  return response.data;
};

export const getGoal = async (goalId: string): Promise<Goal> => {
  const response = await axiosInstance.get(`/api/v1/goals/${goalId}`);
  return response.data;
};

export const createGoal = async (goalData: GoalCreate): Promise<Goal> => {
  const response = await axiosInstance.post('/api/v1/goals', goalData);
  return response.data;
};

export const updateGoal = async (
  goalId: string,
  goalData: Partial<GoalCreate>
): Promise<Goal> => {
  const response = await axiosInstance.put(
    `/api/v1/goals/${goalId}`,
    goalData
  );
  return response.data;
};

export const deleteGoal = async (goalId: string): Promise<void> => {
  await axiosInstance.delete(`/api/v1/goals/${goalId}`);
};