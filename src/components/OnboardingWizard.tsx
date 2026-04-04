"use client";

import { useState } from "react";
import { setClaudeApiKey, setOnboardingComplete } from "@/lib/storage";

interface OnboardingWizardProps {
  onComplete: () => void;
}

export default function OnboardingWizard({ onComplete }: OnboardingWizardProps) {
  const [step, setStep] = useState(0);
  const [apiKey, setApiKey] = useState("");
  const [error, setError] = useState("");

  const handleFinish = () => {
    if (!apiKey.trim()) {
      setError("Please enter your Claude API key.");
      return;
    }
    setClaudeApiKey(apiKey.trim());
    setOnboardingComplete();
    onComplete();
  };

  const steps = [
    // Step 0: Welcome
    <div key="welcome" className="text-center">
      <div className="mb-6 text-6xl">
        <span className="text-blue-600 font-bold">LAMP</span>
      </div>
      <h2 className="mb-3 text-2xl font-bold">Welcome to LAMP</h2>
      <p className="mb-2 text-zinc-600 dark:text-zinc-400">
        LinkedIn Article Management &amp; Productivity
      </p>
      <p className="mx-auto max-w-md text-sm text-zinc-500">
        LAMP uses a small browser script to import your saved LinkedIn posts,
        then summarizes them with Claude AI — all stored locally in your browser.
      </p>
      <button
        onClick={() => setStep(1)}
        className="mt-8 rounded-lg bg-blue-600 px-6 py-3 font-medium text-white transition-colors hover:bg-blue-700"
      >
        Get Started
      </button>
    </div>,

    // Step 1: Tampermonkey setup
    <div key="tampermonkey" className="max-w-md mx-auto">
      <h2 className="mb-2 text-xl font-bold">Install the LAMP Script</h2>
      <p className="mb-4 text-sm text-zinc-500">
        LAMP uses a Tampermonkey userscript to read your saved LinkedIn posts
        directly in your browser — no cookie sharing required.
      </p>

      <div className="space-y-4">
        {/* Step 1 */}
        <div className="flex gap-3">
          <div className="flex-shrink-0 flex h-7 w-7 items-center justify-center rounded-full bg-blue-100 text-xs font-bold text-blue-700 dark:bg-blue-900 dark:text-blue-300">
            1
          </div>
          <div>
            <p className="text-sm font-medium text-zinc-800 dark:text-zinc-200">
              Install Tampermonkey
            </p>
            <p className="mt-0.5 text-xs text-zinc-500">
              A free browser extension that lets you run custom scripts.
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
              <a
                href="https://chromewebstore.google.com/detail/tampermonkey/dhdgffkkebhmkfjojejmpbldmpobfkfo"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 rounded-md bg-zinc-100 px-2 py-1 text-xs font-medium text-zinc-700 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300"
              >
                Chrome
              </a>
              <a
                href="https://addons.mozilla.org/firefox/addon/tampermonkey/"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 rounded-md bg-zinc-100 px-2 py-1 text-xs font-medium text-zinc-700 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300"
              >
                Firefox
              </a>
              <a
                href="https://apps.apple.com/app/tampermonkey/id1482490089"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 rounded-md bg-zinc-100 px-2 py-1 text-xs font-medium text-zinc-700 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300"
              >
                Safari
              </a>
            </div>
          </div>
        </div>

        {/* Step 2 */}
        <div className="flex gap-3">
          <div className="flex-shrink-0 flex h-7 w-7 items-center justify-center rounded-full bg-blue-100 text-xs font-bold text-blue-700 dark:bg-blue-900 dark:text-blue-300">
            2
          </div>
          <div>
            <p className="text-sm font-medium text-zinc-800 dark:text-zinc-200">
              Install the LAMP script
            </p>
            <p className="mt-0.5 text-xs text-zinc-500">
              Click the link below — Tampermonkey will recognize it and offer to install.
            </p>
            <a
              href="/lamp-linkedin.user.js"
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 inline-flex items-center gap-1 rounded-md bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700"
            >
              Install LAMP Script
            </a>
          </div>
        </div>

        {/* Step 3 */}
        <div className="flex gap-3">
          <div className="flex-shrink-0 flex h-7 w-7 items-center justify-center rounded-full bg-blue-100 text-xs font-bold text-blue-700 dark:bg-blue-900 dark:text-blue-300">
            3
          </div>
          <div>
            <p className="text-sm font-medium text-zinc-800 dark:text-zinc-200">
              Done — click Next
            </p>
            <p className="mt-0.5 text-xs text-zinc-500">
              Once installed, the script will run automatically when you import
              from LinkedIn.
            </p>
          </div>
        </div>
      </div>

      <div className="mt-6 flex justify-between">
        <button
          onClick={() => setStep(0)}
          className="rounded-lg px-4 py-2 text-sm text-zinc-500 hover:text-zinc-700"
        >
          Back
        </button>
        <button
          onClick={() => { setError(""); setStep(2); }}
          className="rounded-lg bg-blue-600 px-6 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700"
        >
          I&apos;ve installed it
        </button>
      </div>
    </div>,

    // Step 2: Claude API Key
    <div key="claude" className="max-w-md mx-auto">
      <h2 className="mb-2 text-xl font-bold">Set Up AI Summarization</h2>
      <p className="mb-4 text-sm text-zinc-500">
        LAMP uses Claude Sonnet 4.6 to create smart summaries of your articles.
        Enter your Anthropic API key below.
      </p>
      <div className="mb-4 rounded-lg border border-zinc-200 bg-zinc-50 p-3 text-xs text-zinc-600 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-400">
        <p className="font-medium">How to get an API key:</p>
        <ol className="mt-1 list-inside list-decimal space-y-1">
          <li>
            Go to{" "}
            <a
              href="https://console.anthropic.com/settings/keys"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 underline dark:text-blue-400"
            >
              console.anthropic.com/settings/keys
            </a>
          </li>
          <li>Click &quot;Create Key&quot;</li>
          <li>Copy the key and paste it below</li>
        </ol>
      </div>
      <input
        type="password"
        value={apiKey}
        onChange={(e) => { setApiKey(e.target.value); setError(""); }}
        placeholder="sk-ant-api03-..."
        className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-zinc-700 dark:bg-zinc-800"
      />
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
      <div className="mt-6 flex justify-between">
        <button
          onClick={() => setStep(1)}
          className="rounded-lg px-4 py-2 text-sm text-zinc-500 hover:text-zinc-700"
        >
          Back
        </button>
        <button
          onClick={handleFinish}
          className="rounded-lg bg-blue-600 px-6 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700"
        >
          Finish Setup
        </button>
      </div>
    </div>,
  ];

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-zinc-50 px-4 dark:bg-zinc-950">
      {/* Progress dots */}
      <div className="mb-8 flex gap-2">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className={`h-2 w-2 rounded-full transition-colors ${
              i === step
                ? "bg-blue-600"
                : i < step
                ? "bg-blue-300"
                : "bg-zinc-300 dark:bg-zinc-700"
            }`}
          />
        ))}
      </div>

      <div className="w-full max-w-xl rounded-xl bg-white p-8 shadow-lg dark:bg-zinc-900">
        {steps[step]}
      </div>
    </div>
  );
}
