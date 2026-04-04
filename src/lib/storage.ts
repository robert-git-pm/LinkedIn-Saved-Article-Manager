import { ArticleSummary, ArticleState, LinkedInArticle } from "@/types/article";

const KEYS = {
  CLAUDE_API_KEY: "lamp_claude_api_key",
  ARTICLES: "lamp_articles",
  SUMMARIES: "lamp_summaries",
  ARTICLE_STATES: "lamp_article_states",
  ONBOARDING_COMPLETE: "lamp_onboarding_complete",
} as const;

function isBrowser(): boolean {
  return typeof window !== "undefined";
}

function getItem<T>(key: string): T | null {
  if (!isBrowser()) return null;
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function setItem<T>(key: string, value: T): void {
  if (!isBrowser()) return;
  localStorage.setItem(key, JSON.stringify(value));
}

function removeItem(key: string): void {
  if (!isBrowser()) return;
  localStorage.removeItem(key);
}

function getRawItem(key: string): string | null {
  if (!isBrowser()) return null;
  return localStorage.getItem(key);
}

function setRawItem(key: string, value: string): void {
  if (!isBrowser()) return;
  localStorage.setItem(key, value);
}

// Claude API Key
export function getClaudeApiKey(): string | null {
  return getRawItem(KEYS.CLAUDE_API_KEY);
}

export function setClaudeApiKey(key: string): void {
  setRawItem(KEYS.CLAUDE_API_KEY, key);
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
  const idx = states.findIndex((s) => s.articleId === articleId);
  const newState: ArticleState = {
    articleId,
    dismissed,
    dismissedAt: dismissed ? new Date().toISOString() : undefined,
  };
  if (idx >= 0) {
    states[idx] = newState;
  } else {
    states.push(newState);
  }
  setItem(KEYS.ARTICLE_STATES, states);
}

// Onboarding
export function isOnboardingComplete(): boolean {
  return getRawItem(KEYS.ONBOARDING_COMPLETE) === "true";
}

export function setOnboardingComplete(): void {
  setRawItem(KEYS.ONBOARDING_COMPLETE, "true");
}

// Clear all data
export function clearAllData(): void {
  Object.values(KEYS).forEach((key) => removeItem(key));
}
