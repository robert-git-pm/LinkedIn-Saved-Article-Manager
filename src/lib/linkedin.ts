import { LinkedInArticle } from "@/types/article";

// LinkedIn Voyager responses use a normalized format with `included` arrays
// containing various entity types. We extract articles/posts from these.

interface VoyagerEntity {
  $type?: string;
  entityUrn?: string;
  "*savedEntity"?: string;
  savedAt?: number;
  // Feed update fields
  urn?: string;
  commentary?: { text?: { text?: string } };
  content?: Record<string, unknown>;
  actor?: { name?: { text?: string }; image?: unknown };
  // Article component fields
  title?: { text?: string } | string;
  subtitle?: { text?: string } | string;
  navigationUrl?: string;
  description?: { text?: string } | string;
  // Generic fields
  name?: { text?: string } | string;
  headline?: { text?: string } | string;
}

function extractText(
  field: { text?: string } | string | undefined
): string {
  if (!field) return "";
  if (typeof field === "string") return field;
  return field.text ?? "";
}

export function parseSavedItems(data: unknown): LinkedInArticle[] {
  if (!data || typeof data !== "object") return [];

  const response = data as {
    included?: VoyagerEntity[];
    elements?: VoyagerEntity[];
    data?: {
      elements?: VoyagerEntity[];
      "*elements"?: string[];
      paging?: { total?: number };
    };
  };

  const included = response.included ?? [];
  const elements = response.elements ?? response.data?.elements ?? [];

  // Build a lookup map for included entities by URN
  const entityMap = new Map<string, VoyagerEntity>();
  for (const entity of included) {
    if (entity.entityUrn) {
      entityMap.set(entity.entityUrn, entity);
    }
  }

  const articles: LinkedInArticle[] = [];
  const seen = new Set<string>();

  // Strategy 1: Parse from `elements` (save records pointing to content)
  for (const element of elements) {
    const savedEntity =
      element["*savedEntity"] ?? element.entityUrn ?? "";
    const resolvedEntity = entityMap.get(savedEntity) ?? element;

    const article = extractArticle(resolvedEntity, element.savedAt);
    if (article && !seen.has(article.id)) {
      seen.add(article.id);
      articles.push(article);
    }
  }

  // Strategy 2: Parse directly from `included` (feed updates, articles)
  for (const entity of included) {
    const article = extractArticle(entity, entity.savedAt);
    if (article && !seen.has(article.id)) {
      seen.add(article.id);
      articles.push(article);
    }
  }

  return articles;
}

function extractArticle(
  entity: VoyagerEntity,
  savedAtTimestamp?: number
): LinkedInArticle | null {
  const entityType = entity.$type ?? "";

  // Skip non-content entities (profiles, images, etc.)
  if (
    entityType.includes("MiniProfile") ||
    entityType.includes("Image") ||
    entityType.includes("Paging") ||
    entityType.includes("Metadata")
  ) {
    return null;
  }

  // Extract fields from various entity formats
  const title =
    extractText(entity.title) ||
    entity.commentary?.text?.text?.substring(0, 100) ||
    extractText(entity.name) ||
    "";
  const url = entity.navigationUrl ?? "";
  const author =
    entity.actor?.name
      ? extractText(entity.actor.name as { text?: string } | string)
      : "";
  const previewText =
    extractText(entity.description) ||
    entity.commentary?.text?.text ||
    extractText(entity.headline) ||
    "";
  const id = entity.urn ?? entity.entityUrn ?? "";

  // Must have at least a title or preview text to be considered an article
  if (!title && !previewText) return null;
  // Must have an identifiable URN
  if (!id) return null;

  const savedAt = savedAtTimestamp
    ? new Date(savedAtTimestamp).toISOString()
    : new Date().toISOString();

  return {
    id,
    title: title || "Untitled",
    url,
    author: author || "Unknown",
    savedAt,
    previewText: previewText.substring(0, 300),
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
