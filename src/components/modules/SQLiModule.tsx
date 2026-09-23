"use client";

import { useState } from "react";
import TerminalInput from "@/components/TerminalInput";
import { ResultBlock, SeverityBadge } from "@/components/ResultBlock";
import { Copy, Check, ArrowSquareOut } from "@phosphor-icons/react";

type Risk = "low" | "medium" | "high" | "critical";

interface SQLiPayload {
  label: string;
  payload: string;
  technique: string;
  dbms: string;
  risk: Risk;
  description: string;
}

interface SQLiCategory {
  label: string;
  description: string;
  payloads: SQLiPayload[];
}

interface SQLiResult {
  target: string;
  dbmsFilter: string;
  totalCategories: number;
  totalPayloads: number;
  categories: SQLiCategory[];
  supportedDBMS: string[];
  timestamp: string;
  error?: string;
}

const RISK_MAP: Record<Risk, "info" | "low" | "medium" | "high"> = {
  low: "info",
  medium: "low",
  high: "medium",
  critical: "high",
};

function PayloadRow({ p }: { p: SQLiPayload }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(p.payload);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="group flex items-start gap-2 py-2 border-b border-terminal-border last:border-0 hover:bg-terminal-bg-card-hover px-2 -mx-2 rounded transition-colors">
      <div className="shrink-0 mt-0.5">
        <SeverityBadge level={RISK_MAP[p.risk]} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <p className="text-[10px] font-mono text-terminal-text-muted">{p.label}</p>
          <span className="text-[9px] font-mono text-terminal-text-dim border border-terminal-border px-1 rounded">{p.dbms}</span>
          <span className="text-[9px] font-mono text-terminal-cyan opacity-60">{p.technique}</span>
        </div>
        <code className="text-[11px] font-mono text-terminal-green break-all leading-relaxed block">
          {p.payload}
        </code>
        <p className="text-[10px] font-mono text-terminal-text-dim mt-0.5">{p.description}</p>
      </div>
      <button
        onClick={handleCopy}
        className="p-1.5 border border-terminal-border rounded hover:border-terminal-green hover:border-opacity-40 text-terminal-text-muted hover:text-terminal-green transition-all opacity-0 group-hover:opacity-100 shrink-0"
        title="Copy payload"
      >
        {copied ? <Check size={11} /> : <Copy size={11} />}
      </button>
    </div>
  );
}

const DBMS_OPTIONS = ["All", "MySQL", "MSSQL", "PostgreSQL", "Oracle", "SQLite"];

export default function SQLiModule() {
  const [result, setResult] = useState<SQLiResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [openCats, setOpenCats] = useState<Set<string>>(new Set());
  const [dbmsFilter, setDbmsFilter] = useState("All");

  const handleSubmit = async (value: string) => {
    setLoading(true);
    setResult(null);
    setOpenCats(new Set());
    try {
      const filter = dbmsFilter !== "All" ? `&dbms=${encodeURIComponent(dbmsFilter)}` : "";
      const res = await fetch(`/api/sqli?q=${encodeURIComponent(value)}${filter}`);
      const data = await res.json() as SQLiResult;
      setResult(data);
      if (data.categories?.[0]) setOpenCats(new Set([data.categories[0].label]));
    } catch {
      setResult({ target: value, dbmsFilter: "all", totalCategories: 0, totalPayloads: 0, categories: [], supportedDBMS: [], timestamp: new Date().toISOString(), error: "Network error" });
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

  const copyAll = async () => {
    if (!result) return;
    const all = result.categories
      .flatMap((cat) => cat.payloads.map((p) => `# ${p.label} [${p.dbms}]\n${p.payload}`))
      .join("\n\n");
    await navigator.clipboard.writeText(all);
  };

  return (
    <div className="space-y-4">
      <TerminalInput
        module="sql injection payload generator"
        placeholder="parameter name (e.g. id, username, search)"
        onSubmit={handleSubmit}
        loading={loading}
        prefix="sqli>"
      />

      {/* DBMS Filter */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-[10px] font-mono text-terminal-text-dim">DBMS:</span>
        {DBMS_OPTIONS.map((db) => (
          <button
            key={db}
            onClick={() => setDbmsFilter(db)}
            className={`text-[10px] font-mono px-2 py-0.5 border rounded transition-all duration-200 ${
              dbmsFilter === db
                ? "border-terminal-green text-terminal-green bg-terminal-green-glow"
                : "border-terminal-border text-terminal-text-muted hover:border-terminal-green hover:border-opacity-40 hover:text-terminal-text-secondary"
            }`}
          >
            {db}
          </button>
        ))}
      </div>

      {/* Ethics disclaimer */}
      <div className="text-[10px] font-mono text-terminal-text-dim border border-terminal-border px-3 py-2 rounded">
        <span className="text-terminal-red">⚠ LEGAL:</span> Use only against systems you own or have written authorization to test. Unauthorized SQLi testing is illegal in most jurisdictions.
      </div>

      {result?.error && (
        <ResultBlock title="ERROR" status="error" timestamp={result.timestamp}>
          <p className="text-xs font-mono text-terminal-red">{result.error}</p>
        </ResultBlock>
      )}

      {result && !result.error && (
        <>
          <ResultBlock title={`SQLI PAYLOADS — ${result.target}`} status="info" timestamp={result.timestamp}>
            <div className="flex items-center justify-between">
              <div className="flex gap-4 text-[11px] font-mono text-terminal-text-secondary">
                <span><span className="text-terminal-green">{result.totalCategories}</span> categories</span>
                <span><span className="text-terminal-red">{result.totalPayloads}</span> payloads</span>
                <span><span className="text-terminal-amber">{result.dbmsFilter.toUpperCase()}</span> filter</span>
              </div>
              <button
                onClick={copyAll}
                className="flex items-center gap-1 text-[10px] font-mono text-terminal-text-muted hover:text-terminal-green border border-terminal-border hover:border-terminal-green hover:border-opacity-30 px-2 py-1 rounded transition-all"
              >
                <Copy size={10} /> COPY ALL
              </button>
            </div>
          </ResultBlock>

          {result.categories.map((cat) => {
            const isOpen = openCats.has(cat.label);
            return (
              <div key={cat.label} className="border border-terminal-border rounded overflow-hidden">
                <button
                  onClick={() => toggleCat(cat.label)}
                  className="w-full flex items-center justify-between px-3 py-2.5 bg-terminal-bg-card hover:bg-terminal-bg-card-hover transition-colors text-left"
                >
                  <div className="flex items-center gap-2">
                    <span className={`text-[10px] font-mono transition-transform duration-200 ${isOpen ? "text-terminal-green" : "text-terminal-text-dim"}`}>
                      {isOpen ? "▼" : "▶"}
                    </span>
                    <span className="text-xs font-mono text-terminal-text-secondary">{cat.label}</span>
                    <span className="text-[10px] font-mono text-terminal-text-dim">({cat.payloads.length})</span>
                  </div>
                  <span className="text-[10px] font-mono text-terminal-text-dim hidden sm:block">{cat.description}</span>
                </button>
                {isOpen && (
                  <div className="px-3 py-2 border-t border-terminal-border bg-terminal-bg">
                    {cat.payloads.map((p) => (
                      <PayloadRow key={p.payload} p={p} />
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
