"use client";

import { useState, useEffect, useCallback } from "react";
import {
  getLinkedInCookie,
  removeLinkedInCookie,
  getClaudeApiKey,
  isOnboardingComplete,
  getArticles,
  setArticles,
  getSummaries,
  addSummary,
  getArticleStates,
  setArticleState as persistArticleState,
} from "@/lib/storage";
import { parseSavedItems, filterArticlesByDays } from "@/lib/linkedin";
import { summarizeArticle } from "@/lib/claude";
import { LinkedInArticle, ArticleSummary } from "@/types/article";
import Header from "@/components/Header";
import Settings from "@/components/Settings";
import OnboardingWizard from "@/components/OnboardingWizard";
import TimeRangeSelector from "@/components/TimeRangeSelector";
import ArticleList from "@/components/ArticleList";

export default function Home() {
  const [mounted, setMounted] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [hasLinkedIn, setHasLinkedIn] = useState(false);
  const [hasApiKey, setHasApiKey] = useState(false);

  const [articles, setArticlesState] = useState<LinkedInArticle[]>([]);
  const [summaries, setSummariesState] = useState<ArticleSummary[]>([]);
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(new Set());
  const [summarizingIds, setSummarizingIds] = useState<Set<string>>(new Set());

  const [selectedDays, setSelectedDays] = useState(7);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const refreshState = useCallback(() => {
    setHasLinkedIn(!!getLinkedInCookie());
    setHasApiKey(!!getClaudeApiKey());
    setShowOnboarding(!isOnboardingComplete());

    const savedArticles = getArticles();
    setArticlesState(savedArticles);
    setSummariesState(getSummaries());

    const states = getArticleStates();
    setDismissedIds(
      new Set(states.filter((s) => s.dismissed).map((s) => s.articleId))
    );
  }, []);

  useEffect(() => {
    setMounted(true);
    refreshState();
  }, [refreshState]);

  const handleFetchAndSummarize = async () => {
    const cookie = getLinkedInCookie();
    const apiKey = getClaudeApiKey();

    if (!cookie) {
      setError("Please set your LinkedIn cookie in settings.");
      return;
    }
    if (!apiKey) {
      setError("Please set your Claude API key in settings.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      // Fetch saved articles from LinkedIn via our API proxy
      const response = await fetch("/api/linkedin/saved", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cookie }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || `Failed to fetch articles (${response.status})`);
      }

      const data = await response.json();
      const allArticles = parseSavedItems(data);
      const filtered = filterArticlesByDays(allArticles, selectedDays);

      if (filtered.length === 0) {
        setError(
          `No saved articles found from the last ${selectedDays} days. Try a longer time range.`
        );
        setLoading(false);
        return;
      }

      // Store articles
      setArticles(filtered);
      setArticlesState(filtered);

      // Summarize each article that doesn't already have a summary
      const existingSummaries = getSummaries();
      const existingIds = new Set(existingSummaries.map((s) => s.articleId));
      const toSummarize = filtered.filter(
        (a) => !existingIds.has(a.id) && !dismissedIds.has(a.id)
      );

      // Mark all as summarizing
      setSummarizingIds(new Set(toSummarize.map((a) => a.id)));

      // Summarize one at a time to avoid rate limiting
      for (const article of toSummarize) {
        try {
          const summary = await summarizeArticle(apiKey, article);
          addSummary(summary);
          setSummariesState((prev) => [
            ...prev.filter((s) => s.articleId !== summary.articleId),
            summary,
          ]);
          setSummarizingIds((prev) => {
            const next = new Set(prev);
            next.delete(article.id);
            return next;
          });
        } catch (err) {
          console.error(`Failed to summarize article ${article.id}:`, err);
          setSummarizingIds((prev) => {
            const next = new Set(prev);
            next.delete(article.id);
            return next;
          });
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred.");
    } finally {
      setLoading(false);
    }
  };

  const handleToggleDismiss = (articleId: string, dismissed: boolean) => {
    persistArticleState(articleId, dismissed);
    setDismissedIds((prev) => {
      const next = new Set(prev);
      if (dismissed) next.add(articleId);
      else next.delete(articleId);
      return next;
    });
  };

  const handleLogout = () => {
    if (window.confirm("Disconnect LinkedIn? Your summaries will be kept.")) {
      removeLinkedInCookie();
      refreshState();
    }
  };

  if (!mounted) return null;

  if (showOnboarding) {
    return (
      <OnboardingWizard
        onComplete={() => {
          setShowOnboarding(false);
          refreshState();
        }}
      />
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-zinc-50 dark:bg-zinc-950">
      <Header
        hasLinkedIn={hasLinkedIn}
        hasApiKey={hasApiKey}
        onSettingsClick={() => setShowSettings(true)}
        onLogout={handleLogout}
      />

      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-6">
        {/* Setup warnings */}
        {(!hasLinkedIn || !hasApiKey) && (
          <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-200">
            {!hasLinkedIn && !hasApiKey
              ? "Please set up your LinkedIn cookie and Claude API key in "
              : !hasLinkedIn
              ? "Please set up your LinkedIn cookie in "
              : "Please set up your Claude API key in "}
            <button
              onClick={() => setShowSettings(true)}
              className="font-medium underline"
            >
              Settings
            </button>
            {" "}to get started.
          </div>
        )}

        {/* Time range selector */}
        {hasLinkedIn && hasApiKey && (
          <TimeRangeSelector
            selectedDays={selectedDays}
            onSelect={setSelectedDays}
            onFetch={handleFetchAndSummarize}
            loading={loading}
          />
        )}

        {/* Error display */}
        {error && (
          <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-800 dark:bg-red-950 dark:text-red-300">
            {error}
          </div>
        )}

        {/* Articles */}
        {articles.length > 0 && (
          <div className="mt-6">
            <ArticleList
              articles={articles}
              summaries={summaries}
              dismissedIds={dismissedIds}
              summarizingIds={summarizingIds}
              onToggleDismiss={handleToggleDismiss}
            />
          </div>
        )}

        {/* Empty state */}
        {articles.length === 0 && hasLinkedIn && hasApiKey && !loading && (
          <div className="mt-12 text-center">
            <div className="mb-4 text-4xl text-zinc-300">
              <svg className="mx-auto h-16 w-16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
              </svg>
            </div>
            <h3 className="mb-1 text-lg font-medium text-zinc-600 dark:text-zinc-400">
              No articles loaded yet
            </h3>
            <p className="text-sm text-zinc-500">
              Select a time range above and click &quot;Fetch &amp; Summarize&quot; to get started.
            </p>
          </div>
        )}
      </main>

      {/* Settings Modal */}
      {showSettings && (
        <Settings
          onClose={() => setShowSettings(false)}
          onSettingsChange={refreshState}
        />
      )}
    </div>
  );
}
