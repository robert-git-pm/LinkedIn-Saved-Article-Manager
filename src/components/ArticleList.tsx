"use client";

import { useState } from "react";
import { LinkedInArticle, ArticleSummary } from "@/types/article";
import ArticleCard from "./ArticleCard";

type FilterMode = "active" | "dismissed" | "all";

interface ArticleListProps {
  articles: LinkedInArticle[];
  summaries: ArticleSummary[];
  dismissedIds: Set<string>;
  summarizingIds: Set<string>;
  onToggleDismiss: (articleId: string, dismissed: boolean) => void;
}

export default function ArticleList({
  articles,
  summaries,
  dismissedIds,
  summarizingIds,
  onToggleDismiss,
}: ArticleListProps) {
  const [filter, setFilter] = useState<FilterMode>("active");

  const filteredArticles = articles.filter((a) => {
    const isDismissed = dismissedIds.has(a.id);
    if (filter === "active") return !isDismissed;
    if (filter === "dismissed") return isDismissed;
    return true;
  });

  const activeCount = articles.filter((a) => !dismissedIds.has(a.id)).length;
  const dismissedCount = articles.filter((a) => dismissedIds.has(a.id)).length;

  return (
    <div>
      {/* Filter tabs */}
      <div className="mb-4 flex items-center gap-1 rounded-lg bg-zinc-100 p-1 dark:bg-zinc-800">
        <button
          onClick={() => setFilter("active")}
          className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
            filter === "active"
              ? "bg-white text-zinc-900 shadow-sm dark:bg-zinc-700 dark:text-zinc-100"
              : "text-zinc-600 hover:text-zinc-800 dark:text-zinc-400"
          }`}
        >
          Active ({activeCount})
        </button>
        <button
          onClick={() => setFilter("dismissed")}
          className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
            filter === "dismissed"
              ? "bg-white text-zinc-900 shadow-sm dark:bg-zinc-700 dark:text-zinc-100"
              : "text-zinc-600 hover:text-zinc-800 dark:text-zinc-400"
          }`}
        >
          Dismissed ({dismissedCount})
        </button>
        <button
          onClick={() => setFilter("all")}
          className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
            filter === "all"
              ? "bg-white text-zinc-900 shadow-sm dark:bg-zinc-700 dark:text-zinc-100"
              : "text-zinc-600 hover:text-zinc-800 dark:text-zinc-400"
          }`}
        >
          All ({articles.length})
        </button>
      </div>

      {/* Article cards */}
      {filteredArticles.length === 0 ? (
        <div className="rounded-xl border border-dashed border-zinc-300 p-8 text-center text-sm text-zinc-500 dark:border-zinc-700">
          {filter === "active"
            ? "No active articles. All articles have been dismissed."
            : filter === "dismissed"
            ? "No dismissed articles yet."
            : "No articles found."}
        </div>
      ) : (
        <div className="space-y-3">
          {filteredArticles.map((article) => (
            <ArticleCard
              key={article.id}
              article={article}
              summary={summaries.find((s) => s.articleId === article.id)}
              dismissed={dismissedIds.has(article.id)}
              summarizing={summarizingIds.has(article.id)}
              onToggleDismiss={onToggleDismiss}
            />
          ))}
        </div>
      )}
    </div>
  );
}
