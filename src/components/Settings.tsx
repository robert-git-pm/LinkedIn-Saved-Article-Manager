"use client";

import { useState } from "react";
import {
  getClaudeApiKey,
  setClaudeApiKey,
  removeClaudeApiKey,
  clearAllData,
} from "@/lib/storage";

interface SettingsProps {
  onClose: () => void;
  onSettingsChange: () => void;
}

export default function Settings({ onClose, onSettingsChange }: SettingsProps) {
  const [apiKey, setApiKey] = useState(() => getClaudeApiKey() ?? "");
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    if (apiKey.trim()) {
      setClaudeApiKey(apiKey.trim());
    } else {
      removeClaudeApiKey();
    }
    setSaved(true);
    onSettingsChange();
    setTimeout(() => setSaved(false), 2000);
  };

  const handleClearAll = () => {
    if (
      window.confirm(
        "This will remove all your data (API key, articles, summaries). Continue?"
      )
    ) {
      clearAllData();
      setApiKey("");
      onSettingsChange();
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="mx-4 w-full max-w-lg rounded-xl bg-white p-6 shadow-2xl dark:bg-zinc-900">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-xl font-semibold">Settings</h2>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600 dark:hover:bg-zinc-800"
          >
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="space-y-5">
          {/* LAMP Script */}
          <div>
            <label className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
              LAMP Browser Script
            </label>
            <p className="mb-2 text-xs text-zinc-500">
              The Tampermonkey script that imports your saved LinkedIn posts.
            </p>
            <a
              href="/lamp-linkedin.user.js"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 rounded-md bg-zinc-100 px-3 py-1.5 text-xs font-medium text-zinc-700 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300"
            >
              Reinstall LAMP Script
            </a>
          </div>

          {/* Claude API Key */}
          <div>
            <label className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Claude API Key
            </label>
            <p className="mb-2 text-xs text-zinc-500">
              Used for AI-powered article summaries (Claude Sonnet 4.6). Get your key from{" "}
              <a
                href="https://console.anthropic.com/settings/keys"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 underline dark:text-blue-400"
              >
                console.anthropic.com
              </a>
            </p>
            <input
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="sk-ant-api03-..."
              className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-zinc-700 dark:bg-zinc-800"
            />
            {apiKey && (
              <button
                onClick={() => {
                  setApiKey("");
                  removeClaudeApiKey();
                  onSettingsChange();
                }}
                className="mt-1 text-xs text-red-600 hover:underline"
              >
                Remove API key
              </button>
            )}
          </div>

          {/* Save Button */}
          <div className="flex items-center gap-3">
            <button
              onClick={handleSave}
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700"
            >
              Save Settings
            </button>
            {saved && (
              <span className="text-sm text-green-600">Settings saved!</span>
            )}
          </div>

          {/* Danger Zone */}
          <div className="border-t border-zinc-200 pt-4 dark:border-zinc-700">
            <button
              onClick={handleClearAll}
              className="text-sm text-red-600 hover:underline"
            >
              Clear all data &amp; reset app
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
