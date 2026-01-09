
export interface Scene {
  id: string;
  timestamp: string;
  description: string;
  imagePrompt: string;
  status: 'idle' | 'generating' | 'completed' | 'error';
  imageUrl?: string;
  videoUrl?: string;
  narrationUrl?: string;
}

export interface GeneratedAsset {
  id: string;
  type: 'image' | 'video' | 'narration' | 'thumbnail';
  url: string;
  prompt: string;
  timestamp: number;
}

export type AppTab = 'script' | 'creator' | 'editor' | 'thumbnails' | 'gallery';

export type ImageSize = '1K' | '2K' | '4K';
export type AspectRatio = '16:9' | '9:16' | '1:1' | '4:3' | '3:4';

export enum GenerationState {
  IDLE = 'IDLE',
  ANALYZING = 'ANALYZING',
  GENERATING_IMAGE = 'GENERATING_IMAGE',
  GENERATING_VIDEO = 'GENERATING_VIDEO',
  FINALIZING = 'FINALIZING',
  ERROR = 'ERROR'
}
