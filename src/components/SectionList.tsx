import React from 'react';
import { Section } from '../types';
import { Layers, ChevronRight } from 'lucide-react';
import { motion } from 'motion/react';

interface SectionListProps {
  sections: Section[];
}

export const SectionList: React.FC<SectionListProps> = ({ sections }) => {
  if (sections.length === 0) return null;

  return (
    <div className="w-full max-w-2xl mx-auto space-y-3">
      <div className="flex items-center space-x-2 text-[#888888] mb-2">
        <Layers className="w-4 h-4 text-[#FF6B2B]" />
        <h3 className="text-[11px] font-semibold uppercase tracking-[0.8px]">Detected Sections</h3>
      </div>
      <div className="grid gap-3">
        {sections.map((section, index) => (
          <motion.div
            key={section.id}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.05 }}
            className="flex items-center justify-between p-3 bg-[#1A1A1A] border border-[#252525] rounded-lg hover:shadow-[0_2px_8px_rgba(0,0,0,0.35)] transition-shadow"
          >
            <div className="flex items-center space-x-3">
              <div className="w-7 h-7 flex items-center justify-center bg-[#111111] border border-[#2A2A2A] rounded-[6px] text-[11px] font-mono text-[#EFEFEF]">
                {section.id.toString().padStart(2, '0')}
              </div>
              <div>
                <p className="text-[13px] font-semibold text-[#EFEFEF]">
                  Section {section.id}
                </p>
                <p className="text-[11px] text-[#888888]">
                  Pages {section.startPage} – {section.endPage}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-[11px] font-mono text-[#555555]">
                {section.pageCount} pages
              </span>
              <ChevronRight className="w-4 h-4 text-[#555555]" />
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};
