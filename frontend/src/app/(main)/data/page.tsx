"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getDataUploads, generateInsight } from "@/api/data_uploads";
import { DataUpload } from "@/types/data-upload";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { InsightsViewer } from "@/components/insights-viewer";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ToastProvider, toast } from "@/components/toast";

function DataPageContent() {
  const [dataUploads, setDataUploads] = useState<DataUpload[]>([]);
  const [loadingInsights, setLoadingInsights] = useState<Record<string, boolean>>({});
  const [expandedInsights, setExpandedInsights] = useState<Record<string, boolean>>({});
  const [selectedUpload, setSelectedUpload] = useState<DataUpload | null>(null);
  const [activeTab, setActiveTab] = useState<string>("overview");
  
  const searchParams = useSearchParams();
  const router = useRouter();

  // Hardcoded goalId for now
  const goalId = "689e3075de8f4e6113963169";

  const fetchUploads = async () => {
    try {
      const uploads = await getDataUploads(goalId);
      setDataUploads(uploads);
    } catch (error) {
      console.error("Failed to fetch data uploads", error);
    }
  };

  useEffect(() => {
    fetchUploads();
    
    // Check for URL parameters to direct link to specific upload
    const uploadId = searchParams.get('upload');
    const tab = searchParams.get('tab');
    
    if (uploadId && tab === 'details') {
      setActiveTab('details');
      // Wait for uploads to load, then select the specific upload
      setTimeout(() => {
        const upload = dataUploads.find(u => u._id === uploadId);
        if (upload) {
          setSelectedUpload(upload);
        }
      }, 100);
    }
    
    // Set up auto-refresh to check for completed insights
    const interval = setInterval(() => {
      fetchUploads();
    }, 5000); // Refresh every 5 seconds
    
    return () => clearInterval(interval);
  }, [goalId, searchParams, dataUploads]);

  const handleGenerateInsight = async (dataUploadId: string) => {
    setLoadingInsights(prev => ({ ...prev, [dataUploadId]: true }));
    try {
      await generateInsight(dataUploadId);
      toast.success('Insight generation started! Results will appear shortly.');
      fetchUploads(); // Refresh the table
    } catch (error) {
      console.error("Failed to generate insight", error);
      toast.error('Failed to generate insight. Please try again.');
    } finally {
      setLoadingInsights(prev => ({ ...prev, [dataUploadId]: false }));
    }
  };

  const getStatusBadge = (status: DataUpload['status']) => {
    const variants = {
      'Pending': 'secondary',
      'Validating': 'secondary', 
      'Failed': 'destructive',
      'Complete': 'default'
    } as const;

    return (
      <Badge variant={variants[status] || 'secondary'}>
        {status}
      </Badge>
    );
  };

  const toggleInsightsExpansion = (uploadId: string) => {
    setExpandedInsights(prev => ({
      ...prev,
      [uploadId]: !prev[uploadId]
    }));
  };

  const formatInsights = (insights: string | null | undefined) => {
    if (!insights) return 'No insights generated yet';
    
    // Split insights by line breaks or periods to make them more readable
    const sentences = insights.split(/\.\s+/).filter(sentence => sentence.trim());
    return sentences.map(sentence => sentence.trim() + '.').join(' ');
  };

  const getInsightPreview = (insights: string | null | undefined, maxLength: number = 150) => {
    if (!insights) return '';
    const formatted = formatInsights(insights);
    if (formatted.length <= maxLength) return formatted;
    return formatted.substring(0, maxLength) + '...';
  };

  const viewUploadDetails = (upload: DataUpload) => {
    setSelectedUpload(upload);
    setActiveTab("details");
    
    // Update URL to allow direct linking
    const params = new URLSearchParams();
    params.set('upload', upload._id);
    params.set('tab', 'details');
    router.push(`/data?${params.toString()}`);
  };

  const copyUploadLink = (upload: DataUpload) => {
    const params = new URLSearchParams();
    params.set('upload', upload._id);
    params.set('tab', 'details');
    const url = `${window.location.origin}/data?${params.toString()}`;
    
    navigator.clipboard.writeText(url).then(() => {
      toast.success('Link copied to clipboard! Share this link to show specific insights.');
    }).catch(() => {
      toast.error('Failed to copy link to clipboard.');
    });
  };

  return (
    <ToastProvider>
      {/* Premium Enterprise Header Section */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-ink mb-2">Trade Promotion Data</h1>
            <p className="text-ink-soft">Manage and analyze your promotional data with AI-powered insights</p>
          </div>
          <div className="flex items-center space-x-3">
            <Badge variant="secondary" className="px-3 py-1 text-sm">
              Goal: {goalId.slice(-6)}
            </Badge>
          </div>
        </div>
      </div>

      <div className="space-y-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        {/* Clean Professional Tab Navigation */}
        <TabsList className="grid w-full grid-cols-2 bg-bg-subtle border border-border rounded-lg p-1 h-12">
          <TabsTrigger 
            value="overview" 
            className="flex items-center space-x-2 h-10 rounded-md transition-all duration-200 data-[state=active]:bg-bg data-[state=active]:shadow-sm"
          >
            <span className="text-lg">📊</span>
            <span className="font-medium">Data Overview</span>
          </TabsTrigger>
          <TabsTrigger 
            value="details" 
            disabled={!selectedUpload} 
            className="flex items-center space-x-2 h-10 rounded-md transition-all duration-200 data-[state=active]:bg-bg data-[state=active]:shadow-sm disabled:opacity-50"
          >
            <span className="text-lg">🔍</span>
            <span className="font-medium">Detailed Analysis</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-8">
          {/* Enterprise Summary Cards with Improved Hierarchy */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Card className="bg-bg-subtle border-border shadow-sm hover:shadow-md transition-shadow duration-200">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-ink-soft flex items-center">
                  <div className="w-8 h-8 rounded-lg bg-brand-primary/10 flex items-center justify-center mr-3">
                    <span className="text-brand-primary">📁</span>
                  </div>
                  Total Uploads
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-semibold text-ink">{dataUploads.length}</div>
                <p className="text-xs text-ink-soft mt-1">Data files uploaded</p>
              </CardContent>
            </Card>
            
            <Card className="bg-bg-subtle border-border shadow-sm hover:shadow-md transition-shadow duration-200">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-ink-soft flex items-center">
                  <div className="w-8 h-8 rounded-lg bg-green-50 flex items-center justify-center mr-3">
                    <span className="text-green-600">✅</span>
                  </div>
                  Complete
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-semibold text-ink">
                  {dataUploads.filter(upload => upload.status === 'Complete').length}
                </div>
                <p className="text-xs text-ink-soft mt-1">Successfully processed</p>
              </CardContent>
            </Card>
            
            <Card className="bg-bg-subtle border-border shadow-sm hover:shadow-md transition-shadow duration-200">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-ink-soft flex items-center">
                  <div className="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center mr-3">
                    <span className="text-accent">🧠</span>
                  </div>
                  AI Insights
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-semibold text-ink">
                  {dataUploads.filter(upload => upload.insights).length}
                </div>
                <p className="text-xs text-ink-soft mt-1">Files with AI analysis</p>
              </CardContent>
            </Card>
            
            <Card className="bg-bg-subtle border-border shadow-sm hover:shadow-md transition-shadow duration-200">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-ink-soft flex items-center">
                  <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center mr-3">
                    <span className="text-amber-600">⏳</span>
                  </div>
                  Pending
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-semibold text-ink">
                  {dataUploads.filter(upload => upload.status === 'Pending').length}
                </div>
                <p className="text-xs text-ink-soft mt-1">Awaiting processing</p>
              </CardContent>
            </Card>
          </div>

          {/* Premium Enterprise Data Table */}
          <Card className="bg-bg border-border shadow-sm">
            <CardHeader className="bg-bg-subtle/50 border-b border-border">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-lg bg-brand-primary/10 flex items-center justify-center">
                    <span className="text-brand-primary text-lg">📊</span>
                  </div>
                  <div>
                    <CardTitle className="text-ink text-lg font-semibold">Data Uploads</CardTitle>
                    <CardDescription className="text-ink-soft">
                      Manage and analyze your promotional data files with AI-powered insights
                    </CardDescription>
                  </div>
                </div>
                {dataUploads.length > 0 && (
                  <Badge variant="secondary" className="text-xs">
                    {dataUploads.length} files
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-bg-subtle border-b border-border">
                      <TableHead className="font-semibold text-ink h-12 px-6">File Name</TableHead>
                      <TableHead className="font-semibold text-ink h-12 px-4">Upload Date</TableHead>
                      <TableHead className="font-semibold text-ink h-12 px-4">Status</TableHead>
                      <TableHead className="font-semibold text-ink h-12 px-4 max-w-md">AI Insights</TableHead>
                      <TableHead className="font-semibold text-ink h-12 px-6">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {dataUploads.map((upload, index) => {
                      const isExpanded = expandedInsights[upload._id];
                      const isLoading = loadingInsights[upload._id];
                      
                      return (
                        <TableRow 
                          key={upload._id} 
                          className={`
                            transition-colors duration-200 hover:bg-bg-subtle/50 border-b border-border/50
                            ${index % 2 === 0 ? 'bg-bg' : 'bg-bg-subtle/30'}
                          `}
                        >
                          <TableCell className="font-medium px-6 py-4">
                            <div className="flex items-center space-x-3">
                              <div className="w-8 h-8 rounded bg-brand-primary/10 flex items-center justify-center">
                                <span className="text-brand-primary text-sm">📄</span>
                              </div>
                              <span className="text-ink font-medium">{upload.file_name}</span>
                            </div>
                          </TableCell>
                          <TableCell className="text-ink-soft px-4 py-4">
                            {new Date(upload.upload_timestamp).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric'
                            })}
                          </TableCell>
                          <TableCell className="px-4 py-4">{getStatusBadge(upload.status)}</TableCell>
                          <TableCell className="max-w-md px-4 py-4">
                            {upload.insights ? (
                              <div className="space-y-3">
                                <div className="flex items-center space-x-2">
                                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                  <span className="text-sm font-medium text-green-700">AI Analysis Complete</span>
                                </div>
                                <div className="bg-bg-subtle border border-border rounded-lg p-4">
                                  <div className="text-sm text-ink leading-relaxed">
                                    {isExpanded ? (
                                      <div className="space-y-2">
                                        {formatInsights(upload.insights).split('.').filter(s => s.trim()).map((sentence, idx) => (
                                          <div key={idx} className="flex items-start space-x-2">
                                            <span className="text-blue-500 mt-1">•</span>
                                            <span>{sentence.trim()}.</span>
                                          </div>
                                        ))}
                                      </div>
                                    ) : (
                                      getInsightPreview(upload.insights)
                                    )}
                                  </div>
                                  {formatInsights(upload.insights).length > 150 && (
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => toggleInsightsExpansion(upload._id)}
                                      className="mt-2 text-xs text-brand-primary hover:text-brand-primary-hover hover:bg-brand-primary/5"
                                    >
                                      {isExpanded ? '↑ Show Less' : '↓ Show More'}
                                    </Button>
                                  )}
                                </div>
                              </div>
                            ) : upload.status === 'Complete' ? (
                              <div className="flex items-center space-x-2 p-3 bg-accent/5 rounded-lg border border-accent/20">
                                <div className="w-2 h-2 bg-accent rounded-full"></div>
                                <span className="text-sm font-medium text-accent">Ready for AI Analysis</span>
                              </div>
                            ) : (
                              <div className="flex items-center space-x-2 p-3 bg-bg-subtle rounded-lg border border-border">
                                <div className="w-2 h-2 bg-ink-soft rounded-full animate-pulse"></div>
                                <span className="text-sm font-medium text-ink-soft">Processing...</span>
                              </div>
                            )}
                          </TableCell>
                          <TableCell className="px-6 py-4">
                            <div className="flex flex-col space-y-2 w-full max-w-[140px]">
                              <Button 
                                onClick={() => handleGenerateInsight(upload._id)}
                                disabled={isLoading || upload.status === 'Pending'}
                                variant={upload.insights ? "outline" : "accent"}
                                size="sm"
                                className={`
                                  w-full transition-all duration-200 min-h-[40px]
                                  ${upload.insights 
                                    ? 'text-brand-primary border-brand-primary hover:bg-brand-primary/5' 
                                    : 'bg-accent text-white hover:bg-accent-hover shadow-sm'
                                  }
                                `}
                              >
                                {isLoading ? (
                                  <>
                                    <div className="animate-spin mr-2 w-4 h-4 border-2 border-white border-t-transparent rounded-full"></div>
                                    Analyzing...
                                  </>
                                ) : upload.insights ? (
                                  <>
                                    <span className="mr-1">🔄</span>
                                    Regenerate AI Analysis
                                  </>
                                ) : (
                                  <>
                                    <span className="mr-1">✨</span>
                                    Run AI Analysis
                                  </>
                                )}
                              </Button>
                              {upload.insights && (
                                <>
                                  <Button
                                    onClick={() => viewUploadDetails(upload)}
                                    variant="outline"
                                    size="sm"
                                    className="w-full text-brand-primary border-brand-primary hover:bg-brand-primary/5 transition-all duration-200 min-h-[40px]"
                                  >
                                    <span className="mr-1">🔍</span>
                                    View Details
                                  </Button>
                                  <Button
                                    onClick={() => copyUploadLink(upload)}
                                    variant="secondary"
                                    size="sm"
                                    className="w-full bg-bg-subtle text-ink hover:bg-border transition-all duration-200 min-h-[40px]"
                                  >
                                    <span className="mr-1">🔗</span>
                                    Share Link
                                  </Button>
                                </>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
              
              {dataUploads.length === 0 && (
                <div className="p-8">
                  <Alert className="border-blue-200 bg-blue-50">
                    <AlertDescription className="text-center">
                      <div className="text-4xl mb-2">📊</div>
                      <p className="font-medium text-blue-800">No data uploads found</p>
                      <p className="text-blue-600">Upload some data files to generate insights and start your analysis journey.</p>
                    </AlertDescription>
                  </Alert>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="details" className="space-y-8">
          {selectedUpload ? (
            <div className="space-y-6">
              <Card className="bg-bg border-border shadow-sm">
                <CardHeader className="bg-bg-subtle/50 border-b border-border">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 rounded-lg bg-brand-primary/10 flex items-center justify-center">
                        <span className="text-brand-primary text-xl">🔍</span>
                      </div>
                      <div className="space-y-1">
                        <h2 className="text-xl font-semibold text-ink">Detailed AI Analysis</h2>
                        <p className="text-ink-soft">Deep insights for {selectedUpload.file_name}</p>
                      </div>
                    </div>
                    <Button 
                      onClick={() => setActiveTab("overview")}
                      variant="outline"
                      size="sm"
                      className="flex items-center space-x-2 text-brand-primary border-brand-primary hover:bg-brand-primary/5"
                    >
                      <span>←</span>
                      <span>Back to Overview</span>
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="p-6">
                  <InsightsViewer
                    insights={selectedUpload.insights}
                    fileName={selectedUpload.file_name}
                    uploadDate={selectedUpload.upload_timestamp}
                    status={selectedUpload.status}
                  />
                </CardContent>
              </Card>
            </div>
          ) : (
            <Card className="bg-bg border-border shadow-sm">
              <CardContent className="text-center py-16">
                <div className="w-16 h-16 rounded-full bg-bg-subtle flex items-center justify-center mx-auto mb-4">
                  <span className="text-3xl text-ink-soft">🔍</span>
                </div>
                <h3 className="text-lg font-semibold text-ink mb-2">No File Selected</h3>
                <p className="text-ink-soft">Select a file from the overview tab to view detailed AI insights</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
    </ToastProvider>
  );
}

// Premium Loading Component for Suspense Boundary
function DataPageLoading() {
  return (
    <div className="space-y-8">
      {/* Header Skeleton */}
      <div className="mb-8">
        <div className="h-8 bg-bg-subtle rounded-lg animate-pulse mb-2"></div>
        <div className="h-4 bg-bg-subtle rounded-lg animate-pulse w-2/3"></div>
      </div>
      
      {/* Cards Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="bg-bg-subtle border-border animate-pulse">
            <CardHeader className="pb-3">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 rounded-lg bg-border"></div>
                <div className="h-4 bg-border rounded w-20"></div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="h-8 bg-border rounded mb-2"></div>
              <div className="h-3 bg-border rounded w-24"></div>
            </CardContent>
          </Card>
        ))}
      </div>
      
      {/* Table Skeleton */}
      <Card className="bg-bg border-border">
        <CardHeader className="bg-bg-subtle/50 border-b border-border">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-lg bg-border"></div>
            <div className="space-y-2">
              <div className="h-5 bg-border rounded w-32"></div>
              <div className="h-3 bg-border rounded w-48"></div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 bg-bg-subtle rounded-lg animate-pulse"></div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Main component with Suspense boundary
export default function DataPage() {
  return (
    <Suspense fallback={<DataPageLoading />}>
      <DataPageContent />
    </Suspense>
  );
}