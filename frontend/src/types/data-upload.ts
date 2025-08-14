export interface DataUpload {
  _id: string;
  goal_id: string;
  uploader_id: string;
  file_name: string;
  file_path: string;
  upload_timestamp: string;
  status: "Pending" | "Validating" | "Failed" | "Complete";
  insights?: string;
}