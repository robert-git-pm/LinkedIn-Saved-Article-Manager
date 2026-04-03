import { LinkedInArticle, ArticleSummary } from "@/types/article";

interface ClaudeResponse {
  content: Array<{ type: "text"; text: string }>;
}

export async function summarizeArticle(
  apiKey: string,
  article: LinkedInArticle
): Promise<ArticleSummary> {
  const prompt = `You are a helpful assistant that summarizes LinkedIn articles and posts concisely.

Summarize this saved LinkedIn article/post. Provide:
1. A clear, concise summary (2-3 sentences)
2. Key takeaways (3-5 bullet points of the most actionable or interesting insights)

Article details:
- Title: ${article.title}
- Author: ${article.author}
- URL: ${article.url}
- Content/Preview: ${article.previewText}

Respond in this exact JSON format:
{
  "summary": "Your concise summary here",
  "keyTakeaways": ["Takeaway 1", "Takeaway 2", "Takeaway 3"]
}`;

  const messages = [{ role: "user" as const, content: prompt }];

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
      "anthropic-dangerous-direct-browser-access": "true",
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-6-20250514",
      max_tokens: 1024,
      messages,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    if (response.status === 401) {
      throw new Error("Invalid API key. Please check your Claude API key in settings.");
    }
    if (response.status === 429) {
      throw new Error("Rate limit exceeded. Please wait a moment and try again.");
    }
    throw new Error(`Claude API error: ${response.status} - ${errorText}`);
  }

  const data: ClaudeResponse = await response.json();
  const text = data.content?.[0]?.text ?? "";

  try {
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("No JSON in response");
    const parsed = JSON.parse(jsonMatch[0]) as {
      summary: string;
      keyTakeaways: string[];
    };
    return {
      articleId: article.id,
      summary: parsed.summary,
      keyTakeaways: parsed.keyTakeaways,
      generatedAt: new Date().toISOString(),
    };
  } catch {
    return {
      articleId: article.id,
      summary: text.substring(0, 500),
      keyTakeaways: [],
      generatedAt: new Date().toISOString(),
    };
  }
}

