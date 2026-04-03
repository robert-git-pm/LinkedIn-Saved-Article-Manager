import { LinkedInArticle } from "@/types/article";

interface VoyagerSavedItem {
  entityUrn?: string;
  savedAt?: number;
  contentMetadata?: {
    title?: string;
    description?: string;
    url?: string;
    author?: {
      name?: string;
    };
  };
  content?: {
    "com.linkedin.voyager.feed.render.UpdateV2"?: {
      urn?: string;
      commentary?: {
        text?: {
          text?: string;
        };
      };
      content?: {
        "com.linkedin.voyager.feed.render.ArticleComponent"?: {
          title?: { text?: string };
          subtitle?: { text?: string };
          navigationUrl?: string;
          description?: { text?: string };
        };
      };
      actor?: {
        name?: { text?: string };
      };
    };
  };
}

export function parseSavedItems(data: unknown): LinkedInArticle[] {
  const articles: LinkedInArticle[] = [];

  if (!data || typeof data !== "object") return articles;

  const responseData = data as {
    included?: VoyagerSavedItem[];
    data?: { paging?: { total?: number } };
  };
  const included = responseData.included;
  if (!Array.isArray(included)) return articles;

  for (const item of included) {
    const update =
      item.content?.["com.linkedin.voyager.feed.render.UpdateV2"];
    if (!update) continue;

    const articleComponent =
      update.content?.["com.linkedin.voyager.feed.render.ArticleComponent"];
    const commentary = update.commentary?.text?.text ?? "";
    const actorName = update.actor?.name?.text ?? "Unknown";

    const title =
      articleComponent?.title?.text ||
      commentary.substring(0, 100) ||
      "Untitled";
    const url = articleComponent?.navigationUrl ?? "";
    const previewText =
      articleComponent?.description?.text || commentary || "";

    const id =
      update.urn ?? item.entityUrn ?? `article-${articles.length}`;
    const savedAt = item.savedAt
      ? new Date(item.savedAt).toISOString()
      : new Date().toISOString();

    articles.push({
      id,
      title,
      url,
      author: actorName,
      savedAt,
      previewText: previewText.substring(0, 300),
    });
  }

  return articles;
}

export function filterArticlesByDays(
  articles: LinkedInArticle[],
  days: number
): LinkedInArticle[] {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);
  return articles.filter((a) => new Date(a.savedAt) >= cutoff);
}
