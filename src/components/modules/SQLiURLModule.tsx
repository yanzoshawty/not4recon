"use client";

import { useState } from "react";
import TerminalInput from "@/components/TerminalInput";
import { ResultBlock, KVRow, TagBadge, SeverityBadge } from "@/components/ResultBlock";
import { Copy, Check, Terminal, ArrowSquareOut, Warning } from "@phosphor-icons/react";

type Risk = "low" | "medium" | "high" | "critical";

interface InjectedURL {
  label: string;
  technique: string;
  dbms: string;
  risk: Risk;
  originalParam: string;
  payload: string;
  injectedUrl: string;
  sqlmapCmd: string;
  description: string;
}

interface ParamAnalysis {
  name: string;
  value: string;
  type: string;
  injectable: boolean;
  reason: string;
}

interface URLSQLiResult {
  originalUrl: string;
  host: string;
  path: string;
  totalParams: number;
  injectableCount: number;
  params: ParamAnalysis[];
  results: Record<string, InjectedURL[]>;
  timestamp: string;
  error?: string;
  hint?: string;
}

const RISK_MAP: Record<Risk, "info" | "low" | "medium" | "high"> = {
  low: "info",
  medium: "low",
  high: "medium",
  critical: "high",
};

const TECHNIQUE_COLORS: Record<string, string> = {
  Detection: "text-terminal-cyan",
  "Error-Based": "text-terminal-amber",
  UNION: "text-terminal-green",
  "Time-Based": "text-terminal-amber",
  "WAF Bypass": "text-terminal-red",
  Automation: "text-terminal-cyan",
};

function CopyButton({ text, className }: { text: string; className?: string }) {
  const [copied, setCopied] = useState(false);
  const handle = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };
  return (
    <button
      onClick={handle}
      className={`flex items-center gap-1 text-[10px] font-mono border rounded px-1.5 py-0.5 transition-all duration-200 ${
        copied
          ? "border-terminal-green text-terminal-green"
          : "border-terminal-border text-terminal-text-muted hover:border-terminal-green hover:border-opacity-40 hover:text-terminal-green"
      } ${className ?? ""}`}
    >
      {copied ? <Check size={10} /> : <Copy size={10} />}
      {copied ? "COPIED" : "COPY"}
    </button>
  );
}

function PayloadCard({ entry }: { entry: InjectedURL }) {
  const [showCmd, setShowCmd] = useState(false);

  return (
    <div className="border border-terminal-border rounded bg-terminal-bg p-3 space-y-2 hover:border-terminal-green hover:border-opacity-20 transition-colors">
      {/* Header */}
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-2">
          <SeverityBadge level={RISK_MAP[entry.risk]} />
          <span className={`text-[10px] font-mono ${TECHNIQUE_COLORS[entry.technique] ?? "text-terminal-text-muted"}`}>
            {entry.technique}
          </span>
          <span className="text-[9px] font-mono text-terminal-text-dim border border-terminal-border px-1 rounded">
            {entry.dbms}
          </span>
        </div>
        <span className="text-[10px] font-mono text-terminal-text-secondary">{entry.label}</span>
      </div>

      {/* Description */}
      <p className="text-[10px] font-mono text-terminal-text-dim">{entry.description}</p>

      {/* Payload */}
      {entry.technique !== "Automation" && (
        <div className="space-y-1">
          <p className="text-[9px] font-mono text-terminal-text-dim tracking-widest">PAYLOAD</p>
          <div className="flex items-start gap-2">
            <code className="text-[11px] font-mono text-terminal-amber break-all flex-1 leading-relaxed">
              {entry.payload}
            </code>
            <CopyButton text={entry.payload} className="shrink-0" />
          </div>
        </div>
      )}

      {/* Injected URL */}
      {entry.technique !== "Automation" && (
        <div className="space-y-1">
          <p className="text-[9px] font-mono text-terminal-text-dim tracking-widest">INJECTED URL</p>
          <div className="flex items-start gap-2">
            <code className="text-[10px] font-mono text-terminal-green break-all flex-1 leading-relaxed">
              {entry.injectedUrl}
            </code>
            <div className="flex gap-1 shrink-0">
              <CopyButton text={entry.injectedUrl} />
              <a
                href={entry.injectedUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-[10px] font-mono border border-terminal-border text-terminal-text-muted hover:border-terminal-cyan hover:border-opacity-40 hover:text-terminal-cyan rounded px-1.5 py-0.5 transition-all"
                title="Open in browser"
              >
                <ArrowSquareOut size={10} />
              </a>
            </div>
          </div>
        </div>
      )}

      {/* SQLMap command */}
      <div className="space-y-1">
        <button
          onClick={() => setShowCmd((v) => !v)}
          className="flex items-center gap-1.5 text-[9px] font-mono text-terminal-text-dim hover:text-terminal-cyan transition-colors tracking-widest"
        >
          <Terminal size={10} />
          {showCmd ? "▼" : "▶"} SQLMAP COMMAND
        </button>
        {showCmd && (
          <div className="flex items-start gap-2 bg-terminal-bg-secondary rounded p-2 border border-terminal-border">
            <code className="text-[10px] font-mono text-terminal-cyan break-all flex-1 leading-relaxed">
              {entry.sqlmapCmd}
            </code>
            <CopyButton text={entry.sqlmapCmd} className="shrink-0" />
          </div>
        )}
      </div>
    </div>
  );
}

const TECHNIQUE_FILTER = ["All", "Detection", "Error-Based", "UNION", "Time-Based", "WAF Bypass", "Automation"];

export default function SQLiURLModule() {
  const [result, setResult] = useState<URLSQLiResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeParam, setActiveParam] = useState<string | null>(null);
  const [techniqueFilter, setTechniqueFilter] = useState("All");

  const handleSubmit = async (value: string) => {
    setLoading(true);
    setResult(null);
    setActiveParam(null);
    setTechniqueFilter("All");
    try {
      const res = await fetch(`/api/sqli-url?q=${encodeURIComponent(value)}`);
      const data = await res.json() as URLSQLiResult;
      setResult(data);
      // Auto-select first injectable param
      const firstParam = Object.keys(data.results ?? {})[0];
      if (firstParam) setActiveParam(firstParam);
    } catch {
      setResult({ originalUrl: value, host: "", path: "", totalParams: 0, injectableCount: 0, params: [], results: {}, timestamp: new Date().toISOString(), error: "Network error" });
    } finally {
      setLoading(false);
    }
  };

  const activePayloads = activeParam && result?.results[activeParam]
    ? result.results[activeParam].filter(
        (e) => techniqueFilter === "All" || e.technique === techniqueFilter
      )
    : [];

  return (
    <div className="space-y-4">
      <TerminalInput
        module="url sqli analyzer"
        placeholder="https://target.com/page?id=1&cat=electronics"
        onSubmit={handleSubmit}
        loading={loading}
        prefix="sqli-url>"
      />

      <div className="text-[10px] font-mono text-terminal-text-dim border border-terminal-border px-3 py-2 rounded">
        <span className="text-terminal-red">⚠ LEGAL:</span> Only test against systems you own or have explicit written authorization. Unauthorized SQLi is a criminal offence.
      </div>

      {result?.error && (
        <ResultBlock title="ERROR" status="error" timestamp={result.timestamp}>
          <p className="text-xs font-mono text-terminal-red">{result.error}</p>
          {result.hint && (
            <p className="text-[11px] font-mono text-terminal-amber mt-2">{result.hint}</p>
          )}
        </ResultBlock>
      )}

      {result && !result.error && (
        <>
          {/* URL Summary */}
          <ResultBlock
            title={`URL ANALYSIS — ${result.host}`}
            status={result.injectableCount > 0 ? "success" : "warning"}
            timestamp={result.timestamp}
          >
            <KVRow label="URL" value={result.originalUrl} accent="green" />
            <KVRow label="Host" value={result.host} />
            <KVRow label="Path" value={result.path || "/"} />
            <KVRow label="Params" value={`${result.totalParams} detected`} accent="cyan" />
            <KVRow
              label="Injectable"
              value={
                <div className="flex flex-wrap gap-1">
                  {result.params.map((p) => (
                    <TagBadge
                      key={p.name}
                      label={`${p.name}=${p.value} [${p.type}]`}
                      color={p.injectable ? "green" : "default"}
                    />
                  ))}
                </div>
              }
            />
          </ResultBlock>

          {result.injectableCount === 0 && (
            <ResultBlock title="NO INJECTABLE PARAMS" status="warning" timestamp={result.timestamp}>
              <p className="text-xs font-mono text-terminal-amber">
                No injectable parameters detected automatically. Try adding common params like <code className="text-terminal-green">?id=1</code> or <code className="text-terminal-green">?search=test</code> to the URL.
              </p>
            </ResultBlock>
          )}

          {result.injectableCount > 0 && (
            <>
              {/* Param selector */}
              <div className="space-y-2">
                <p className="text-[10px] font-mono text-terminal-text-dim tracking-widest">TARGET PARAMETER:</p>
                <div className="flex gap-2 flex-wrap">
                  {Object.keys(result.results).map((param) => (
                    <button
                      key={param}
                      onClick={() => setActiveParam(param)}
                      className={`text-[11px] font-mono px-2.5 py-1 border rounded transition-all duration-200 ${
                        activeParam === param
                          ? "border-terminal-green text-terminal-green bg-terminal-green-glow"
                          : "border-terminal-border text-terminal-text-muted hover:border-terminal-green hover:border-opacity-40"
                      }`}
                    >
                      ?{param}
                    </button>
                  ))}
                </div>
              </div>

              {/* Technique filter */}
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[10px] font-mono text-terminal-text-dim">TECHNIQUE:</span>
                {TECHNIQUE_FILTER.map((t) => (
                  <button
                    key={t}
                    onClick={() => setTechniqueFilter(t)}
                    className={`text-[9px] font-mono px-1.5 py-0.5 border rounded transition-all duration-200 ${
                      techniqueFilter === t
                        ? "border-terminal-green text-terminal-green bg-terminal-green-glow"
                        : "border-terminal-border text-terminal-text-dim hover:text-terminal-text-secondary"
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>

              {/* Stats */}
              {activeParam && (
                <div className="flex items-center gap-4 text-[11px] font-mono text-terminal-text-dim">
                  <span>param: <span className="text-terminal-green">?{activeParam}</span></span>
                  <span>showing: <span className="text-terminal-cyan">{activePayloads.length}</span> payloads</span>
                </div>
              )}

              {/* Payload cards */}
              <div className="space-y-3">
                {activePayloads.map((entry, i) => (
                  <PayloadCard key={i} entry={entry} />
                ))}
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}
