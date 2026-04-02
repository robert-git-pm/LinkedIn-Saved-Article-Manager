const STORAGE_KEY = 'lamp_v1';

const state = {
  settings: {
    liAt: '',
    apiKey: '',
    days: 7,
  },
  items: [],
  summaries: {},
  done: {},
  status: '',
  error: '',
};

const setStatus = (message, isError = false) => {
  state.status = message;
  state.error = isError ? message : '';
  const statusElement = el('status');
  if (statusElement) {
    statusElement.textContent = message;
    statusElement.className = isError ? 'error' : 'success';
  }
  if (isError) {
    console.error('[LAMP]', message);
  } else {
    console.info('[LAMP]', message);
  }
};

const load = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    const parsed = JSON.parse(raw);
    Object.assign(state, parsed);
  } catch {
    // ignore broken localStorage
  }
};

const save = () => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify({
    settings: state.settings,
    items: state.items,
    summaries: state.summaries,
    done: state.done,
  }));
};

const el = (id) => document.getElementById(id);

const render = () => {
  const liAtInput = el('liAt');
  const apiKeyInput = el('apiKey');
  const daysInput = el('days');
  const statusElement = el('status');

  if (!liAtInput || !apiKeyInput || !daysInput || !statusElement) {
    console.error('[LAMP] Missing required DOM elements during render.');
    return;
  }

  liAtInput.value = state.settings.liAt;
  apiKeyInput.value = state.settings.apiKey;
  daysInput.value = String(state.settings.days);
  statusElement.textContent = state.status;
  statusElement.className = state.error ? 'error' : 'success';

  const list = el('articles');
  list.innerHTML = '';

  if (state.items.length === 0) {
    list.innerHTML = '<div class="card"><small>No saved items loaded yet.</small></div>';
    return;
  }

  state.items.forEach((item) => {
    const done = Boolean(state.done[item.id]);
    const summary = state.summaries[item.id];

    const card = document.createElement('div');
    card.className = `card ${done ? 'muted' : ''}`;
    card.innerHTML = `
      <div class="row" style="justify-content: space-between;">
        <strong>${item.title}</strong>
        <label><input type="checkbox" data-done="${item.id}" ${done ? 'checked' : ''}/> done/ignore</label>
      </div>
      <div class="row"><small>${item.author || 'Unknown author'}</small>${item.url ? `<a href="${item.url}" target="_blank" rel="noreferrer">Open</a>` : ''}</div>
      ${summary ? `<p>${summary.summary || ''}</p>
      <small><strong>Build idea:</strong> ${summary.build_idea || '-'}</small>` : '<small>No summary yet.</small>'}
    `;
    list.appendChild(card);
  });

  document.querySelectorAll('input[data-done]').forEach((checkbox) => {
    checkbox.addEventListener('change', (event) => {
      const id = event.target.getAttribute('data-done');
      state.done[id] = event.target.checked;
      save();
      render();
    });
  });
};

const request = async (path, body) => {
  if (window.location.protocol === 'file:') {
    throw new Error('You opened index.html directly via file://. Please run "node server.mjs" and open http://localhost:3000.');
  }

  const response = await fetch(path, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || 'Request failed');
  return data;
};

const refresh = async () => {
  setStatus('Loading saved LinkedIn items...');
  render();

  try {
    state.settings.liAt = el('liAt').value.trim();
    state.settings.apiKey = el('apiKey').value.trim();
    state.settings.days = Number(el('days').value || 7);

    if (!state.settings.liAt) throw new Error('Please add your LinkedIn li_at cookie first.');
    if (!state.settings.apiKey) throw new Error('Please add your Claude API key first.');

    save();

    const { items } = await request('/api/linkedin/saved', {
      liAt: state.settings.liAt,
      count: Math.max(10, state.settings.days * 6),
    });

    state.items = items;
    setStatus(`Loaded ${items.length} items. Summarizing...`);
    render();

    const candidates = state.items.filter((item) => !state.done[item.id]).slice(0, 12);

    const { summaries } = await request('/api/anthropic/summarize', {
      apiKey: state.settings.apiKey,
      articles: candidates.map((item) => ({
        id: item.id,
        title: item.title,
        url: item.url,
        author: item.author,
        snippet: item.snippet,
      })),
    });

    summaries.forEach((summary) => {
      if (summary?.id) state.summaries[summary.id] = summary;
    });

    setStatus('Summaries updated.');
    save();
  } catch (error) {
    setStatus(error?.message || 'Unexpected error', true);
  }

  render();
};

const init = () => {
  const refreshButton = el('refresh');
  const clearButton = el('clear');

  if (!refreshButton || !clearButton) {
    console.error('[LAMP] Initialization failed: button elements not found.');
    return;
  }

  refreshButton.addEventListener('click', refresh);
  clearButton.addEventListener('click', () => {
    localStorage.removeItem(STORAGE_KEY);
    location.reload();
  });

  load();
  render();
  if (window.location.protocol === 'file:') {
    setStatus('Detected file:// mode. Start the local server with "node server.mjs" and open http://localhost:3000.', true);
  } else {
    setStatus('Ready. Add your credentials and click "Fetch & Summarize".');
  }
};

window.addEventListener('error', (event) => {
  setStatus(`Unexpected UI error: ${event.message}`, true);
});

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init, { once: true });
} else {
  init();
}
