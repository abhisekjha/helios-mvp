"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Shield, 
  CheckCircle, 
  AlertTriangle, 
  Clock, 
  Eye,
  FileCheck,
  TrendingUp,
  Filter,
  Search
} from "lucide-react";
import { Input } from "@/components/ui/input";

interface Claim {
  id: string;
  title: string;
  description: string;
  amount: number;
  status: "validated" | "flagged" | "pending" | "rejected";
  confidence: number;
  timestamp: Date;
  category: string;
  reason?: string;
}

const mockClaims: Claim[] = [
  {
    id: "1",
    title: "Marketing ROI Claim",
    description: "Digital campaign generated $2.3M in attributed revenue",
    amount: 2300000,
    status: "validated",
    confidence: 98,
    timestamp: new Date(Date.now() - 300000),
    category: "Marketing"
  },
  {
    id: "2",
    title: "Cost Reduction Initiative",
    description: "Process automation saved $450k in operational costs",
    amount: 450000,
    status: "flagged",
    confidence: 72,
    timestamp: new Date(Date.now() - 600000),
    category: "Operations",
    reason: "Baseline calculation methodology requires verification"
  },
  {
    id: "3",
    title: "Customer Acquisition",
    description: "New partnership channel acquired 1,247 customers",
    amount: 1247,
    status: "validated",
    confidence: 95,
    timestamp: new Date(Date.now() - 900000),
    category: "Sales"
  },
  {
    id: "4",
    title: "Efficiency Improvement",
    description: "Dashboard implementation reduced reporting time by 15 hours/week",
    amount: 15,
    status: "pending",
    confidence: 85,
    timestamp: new Date(Date.now() - 1200000),
    category: "Technology"
  },
  {
    id: "5",
    title: "Revenue Protection",
    description: "Fraud detection prevented $180k in revenue leakage",
    amount: 180000,
    status: "flagged",
    confidence: 68,
    timestamp: new Date(Date.now() - 1500000),
    category: "Security",
    reason: "Data source validation needed for fraud detection accuracy"
  }
];

export default function AuditorPage() {
  const [claims, setClaims] = useState<Claim[]>(mockClaims);
  const [filter, setFilter] = useState<"all" | "validated" | "flagged" | "pending">("all");
  const [searchQuery, setSearchQuery] = useState("");

  const getStatusColor = (status: string) => {
    switch (status) {
      case "validated": return "bg-green-100 text-green-800 border-green-200";
      case "flagged": return "bg-red-100 text-red-800 border-red-200";
      case "pending": return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "rejected": return "bg-gray-100 text-gray-800 border-gray-200";
      default: return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "validated": return <CheckCircle className="w-4 h-4" />;
      case "flagged": return <AlertTriangle className="w-4 h-4" />;
      case "pending": return <Clock className="w-4 h-4" />;
      default: return <Shield className="w-4 h-4" />;
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 90) return "text-green-600";
    if (confidence >= 70) return "text-yellow-600";
    return "text-red-600";
  };

  const filteredClaims = claims.filter(claim => {
    const matchesFilter = filter === "all" || claim.status === filter;
    const matchesSearch = claim.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         claim.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         claim.category.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const stats = {
    total: claims.length,
    validated: claims.filter(c => c.status === "validated").length,
    flagged: claims.filter(c => c.status === "flagged").length,
    pending: claims.filter(c => c.status === "pending").length,
    accuracyRate: Math.round((claims.filter(c => c.status === "validated").length / claims.length) * 100)
  };

  const handleClaimAction = (claimId: string, action: "approve" | "reject") => {
    setClaims(prev => prev.map(claim => 
      claim.id === claimId 
        ? { ...claim, status: action === "approve" ? "validated" : "rejected" as const }
        : claim
    ));
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Auditor Center</h1>
          <p className="text-slate-600 mt-1">Automated claim validation and verification system</p>
        </div>
        <div className="flex items-center space-x-2 bg-green-50 px-4 py-2 rounded-lg border border-green-200">
          <Shield className="w-5 h-5 text-green-600" />
          <span className="text-sm font-medium text-green-700">Auditor Agent Active</span>
        </div>
      </div>

      {/* Stats Dashboard */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">Total Claims</p>
                <p className="text-2xl font-bold text-slate-900">{stats.total}</p>
              </div>
              <FileCheck className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">Validated</p>
                <p className="text-2xl font-bold text-green-600">{stats.validated}</p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">Flagged</p>
                <p className="text-2xl font-bold text-red-600">{stats.flagged}</p>
              </div>
              <AlertTriangle className="w-8 h-8 text-red-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">Accuracy Rate</p>
                <p className="text-2xl font-bold text-slate-900">{stats.accuracyRate}%</p>
              </div>
              <TrendingUp className="w-8 h-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
                <Input
                  placeholder="Search claims..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
            
            <div className="flex gap-2">
              {["all", "validated", "flagged", "pending"].map((status) => (
                <Button
                  key={status}
                  variant={filter === status ? "default" : "outline"}
                  size="sm"
                  onClick={() => setFilter(status as "all" | "validated" | "flagged" | "pending")}
                  className="capitalize"
                >
                  <Filter className="w-4 h-4 mr-1" />
                  {status === "all" ? "All" : status}
                </Button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Claims List */}
      <div className="space-y-4">
        {filteredClaims.map((claim) => (
          <Card key={claim.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <h3 className="font-semibold text-slate-900">{claim.title}</h3>
                    <Badge className={getStatusColor(claim.status)}>
                      {getStatusIcon(claim.status)}
                      <span className="ml-1 capitalize">{claim.status}</span>
                    </Badge>
                    <Badge variant="outline">{claim.category}</Badge>
                  </div>
                  
                  <p className="text-sm text-slate-600 mb-3">{claim.description}</p>
                  
                  <div className="flex items-center space-x-6 text-sm">
                    <div className="flex items-center space-x-1">
                      <span className="text-slate-600">Amount:</span>
                      <span className="font-medium">
                        {typeof claim.amount === 'number' && claim.amount > 1000 
                          ? `$${(claim.amount / 1000).toFixed(0)}k`
                          : claim.amount.toLocaleString()
                        }
                      </span>
                    </div>
                    
                    <div className="flex items-center space-x-1">
                      <span className="text-slate-600">Confidence:</span>
                      <span className={`font-medium ${getConfidenceColor(claim.confidence)}`}>
                        {claim.confidence}%
                      </span>
                    </div>
                    
                    <div className="flex items-center space-x-1">
                      <span className="text-slate-600">Time:</span>
                      <span className="text-slate-500">
                        {claim.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>

                  {claim.reason && (
                    <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <p className="text-sm text-yellow-800">
                        <strong>Reason for Flag:</strong> {claim.reason}
                      </p>
                    </div>
                  )}
                </div>

                <div className="flex flex-col space-y-2 ml-4">
                  <Button variant="outline" size="sm">
                    <Eye className="w-4 h-4 mr-1" />
                    Details
                  </Button>
                  
                  {claim.status === "flagged" && (
                    <div className="flex space-y-2 flex-col">
                      <Button 
                        size="sm"
                        onClick={() => handleClaimAction(claim.id, "approve")}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        Approve
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleClaimAction(claim.id, "reject")}
                      >
                        Reject
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredClaims.length === 0 && (
        <Card>
          <CardContent className="p-8 text-center">
            <Shield className="w-16 h-16 mx-auto text-slate-300 mb-4" />
            <h3 className="text-lg font-medium text-slate-900 mb-2">No claims found</h3>
            <p className="text-slate-600">
              {searchQuery ? "Try adjusting your search criteria" : "No claims match the selected filter"}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
