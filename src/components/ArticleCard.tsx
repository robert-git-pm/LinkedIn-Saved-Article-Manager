"use client";

import { LinkedInArticle, ArticleSummary } from "@/types/article";

interface ArticleCardProps {
  article: LinkedInArticle;
  summary?: ArticleSummary;
  dismissed: boolean;
  summarizing: boolean;
  onToggleDismiss: (articleId: string, dismissed: boolean) => void;
}

export default function ArticleCard({
  article,
  summary,
  dismissed,
  summarizing,
  onToggleDismiss,
}: ArticleCardProps) {
  const savedDate = new Date(article.savedAt).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  return (
    <div
      className={`rounded-xl border p-5 transition-all ${
        dismissed
          ? "border-zinc-100 bg-zinc-50 opacity-50 dark:border-zinc-800/50 dark:bg-zinc-900/50"
          : "border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900"
      }`}
    >
      <div className="flex gap-3">
        {/* Checkbox */}
        <div className="pt-0.5">
          <input
            type="checkbox"
            checked={dismissed}
            onChange={(e) => onToggleDismiss(article.id, e.target.checked)}
            className="h-4 w-4 cursor-pointer rounded border-zinc-300 text-blue-600 focus:ring-blue-500"
            title={dismissed ? "Mark as unread" : "Dismiss article"}
          />
        </div>

        {/* Content */}
        <div className="min-w-0 flex-1">
          {/* Header */}
          <div className="mb-2 flex items-start justify-between gap-2">
            <div>
              <h3
                className={`font-semibold leading-tight ${
                  dismissed
                    ? "text-zinc-400 line-through dark:text-zinc-600"
                    : "text-zinc-900 dark:text-zinc-100"
                }`}
              >
                {article.url ? (
                  <a
                    href={article.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-blue-600 hover:underline"
                  >
                    {article.title}
                  </a>
                ) : (
                  article.title
                )}
              </h3>
              <p className="mt-0.5 text-xs text-zinc-500">
                {article.author} &middot; Saved {savedDate}
              </p>
            </div>
            {article.url && (
              <a
                href={article.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-shrink-0 rounded-lg p-1 text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-blue-600 dark:hover:bg-zinc-800"
                title="Open original"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </a>
            )}
          </div>

          {/* Preview text (shown if no summary yet) */}
          {!summary && !summarizing && article.previewText && (
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              {article.previewText}
            </p>
          )}

          {/* Loading state */}
          {summarizing && (
            <div className="mt-2 space-y-2">
              <div className="h-4 w-3/4 animate-pulse rounded bg-zinc-200 dark:bg-zinc-700" />
              <div className="h-4 w-1/2 animate-pulse rounded bg-zinc-200 dark:bg-zinc-700" />
            </div>
          )}

          {/* Summary */}
          {summary && !dismissed && (
            <div className="mt-2">
              <p className="text-sm text-zinc-700 dark:text-zinc-300">
                {summary.summary}
              </p>
              {summary.keyTakeaways.length > 0 && (
                <div className="mt-3">
                  <p className="mb-1 text-xs font-medium uppercase tracking-wide text-zinc-500">
                    Key Takeaways
                  </p>
                  <ul className="space-y-1">
                    {summary.keyTakeaways.map((t, i) => (
                      <li
                        key={i}
                        className="flex gap-2 text-sm text-zinc-600 dark:text-zinc-400"
                      >
                        <span className="mt-1 flex-shrink-0 text-blue-500">&bull;</span>
                        <span>{t}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
