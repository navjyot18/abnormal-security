import axios from 'axios';
import { File as FileType } from '../types/file';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000/api';

export const fileService = {
  async uploadFile(file: File): Promise<FileType> {
    const formData = new FormData();
    formData.append('file', file);

    const response = await axios.post(`${API_URL}/files/`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  // async getFiles(): Promise<FileType[]> {
  //   const response = await axios.get(`${API_URL}/files/`);
  //   return response.data;
  // },

  async getFiles({
    file_type,
    filename,
    size_min,
    size_max,
    uploaded_after,
  }: {
    file_type?: string;
    filename?: string;
    size_min?: number | string;
    size_max?: number | string;
    uploaded_after?: string;
  }): Promise<FileType[]> {
    // Build the query parameters based on the filters
    const params: any = {};

    console.log('Filters:', file_type, filename, size_min, size_max, uploaded_after);
    if (file_type) params.file_type = file_type;
    if (filename) params.filename = filename;
    if (size_min) params.size_min = size_min;
    if (size_max) params.size_max = size_max;
    if (uploaded_after) params.uploaded_after = uploaded_after;

    const response = await axios.get(`${API_URL}/files/`, { params });
    console.log('Response:', response.data);
    return response.data;
  },

  async deleteFile(id: string): Promise<void> {
    await axios.delete(`${API_URL}/files/${id}/`);
  },

  async downloadFile(fileUrl: string, filename: string): Promise<void> {
    try {
      const response = await axios.get(fileUrl, {
        responseType: 'blob',
      });

      // Create a blob URL and trigger download
      const blob = new Blob([response.data]);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Download error:', error);
      throw new Error('Failed to download file');
    }
  },
};
