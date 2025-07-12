
import React, { useState, useCallback } from 'react';
import { UploadIcon } from './icons/UploadIcon';
import { DocumentIcon } from './icons/DocumentIcon';

interface FileUploadProps {
  onFileSelect: (file: File) => void;
  isProcessing: boolean;
}

const FileUpload: React.FC<FileUploadProps> = ({ onFileSelect, isProcessing }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);

  const handleDragEnter = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isProcessing) setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (isProcessing) return;

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      if (files[0].type === 'application/pdf') {
        setFileName(files[0].name);
        onFileSelect(files[0]);
      } else {
        alert('Please upload a valid PDF file.');
      }
    }
  }, [isProcessing, onFileSelect]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
        if (files[0].type === 'application/pdf') {
            setFileName(files[0].name);
            onFileSelect(files[0]);
        } else {
            alert('Please upload a valid PDF file.');
        }
    }
  };

  return (
    <div
      className={`relative w-full text-center p-8 border-2 border-dashed rounded-lg transition-all duration-300 ${isDragging ? 'border-brand-blue bg-brand-medium' : 'border-brand-lighter'}`}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      <input
        type="file"
        id="file-upload"
        className="hidden"
        accept="application/pdf"
        onChange={handleFileChange}
        disabled={isProcessing}
      />
      <label htmlFor="file-upload" className={`cursor-pointer ${isProcessing ? 'cursor-not-allowed' : ''}`}>
        <div className="flex flex-col items-center justify-center text-gray-400">
            {fileName && !isProcessing ? (
                <>
                    <DocumentIcon className="w-16 h-16 mb-4 text-brand-blue" />
                    <p className="text-lg font-semibold text-brand-text">{fileName}</p>
                    <p className="mt-2">Ready for analysis. Or choose another file.</p>
                </>
            ) : (
                <>
                    <UploadIcon className="w-16 h-16 mb-4" />
                    <p className="text-lg font-semibold text-brand-text">
                        Drag & Drop your PDF here
                    </p>
                    <p className="mt-1">or <span className="text-brand-blue font-bold">click to browse</span></p>
                </>
            )}
        </div>
      </label>
    </div>
  );
};

export default FileUpload;
