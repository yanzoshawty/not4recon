"use client";

import { useState } from "react";
import TerminalInput from "@/components/TerminalInput";
import { ResultBlock, KVRow, TagBadge, SeverityBadge } from "@/components/ResultBlock";
import { Copy, Check, Terminal, ArrowSquareOut, Play, X, Warning } from "@phosphor-icons/react";

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

interface RequestResult {
  url: string;
  status: number | null;
  statusText: string;
  responseTime: number;
  headers: Record<string, string>;
  body: string;
  error?: string;
  proxyUsed: string;
}

const RISK_MAP: Record<Risk, "info" | "low" | "medium" | "high"> = {
  low: "info", medium: "low", high: "medium", critical: "high",
};

const TECHNIQUE_COLORS: Record<string, string> = {
  Detection: "text-terminal-cyan",
  "Error-Based": "text-terminal-amber",
  UNION: "text-terminal-green",
  "Time-Based": "text-terminal-amber",
  "WAF Bypass": "text-terminal-red",
  Automation: "text-terminal-cyan",
};

// CORS proxies to try in order
const CORS_PROXIES = [
  { name: "allorigins", buildUrl: (u: string) => `https://api.allorigins.win/raw?url=${encodeURIComponent(u)}` },
  { name: "corsproxy.io", buildUrl: (u: string) => `https://corsproxy.io/?${encodeURIComponent(u)}` },
  { name: "cors-anywhere", buildUrl: (u: string) => `https://cors-anywhere.herokuapp.com/${u}` },
];

async function sendRequestWithCORS(targetUrl: string): Promise<RequestResult> {
  const start = Date.now();

  for (const proxy of CORS_PROXIES) {
    try {
      const proxyUrl = proxy.buildUrl(targetUrl);
      const res = await fetch(proxyUrl, {
        method: "GET",
        headers: { "User-Agent": "not4recon-sqli-tester/1.0" },
        signal: AbortSignal.timeout(8000),
      });

      const body = await res.text();
      const responseTime = Date.now() - start;

      const headers: Record<string, string> = {};
      res.headers.forEach((val, key) => { headers[key] = val; });

      return {
        url: targetUrl,
        status: res.status,
        statusText: res.statusText,
        responseTime,
        headers,
        body: body.slice(0, 3000),
        proxyUsed: proxy.name,
      };
    } catch {
      continue;
    }
  }

  return {
    url: targetUrl,
    status: null,
    statusText: "All proxies failed",
    responseTime: Date.now() - start,
    headers: {},
    body: "",
    error: "All CORS proxies failed. Try opening the URL directly in a new tab.",
    proxyUsed: "none",
  };
}

function CopyButton({ text, className }: { text: string; className?: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={async () => {
        await navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      }}
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

function RequestPanel({ result }: { result: RequestResult }) {
  const [showBody, setShowBody] = useState(false);
  const [showHeaders, setShowHeaders] = useState(false);

  const statusColor =
    !result.status ? "text-terminal-red" :
    result.status < 300 ? "text-terminal-green" :
    result.status < 400 ? "text-terminal-amber" :
    "text-terminal-red";

  // Detect potential SQLi indicators in response
  const sqlErrors = [
    "you have an error in your sql syntax",
    "warning: mysql",
    "ora-00933",
    "postgresql error",
    "unclosed quotation mark",
    "quoted string not properly terminated",
    "sqlstate",
    "sqlite_error",
    "syntax error",
    "division by zero",
  ];
  const bodyLower = result.body.toLowerCase();
  const sqlIndicators = sqlErrors.filter((e) => bodyLower.includes(e));

  return (
    <div className="border border-terminal-border rounded bg-terminal-bg-secondary p-3 space-y-2 mt-2">
      {/* Status bar */}
      <div className="flex items-center gap-4 flex-wrap">
        <span className="text-[10px] font-mono text-terminal-text-dim">STATUS</span>
        <span className={`text-sm font-mono font-bold ${statusColor}`}>
          {result.status ?? "ERR"}
        </span>
        <span className="text-[10px] font-mono text-terminal-text-dim">{result.statusText}</span>
        <span className="text-[10px] font-mono text-terminal-text-dim ml-auto">{result.responseTime}ms</span>
        <span className="text-[9px] font-mono text-terminal-text-dim">via {result.proxyUsed}</span>
      </div>

      {result.error && (
        <p className="text-[11px] font-mono text-terminal-red">{result.error}</p>
      )}

      {/* SQLi indicators */}
      {sqlIndicators.length > 0 && (
        <div className="border border-terminal-red border-opacity-40 rounded p-2 bg-red-500/5">
          <p className="text-[10px] font-mono text-terminal-red font-bold">
            🎯 POTENTIAL SQLi INDICATORS DETECTED ({sqlIndicators.length})
          </p>
          {sqlIndicators.map((ind) => (
            <p key={ind} className="text-[10px] font-mono text-terminal-amber mt-0.5">→ "{ind}"</p>
          ))}
        </div>
      )}

      {/* Headers toggle */}
      {Object.keys(result.headers).length > 0 && (
        <div>
          <button
            onClick={() => setShowHeaders((v) => !v)}
            className="text-[9px] font-mono text-terminal-text-dim hover:text-terminal-cyan transition-colors tracking-widest"
          >
            {showHeaders ? "▼" : "▶"} RESPONSE HEADERS ({Object.keys(result.headers).length})
          </button>
          {showHeaders && (
            <div className="mt-1 space-y-0.5 max-h-32 overflow-y-auto">
              {Object.entries(result.headers).map(([k, v]) => (
                <div key={k} className="flex gap-2 text-[10px] font-mono">
                  <span className="text-terminal-amber shrink-0">{k}:</span>
                  <span className="text-terminal-text-dim break-all">{v}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Body toggle */}
      {result.body && (
        <div>
          <div className="flex items-center justify-between">
            <button
              onClick={() => setShowBody((v) => !v)}
              className="text-[9px] font-mono text-terminal-text-dim hover:text-terminal-cyan transition-colors tracking-widest"
            >
              {showBody ? "▼" : "▶"} RESPONSE BODY ({result.body.length} chars)
            </button>
            <CopyButton text={result.body} />
          </div>
          {showBody && (
            <pre className="mt-1 text-[10px] font-mono text-terminal-text-secondary bg-terminal-bg rounded p-2 max-h-48 overflow-y-auto overflow-x-auto whitespace-pre-wrap break-all border border-terminal-border">
              {result.body}
            </pre>
          )}
        </div>
      )}
    </div>
  );
}

function PayloadCard({ entry }: { entry: InjectedURL }) {
  const [showCmd, setShowCmd] = useState(false);
  const [requestResult, setRequestResult] = useState<RequestResult | null>(null);
  const [executing, setExecuting] = useState(false);

  const handleExecute = async () => {
    setExecuting(true);
    setRequestResult(null);
    const result = await sendRequestWithCORS(entry.injectedUrl);
    setRequestResult(result);
    setExecuting(false);
  };

  return (
    <div className="border border-terminal-border rounded bg-terminal-bg p-3 space-y-2 hover:border-terminal-green hover:border-opacity-20 transition-colors">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-2">
          <SeverityBadge level={RISK_MAP[entry.risk]} />
          <span className={`text-[10px] font-mono ${TECHNIQUE_COLORS[entry.technique] ?? "text-terminal-text-muted"}`}>
            {entry.technique}
          </span>
          <span className="text-[9px] font-mono text-terminal-text-dim border border-terminal-border px-1 rounded">{entry.dbms}</span>
        </div>
        <span className="text-[10px] font-mono text-terminal-text-secondary">{entry.label}</span>
      </div>

      <p className="text-[10px] font-mono text-terminal-text-dim">{entry.description}</p>

      {entry.technique !== "Automation" && (
        <>
          <div className="space-y-1">
            <p className="text-[9px] font-mono text-terminal-text-dim tracking-widest">PAYLOAD</p>
            <div className="flex items-start gap-2">
              <code className="text-[11px] font-mono text-terminal-amber break-all flex-1 leading-relaxed">{entry.payload}</code>
              <CopyButton text={entry.payload} className="shrink-0" />
            </div>
          </div>

          <div className="space-y-1">
            <p className="text-[9px] font-mono text-terminal-text-dim tracking-widest">INJECTED URL</p>
            <div className="flex items-start gap-2">
              <code className="text-[10px] font-mono text-terminal-green break-all flex-1 leading-relaxed">{entry.injectedUrl}</code>
              <div className="flex gap-1 shrink-0 flex-wrap">
                <CopyButton text={entry.injectedUrl} />
                <a
                  href={entry.injectedUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-[10px] font-mono border border-terminal-border text-terminal-text-muted hover:border-terminal-cyan hover:text-terminal-cyan rounded px-1.5 py-0.5 transition-all"
                >
                  <ArrowSquareOut size={10} />
                </a>
                <button
                  onClick={handleExecute}
                  disabled={executing}
                  className="flex items-center gap-1 text-[10px] font-mono border rounded px-1.5 py-0.5 transition-all disabled:opacity-50 border-terminal-green border-opacity-40 text-terminal-green hover:bg-terminal-green-glow"
                >
                  <Play size={10} />
                  {executing ? "..." : "RUN"}
                </button>
              </div>
            </div>
          </div>

          {requestResult && <RequestPanel result={requestResult} />}
        </>
      )}

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
            <code className="text-[10px] font-mono text-terminal-cyan break-all flex-1 leading-relaxed">{entry.sqlmapCmd}</code>
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
        module="url sqli analyzer + executor"
        placeholder="https://target.com/page?id=1&cat=test"
        onSubmit={handleSubmit}
        loading={loading}
        prefix="sqli-url>"
      />

      <div className="text-[10px] font-mono text-terminal-text-dim border border-terminal-red border-opacity-20 px-3 py-2 rounded bg-red-500/5">
        <span className="text-terminal-red">⚠ LEGAL:</span> Only test against systems you own or have explicit written authorization. RUN button sends real HTTP requests via CORS proxy.
      </div>

      {result?.error && (
        <ResultBlock title="ERROR" status="error" timestamp={result.timestamp}>
          <p className="text-xs font-mono text-terminal-red">{result.error}</p>
          {result.hint && <p className="text-[11px] font-mono text-terminal-amber mt-2">{result.hint}</p>}
        </ResultBlock>
      )}

      {result && !result.error && (
        <>
          <ResultBlock title={`URL ANALYSIS — ${result.host}`} status={result.injectableCount > 0 ? "success" : "warning"} timestamp={result.timestamp}>
            <KVRow label="URL" value={result.originalUrl} accent="green" />
            <KVRow label="Host" value={result.host} />
            <KVRow label="Path" value={result.path || "/"} />
            <KVRow label="Params" value={`${result.totalParams} detected`} accent="cyan" />
            <KVRow
              label="Injectable"
              value={
                <div className="flex flex-wrap gap-1">
                  {result.params.map((p) => (
                    <TagBadge key={p.name} label={`${p.name}=${p.value} [${p.type}]`} color={p.injectable ? "green" : "default"} />
                  ))}
                </div>
              }
            />
          </ResultBlock>

          {result.injectableCount > 0 && (
            <>
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

              {activeParam && (
                <div className="flex items-center gap-4 text-[11px] font-mono text-terminal-text-dim">
                  <span>param: <span className="text-terminal-green">?{activeParam}</span></span>
                  <span>payloads: <span className="text-terminal-cyan">{activePayloads.length}</span></span>
                </div>
              )}

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
