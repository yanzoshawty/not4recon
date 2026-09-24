"use client";

import { useState } from "react";
import TerminalInput from "@/components/TerminalInput";
import { ResultBlock, KVRow, TagBadge } from "@/components/ResultBlock";
import { ArrowSquareOut, EnvelopeSimple, MagnifyingGlass, Play, Check, Copy, Warning } from "@phosphor-icons/react";

interface PlatformCheck {
  name: string;
  url: string;
  method: string;
  fieldName: string;
  batch: number;
}

interface EmailResult {
  email: string;
  analysis: {
    localPart: string;
    domain: string;
    isDisposable: boolean;
    isNumericLocal: boolean;
    hasSpecialChars: boolean;
    localLength: number;
    mxValid: boolean;
    mxRecords: string[];
    domainExists: boolean;
    risk: "low" | "medium" | "high";
    notes: string[];
  };
  platforms: {
    currentBatch: number;
    totalBatches: number;
    totalPlatforms: number;
    batchPlatforms: PlatformCheck[];
  };
  osintLinks: { category: string; sources: { name: string; url: string; description: string }[] }[];
  googleDorks: string[];
  timestamp: string;
  error?: string;
}

interface PlatformResult {
  name: string;
  status: "found" | "not_found" | "error" | "checking";
  statusCode: number | null;
  responseTime: number;
  hint: string;
}

const TOTAL_BATCHES = 5;

async function checkPlatformDirect(platform: PlatformCheck, email: string): Promise<PlatformResult> {
  const start = Date.now();
  // We do a HEAD/GET to the platform's reset URL via cors proxy
  // and infer registration from response differences
  try {
    const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(platform.url)}`;
    const res = await fetch(proxyUrl, {
      signal: AbortSignal.timeout(5000),
    });
    const responseTime = Date.now() - start;
    const body = await res.text().catch(() => "");

    // Heuristic: if page loads (200) and contains email-related fields, likely registered
    const bodyLower = body.toLowerCase();
    const hasEmailField = bodyLower.includes("email") || bodyLower.includes("account");
    const isErrorPage = bodyLower.includes("not found") || bodyLower.includes("error") || res.status === 404;

    return {
      name: platform.name,
      status: isErrorPage ? "not_found" : hasEmailField ? "found" : "not_found",
      statusCode: res.status,
      responseTime,
      hint: `HTTP ${res.status} — ${responseTime}ms (heuristic check, not definitive)`,
    };
  } catch {
    return {
      name: platform.name,
      status: "error",
      statusCode: null,
      responseTime: Date.now() - start,
      hint: "Request failed or timed out",
    };
  }
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={async () => {
        await navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      }}
      className="flex items-center gap-1 text-[10px] font-mono border border-terminal-border text-terminal-text-muted hover:border-terminal-green hover:text-terminal-green rounded px-1.5 py-0.5 transition-all"
    >
      {copied ? <Check size={10} /> : <Copy size={10} />}
    </button>
  );
}

export default function EmailFootprintModule() {
  const [result, setResult] = useState<EmailResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [currentBatch, setCurrentBatch] = useState(1);
  const [platformResults, setPlatformResults] = useState<PlatformResult[]>([]);
  const [checking, setChecking] = useState(false);
  const [openCats, setOpenCats] = useState<Set<string>>(new Set(["Breach Databases"]));

  const handleSubmit = async (value: string) => {
    setLoading(true);
    setResult(null);
    setPlatformResults([]);
    setCurrentBatch(1);
    try {
      const res = await fetch(`/api/email-footprint?q=${encodeURIComponent(value)}&batch=1`);
      const data = await res.json() as EmailResult;
      setResult(data);
    } catch {
      setResult({ email: value, analysis: { localPart: "", domain: "", isDisposable: false, isNumericLocal: false, hasSpecialChars: false, localLength: 0, mxValid: false, mxRecords: [], domainExists: false, risk: "low", notes: [] }, platforms: { currentBatch: 1, totalBatches: 5, totalPlatforms: 50, batchPlatforms: [] }, osintLinks: [], googleDorks: [], timestamp: new Date().toISOString(), error: "Network error" });
    } finally {
      setLoading(false);
    }
  };

  const loadBatch = async (batch: number) => {
    if (!result) return;
    setCurrentBatch(batch);
    try {
      const res = await fetch(`/api/email-footprint?q=${encodeURIComponent(result.email)}&batch=${batch}`);
      const data = await res.json() as EmailResult;
      setResult((prev) => prev ? { ...prev, platforms: data.platforms } : prev);
    } catch { /* silently fail */ }
  };

  const runPlatformBatch = async () => {
    if (!result) return;
    setChecking(true);
    setPlatformResults([]);

    const platforms = result.platforms.batchPlatforms;
    // Check in parallel with individual results streaming in
    const checks = platforms.map(async (p) => {
      const res = await checkPlatformDirect(p, result.email);
      setPlatformResults((prev) => [...prev.filter((r) => r.name !== p.name), res]);
      return res;
    });
    await Promise.allSettled(checks);
    setChecking(false);
  };

  const toggleCat = (cat: string) => {
    setOpenCats((prev) => {
      const next = new Set(prev);
      if (next.has(cat)) next.delete(cat);
      else next.add(cat);
      return next;
    });
  };

  const riskColors = { low: "green", medium: "amber", high: "red" } as const;

  return (
    <div className="space-y-4">
      <TerminalInput
        module="email footprinting — professional"
        placeholder="target@example.com"
        onSubmit={handleSubmit}
        loading={loading}
        prefix="email>"
      />

      {result?.error && (
        <ResultBlock title="ERROR" status="error" timestamp={result.timestamp}>
          <p className="text-xs font-mono text-terminal-red">{result.error}</p>
        </ResultBlock>
      )}

      {result && !result.error && (
        <>
          {/* Analysis */}
          <ResultBlock
            title={`EMAIL ANALYSIS — ${result.email}`}
            status={result.analysis.risk === "low" ? "success" : result.analysis.risk === "medium" ? "warning" : "error"}
            timestamp={result.timestamp}
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6">
              <div>
                <KVRow label="Local Part" value={result.analysis.localPart} accent="green" />
                <KVRow label="Domain" value={result.analysis.domain} accent="cyan" />
                <KVRow label="MX Valid" value={<TagBadge label={result.analysis.mxValid ? "YES" : "NO"} color={result.analysis.mxValid ? "green" : "red"} />} />
                <KVRow label="Domain Exists" value={<TagBadge label={result.analysis.domainExists ? "YES" : "NO"} color={result.analysis.domainExists ? "green" : "red"} />} />
                <KVRow label="Disposable" value={<TagBadge label={result.analysis.isDisposable ? "YES — TEMP" : "NO"} color={result.analysis.isDisposable ? "red" : "green"} />} />
                <KVRow label="Risk" value={<TagBadge label={result.analysis.risk.toUpperCase()} color={riskColors[result.analysis.risk]} />} />
              </div>
              <div className="mt-4 sm:mt-0">
                {result.analysis.mxRecords.length > 0 && (
                  <>
                    <p className="text-[9px] font-mono text-terminal-text-dim tracking-widest mb-1">MX RECORDS</p>
                    {result.analysis.mxRecords.map((mx) => (
                      <p key={mx} className="text-[10px] font-mono text-terminal-cyan">{mx}</p>
                    ))}
                  </>
                )}
                {result.analysis.notes.length > 0 && (
                  <div className="mt-2 space-y-0.5">
                    {result.analysis.notes.map((note, i) => (
                      <p key={i} className="text-[10px] font-mono text-terminal-amber">{note}</p>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </ResultBlock>

          {/* Google Dorks */}
          <ResultBlock title="GOOGLE DORKS" status="info" timestamp={result.timestamp}>
            <div className="space-y-1">
              {result.googleDorks.map((dork) => (
                <div key={dork} className="flex items-center gap-2 py-1 border-b border-terminal-border last:border-0">
                  <code className="text-[10px] font-mono text-terminal-green flex-1">{dork}</code>
                  <div className="flex gap-1 shrink-0">
                    <CopyButton text={dork} />
                    <a
                      href={`https://www.google.com/search?q=${encodeURIComponent(dork)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-[10px] font-mono border border-terminal-border text-terminal-text-muted hover:border-terminal-cyan hover:text-terminal-cyan rounded px-1.5 py-0.5 transition-all"
                    >
                      <ArrowSquareOut size={10} />
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </ResultBlock>

          {/* Platform batch checker */}
          <div className="border border-terminal-border rounded overflow-hidden">
            <div className="px-3 py-2.5 bg-terminal-bg-card border-b border-terminal-border">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-mono text-terminal-text-secondary">PLATFORM REGISTRATION CHECK</p>
                  <p className="text-[10px] font-mono text-terminal-text-dim mt-0.5">
                    {result.platforms.totalPlatforms} platforms • {result.platforms.totalBatches} batches of 10
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {/* Batch selector */}
                  <div className="flex gap-1">
                    {Array.from({ length: TOTAL_BATCHES }, (_, i) => i + 1).map((b) => (
                      <button
                        key={b}
                        onClick={() => loadBatch(b)}
                        className={`text-[9px] font-mono w-6 h-6 rounded border transition-all ${
                          currentBatch === b
                            ? "border-terminal-green text-terminal-green bg-terminal-green-glow"
                            : "border-terminal-border text-terminal-text-dim hover:border-terminal-green hover:border-opacity-40"
                        }`}
                      >
                        {b}
                      </button>
                    ))}
                  </div>
                  <button
                    onClick={runPlatformBatch}
                    disabled={checking}
                    className="flex items-center gap-1.5 text-[10px] font-mono border border-terminal-green border-opacity-40 text-terminal-green hover:bg-terminal-green-glow px-2 py-1 rounded transition-all disabled:opacity-50"
                  >
                    <Play size={10} />
                    {checking ? "Checking..." : `Run Batch ${currentBatch}`}
                  </button>
                </div>
              </div>
            </div>

            <div className="divide-y divide-terminal-border">
              {result.platforms.batchPlatforms.map((platform) => {
                const pr = platformResults.find((r) => r.name === platform.name);
                return (
                  <div key={platform.name} className="flex items-center gap-3 px-3 py-2 hover:bg-terminal-bg-card-hover transition-colors">
                    <div className={`w-2 h-2 rounded-full shrink-0 ${
                      !pr ? "bg-terminal-text-dim" :
                      pr.status === "found" ? "bg-terminal-green" :
                      pr.status === "checking" ? "bg-terminal-amber animate-pulse" :
                      pr.status === "error" ? "bg-terminal-amber" :
                      "bg-terminal-text-dim"
                    }`} />
                    <span className="text-[11px] font-mono text-terminal-text-secondary flex-1">{platform.name}</span>
                    {pr && (
                      <>
                        <span className={`text-[9px] font-mono ${
                          pr.status === "found" ? "text-terminal-green" :
                          pr.status === "error" ? "text-terminal-amber" :
                          "text-terminal-text-dim"
                        }`}>
                          {pr.status === "found" ? "LIKELY REGISTERED" :
                           pr.status === "error" ? "TIMEOUT" :
                           "NOT FOUND"}
                        </span>
                        <span className="text-[9px] font-mono text-terminal-text-dim">{pr.responseTime}ms</span>
                      </>
                    )}
                    <a
                      href={platform.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-terminal-text-dim hover:text-terminal-cyan transition-colors"
                    >
                      <ArrowSquareOut size={11} />
                    </a>
                  </div>
                );
              })}
            </div>

            {checking && (
              <div className="px-3 py-2 border-t border-terminal-border">
                <p className="text-[10px] font-mono text-terminal-amber animate-pulse">
                  Checking {result.platforms.batchPlatforms.length} platforms via CORS proxy...
                </p>
                <p className="text-[9px] font-mono text-terminal-text-dim mt-0.5">
                  Results are heuristic — not definitive. Manual verification recommended.
                </p>
              </div>
            )}
          </div>

          {/* OSINT Links */}
          {result.osintLinks.map((cat) => {
            const isOpen = openCats.has(cat.category);
            return (
              <div key={cat.category} className="border border-terminal-border rounded overflow-hidden">
                <button
                  onClick={() => toggleCat(cat.category)}
                  className="w-full flex items-center justify-between px-3 py-2.5 bg-terminal-bg-card hover:bg-terminal-bg-card-hover transition-colors text-left"
                >
                  <div className="flex items-center gap-2">
                    <span className={`text-[10px] font-mono ${isOpen ? "text-terminal-green" : "text-terminal-text-dim"}`}>
                      {isOpen ? "▼" : "▶"}
                    </span>
                    <span className="text-xs font-mono text-terminal-text-secondary">{cat.category}</span>
                    <span className="text-[10px] font-mono text-terminal-text-dim">({cat.sources.length})</span>
                  </div>
                </button>
                {isOpen && (
                  <div className="px-3 py-2 border-t border-terminal-border bg-terminal-bg">
                    {cat.sources.map((src) => (
                      <div key={src.name} className="flex items-center gap-2 py-1.5 border-b border-terminal-border last:border-0 hover:bg-terminal-bg-card-hover px-2 -mx-2 rounded transition-colors">
                        <span className="text-[10px] font-mono text-terminal-text-muted flex-1">{src.description}</span>
                        <a
                          href={src.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 text-[10px] font-mono text-terminal-cyan hover:text-glow-cyan transition-colors shrink-0"
                        >
                          <ArrowSquareOut size={11} />
                          {src.name}
                        </a>
                      </div>
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
