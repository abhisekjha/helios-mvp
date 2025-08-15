'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { getGoal, Goal } from '@/api/goals';
import { uploadData, getDataUploads, deleteDataUpload } from '@/api/data_uploads';
import { DataUpload } from '@/types/data-upload';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { ToastProvider, toast } from '@/components/toast';

export default function GoalDetailPage() {
  const { goalId } = useParams();
  const router = useRouter();
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

  const getStatusBadge = (status: DataUpload['status']) => {
    const statusConfig = {
      'Pending': {
        variant: 'secondary' as const,
        className: 'bg-muted text-muted-foreground border-border',
        icon: '⏳',
        clickable: false
      },
      'Validating': {
        variant: 'default' as const,
        className: 'bg-primary text-primary-foreground border-primary',
        icon: '🔄',
        clickable: false
      },
      'Failed': {
        variant: 'destructive' as const,
        className: 'bg-destructive text-destructive-foreground border-destructive',
        icon: '❌',
        clickable: false
      },
      'Complete': {
        variant: 'default' as const,
        className: 'bg-primary text-primary-foreground border-primary hover:bg-brand-primary-hover cursor-pointer transition-colors',
        icon: '✅',
        clickable: true
      }
    };

    const config = statusConfig[status] || statusConfig['Pending'];
    
    return {
      ...config,
      text: status
    };
  };

  const handleStatusClick = (upload: DataUpload) => {
    if (upload.status === 'Complete') {
      toast.info(`Navigating to insights for ${upload.file_name}`);
      // Navigate to the data insights page with the specific upload
      router.push(`/data?upload=${upload._id}&tab=details`);
    }
  };

  const navigateToInsights = () => {
    router.push('/data');
  };

  const handleUpload = async () => {
    if (file && typeof goalId === 'string') {
      try {
        await uploadData(goalId, file);
        setFile(null);
        toast.success('File uploaded successfully! Processing will begin shortly.');
        fetchUploads(); // Refresh uploads list immediately
      } catch (error) {
        console.error('Failed to upload file', error);
        toast.error('Failed to upload file. Please try again.');
      }
    }
  };

  const handleDeleteUpload = async (uploadId: string, fileName: string) => {
    if (window.confirm(`Are you sure you want to delete "${fileName}"? This action cannot be undone.`)) {
      try {
        if (typeof goalId === 'string') {
          await deleteDataUpload(goalId, uploadId);
          toast.success(`File "${fileName}" deleted successfully.`);
          fetchUploads(); // Refresh uploads list
        }
      } catch (error) {
        console.error('Failed to delete file', error);
        toast.error('Failed to delete file. Please try again.');
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
    <ToastProvider>
      <div className="container mx-auto p-8 space-y-8">
      <Card className="border-border bg-card">
        <CardHeader>
          <CardTitle className="text-2xl font-semibold flex items-center space-x-3 text-foreground">
            <span className="text-3xl">🎯</span>
            <div>
              <div>{goal.objective_text}</div>
              <div className="text-muted-foreground text-sm font-normal mt-1">
                Goal Management Dashboard
              </div>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 text-foreground">
            <div className="space-y-1">
              <div className="text-xs text-muted-foreground uppercase tracking-wide">Budget</div>
              <div className="text-lg font-semibold">${goal.budget?.toLocaleString()}</div>
            </div>
            <div className="space-y-1">
              <div className="text-xs text-muted-foreground uppercase tracking-wide">Start Date</div>
              <div className="text-lg font-semibold">
                {new Date(goal.start_date).toLocaleDateString()}
              </div>
            </div>
            <div className="space-y-1">
              <div className="text-xs text-muted-foreground uppercase tracking-wide">End Date</div>
              <div className="text-lg font-semibold">
                {new Date(goal.end_date).toLocaleDateString()}
              </div>
            </div>
            <div className="space-y-1">
              <div className="text-xs text-muted-foreground uppercase tracking-wide">Status</div>
              <div className="text-lg font-semibold flex items-center space-x-2">
                <span>{goal.status === 'Draft' ? '📝' : goal.status === 'AWAITING_REVIEW' ? '🔍' : '✅'}</span>
                <span>{goal.status}</span>
              </div>
            </div>
          </div>
          {goal.status === 'AWAITING_REVIEW' && (
            <div className="mt-8">
              <Link href={`/goals/${goalId}/review`} legacyBehavior>
                <Button variant="accent" className="font-semibold">
                  <span className="mr-2">📋</span>
                  Review Plans
                </Button>
              </Link>
            </div>
          )}
        </CardContent>
      </Card>
      {goal.status === 'Processing' && (
        <Card className="border-border bg-muted/30">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 text-foreground">
              <span className="animate-spin text-2xl">⚙️</span>
              <span>Processing Goal</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">The goal is currently being processed. This may take a few minutes...</p>
            <div className="mt-4 flex items-center space-x-2">
              <div className="w-2 h-2 bg-primary rounded-full animate-bounce"></div>
              <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
              <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
            </div>
          </CardContent>
        </Card>
      )}
      {goal.status === 'Failed' && (
        <Card className="border-destructive bg-destructive/5">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 text-destructive">
              <span className="text-2xl">❌</span>
              <span>Goal Processing Failed</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-6">There was an error processing the goal. Please try again.</p>
            <Button variant="destructive">
              <span className="mr-2">🔄</span>
              Retry Processing
            </Button>
          </CardContent>
        </Card>
      )}
      {goal.status !== 'Processing' && goal.status !== 'Failed' && (
        <Card>
          <CardHeader>
            <CardTitle>Data Management</CardTitle>
          </CardHeader>
          <CardContent>
            {(user?.role === 'manager' || user?.role === 'director') && goal.status === 'Draft' && (
              <div className="mb-8">
                <h3 className="text-lg font-semibold mb-4 flex items-center text-foreground">
                  <span className="mr-2">📤</span>
                  Upload Data File
                </h3>
                <div className="bg-muted/50 p-6 rounded-lg border border-border">
                  <div className="flex items-center space-x-4">
                    <Input
                      type="file"
                      onChange={handleFileChange}
                      accept=".csv"
                      className="flex-1"
                    />
                    <Button 
                      onClick={handleUpload} 
                      disabled={!file}
                    >
                      <span className="mr-1">✨</span>
                      Upload
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground mt-3">
                    📝 Supported format: CSV files only. Data will be processed automatically after upload.
                  </p>
                </div>
              </div>
            )}

            <div>
              <h3 className="text-lg font-semibold mb-4 text-foreground">Uploaded Files</h3>
              {uploads.length > 0 && (
                <div className="mb-6 flex items-center justify-between">
                  <div className="flex items-center space-x-6 text-sm text-muted-foreground">
                    <span>📊 Total Files: {uploads.length}</span>
                    <span>✅ Complete: {uploads.filter(u => u.status === 'Complete').length}</span>
                    <span>🧠 With Insights: {uploads.filter(u => u.insights).length}</span>
                  </div>
                  <div className="flex space-x-2">
                    {(user?.role === 'director' || user?.role === 'manager') && uploads.length > 1 && (
                      <Button 
                        onClick={() => {
                          if (window.confirm(`Are you sure you want to delete ALL ${uploads.length} uploaded files? This action cannot be undone.`)) {
                            if (typeof goalId === 'string') {
                              uploads.forEach(upload => {
                                deleteDataUpload(goalId, upload._id).catch(console.error);
                              });
                              toast.success('All files deleted successfully.');
                              setTimeout(() => fetchUploads(), 1000); // Refresh after a delay
                            }
                          }
                        }}
                        variant="outline"
                        size="sm"
                        className="text-destructive border-destructive hover:bg-destructive/10"
                      >
                        <span className="mr-1">🗑️</span>
                        Delete All
                      </Button>
                    )}
                    <Button 
                      onClick={navigateToInsights}
                      variant="outline"
                      size="sm"
                    >
                      <span className="mr-1">📊</span>
                      View All Insights
                    </Button>
                  </div>
                </div>
              )}
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>File Name</TableHead>
                    <TableHead>Upload Time</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Insights</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {uploads
                    .filter((upload) => upload._id)
                    .map((upload, index) => {
                      const statusConfig = getStatusBadge(upload.status);
                      return (
                        <TableRow key={upload._id || index}>
                          <TableCell className="font-medium flex items-center space-x-2">
                            <span className="text-lg">📄</span>
                            <span>{upload.file_name}</span>
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {new Date(upload.upload_timestamp).toLocaleString()}
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant={statusConfig.variant}
                              className={`${statusConfig.className} flex items-center space-x-1 w-fit`}
                              onClick={() => handleStatusClick(upload)}
                              role={statusConfig.clickable ? "button" : undefined}
                              tabIndex={statusConfig.clickable ? 0 : undefined}
                            >
                              <span>{statusConfig.icon}</span>
                              <span>{statusConfig.text}</span>
                              {statusConfig.clickable && <span className="ml-1">→</span>}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {upload.insights ? (
                              <div className="flex items-center space-x-2">
                                <div className="w-2 h-2 bg-primary rounded-full"></div>
                                <span className="text-sm text-foreground font-medium">Available</span>
                              </div>
                            ) : upload.status === 'Complete' ? (
                              <div className="flex items-center space-x-2">
                                <div className="w-2 h-2 bg-accent rounded-full animate-pulse"></div>
                                <span className="text-sm text-muted-foreground">Ready to Generate</span>
                              </div>
                            ) : (
                              <div className="flex items-center space-x-2">
                                <div className="w-2 h-2 bg-muted-foreground rounded-full"></div>
                                <span className="text-sm text-muted-foreground">Not Ready</span>
                              </div>
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="flex space-x-2">
                              {upload.status === 'Complete' && (
                                <Button
                                  onClick={() => handleStatusClick(upload)}
                                  size="sm"
                                  className=""
                                >
                                  <span className="mr-1">🔍</span>
                                  View Details
                                </Button>
                              )}
                              {upload.status === 'Failed' && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="text-destructive border-destructive hover:bg-destructive/10"
                                >
                                  <span className="mr-1">🔄</span>
                                  Retry
                                </Button>
                              )}
                              {/* Delete button - always visible for directors and managers */}
                              {(user?.role === 'director' || user?.role === 'manager') && (
                                <Button
                                  onClick={() => handleDeleteUpload(upload._id, upload.file_name)}
                                  size="sm"
                                  variant="outline"
                                  className="text-destructive border-destructive hover:bg-destructive/10"
                                >
                                  <span className="mr-1">�️</span>
                                  Delete
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                </TableBody>
              </Table>
              
              {uploads.length === 0 && (
                <div className="text-center py-12 text-muted-foreground">
                  <div className="text-4xl mb-3">📁</div>
                  <p className="font-medium text-foreground">No files uploaded yet</p>
                  <p className="text-sm">Upload CSV files to start generating insights</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
    </ToastProvider>
  );
}