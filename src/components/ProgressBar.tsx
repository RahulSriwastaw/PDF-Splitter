import React from 'react';
import { motion } from 'motion/react';

interface ProgressBarProps {
  progress: number;
  total: number;
  message: string;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({ progress, total, message }) => {
  const percentage = total > 0 ? (progress / total) * 100 : 0;

  return (
    <div className="w-full max-w-2xl mx-auto space-y-2">
      <div className="flex justify-between items-end">
        <span className="text-[13px] font-medium text-[#888888]">{message}</span>
        <span className="text-[11px] font-mono text-[#555555]">
          {progress} / {total} ({Math.round(percentage)}%)
        </span>
      </div>
      <div className="h-1.5 w-full bg-[#1A1A1A] border border-[#252525] rounded-full overflow-hidden">
        <motion.div
          className="h-full bg-[#FF6B2B]"
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 0.3 }}
        />
      </div>
    </div>
  );
};
