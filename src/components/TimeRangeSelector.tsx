"use client";

interface TimeRangeSelectorProps {
  selectedDays: number;
  onSelect: (days: number) => void;
  onFetch: () => void;
  loading: boolean;
}

const presets = [
  { days: 3, label: "3 days" },
  { days: 7, label: "7 days" },
  { days: 14, label: "14 days" },
  { days: 30, label: "30 days" },
];

export default function TimeRangeSelector({
  selectedDays,
  onSelect,
  onFetch,
  loading,
}: TimeRangeSelectorProps) {
  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
      <h3 className="mb-3 text-sm font-medium text-zinc-700 dark:text-zinc-300">
        Summarize saved articles from the last:
      </h3>
      <div className="flex flex-wrap items-center gap-2">
        {presets.map((p) => (
          <button
            key={p.days}
            onClick={() => onSelect(p.days)}
            className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
              selectedDays === p.days
                ? "bg-blue-600 text-white"
                : "bg-zinc-100 text-zinc-700 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
            }`}
          >
            {p.label}
          </button>
        ))}
        <button
          onClick={onFetch}
          disabled={loading}
          className="ml-auto rounded-lg bg-blue-600 px-5 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? (
            <span className="flex items-center gap-2">
              <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              Fetching...
            </span>
          ) : (
            "Fetch & Summarize"
          )}
        </button>
      </div>
    </div>
  );
}
