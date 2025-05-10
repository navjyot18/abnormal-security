import React from 'react';
import { fileService } from '../services/fileService';
import { File as FileType } from '../types/file';
import { DocumentIcon, TrashIcon, ArrowDownTrayIcon } from '@heroicons/react/24/outline';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

export const FileList: React.FC = () => {
  const queryClient = useQueryClient();

  // This state holds the current filters used for query
  const [filters, setFilters] = React.useState({});
  // This state holds the form values before user applies them
  const [inputFilters, setInputFilters] = React.useState({
    file_type: '',
    filename: '',
    size_min: '', // <- updated
    size_max: '', // <- updated
    uploaded_after: '',
  });

  const reset = () => {
    setInputFilters({
      file_type: '',
      filename: '',
      size_min: '', // <- updated
      size_max: '', // <- updated
      uploaded_after: '',
    });
    setFilters({});
  };

  // Query: fetch files with current filters
  const {
    data: files,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['files', filters],
    queryFn: () => fileService.getFiles(filters),
  });

  // Apply filters
  const handleApplyFilters = () => {
    const sanitizedFilters: any = {
      ...inputFilters,
      file_type: inputFilters.file_type.trim() || undefined,
      filename: inputFilters.filename.trim() || undefined,
      size_min: inputFilters.size_min ? Number(inputFilters.size_min) * 1024 : undefined, // Convert KB to Bytes
      size_max: inputFilters.size_max ? Number(inputFilters.size_max) * 1024 : undefined, // Convert KB to Bytes
      uploaded_after: inputFilters.uploaded_after || undefined,
    };

    console.log('Sanitized Filters:', sanitizedFilters);

    setFilters(sanitizedFilters);
  };

  const deleteMutation = useMutation({
    mutationFn: fileService.deleteFile,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['files'] });
    },
  });

  const downloadMutation = useMutation({
    mutationFn: ({ fileUrl, filename }: { fileUrl: string; filename: string }) =>
      fileService.downloadFile(fileUrl, filename),
  });

  const handleDelete = async (id: string) => {
    try {
      await deleteMutation.mutateAsync(id);
    } catch (err) {
      console.error('Delete error:', err);
    }
  };

  const handleDownload = async (fileUrl: string, filename: string) => {
    try {
      await downloadMutation.mutateAsync({ fileUrl, filename });
    } catch (err) {
      console.error('Download error:', err);
    }
  };


  console.log('Files:', files);
  return (
    <div className="p-6">
      <h2 className="text-xl font-semibold text-gray-900 mb-4">Uploaded Files</h2>

      {/* Filter inputs */}
      <div className="mb-6 space-y-2">
        <input
          type="text"
          placeholder="Filename"
          value={inputFilters.filename}
          onChange={(e) => setInputFilters((prev) => ({ ...prev, filename: e.target.value }))}
          className="border rounded px-2 py-1 w-full"
        />
        <input
          type="text"
          placeholder="File Type"
          value={inputFilters.file_type}
          onChange={(e) => setInputFilters((prev) => ({ ...prev, file_type: e.target.value }))}
          className="border rounded px-2 py-1 w-full"
        />
        <input
          type="number"
          placeholder="Min Size (KB)"
          value={inputFilters.size_min}
          onChange={(e) => setInputFilters((prev) => ({ ...prev, size_min: e.target.value }))}
          className="border rounded px-2 py-1 w-full"
        />
        <input
          type="number"
          placeholder="Max Size (KB)"
          value={inputFilters.size_max}
          onChange={(e) => setInputFilters((prev) => ({ ...prev, size_max: e.target.value }))}
          className="border rounded px-2 py-1 w-full"
        />
        <input
          type="date"
          placeholder="Uploaded After"
          value={inputFilters.uploaded_after}
          onChange={(e) => setInputFilters((prev) => ({ ...prev, uploaded_after: e.target.value }))}
          className="border rounded px-2 py-1 w-full"
        />
        <button onClick={handleApplyFilters} className="bg-blue-600 text-white px-4 py-2 rounded mt-2">
          Apply Filters
        </button>
        <button
          onClick={reset}
          style={{ background: 'red' }}
          className="bg-danger-600 text-white px-4 py-2 rounded ml-2 mt-2"
        >
          Reset Filters
        </button>
      </div>

      {/* Loading skeleton */}
      {isLoading ? (
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-gray-200 rounded w-1/4"></div>
          <div className="space-y-3">
            <div className="h-8 bg-gray-200 rounded"></div>
            <div className="h-8 bg-gray-200 rounded"></div>
            <div className="h-8 bg-gray-200 rounded"></div>
          </div>
        </div>
      ) : error ? (
        <div className="bg-red-50 border-l-4 border-red-400 p-4">
          <p className="text-sm text-red-700">Failed to load files. Please try again.</p>
        </div>
      ) : !files || files.length === 0 ? (
        <div className="text-center py-12">
          <DocumentIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No files</h3>
          <p className="mt-1 text-sm text-gray-500">Get started by uploading a file</p>
        </div>
      ) : (
        <div className="mt-6 flow-root">
          <ul className="-my-5 divide-y divide-gray-200">
            {files.map((file) => (
              <li key={file.id} className="py-4">
                <div className="flex items-center space-x-4">
                  <DocumentIcon className="h-8 w-8 text-gray-400" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{file.original_filename}</p>
                    <p className="text-sm text-gray-500">
                      {file.file_type} • {(file.size / 1024).toFixed(2)} KB
                    </p>
                    <p className="text-sm text-gray-500">Uploaded {new Date(file.uploaded_at).toLocaleString()}</p>
                    {file.count > 1 ? (
                      <p className="text-sm" style={{ color: 'green', fontWeight: 'bold' }}>
                        Storage Saved: {(file.count - 1) * file.size} KB
                      </p>
                    ) : null}
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleDownload(file.file, file.original_filename)}
                      disabled={downloadMutation.isPending}
                      className="inline-flex items-center px-3 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700"
                    >
                      <ArrowDownTrayIcon className="h-4 w-4 mr-1" />
                      Download
                    </button>
                    <button
                      onClick={() => handleDelete(file.id)}
                      disabled={deleteMutation.isPending}
                      className="inline-flex items-center px-3 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700"
                    >
                      <TrashIcon className="h-4 w-4 mr-1" />
                      Delete
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};
