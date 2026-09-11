export type SourceType =
  | 'article'
  | 'news'
  | 'journal'
  | 'youtube'
  | 'documentation'
  | 'book'
  | 'google_doc'
  | 'other';

export type LearningStatus = 'new' | 'learning' | 'learned';

export type ProjectType =
  | 'experiment'
  | 'application'
  | 'article'
  | 'video'
  | 'research'
  | 'business'
  | 'learning'
  | 'other';

export type ProjectStatus = 'planned' | 'active' | 'completed' | 'paused' | 'archived';
export type ProjectPriority = 'low' | 'medium' | 'high';

export type TaskStatus = 'todo' | 'doing' | 'done';

export type OutputType =
  | 'code'
  | 'document'
  | 'video'
  | 'research'
  | 'product'
  | 'creative'
  | 'presentation'
  | 'other';

export type OutputPlatform =
  | 'github'
  | 'gitlab'
  | 'google_colab'
  | 'google_docs'
  | 'notion'
  | 'youtube'
  | 'tiktok'
  | 'instagram'
  | 'linkedin'
  | 'journal'
  | 'website'
  | 'news'
  | 'blog'
  | 'other';

export interface LearningItem {
  id: string;
  user_id: string;
  title: string;
  source_url: string | null;
  source_type: SourceType;
  description: string | null;
  topic: string | null;
  learning_goal: string | null;
  status: LearningStatus;
  created_at: string;
  completed_at: string | null;
}

export interface LearningNote {
  id: string;
  user_id: string;
  learning_item_id: string;
  understanding: string;
  critical_comment: string | null;
  questions: string | null;
  ideas: string | null;
  created_at: string;
  updated_at: string;
}

export interface Project {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  project_type: ProjectType;
  status: ProjectStatus;
  priority: ProjectPriority;
  start_date: string | null;
  due_date: string | null;
  learning_item_id: string | null;
  parent_project_id: string | null;
  is_featured: boolean;
  created_at: string;
  updated_at: string;
}

export interface ProjectTask {
  id: string;
  user_id: string;
  project_id: string;
  title: string;
  description: string | null;
  status: TaskStatus;
  position: number;
  due_date: string | null;
  created_at: string;
  updated_at: string;
}

export interface Output {
  id: string;
  user_id: string;
  project_id: string;
  title: string;
  output_type: OutputType;
  platform: OutputPlatform;
  url: string;
  is_primary: boolean;
  status: string;
  published_at: string | null;
  description: string | null;
  created_at: string;
}

export interface ProjectReview {
  id: string;
  user_id: string;
  project_id: string;
  what_worked: string | null;
  what_failed: string | null;
  key_insight: string | null;
  next_step: string | null;
  created_at: string;
  updated_at: string;
}

export const SOURCE_TYPE_LABELS: Record<SourceType, string> = {
  article: 'Artikel',
  news: 'Berita',
  journal: 'Jurnal',
  youtube: 'YouTube',
  documentation: 'Dokumentasi',
  book: 'Buku',
  google_doc: 'Google Doc',
  other: 'Lainnya',
};

export const PROJECT_TYPE_LABELS: Record<ProjectType, string> = {
  experiment: 'Eksperimen',
  application: 'Aplikasi',
  article: 'Artikel',
  video: 'Video',
  research: 'Riset',
  business: 'Bisnis',
  learning: 'Belajar',
  other: 'Lainnya',
};

export const OUTPUT_TYPE_LABELS: Record<OutputType, string> = {
  code: 'Kode',
  document: 'Dokumen',
  video: 'Video',
  research: 'Riset',
  product: 'Produk',
  creative: 'Kreatif',
  presentation: 'Presentasi',
  other: 'Lainnya',
};

export const PLATFORM_LABELS: Record<OutputPlatform, string> = {
  github: 'GitHub',
  gitlab: 'GitLab',
  google_colab: 'Google Colab',
  google_docs: 'Google Docs',
  notion: 'Notion',
  youtube: 'YouTube',
  tiktok: 'TikTok',
  instagram: 'Instagram',
  linkedin: 'LinkedIn',
  journal: 'Jurnal',
  website: 'Website',
  news: 'Berita',
  blog: 'Blog',
  other: 'Lainnya',
};
