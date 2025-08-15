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
        className: 'bg-yellow-100 text-yellow-800 border-yellow-300',
        icon: '⏳',
        clickable: false
      },
      'Validating': {
        variant: 'secondary' as const,
        className: 'bg-blue-100 text-blue-800 border-blue-300',
        icon: '🔄',
        clickable: false
      },
      'Failed': {
        variant: 'destructive' as const,
        className: 'bg-red-100 text-red-800 border-red-300 hover:bg-red-200',
        icon: '❌',
        clickable: false
      },
      'Complete': {
        variant: 'default' as const,
        className: 'bg-gradient-to-r from-green-400 to-emerald-500 text-white border-0 hover:from-green-500 hover:to-emerald-600 cursor-pointer transform hover:scale-105 transition-all duration-200 shadow-lg hover:shadow-xl',
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
      <div className="container mx-auto p-4 space-y-6">
      <Card className="shadow-lg border-0 bg-gradient-to-r from-indigo-500 to-purple-600 text-white">
        <CardHeader>
          <CardTitle className="text-2xl flex items-center space-x-3">
            <span className="text-3xl">🎯</span>
            <div>
              <div>{goal.objective_text}</div>
              <div className="text-indigo-100 text-sm font-normal mt-1">
                Goal Management Dashboard
              </div>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-indigo-100">
            <div>
              <div className="text-xs opacity-75">Budget</div>
              <div className="text-lg font-semibold">${goal.budget?.toLocaleString()}</div>
            </div>
            <div>
              <div className="text-xs opacity-75">Start Date</div>
              <div className="text-lg font-semibold">
                {new Date(goal.start_date).toLocaleDateString()}
              </div>
            </div>
            <div>
              <div className="text-xs opacity-75">End Date</div>
              <div className="text-lg font-semibold">
                {new Date(goal.end_date).toLocaleDateString()}
              </div>
            </div>
            <div>
              <div className="text-xs opacity-75">Status</div>
              <div className="text-lg font-semibold flex items-center space-x-2">
                <span>{goal.status === 'Draft' ? '📝' : goal.status === 'AWAITING_REVIEW' ? '🔍' : '✅'}</span>
                <span>{goal.status}</span>
              </div>
            </div>
          </div>
          {goal.status === 'AWAITING_REVIEW' && (
            <div className="mt-6">
              <Link href={`/goals/${goalId}/review`} legacyBehavior>
                <Button className="bg-white text-indigo-600 hover:bg-gray-100 font-semibold">
                  <span className="mr-2">📋</span>
                  Review Plans
                </Button>
              </Link>
            </div>
          )}
        </CardContent>
      </Card>
      {goal.status === 'Processing' && (
        <Card className="border-blue-200 bg-gradient-to-r from-blue-50 to-cyan-50">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 text-blue-800">
              <span className="animate-spin text-2xl">⚙️</span>
              <span>Processing Goal</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-blue-700">The goal is currently being processed. This may take a few minutes...</p>
            <div className="mt-3 flex items-center space-x-2">
              <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce"></div>
              <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
              <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
            </div>
          </CardContent>
        </Card>
      )}
      {goal.status === 'Failed' && (
        <Card className="border-red-200 bg-gradient-to-r from-red-50 to-pink-50">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 text-red-800">
              <span className="text-2xl">❌</span>
              <span>Goal Processing Failed</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-red-700 mb-4">There was an error processing the goal. Please try again.</p>
            <Button className="bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 text-white">
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
              <div className="mb-6">
                <h3 className="text-lg font-semibold mb-4 flex items-center">
                  <span className="mr-2">📤</span>
                  Upload Data File
                </h3>
                <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-4 rounded-lg border border-blue-200">
                  <div className="flex items-center space-x-3">
                    <Input
                      type="file"
                      onChange={handleFileChange}
                      accept=".csv"
                      className="flex-1"
                    />
                    <Button 
                      onClick={handleUpload} 
                      disabled={!file}
                      className="bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
                    >
                      <span className="mr-1">✨</span>
                      Upload
                    </Button>
                  </div>
                  <p className="text-xs text-gray-600 mt-2">
                    📝 Supported format: CSV files only. Data will be processed automatically after upload.
                  </p>
                </div>
              </div>
            )}

            <div>
              <h3 className="text-lg font-semibold mb-2">Uploaded Files</h3>
              {uploads.length > 0 && (
                <div className="mb-4 flex items-center justify-between">
                  <div className="flex items-center space-x-4 text-sm text-gray-600">
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
                        className="text-red-600 border-red-300 hover:bg-red-50 hover:border-red-400"
                      >
                        <span className="mr-1">🗑️</span>
                        Delete All
                      </Button>
                    )}
                    <Button 
                      onClick={navigateToInsights}
                      variant="outline"
                      size="sm"
                      className="bg-gradient-to-r from-blue-500 to-purple-500 text-white border-0 hover:from-blue-600 hover:to-purple-600"
                    >
                      <span className="mr-1">📊</span>
                      View All Insights
                    </Button>
                  </div>
                </div>
              )}
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50">
                    <TableHead className="font-semibold">File Name</TableHead>
                    <TableHead className="font-semibold">Upload Time</TableHead>
                    <TableHead className="font-semibold">Status</TableHead>
                    <TableHead className="font-semibold">Insights</TableHead>
                    <TableHead className="font-semibold">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {uploads
                    .filter((upload) => upload._id)
                    .map((upload, index) => {
                      const statusConfig = getStatusBadge(upload.status);
                      return (
                        <TableRow key={upload._id || index} className="hover:bg-gray-50">
                          <TableCell className="font-medium flex items-center space-x-2">
                            <span className="text-lg">📄</span>
                            <span>{upload.file_name}</span>
                          </TableCell>
                          <TableCell className="text-gray-600">
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
                                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                                <span className="text-sm text-green-700 font-medium">Available</span>
                              </div>
                            ) : upload.status === 'Complete' ? (
                              <div className="flex items-center space-x-2">
                                <div className="w-2 h-2 bg-orange-400 rounded-full animate-bounce"></div>
                                <span className="text-sm text-orange-700">Ready to Generate</span>
                              </div>
                            ) : (
                              <div className="flex items-center space-x-2">
                                <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                                <span className="text-sm text-gray-500">Not Ready</span>
                              </div>
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="flex space-x-2">
                              {upload.status === 'Complete' && (
                                <Button
                                  onClick={() => handleStatusClick(upload)}
                                  size="sm"
                                  className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white border-0 shadow-md hover:shadow-lg transform hover:scale-105 transition-all duration-200"
                                >
                                  <span className="mr-1">🔍</span>
                                  View Details
                                </Button>
                              )}
                              {upload.status === 'Failed' && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="text-red-600 border-red-300 hover:bg-red-50"
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
                                  className="text-red-600 border-red-300 hover:bg-red-50 hover:border-red-400"
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
                <div className="text-center py-8 text-gray-500">
                  <div className="text-4xl mb-2">📁</div>
                  <p className="font-medium">No files uploaded yet</p>
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