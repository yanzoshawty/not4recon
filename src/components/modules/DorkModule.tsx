"use client";

import { useState } from "react";
import TerminalInput from "@/components/TerminalInput";
import { ResultBlock, SeverityBadge } from "@/components/ResultBlock";
import { ArrowSquareOut, Copy, Check } from "@phosphor-icons/react";

interface DorkQuery {
  label: string;
  query: string;
  severity: "info" | "low" | "medium" | "high";
}

interface DorkCategory {
  label: string;
  description: string;
  queries: DorkQuery[];
}

interface DorkResult {
  target: string;
  totalCategories: number;
  totalQueries: number;
  categories: DorkCategory[];
  googleSearchBase: string;
  timestamp: string;
  error?: string;
}

function DorkRow({ dork, searchBase }: { dork: DorkQuery; searchBase: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(dork.query);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="group flex items-start gap-2 py-2 border-b border-terminal-border last:border-0 hover:bg-terminal-bg-card-hover px-2 -mx-2 rounded transition-colors">
      <div className="shrink-0 mt-0.5">
        <SeverityBadge level={dork.severity} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[10px] font-mono text-terminal-text-muted mb-0.5">{dork.label}</p>
        <code className="text-[11px] font-mono text-terminal-green break-all leading-relaxed">
          {dork.query}
        </code>
      </div>
      <div className="flex gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={handleCopy}
          className="p-1.5 border border-terminal-border rounded hover:border-terminal-green hover:border-opacity-40 text-terminal-text-muted hover:text-terminal-green transition-all"
          title="Copy query"
        >
          {copied ? <Check size={11} /> : <Copy size={11} />}
        </button>
        <a
          href={`${searchBase}${encodeURIComponent(dork.query)}`}
          target="_blank"
          rel="noopener noreferrer"
          className="p-1.5 border border-terminal-border rounded hover:border-terminal-cyan hover:border-opacity-40 text-terminal-text-muted hover:text-terminal-cyan transition-all"
          title="Open in Google"
        >
          <ArrowSquareOut size={11} />
        </a>
      </div>
    </div>
  );
}

export default function DorkModule() {
  const [result, setResult] = useState<DorkResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [openCats, setOpenCats] = useState<Set<string>>(new Set());

  const handleSubmit = async (value: string) => {
    setLoading(true);
    setResult(null);
    setOpenCats(new Set());
    try {
      const res = await fetch(`/api/dork?q=${encodeURIComponent(value)}`);
      const data = await res.json() as DorkResult;
      setResult(data);
      // Open first category by default
      if (data.categories?.[0]) setOpenCats(new Set([data.categories[0].label]));
    } catch {
      setResult({ target: value, totalCategories: 0, totalQueries: 0, categories: [], googleSearchBase: "", timestamp: new Date().toISOString(), error: "Network error" });
    } finally {
      setLoading(false);
    }
  };

  const toggleCat = (label: string) => {
    setOpenCats((prev) => {
      const next = new Set(prev);
      if (next.has(label)) next.delete(label);
      else next.add(label);
      return next;
    });
  };

  return (
    <div className="space-y-4">
      <TerminalInput
        module="google dorking generator"
        placeholder="target-domain.com"
        onSubmit={handleSubmit}
        loading={loading}
        prefix="dork>"
      />

      {/* Disclaimer */}
      <div className="text-[10px] font-mono text-terminal-text-dim border border-terminal-border px-3 py-2 rounded">
        <span className="text-terminal-amber">⚠ ETHICS:</span> Use only against targets you own or have written authorization to test. Unauthorized scanning may violate laws.
      </div>

      {result?.error && (
        <ResultBlock title="ERROR" status="error" timestamp={result.timestamp}>
          <p className="text-xs font-mono text-terminal-red">{result.error}</p>
        </ResultBlock>
      )}

      {result && !result.error && (
        <>
          <ResultBlock
            title={`DORK GENERATOR — ${result.target}`}
            status="info"
            timestamp={result.timestamp}
          >
            <div className="flex gap-4 text-[11px] font-mono text-terminal-text-secondary">
              <span><span className="text-terminal-green">{result.totalCategories}</span> categories</span>
              <span><span className="text-terminal-cyan">{result.totalQueries}</span> queries generated</span>
            </div>
          </ResultBlock>

          {result.categories.map((cat) => {
            const isOpen = openCats.has(cat.label);
            return (
              <div key={cat.label} className="border border-terminal-border rounded overflow-hidden">
                {/* Category header */}
                <button
                  onClick={() => toggleCat(cat.label)}
                  className="w-full flex items-center justify-between px-3 py-2.5 bg-terminal-bg-card hover:bg-terminal-bg-card-hover transition-colors text-left"
                >
                  <div className="flex items-center gap-2">
                    <span className={`text-[10px] font-mono transition-transform duration-200 ${isOpen ? "text-terminal-green" : "text-terminal-text-dim"}`}>
                      {isOpen ? "▼" : "▶"}
                    </span>
                    <span className="text-xs font-mono text-terminal-text-secondary">{cat.label}</span>
                    <span className="text-[10px] font-mono text-terminal-text-dim">({cat.queries.length})</span>
                  </div>
                  <span className="text-[10px] font-mono text-terminal-text-dim hidden sm:block">{cat.description}</span>
                </button>

                {/* Queries */}
                {isOpen && (
                  <div className="px-3 py-2 border-t border-terminal-border bg-terminal-bg">
                    {cat.queries.map((dork) => (
                      <DorkRow key={dork.query} dork={dork} searchBase={result.googleSearchBase} />
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </>
      )}
    </div>
  );
}
