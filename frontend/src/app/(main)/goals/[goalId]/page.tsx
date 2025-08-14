'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { getGoal, Goal } from '@/api/goals';
import { uploadData, getDataUploads } from '@/api/data_uploads';
import { DataUpload } from '@/types/data-upload';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

export default function GoalDetailPage() {
  const { goalId } = useParams();
  const { user } = useAuth();
  const [goal, setGoal] = useState<Goal | null>(null);
  const [uploads, setUploads] = useState<DataUpload[]>([]);
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchGoal = useCallback(async () => {
    if (typeof goalId === 'string') {
      try {
        const goalData = await getGoal(goalId);
        setGoal(goalData);
      } catch (error) {
        console.error('Failed to fetch goal', error);
      }
    }
  }, [goalId]);

  const fetchUploads = useCallback(async () => {
    if (typeof goalId === 'string') {
      try {
        const uploadsData = await getDataUploads(goalId);
        setUploads(uploadsData);
      } catch (error) {
        console.error('Failed to fetch uploads', error);
      }
    }
  }, [goalId]);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        await Promise.all([fetchGoal(), fetchUploads()]);
      } catch (error) {
        console.error('Failed to fetch initial data', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();

    const interval = setInterval(() => {
      fetchUploads();
      fetchGoal();
    }, 3000);

    return () => clearInterval(interval);
  }, [goalId, fetchGoal, fetchUploads]);
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files.length > 0) {
      setFile(event.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (file && typeof goalId === 'string') {
      try {
        await uploadData(goalId, file);
        setFile(null);
        fetchUploads(); // Refresh uploads list immediately
      } catch (error) {
        console.error('Failed to upload file', error);
      }
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!goal) {
    return <div>Goal not found</div>;
  }

  return (
    <div className="container mx-auto p-4">
      <Card className="mb-4">
        <CardHeader>
          <CardTitle>{goal.objective_text}</CardTitle>
        </CardHeader>
        <CardContent>
          <p>
            <strong>Budget:</strong> {goal.budget}
          </p>
          <p>
            <strong>Start Date:</strong>{' '}
            {new Date(goal.start_date).toLocaleDateString()}
          </p>
          <p>
            <strong>End Date:</strong>{' '}
            {new Date(goal.end_date).toLocaleDateString()}
          </p>
          <p>
            <strong>Status:</strong> {goal.status}
          </p>
          {goal.status === 'AWAITING_REVIEW' && (
            <div className="mt-4">
              <Link href={`/goals/${goalId}/review`} legacyBehavior>
                <Button>Review Plans</Button>
              </Link>
            </div>
          )}
        </CardContent>
      </Card>
      {goal.status === 'Processing' && (
        <Card className="mb-4">
          <CardHeader>
            <CardTitle>Processing Goal</CardTitle>
          </CardHeader>
          <CardContent>
            <p>The goal is currently being processed. This may take a few minutes...</p>
          </CardContent>
        </Card>
      )}
      {goal.status === 'Failed' && (
        <Card className="mb-4">
          <CardHeader>
            <CardTitle>Goal Processing Failed</CardTitle>
          </CardHeader>
          <CardContent>
            <p>There was an error processing the goal. Please try again.</p>
          </CardContent>
        </Card>
      )}
      {goal.status !== 'Processing' && goal.status !== 'Failed' && (
        <Card>
          <CardHeader>
            <CardTitle>Data Management</CardTitle>
          </CardHeader>
          <CardContent>
            {user?.role === 'manager' && goal.status === 'Draft' && (
              <div className="mb-4">
                <h3 className="text-lg font-semibold mb-2">
                  Upload Data File
                </h3>
                <div className="flex items-center space-x-2">
                  <Input
                    type="file"
                    onChange={handleFileChange}
                    accept=".csv"
                  />
                  <Button onClick={handleUpload} disabled={!file}>
                    Upload
                  </Button>
                </div>
              </div>
            )}

            <div>
              <h3 className="text-lg font-semibold mb-2">Uploaded Files</h3>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>File Name</TableHead>
                    <TableHead>Upload Time</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {uploads
                    .filter((upload) => upload._id)
                    .map((upload, index) => (
                      <TableRow key={upload._id || index}>
                        <TableCell>{upload.file_name}</TableCell>
                        <TableCell>
                          {new Date(upload.upload_timestamp).toLocaleString()}
                        </TableCell>
                        <TableCell>{upload.status}</TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}