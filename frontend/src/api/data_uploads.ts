import axios from "@/lib/axios";
import { DataUpload } from "@/types/data-upload";

export const uploadData = async (goalId: string, file: File): Promise<DataUpload> => {
    const formData = new FormData();
    formData.append("file", file);
    const response = await axios.post(`/api/v1/goals/${goalId}/uploads`, formData);
    return response.data;
}

export const getDataUploads = async (goalId: string): Promise<DataUpload[]> => {
    const response = await axios.get(`/api/v1/goals/${goalId}/uploads`);
    return response.data;
}

export const getInsights = async (uploadId: string): Promise<string[]> => {
    const response = await axios.get(`/api/v1/data_uploads/${uploadId}/insights`);
    return response.data;
}

export const generateInsight = async (dataUploadId: string): Promise<void> => {
    await axios.post(`/api/v1/data_uploads/${dataUploadId}/generate_insight`);
}