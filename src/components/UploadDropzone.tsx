import React, { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';

interface UploadDropzoneProps {
  onFilesSelected: (files: File[]) => void;
  isPending: boolean;
}

export const UploadDropzone: React.FC<UploadDropzoneProps> = ({ onFilesSelected, isPending }) => {
  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles && acceptedFiles.length > 0 && !isPending) {
      onFilesSelected(acceptedFiles);
    }
  }, [onFilesSelected, isPending]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/jpeg': ['.jpg', '.jpeg'],
      'image/png': ['.png']
    },
    multiple: true,
    disabled: isPending
  });

  return (
    <div
      {...getRootProps()}
      className={`border-2 border-dashed rounded-3xl p-10 flex flex-col items-center justify-center transition-all duration-300 cursor-pointer text-center bg-white/5 backdrop-blur-md
        ${isDragActive 
          ? 'border-brand-purple bg-brand-purple/5 scale-[1.02]' 
          : 'border-slate-300 dark:border-slate-700 hover:border-brand-purple/50 dark:hover:border-brand-purple/50'
        } ${isPending ? 'opacity-50 cursor-not-allowed' : ''}`}
    >
      <input { ...getInputProps() } />
      
      <div className="w-16 h-16 rounded-2xl bg-brand-purple/10 flex items-center justify-center mb-4 text-brand-purple transition-transform duration-300 group-hover:scale-110">
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
        </svg>
      </div>

      <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200 mb-1">
        {isDragActive ? 'Drop documents here' : 'Drag & drop images here'}
      </h3>
      <p className="text-sm text-slate-500 dark:text-slate-400 max-w-xs">
        Supports multiple JPEG and PNG files. Mobile users can also capture directly.
      </p>
      
      <span className="mt-4 px-5 py-2 text-xs font-medium text-brand-purple bg-brand-purple/10 rounded-full hover:bg-brand-purple/20 transition-colors">
        Browse Files
      </span>
    </div>
  );
};
