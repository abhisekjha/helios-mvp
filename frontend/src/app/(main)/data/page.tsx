"use client";

import { useState, useEffect } from "react";
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

export default function DataPage() {
  const [dataUploads, setDataUploads] = useState<DataUpload[]>([]);

  // Hardcoded goalId for now
  const goalId = "665de5c727742d546532a47b";

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
  }, [goalId]);

  const handleGenerateInsight = async (dataUploadId: string) => {
    try {
      await generateInsight(dataUploadId);
      fetchUploads(); // Refresh the table
    } catch (error) {
      console.error("Failed to generate insight", error);
    }
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Data Uploads</CardTitle>
          <CardDescription>
            View your data uploads and generate insights.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>File Name</TableHead>
                <TableHead>Upload Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Insights</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {dataUploads.map((upload) => (
                <TableRow key={upload._id}>
                  <TableCell>{upload.file_name}</TableCell>
                  <TableCell>
                    {new Date(upload.upload_timestamp).toLocaleDateString()}
                  </TableCell>
                  <TableCell>{upload.status}</TableCell>
                  <TableCell>{upload.insights}</TableCell>
                  <TableCell>
                    <Button onClick={() => handleGenerateInsight(upload._id)}>
                      Generate Insight
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}