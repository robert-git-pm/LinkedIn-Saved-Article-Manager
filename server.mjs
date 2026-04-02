import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const PORT = process.env.PORT || 3000;
const CURRENT_FILE = fileURLToPath(import.meta.url);
const BASE_DIR = dirname(CURRENT_FILE);
const PUBLIC_DIR = join(BASE_DIR, 'public');

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
};

const sendJson = (res, status, body) => {
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  });
  res.end(JSON.stringify(body));
};

const parseBody = async (req) => {
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  const raw = Buffer.concat(chunks).toString('utf-8');
  return raw ? JSON.parse(raw) : {};
};

const fetchLinkedInSaved = async ({ liAt, count = 30 }) => {
  const variables = encodeURIComponent(JSON.stringify({ count, start: 0 }));
  const url = `https://www.linkedin.com/voyager/api/graphql?variables=${variables}&queryId=voyagerSavedItemsDashSavedItems.4e8a5a7f737f`; 

  const response = await fetch(url, {
    headers: {
      Cookie: `li_at=${liAt}`,
      'User-Agent': 'Mozilla/5.0',
      Accept: 'application/json',
      'X-Restli-Protocol-Version': '2.0.0',
      'Csrf-Token': 'ajax:0000000000',
    },
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`LinkedIn request failed (${response.status}): ${text.slice(0, 200)}`);
  }

  const data = await response.json();
  const included = Array.isArray(data?.included) ? data.included : [];

  return included
    .filter((item) => item?.title?.text || item?.headline?.text || item?.permalink)
    .map((item, index) => ({
      id: item.entityUrn || item.trackingId || `article-${index}`,
      title: item?.title?.text || item?.headline?.text || 'Untitled saved item',
      url: item?.permalink || '',
      author: item?.actor?.name?.text || item?.actorName?.text || '',
      savedAt: item?.savedAt || item?.lastModifiedAt || null,
      snippet: item?.summary?.text || item?.commentary?.text?.text || '',
    }));
};

const summarizeWithClaude = async ({ apiKey, articles }) => {
  const prompt = `Summarize these LinkedIn saved items for a busy professional.\n\nReturn strict JSON array with objects:\n{id,title,summary,key_takeaways:[...],build_idea,priority}\npriority must be one of: high, medium, low\n\nItems:\n${JSON.stringify(articles)}`;

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-5',
      max_tokens: 1600,
      temperature: 0.2,
      messages: [{ role: 'user', content: prompt }],
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Anthropic request failed (${response.status}): ${text.slice(0, 240)}`);
  }

  const data = await response.json();
  const text = data?.content?.[0]?.text || '[]';

  const jsonStart = text.indexOf('[');
  const jsonEnd = text.lastIndexOf(']');
  if (jsonStart === -1 || jsonEnd === -1) return [];

  return JSON.parse(text.slice(jsonStart, jsonEnd + 1));
};

const server = createServer(async (req, res) => {
  try {
    if (req.method === 'OPTIONS') {
      res.writeHead(204, {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      });
      res.end();
      return;
    }

    if (req.url === '/api/linkedin/saved' && req.method === 'POST') {
      const body = await parseBody(req);
      const items = await fetchLinkedInSaved(body);
      sendJson(res, 200, { items });
      return;
    }

    if (req.url === '/api/anthropic/summarize' && req.method === 'POST') {
      const body = await parseBody(req);
      const summaries = await summarizeWithClaude(body);
      sendJson(res, 200, { summaries });
      return;
    }

    const path = req.url === '/' ? '/index.html' : req.url;
    const filePath = join(PUBLIC_DIR, path);
    const file = await readFile(filePath);
    const ext = extname(filePath);

    res.writeHead(200, { 'Content-Type': MIME_TYPES[ext] || 'text/plain; charset=utf-8' });
    res.end(file);
  } catch (error) {
    sendJson(res, 500, { error: error instanceof Error ? error.message : 'Unknown server error' });
  }
});

server.listen(PORT, () => {
  console.log(`LAMP running at http://localhost:${PORT}`);
});
