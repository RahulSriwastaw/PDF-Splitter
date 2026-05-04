/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useCallback } from 'react';
import { UploadZone } from './components/UploadZone';
import { ProgressBar } from './components/ProgressBar';
import { SectionList } from './components/SectionList';
import { extractSections } from './utils/extractSections';
import { extractAllText } from './utils/extractAllText';
import { extractSectionsText } from './utils/extractSectionsText';
import { createNup } from './utils/createNup';
import { buildZip } from './utils/buildZip';
import { Section, ProcessingStatus } from './types';
import { FileDown, AlertCircle, RefreshCcw, Scissors, FileText as FileTextIcon, Archive, LayoutGrid } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { saveAs } from 'file-saver';
import JSZip from 'jszip';

export default function App() {
  const [file, setFile] = useState<File | null>(null);
  const [sections, setSections] = useState<Section[]>([]);
  const [status, setStatus] = useState<ProcessingStatus>({
    step: 'idle',
    progress: 0,
    total: 0,
    message: '',
  });
  const [error, setError] = useState<string | null>(null);
  const [pagesPerSheet, setPagesPerSheet] = useState<number>(4);

  const handleFileSelect = useCallback(async (selectedFile: File) => {
    setFile(selectedFile);
    setSections([]);
    setError(null);
    setStatus({
      step: 'scanning',
      progress: 0,
      total: 0,
      message: 'Scanning pages for "Q.1" markers...',
    });

    try {
      const detectedSections = await extractSections(selectedFile, (current, total) => {
        setStatus(prev => ({ ...prev, progress: current, total }));
      });
      setSections(detectedSections);
      setStatus({
        step: 'complete',
        progress: detectedSections.length,
        total: detectedSections.length,
        message: `Found ${detectedSections.length} sections. Ready to process.`,
      });
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : 'Failed to scan PDF');
      setStatus(prev => ({ ...prev, step: 'error' }));
    }
  }, []);

  const handleProcess = async () => {
    if (!file || sections.length === 0) return;

    setStatus({
      step: 'processing',
      progress: 0,
      total: sections.length,
      message: 'Generating 4-up layouts...',
    });

    try {
      const processedFiles: { name: string; data: Uint8Array }[] = [];

      for (let i = 0; i < sections.length; i++) {
        const section = sections[i];
        setStatus(prev => ({
          ...prev,
          progress: i + 1,
          message: `Processing Section ${section.id}...`,
        }));

        const pdfData = await createNup(file, section, pagesPerSheet);
        processedFiles.push({
          name: `section_${section.id.toString().padStart(2, '0')}.pdf`,
          data: pdfData,
        });
      }

      setStatus({
        step: 'zipping',
        progress: 100,
        total: 100,
        message: 'Bundling into ZIP...',
      });

      await buildZip(processedFiles, `${file.name.replace('.pdf', '')}_${pagesPerSheet}up_split.zip`);

      setStatus({
        step: 'complete',
        progress: sections.length,
        total: sections.length,
        message: 'Processing complete! ZIP downloaded.',
      });
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : 'Failed to process sections');
      setStatus(prev => ({ ...prev, step: 'error' }));
    }
  };

  const handleExtractText = async () => {
    if (!file) return;

    setStatus({
      step: 'processing',
      progress: 0,
      total: 100,
      message: 'Extracting text (Parallel Mode)...',
    });

    try {
      const text = await extractAllText(file, (current, total) => {
        setStatus(prev => ({ ...prev, progress: current, total }));
      });

      // Add UTF-8 BOM (\uFEFF) to ensure editors recognize it as UTF-8
      const blob = new Blob(['\uFEFF', text], { type: 'text/plain;charset=utf-8' });
      saveAs(blob, `${file.name.replace('.pdf', '')}_extracted_text.txt`);

      setStatus({
        step: 'complete',
        progress: 100,
        total: 100,
        message: 'Text extraction complete! File downloaded.',
      });
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : 'Failed to extract text');
      setStatus(prev => ({ ...prev, step: 'error' }));
    }
  };

  const handleDownloadSectionsTextZip = async () => {
    if (!file || sections.length === 0) return;

    setStatus({
      step: 'processing',
      progress: 0,
      total: sections.length,
      message: 'Extracting text for each section...',
    });

    try {
      const results = await extractSectionsText(file, sections, (current, total) => {
        setStatus(prev => ({ ...prev, progress: current, total }));
      });

      setStatus({
        step: 'zipping',
        progress: 100,
        total: 100,
        message: 'Creating ZIP archive...',
      });

      const zip = new JSZip();
      results.forEach(item => {
        // Add BOM to each text file
        zip.file(item.name, '\uFEFF' + item.text);
      });

      const content = await zip.generateAsync({ type: 'blob' });
      saveAs(content, `${file.name.replace('.pdf', '')}_sections_text.zip`);

      setStatus({
        step: 'complete',
        progress: sections.length,
        total: sections.length,
        message: 'Sections text ZIP downloaded!',
      });
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : 'Failed to create sections text ZIP');
      setStatus(prev => ({ ...prev, step: 'error' }));
    }
  };

  const reset = () => {
    setFile(null);
    setSections([]);
    setError(null);
    setStatus({
      step: 'idle',
      progress: 0,
      total: 0,
      message: '',
    });
  };

  return (
    <div className="min-h-screen bg-[#0F0F0F] text-[#EFEFEF] font-sans selection:bg-[#FF6B2B]/30 leading-normal">
      <main className="relative z-10 container mx-auto px-4 py-8 max-w-4xl">
        <header className="text-center mb-8 space-y-3">
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center space-x-2 px-[9px] py-[3px] rounded-[20px] bg-[#1A2A3A] text-[#2196F3] text-[11px]"
          >
            <Scissors className="w-3 h-3" />
            <span>PDF Utility Tool</span>
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-[20px] font-bold text-[#EFEFEF]"
          >
            PDF 4-Up Splitter
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-[#888888] text-[13px] max-w-lg mx-auto"
          >
            Automatically detect sections by "Q.1" markers and generate print-optimized N-up layouts.
          </motion.p>
        </header>

        <div className="space-y-8">
          <section>
            <UploadZone
              onFileSelect={handleFileSelect}
              disabled={status.step === 'scanning' || status.step === 'processing' || status.step === 'zipping'}
            />
          </section>

          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="bg-[#3A1A1A] border border-[#252525] rounded-lg p-3 flex items-start space-x-3 mb-6"
              >
                <AlertCircle className="w-4 h-4 text-[#F44336] shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-[13px] font-semibold text-[#F44336]">Error Occurred</p>
                  <p className="text-[11px] text-[#888888] font-normal mt-1">{error}</p>
                </div>
                <button
                  onClick={reset}
                  className="p-1 hover:bg-[#2A2A2A] rounded-[6px] transition-colors"
                >
                  <RefreshCcw className="w-3 h-3 text-[#F44336]" />
                </button>
              </motion.div>
            )}

            {(status.step !== 'idle' && status.step !== 'error') && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                className="space-y-6"
              >
                <ProgressBar
                  progress={status.progress}
                  total={status.total}
                  message={status.message}
                />

                {sections.length > 0 && (
                  <div className="space-y-6">
                    <SectionList sections={sections} />
                    
                    <div className="flex flex-col items-center space-y-4 pt-4 border-t border-[#1E1E1E]">
                      <div className="flex items-center space-x-3 bg-[#1A1A1A] p-2 rounded-lg border border-[#252525]">
                        <div className="flex items-center space-x-2 px-2 text-[#888888]">
                          <LayoutGrid className="w-4 h-4 text-[#FF6B2B]" />
                          <span className="text-[13px] font-medium">Pages per sheet:</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <input
                            type="number"
                            min="1"
                            max="100"
                            value={pagesPerSheet}
                            onChange={(e) => setPagesPerSheet(Math.max(1, parseInt(e.target.value) || 1))}
                            disabled={status.step === 'processing' || status.step === 'zipping'}
                            className="w-16 bg-[#1A1A1A] border border-[#2A2A2A] rounded-[6px] px-2 py-1.5 text-[#EFEFEF] text-[13px] text-center focus:outline-none focus:border-[#FF6B2B] disabled:opacity-50 disabled:cursor-not-allowed"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 w-full">
                        <motion.button
                          whileHover={{ scale: 1.01 }}
                          whileTap={{ scale: 0.99 }}
                          onClick={handleProcess}
                          disabled={status.step === 'processing' || status.step === 'zipping'}
                          className={`
                            flex items-center justify-center space-x-2 px-4 py-2.5 rounded-[6px] text-[13px] font-medium transition-colors
                            ${status.step === 'processing' || status.step === 'zipping'
                              ? 'bg-[#1A1A1A] text-[#555555] border border-[#252525] cursor-not-allowed'
                              : 'bg-[#FF6B2B] text-white hover:bg-[#E55A1A]'}
                          `}
                        >
                          <FileDown className="w-4 h-4" />
                          <span>
                            {status.step === 'processing' ? 'Processing...' : `Download ${pagesPerSheet}-Up ZIP`}
                          </span>
                        </motion.button>

                        <motion.button
                          whileHover={{ scale: 1.01 }}
                          whileTap={{ scale: 0.99 }}
                          onClick={handleDownloadSectionsTextZip}
                          disabled={status.step === 'processing' || status.step === 'zipping'}
                          className={`
                            flex items-center justify-center space-x-2 px-4 py-2.5 rounded-[6px] text-[13px] font-medium transition-colors
                            ${status.step === 'processing' || status.step === 'zipping'
                              ? 'bg-[#1A1A1A] text-[#555555] border border-[#252525] cursor-not-allowed'
                              : 'bg-transparent border border-[#2A2A2A] text-[#EFEFEF] hover:bg-[#2A2A2A]/50'}
                          `}
                        >
                          <Archive className="w-4 h-4" />
                          <span>Sections Text ZIP</span>
                        </motion.button>

                        <motion.button
                          whileHover={{ scale: 1.01 }}
                          whileTap={{ scale: 0.99 }}
                          onClick={handleExtractText}
                          disabled={status.step === 'processing' || status.step === 'zipping'}
                          className={`
                            flex items-center justify-center space-x-2 px-4 py-2.5 rounded-[6px] text-[13px] font-medium transition-colors md:col-span-2
                            ${status.step === 'processing' || status.step === 'zipping'
                              ? 'bg-[#1A1A1A] text-[#555555] border border-[#252525] cursor-not-allowed'
                              : 'bg-[#1A1A1A] border border-[#2A2A2A] text-[#EFEFEF] hover:bg-[#2A2A2A]/50'}
                          `}
                        >
                          <FileTextIcon className="w-4 h-4" />
                          <span>Extract Full Text (.txt)</span>
                        </motion.button>
                      </div>
                    </div>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <footer className="mt-16 pt-6 border-t border-[#1E1E1E] text-center">
          <p className="text-[11px] text-[#555555] font-normal uppercase tracking-[0.8px]">
            Browser-only processing • No data leaves your machine
          </p>
        </footer>
      </main>
    </div>
  );
}

