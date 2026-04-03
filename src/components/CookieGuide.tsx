"use client";

export default function CookieGuide() {
  return (
    <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 text-sm text-blue-900 dark:border-blue-800 dark:bg-blue-950 dark:text-blue-200">
      <h4 className="mb-2 font-semibold">
        How to find your LinkedIn session cookie (li_at):
      </h4>
      <ol className="list-inside list-decimal space-y-2">
        <li>
          Open{" "}
          <a
            href="https://www.linkedin.com"
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium underline"
          >
            linkedin.com
          </a>{" "}
          and make sure you are logged in
        </li>
        <li>
          Open Developer Tools (press{" "}
          <kbd className="rounded bg-blue-100 px-1.5 py-0.5 font-mono text-xs dark:bg-blue-900">
            F12
          </kbd>{" "}
          or{" "}
          <kbd className="rounded bg-blue-100 px-1.5 py-0.5 font-mono text-xs dark:bg-blue-900">
            Ctrl+Shift+I
          </kbd>{" "}
          /{" "}
          <kbd className="rounded bg-blue-100 px-1.5 py-0.5 font-mono text-xs dark:bg-blue-900">
            Cmd+Option+I
          </kbd>
          )
        </li>
        <li>
          Go to the <strong>Application</strong> tab (Chrome) or{" "}
          <strong>Storage</strong> tab (Firefox)
        </li>
        <li>
          In the left sidebar, expand <strong>Cookies</strong> &rarr;{" "}
          <strong>https://www.linkedin.com</strong>
        </li>
        <li>
          Find the cookie named{" "}
          <code className="rounded bg-blue-100 px-1 font-mono text-xs dark:bg-blue-900">
            li_at
          </code>
        </li>
        <li>
          Double-click the <strong>Value</strong> column, copy the entire value
        </li>
        <li>Paste it below</li>
      </ol>
      <p className="mt-3 text-xs text-blue-700 dark:text-blue-400">
        This cookie stays valid for approximately 1 year. Your cookie is only
        stored in your browser&apos;s local storage and is sent to LinkedIn through
        our server-side proxy. We never store or log it.
      </p>
    </div>
  );
}
