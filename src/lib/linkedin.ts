import { LinkedInArticle } from "@/types/article";

// LinkedIn's Search API returns a normalized response with `included[]` containing
// various entity types (updates, articles, actors, images, etc.).
// We extract saved posts/articles from the UpdateV2 and article entities.

/* eslint-disable @typescript-eslint/no-explicit-any */

function safeStr(val: any): string {
  if (!val) return "";
  if (typeof val === "string") return val;
  if (typeof val === "object" && val.text) return String(val.text);
  return "";
}

export function parseSavedItems(data: unknown): LinkedInArticle[] {
  if (!data || typeof data !== "object") return [];

  const response = data as { included?: any[]; data?: any };
  const included: any[] = response.included ?? [];
  if (!Array.isArray(included) || included.length === 0) return [];

  // Build lookup map by entityUrn
  const entityMap = new Map<string, any>();
  for (const entity of included) {
    if (entity.entityUrn) {
      entityMap.set(entity.entityUrn, entity);
    }
    // Also index by $recipeType-based keys
    if (entity["*entity"]) {
      entityMap.set(entity["*entity"], entity);
    }
  }

  const articles: LinkedInArticle[] = [];
  const seen = new Set<string>();

  for (const entity of included) {
    const type: string = entity.$type ?? entity.$recipeType ?? "";

    // Strategy 1: Feed UpdateV2 entities (posts, shares, articles)
    if (type.includes("Update") || type.includes("update")) {
      const article = parseUpdate(entity, entityMap);
      if (article && !seen.has(article.id)) {
        seen.add(article.id);
        articles.push(article);
      }
      continue;
    }

    // Strategy 2: Direct article/share entities
    if (
      type.includes("Article") ||
      type.includes("Share") ||
      type.includes("Post")
    ) {
      const article = parseDirectEntity(entity);
      if (article && !seen.has(article.id)) {
        seen.add(article.id);
        articles.push(article);
      }
      continue;
    }

    // Strategy 3: Search result items that reference content
    if (type.includes("SearchResult") || type.includes("EntityResult")) {
      const linkedEntity = entity["*entity"] || entity.entityUrn;
      const resolved = entityMap.get(linkedEntity);
      if (resolved) {
        const article =
          parseUpdate(resolved, entityMap) ?? parseDirectEntity(resolved);
        if (article && !seen.has(article.id)) {
          seen.add(article.id);
          articles.push(article);
        }
      }
    }
  }

  return articles;
}

function parseUpdate(
  entity: any,
  entityMap: Map<string, any>
): LinkedInArticle | null {
  const urn: string = entity.urn ?? entity.entityUrn ?? "";
  if (!urn) return null;

  // Extract commentary text
  const commentary: string =
    safeStr(entity.commentary?.text) ||
    safeStr(entity.commentary) ||
    "";

  // Extract actor name (the person who posted)
  let author = "Unknown";
  const actorRef = entity.actor?.["*name"] ?? entity.actor?.name;
  if (actorRef && typeof actorRef === "string" && entityMap.has(actorRef)) {
    author = safeStr(entityMap.get(actorRef)?.text) || actorRef;
  } else {
    author = safeStr(entity.actor?.name) || safeStr(entity.actorName) || "Unknown";
  }

  // Extract article content if this update contains an article
  const content = entity.content ?? {};
  const articleComponent =
    content["com.linkedin.voyager.feed.render.ArticleComponent"] ??
    content.articleComponent ??
    content.article ??
    null;

  let title = "";
  let url = "";
  let description = "";

  if (articleComponent) {
    title = safeStr(articleComponent.title);
    url = articleComponent.navigationUrl ?? articleComponent.url ?? "";
    description = safeStr(articleComponent.description) || safeStr(articleComponent.subtitle);
  }

  // Fallback: use commentary as title/description
  if (!title) title = commentary.substring(0, 120) || "Untitled Post";
  if (!description) description = commentary;

  // Extract navigation URL from various locations
  if (!url) {
    url =
      entity.navigationUrl ??
      entity.permalink ??
      content.navigationUrl ??
      "";
  }

  // Extract saved timestamp
  const savedAt = entity.savedAt
    ? new Date(entity.savedAt).toISOString()
    : entity.createdAt
    ? new Date(entity.createdAt).toISOString()
    : new Date().toISOString();

  return {
    id: urn,
    title,
    url,
    author,
    savedAt,
    previewText: description.substring(0, 300),
  };
}

function parseDirectEntity(entity: any): LinkedInArticle | null {
  const urn: string = entity.urn ?? entity.entityUrn ?? "";
  if (!urn) return null;

  const title =
    safeStr(entity.title) ||
    safeStr(entity.name) ||
    safeStr(entity.headline) ||
    "";
  const url = entity.navigationUrl ?? entity.url ?? entity.permalink ?? "";
  const description =
    safeStr(entity.description) ||
    safeStr(entity.subtitle) ||
    safeStr(entity.text) ||
    "";

  if (!title && !description) return null;

  const savedAt = entity.savedAt
    ? new Date(entity.savedAt).toISOString()
    : entity.createdAt
    ? new Date(entity.createdAt).toISOString()
    : new Date().toISOString();

  return {
    id: urn,
    title: title || "Untitled",
    url,
    author: safeStr(entity.author) || safeStr(entity.authorName) || "Unknown",
    savedAt,
    previewText: description.substring(0, 300),
  };
}

export function filterArticlesByDays(
  articles: LinkedInArticle[],
  days: number
): LinkedInArticle[] {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);
  return articles.filter((a) => new Date(a.savedAt) >= cutoff);
}
