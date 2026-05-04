export interface Section {
  id: number;
  startPage: number;
  endPage: number;
  pageCount: number;
}

export interface ProcessingStatus {
  step: 'idle' | 'scanning' | 'processing' | 'zipping' | 'complete' | 'error';
  progress: number;
  total: number;
  message: string;
}
