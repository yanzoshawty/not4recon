"use client";

import { useState } from "react";
import TerminalInput from "@/components/TerminalInput";
import { ResultBlock } from "@/components/ResultBlock";
import { ArrowSquareOut, CheckCircle, XCircle } from "@phosphor-icons/react";

interface PlatformResult {
  platform: string;
  url: string;
  found: boolean;
  icon: string;
}

interface UsernameResult {
  username: string;
  totalChecked: number;
  foundCount: number;
  found: PlatformResult[];
  notFound: PlatformResult[];
  timestamp: string;
  error?: string;
}

function PlatformRow({ item }: { item: PlatformResult }) {
  return (
    <div className="flex items-center gap-2 py-1.5 border-b border-terminal-border last:border-0 hover:bg-terminal-bg-card-hover px-2 -mx-2 rounded transition-colors">
      {item.found ? (
        <CheckCircle size={13} className="text-terminal-green shrink-0" weight="fill" />
      ) : (
        <XCircle size={13} className="text-terminal-text-dim shrink-0" weight="fill" />
      )}
      <span
        className={`text-xs font-mono flex-1 ${
          item.found ? "text-terminal-text-secondary" : "text-terminal-text-dim"
        }`}
      >
        {item.platform}
      </span>
      {item.found && (
        <a
          href={item.url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1 text-[10px] font-mono text-terminal-cyan hover:text-glow-cyan transition-colors shrink-0"
        >
          <ArrowSquareOut size={11} />
          visit
        </a>
      )}
    </div>
  );
}

export default function UsernameModule() {
  const [result, setResult] = useState<UsernameResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [showNotFound, setShowNotFound] = useState(false);

  const handleSubmit = async (value: string) => {
    setLoading(true);
    setResult(null);
    setShowNotFound(false);
    try {
      const res = await fetch(`/api/username?q=${encodeURIComponent(value)}`);
      const data = await res.json() as UsernameResult;
      setResult(data);
    } catch {
      setResult({
        username: value, totalChecked: 0, foundCount: 0,
        found: [], notFound: [],
        timestamp: new Date().toISOString(), error: "Network error",
      });
    } finally {
      setLoading(false);
    }
  };

  const percentage = result
    ? Math.round((result.foundCount / result.totalChecked) * 100)
    : 0;

  return (
    <div className="space-y-4">
      <TerminalInput
        module="social media username lookup"
        placeholder="username (without @)"
        onSubmit={handleSubmit}
        loading={loading}
        prefix="user>"
      />

      {loading && (
        <div className="border border-terminal-border rounded bg-terminal-bg-card px-3 py-3">
          <p className="text-[11px] font-mono text-terminal-text-muted">
            Scanning {18} platforms in parallel
            <span className="animate-cursor-blink ml-1">_</span>
          </p>
          {/* Progress bar animation */}
          <div className="mt-2 h-px bg-terminal-border rounded overflow-hidden">
            <div className="h-full bg-terminal-green animate-scan-line" />
          </div>
        </div>
      )}

      {result?.error && (
        <ResultBlock title="ERROR" status="error" timestamp={result.timestamp}>
          <p className="text-xs font-mono text-terminal-red">{result.error}</p>
        </ResultBlock>
      )}

      {result && !result.error && (
        <>
          {/* Summary */}
          <ResultBlock
            title={`USERNAME SCAN — @${result.username}`}
            status={result.foundCount > 0 ? "success" : "info"}
            timestamp={result.timestamp}
            copyData={result.found.map((f) => `${f.platform}: ${f.url}`).join("\n")}
          >
            <div className="flex items-center gap-6 text-[11px] font-mono">
              <div>
                <span className="text-terminal-text-dim">CHECKED</span>
                <span className="ml-2 text-terminal-text-secondary">{result.totalChecked}</span>
              </div>
              <div>
                <span className="text-terminal-text-dim">FOUND</span>
                <span className={`ml-2 ${result.foundCount > 0 ? "text-terminal-green text-glow" : "text-terminal-text-muted"}`}>
                  {result.foundCount}
                </span>
              </div>
              <div>
                <span className="text-terminal-text-dim">MATCH RATE</span>
                <span className="ml-2 text-terminal-amber">{percentage}%</span>
              </div>
            </div>

            {/* Hit bar */}
            <div className="mt-3 h-1.5 bg-terminal-border rounded-full overflow-hidden">
              <div
                className="h-full bg-terminal-green transition-all duration-700 ease-[cubic-bezier(0.32,0.72,0,1)]"
                style={{ width: `${percentage}%` }}
              />
            </div>
          </ResultBlock>

          {/* Found platforms */}
          {result.found.length > 0 && (
            <ResultBlock
              title={`ACTIVE PROFILES — ${result.found.length} found`}
              status="success"
              timestamp={result.timestamp}
            >
              {result.found.map((item) => (
                <PlatformRow key={item.platform} item={item} />
              ))}
            </ResultBlock>
          )}

          {/* Not found toggle */}
          {result.notFound.length > 0 && (
            <div>
              <button
                onClick={() => setShowNotFound((v) => !v)}
                className="text-[11px] font-mono text-terminal-text-muted hover:text-terminal-text-secondary transition-colors"
              >
                {showNotFound ? "▼" : "▶"} {result.notFound.length} platforms not found (click to expand)
              </button>
              {showNotFound && (
                <div className="mt-2 border border-terminal-border rounded bg-terminal-bg-card p-3">
                  {result.notFound.map((item) => (
                    <PlatformRow key={item.platform} item={item} />
                  ))}
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
