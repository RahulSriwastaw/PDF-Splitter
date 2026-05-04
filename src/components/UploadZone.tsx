import React, { useCallback, useState } from 'react';
import { Upload, FileText, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface UploadZoneProps {
  onFileSelect: (file: File) => void;
  disabled?: boolean;
}

export const UploadZone: React.FC<UploadZoneProps> = ({ onFileSelect, disabled }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    if (!disabled) setIsDragging(true);
  }, [disabled]);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (disabled) return;

    const file = e.dataTransfer.files[0];
    if (file && file.type === 'application/pdf') {
      setSelectedFile(file);
      onFileSelect(file);
    }
  }, [onFileSelect, disabled]);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type === 'application/pdf') {
      setSelectedFile(file);
      onFileSelect(file);
    }
  }, [onFileSelect]);

  const clearFile = (e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedFile(null);
  };

  return (
    <div className="w-full max-w-2xl mx-auto">
      <motion.div
        whileHover={!disabled ? { scale: 1.01 } : {}}
        whileTap={!disabled ? { scale: 0.99 } : {}}
        className={`
          relative border-2 border-dashed rounded-lg p-8
          transition-all duration-200 cursor-pointer
          ${isDragging ? 'border-[#FF6B2B] bg-[#1A1A1A]' : 'border-[#252525] hover:border-[#2A2A2A] bg-[#1A1A1A]'}
          ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
        `}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => !disabled && document.getElementById('file-input')?.click()}
      >
        <input
          id="file-input"
          type="file"
          accept=".pdf"
          className="hidden"
          onChange={handleFileInput}
          disabled={disabled}
        />

        <div className="flex flex-col items-center justify-center space-y-3 text-center">
          <AnimatePresence mode="wait">
            {selectedFile ? (
              <motion.div
                key="file"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="flex items-center space-x-3 bg-[#111111] border border-[#252525] px-3 py-2 rounded-[6px]"
              >
                <FileText className="w-5 h-5 text-[#FF6B2B]" />
                <span className="text-[#EFEFEF] text-[13px] font-medium truncate max-w-xs">
                  {selectedFile.name}
                </span>
                <button
                  onClick={clearFile}
                  className="p-1 hover:bg-[#2A2A2A] rounded-[6px] transition-colors"
                >
                  <X className="w-3 h-3 text-[#555555]" />
                </button>
              </motion.div>
            ) : (
              <motion.div
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col items-center space-y-3"
              >
                <div className="p-3 bg-[#111111] border border-[#252525] rounded-full">
                  <Upload className="w-5 h-5 text-[#555555]" />
                </div>
                <div>
                  <p className="text-[13px] font-medium text-[#EFEFEF]">
                    Click or drag PDF here
                  </p>
                  <p className="text-[11px] text-[#555555] mt-1">
                    Maximum file size: 50MB
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
};
