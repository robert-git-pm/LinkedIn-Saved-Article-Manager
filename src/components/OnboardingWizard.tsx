"use client";

import { useState } from "react";
import {
  setLinkedInCookie,
  setClaudeApiKey,
  setOnboardingComplete,
} from "@/lib/storage";
import CookieGuide from "./CookieGuide";

interface OnboardingWizardProps {
  onComplete: () => void;
}

export default function OnboardingWizard({
  onComplete,
}: OnboardingWizardProps) {
  const [step, setStep] = useState(0);
  const [cookie, setCookie] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [validating, setValidating] = useState(false);
  const [error, setError] = useState("");

  const handleFinish = async () => {
    if (!cookie.trim()) {
      setError("Please enter your LinkedIn cookie.");
      return;
    }
    if (!apiKey.trim()) {
      setError("Please enter your Claude API key.");
      return;
    }

    setValidating(true);
    setError("");

    try {
      setLinkedInCookie(cookie.trim());
      setClaudeApiKey(apiKey.trim());
      setOnboardingComplete();
      onComplete();
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setValidating(false);
    }
  };

  const steps = [
    // Step 0: Welcome
    <div key="welcome" className="text-center">
      <div className="mb-6 text-6xl">
        <span className="text-blue-600 font-bold">LAMP</span>
      </div>
      <h2 className="mb-3 text-2xl font-bold">
        Welcome to LAMP
      </h2>
      <p className="mb-2 text-zinc-600 dark:text-zinc-400">
        LinkedIn Article Management &amp; Productivity
      </p>
      <p className="mx-auto max-w-md text-sm text-zinc-500">
        LAMP helps you stay on top of your saved LinkedIn articles. It fetches
        your saved posts, summarizes them with AI, and lets you manage them
        efficiently.
      </p>
      <button
        onClick={() => setStep(1)}
        className="mt-8 rounded-lg bg-blue-600 px-6 py-3 font-medium text-white transition-colors hover:bg-blue-700"
      >
        Get Started
      </button>
    </div>,

    // Step 1: LinkedIn Cookie
    <div key="linkedin" className="max-w-md mx-auto">
      <h2 className="mb-2 text-xl font-bold">Connect LinkedIn</h2>
      <p className="mb-4 text-sm text-zinc-500">
        To access your saved articles, we need your LinkedIn session cookie.
      </p>
      <CookieGuide />
      <div className="mt-4">
        <input
          type="password"
          value={cookie}
          onChange={(e) => {
            setCookie(e.target.value);
            setError("");
          }}
          placeholder="Paste your li_at cookie value here"
          className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-zinc-700 dark:bg-zinc-800"
        />
      </div>
      <div className="mt-6 flex justify-between">
        <button
          onClick={() => setStep(0)}
          className="rounded-lg px-4 py-2 text-sm text-zinc-500 hover:text-zinc-700"
        >
          Back
        </button>
        <button
          onClick={() => {
            if (!cookie.trim()) {
              setError("Please enter your LinkedIn cookie.");
              return;
            }
            setError("");
            setStep(2);
          }}
          className="rounded-lg bg-blue-600 px-6 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700"
        >
          Next
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
        onChange={(e) => {
          setApiKey(e.target.value);
          setError("");
        }}
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
          disabled={validating}
          className="rounded-lg bg-blue-600 px-6 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:opacity-50"
        >
          {validating ? "Setting up..." : "Finish Setup"}
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
