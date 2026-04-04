"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import {
  getClaudeApiKey,
  isOnboardingComplete,
  getArticles,
  setArticles,
  getSummaries,
  addSummary,
  getArticleStates,
  setArticleState as persistArticleState,
} from "@/lib/storage";
import { summarizeArticle } from "@/lib/claude";
import { LinkedInArticle, ArticleSummary } from "@/types/article";
import Header from "@/components/Header";
import Settings from "@/components/Settings";
import OnboardingWizard from "@/components/OnboardingWizard";
import TimeRangeSelector from "@/components/TimeRangeSelector";
import ArticleList from "@/components/ArticleList";

function filterArticlesByDays(articles: LinkedInArticle[], days: number): LinkedInArticle[] {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);
  return articles.filter((a) => new Date(a.savedAt) >= cutoff);
}

export default function Home() {
  const [mounted, setMounted] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [hasApiKey, setHasApiKey] = useState(false);

  const [articles, setArticlesState] = useState<LinkedInArticle[]>([]);
  const [summaries, setSummariesState] = useState<ArticleSummary[]>([]);
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(new Set());
  const [summarizingIds, setSummarizingIds] = useState<Set<string>>(new Set());

  const [selectedDays, setSelectedDays] = useState(7);
  const [loading, setLoading] = useState(false);
  const [waitingForImport, setWaitingForImport] = useState(false);
  const [error, setError] = useState("");

  const importTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const refreshState = useCallback(() => {
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

  // postMessage listener for Tampermonkey imports
  useEffect(() => {
    const handleMessage = async (event: MessageEvent) => {
      // Only accept messages from LinkedIn
      if (event.origin !== "https://www.linkedin.com") return;
      if (event.data?.type !== "lamp-import") return;

      const incoming: LinkedInArticle[] = event.data.articles ?? [];
      if (incoming.length === 0) {
        setError("No articles received from LinkedIn. Try scrolling down on the saved posts page first.");
        setWaitingForImport(false);
        return;
      }

      if (importTimeoutRef.current) {
        clearTimeout(importTimeoutRef.current);
        importTimeoutRef.current = null;
      }
      setWaitingForImport(false);

      const filtered = filterArticlesByDays(incoming, selectedDays);
      const toStore = filtered.length > 0 ? filtered : incoming;

      setArticles(toStore);
      setArticlesState(toStore);
      setError("");

      // Summarize new articles
      const existingSummaries = getSummaries();
      const existingIds = new Set(existingSummaries.map((s) => s.articleId));
      const apiKey = getClaudeApiKey();

      if (!apiKey) {
        setError("Articles imported! Please set your Claude API key in Settings to generate summaries.");
        return;
      }

      const toSummarize = toStore.filter(
        (a) => !existingIds.has(a.id) && !dismissedIds.has(a.id)
      );

      setSummarizingIds(new Set(toSummarize.map((a) => a.id)));
      setLoading(true);

      for (const article of toSummarize) {
        try {
          const summary = await summarizeArticle(apiKey, article);
          addSummary(summary);
          setSummariesState((prev) => [
            ...prev.filter((s) => s.articleId !== summary.articleId),
            summary,
          ]);
        } catch (err) {
          console.error(`Failed to summarize article ${article.id}:`, err);
        } finally {
          setSummarizingIds((prev) => {
            const next = new Set(prev);
            next.delete(article.id);
            return next;
          });
        }
      }

      setLoading(false);
    };

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [selectedDays, dismissedIds]);

  useEffect(() => {
    setMounted(true);
    refreshState();
  }, [refreshState]);

  const handleImportFromLinkedIn = () => {
    setError("");
    setWaitingForImport(true);

    // Open LinkedIn saved posts as popup — window.opener will be available in the script
    window.open(
      "https://www.linkedin.com/my-items/saved-posts/",
      "lamp-linkedin",
      "width=1200,height=800,noopener=no,noreferrer=no"
    );

    // Timeout after 90 seconds
    importTimeoutRef.current = setTimeout(() => {
      setWaitingForImport(false);
      setError(
        "No data received from LinkedIn. Is the LAMP script installed in Tampermonkey? " +
          "Make sure to install it from Settings → Reinstall LAMP Script."
      );
    }, 90000);
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
        articleCount={articles.length}
        hasApiKey={hasApiKey}
        onSettingsClick={() => setShowSettings(true)}
      />

      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-6">
        {/* Setup warning */}
        {!hasApiKey && (
          <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-200">
            Please set up your Claude API key in{" "}
            <button
              onClick={() => setShowSettings(true)}
              className="font-medium underline"
            >
              Settings
            </button>{" "}
            to generate summaries.
          </div>
        )}

        {/* Import button + time range */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
          <div className="flex-1">
            <TimeRangeSelector
              selectedDays={selectedDays}
              onSelect={setSelectedDays}
              onFetch={handleImportFromLinkedIn}
              loading={loading || waitingForImport}
            />
          </div>
        </div>

        {/* Waiting for import indicator */}
        {waitingForImport && (
          <div className="mt-4 flex items-center gap-3 rounded-lg border border-blue-200 bg-blue-50 p-4 text-sm text-blue-700 dark:border-blue-800 dark:bg-blue-950 dark:text-blue-300">
            <svg className="h-5 w-5 animate-spin flex-shrink-0" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            <span>
              Waiting for LinkedIn import… In the popup, the LAMP script will
              send your articles automatically. If nothing happens after a few
              seconds, click the &quot;Send to LAMP&quot; button in the popup.
            </span>
          </div>
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
        {articles.length === 0 && !loading && !waitingForImport && (
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
              Click &quot;Import from LinkedIn&quot; to fetch your saved posts.
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
