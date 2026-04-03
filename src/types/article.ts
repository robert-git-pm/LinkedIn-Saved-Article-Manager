export interface LinkedInArticle {
  id: string;
  title: string;
  url: string;
  author: string;
  savedAt: string; // ISO date string
  previewText: string;
}

export interface ArticleSummary {
  articleId: string;
  summary: string;
  keyTakeaways: string[];
  generatedAt: string; // ISO date string
}

export interface ArticleState {
  articleId: string;
  dismissed: boolean;
  dismissedAt?: string;
}

