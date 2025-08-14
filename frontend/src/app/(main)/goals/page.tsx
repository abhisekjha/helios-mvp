'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { getGoals, deleteGoal, Goal } from '@/api/goals';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

export default function GoalsPage() {
  const [goals, setGoals] = useState<Goal[]>([]);
  const { user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    const fetchGoals = async () => {
      if (user) {
        try {
          const fetchedGoals = await getGoals();
          setGoals(fetchedGoals);
        } catch (error) {
          console.error('Failed to fetch goals:', error);
          // Handle error (e.g., show a toast notification)
        }
      }
    };

    fetchGoals();
  }, [user]);

  const handleDelete = async (goalId: string) => {
    if (window.confirm('Are you sure you want to delete this goal?')) {
      try {
        await deleteGoal(goalId);
        setGoals(goals.filter((goal) => goal.id !== goalId));
      } catch (error) {
        console.error('Failed to delete goal:', error);
        // Handle error
      }
    }
  };

  const isDirectorOrManager = user?.role === 'director' || user?.role === 'manager';

  return (
    <div className="container mx-auto py-10">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Goals</CardTitle>
          {isDirectorOrManager && (
            <Button onClick={() => router.push('/goals/new')}>New Goal</Button>
          )}
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Objective</TableHead>
                <TableHead>Budget</TableHead>
                <TableHead>End Date</TableHead>
                {isDirectorOrManager && <TableHead>Actions</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {goals.map((goal) => (
                <TableRow
                  key={goal.id}
                  onClick={() => router.push(`/goals/${goal.id}`)}
                  className="cursor-pointer"
                >
                  <TableCell>{goal.objective_text}</TableCell>
                  <TableCell>{goal.budget}</TableCell>
                  <TableCell>
                    {new Date(goal.end_date).toLocaleDateString()}
                  </TableCell>
                  {isDirectorOrManager && (
                    <TableCell>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          router.push(`/goals/${goal.id}/edit`);
                        }}
                        className="mr-2"
                      >
                        Edit
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(goal.id);
                        }}
                      >
                        Delete
                      </Button>
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}