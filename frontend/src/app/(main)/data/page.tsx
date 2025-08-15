"use client";

import { useState, useEffect } from "react";
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

export default function DataPage() {
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

  const truncateText = (text: string, maxLength: number = 100) => {
    if (!text) return '';
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
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
      <div className="space-y-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="overview" className="flex items-center space-x-2">
            <span>📊</span>
            <span>Overview</span>
          </TabsTrigger>
          <TabsTrigger value="details" disabled={!selectedUpload} className="flex items-center space-x-2">
            <span>🔍</span>
            <span>Detailed Analysis</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-blue-700 flex items-center">
                  <span className="mr-2">📁</span>
                  Total Uploads
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-blue-800">{dataUploads.length}</div>
              </CardContent>
            </Card>
            
            <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-green-700 flex items-center">
                  <span className="mr-2">✅</span>
                  Complete
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-green-800">
                  {dataUploads.filter(upload => upload.status === 'Complete').length}
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-purple-700 flex items-center">
                  <span className="mr-2">🧠</span>
                  With Insights
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-purple-800">
                  {dataUploads.filter(upload => upload.insights).length}
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-orange-700 flex items-center">
                  <span className="mr-2">⏳</span>
                  Pending
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-orange-800">
                  {dataUploads.filter(upload => upload.status === 'Pending').length}
                </div>
              </CardContent>
            </Card>
          </div>

          <Card className="shadow-lg">
            <CardHeader className="bg-gradient-to-r from-gray-50 to-gray-100">
              <CardTitle className="flex items-center space-x-2">
                <span>📊</span>
                <span>Data Uploads</span>
              </CardTitle>
              <CardDescription>
                View your data uploads and generate insights with enhanced analysis capabilities.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gray-50">
                      <TableHead className="font-semibold">File Name</TableHead>
                      <TableHead className="font-semibold">Upload Date</TableHead>
                      <TableHead className="font-semibold">Status</TableHead>
                      <TableHead className="font-semibold max-w-md">Insights Preview</TableHead>
                      <TableHead className="font-semibold">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {dataUploads.map((upload) => {
                      const isExpanded = expandedInsights[upload._id];
                      const formattedInsights = formatInsights(upload.insights);
                      const isLoading = loadingInsights[upload._id];
                      
                      return (
                        <TableRow key={upload._id} className="hover:bg-gray-50 transition-colors">
                          <TableCell className="font-medium flex items-center space-x-2">
                            <span className="text-lg">📄</span>
                            <span>{upload.file_name}</span>
                          </TableCell>
                          <TableCell className="text-gray-600">
                            {new Date(upload.upload_timestamp).toLocaleDateString()}
                          </TableCell>
                          <TableCell>{getStatusBadge(upload.status)}</TableCell>
                          <TableCell className="max-w-md">
                            {upload.insights ? (
                              <div className="space-y-3">
                                <div className="flex items-center space-x-2">
                                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                                  <span className="text-sm font-medium text-green-700">Insights Available</span>
                                </div>
                                <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-3 rounded-lg border border-blue-200">
                                  <div className="text-sm text-gray-800 leading-relaxed">
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
                                      className="mt-2 text-xs text-blue-600 hover:text-blue-800 hover:bg-blue-100"
                                    >
                                      {isExpanded ? '👆 Show Less' : '👇 Show More Details'}
                                    </Button>
                                  )}
                                </div>
                              </div>
                            ) : upload.status === 'Complete' ? (
                              <div className="flex items-center space-x-2 p-3 bg-orange-50 rounded-lg border border-orange-200">
                                <div className="w-2 h-2 bg-orange-400 rounded-full animate-bounce"></div>
                                <span className="text-sm font-medium text-orange-700">Ready for Analysis</span>
                              </div>
                            ) : (
                              <div className="flex items-center space-x-2 p-3 bg-gray-50 rounded-lg border border-gray-200">
                                <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse"></div>
                                <span className="text-sm font-medium text-gray-600">Processing Upload...</span>
                              </div>
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-col space-y-2">
                              <Button 
                                onClick={() => handleGenerateInsight(upload._id)}
                                disabled={isLoading || upload.status === 'Pending'}
                                variant={upload.insights ? "outline" : "default"}
                                size="sm"
                                className={`w-full transition-all duration-200 ${
                                  upload.insights 
                                    ? 'bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white border-0' 
                                    : 'bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white shadow-lg hover:shadow-xl transform hover:scale-105'
                                }`}
                              >
                                {isLoading ? (
                                  <>
                                    <div className="animate-spin mr-2 w-4 h-4 border-2 border-white border-t-transparent rounded-full"></div>
                                    Generating...
                                  </>
                                ) : upload.insights ? (
                                  <>
                                    <span className="mr-1">🔄</span>
                                    Regenerate
                                  </>
                                ) : (
                                  <>
                                    <span className="mr-1">✨</span>
                                    Generate Insight
                                  </>
                                )}
                              </Button>
                              {upload.insights && (
                                <>
                                  <Button
                                    onClick={() => viewUploadDetails(upload)}
                                    variant="outline"
                                    size="sm"
                                    className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white border-0 shadow-md hover:shadow-lg transform hover:scale-105 transition-all duration-200"
                                  >
                                    <span className="mr-1">🔍</span>
                                    View Details
                                  </Button>
                                  <Button
                                    onClick={() => copyUploadLink(upload)}
                                    variant="outline"
                                    size="sm"
                                    className="w-full bg-gradient-to-r from-orange-400 to-red-400 hover:from-orange-500 hover:to-red-500 text-white border-0 shadow-md hover:shadow-lg transform hover:scale-105 transition-all duration-200"
                                  >
                                    <span className="mr-1">🔗</span>
                                    Copy Link
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

        <TabsContent value="details" className="space-y-6">
          {selectedUpload ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <h2 className="text-2xl font-bold text-gray-800 flex items-center space-x-2">
                    <span>🔍</span>
                    <span>Detailed Analysis</span>
                  </h2>
                  <p className="text-gray-600">Deep dive into insights for {selectedUpload.file_name}</p>
                </div>
                <Button 
                  onClick={() => setActiveTab("overview")}
                  variant="outline"
                  size="sm"
                  className="flex items-center space-x-1"
                >
                  <span>←</span>
                  <span>Back to Overview</span>
                </Button>
              </div>
              <InsightsViewer
                insights={selectedUpload.insights}
                fileName={selectedUpload.file_name}
                uploadDate={selectedUpload.upload_timestamp}
                status={selectedUpload.status}
              />
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">🔍</div>
              <h3 className="text-xl font-semibold text-gray-700 mb-2">No File Selected</h3>
              <p className="text-gray-500">Select a file from the overview to view detailed insights</p>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
    </ToastProvider>
  );
}