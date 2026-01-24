export interface GeneratedSite {
  html: string;
  css?: string;
  js?: string;
  explanation?: string;
}

export interface Project {
  id: string;
  name: string;
  prompt: string;
  createdAt: number;
  code: GeneratedSite;
  version: number;
}

export type ViewMode = 'desktop' | 'tablet' | 'mobile';
export type TabMode = 'preview' | 'code';

export interface PromptTemplate {
  label: string;
  prompt: string;
  icon: string;
}

export enum GeneratorState {
  IDLE = 'IDLE',
  GENERATING = 'GENERATING',
  SUCCESS = 'SUCCESS',
  ERROR = 'ERROR'
}