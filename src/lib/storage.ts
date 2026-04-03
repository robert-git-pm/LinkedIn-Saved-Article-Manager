import { ArticleSummary, ArticleState, LinkedInArticle } from "@/types/article";

const KEYS = {
  LINKEDIN_COOKIE: "lamp_linkedin_cookie",
  CLAUDE_API_KEY: "lamp_claude_api_key",
  ARTICLES: "lamp_articles",
  SUMMARIES: "lamp_summaries",
  ARTICLE_STATES: "lamp_article_states",
  ONBOARDING_COMPLETE: "lamp_onboarding_complete",
} as const;

function getItem<T>(key: string): T | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function setItem<T>(key: string, value: T): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(key, JSON.stringify(value));
}

function removeItem(key: string): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(key);
}

// LinkedIn Cookie
export function getLinkedInCookie(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(KEYS.LINKEDIN_COOKIE);
}

export function setLinkedInCookie(cookie: string): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(KEYS.LINKEDIN_COOKIE, cookie);
}

export function removeLinkedInCookie(): void {
  removeItem(KEYS.LINKEDIN_COOKIE);
}

// Claude API Key
export function getClaudeApiKey(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(KEYS.CLAUDE_API_KEY);
}

export function setClaudeApiKey(key: string): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(KEYS.CLAUDE_API_KEY, key);
}

export function removeClaudeApiKey(): void {
  removeItem(KEYS.CLAUDE_API_KEY);
}

// Articles
export function getArticles(): LinkedInArticle[] {
  return getItem<LinkedInArticle[]>(KEYS.ARTICLES) ?? [];
}

export function setArticles(articles: LinkedInArticle[]): void {
  setItem(KEYS.ARTICLES, articles);
}

// Summaries
export function getSummaries(): ArticleSummary[] {
  return getItem<ArticleSummary[]>(KEYS.SUMMARIES) ?? [];
}

export function setSummaries(summaries: ArticleSummary[]): void {
  setItem(KEYS.SUMMARIES, summaries);
}

export function addSummary(summary: ArticleSummary): void {
  const existing = getSummaries();
  const filtered = existing.filter((s) => s.articleId !== summary.articleId);
  setSummaries([...filtered, summary]);
}

// Article States (dismissed/checked)
export function getArticleStates(): ArticleState[] {
  return getItem<ArticleState[]>(KEYS.ARTICLE_STATES) ?? [];
}

export function setArticleState(articleId: string, dismissed: boolean): void {
  const states = getArticleStates();
  const existing = states.findIndex((s) => s.articleId === articleId);
  const newState: ArticleState = {
    articleId,
    dismissed,
    dismissedAt: dismissed ? new Date().toISOString() : undefined,
  };
  if (existing >= 0) {
    states[existing] = newState;
  } else {
    states.push(newState);
  }
  setItem(KEYS.ARTICLE_STATES, states);
}

export function isArticleDismissed(articleId: string): boolean {
  const states = getArticleStates();
  return states.find((s) => s.articleId === articleId)?.dismissed ?? false;
}

// Onboarding
export function isOnboardingComplete(): boolean {
  if (typeof window === "undefined") return false;
  return localStorage.getItem(KEYS.ONBOARDING_COMPLETE) === "true";
}

export function setOnboardingComplete(): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(KEYS.ONBOARDING_COMPLETE, "true");
}

// Clear all data
export function clearAllData(): void {
  Object.values(KEYS).forEach((key) => removeItem(key));
}
