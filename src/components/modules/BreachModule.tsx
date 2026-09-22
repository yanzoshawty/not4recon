"use client";

import { useState } from "react";
import TerminalInput from "@/components/TerminalInput";
import { ResultBlock, KVRow, TagBadge } from "@/components/ResultBlock";
import { Lock, ArrowSquareOut } from "@phosphor-icons/react";

interface Breach {
  name: string;
  title: string;
  domain: string;
  breachDate: string;
  addedDate: string;
  dataClasses: string[];
  pwnCount: number;
  isVerified: boolean;
  isSensitive: boolean;
}

interface BreachResult {
  email: string;
  breached?: boolean;
  breachCount?: number;
  breaches?: Breach[];
  mode?: "no_key";
  message?: string;
  hibpUrl?: string;
  alternativeSources?: { name: string; url: string }[];
  timestamp: string;
  error?: string;
}

export default function BreachModule() {
  const [result, setResult] = useState<BreachResult | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (value: string) => {
    setLoading(true);
    setResult(null);
    try {
      const res = await fetch(`/api/breach?q=${encodeURIComponent(value)}`);
      const data = await res.json() as BreachResult;
      setResult(data);
    } catch {
      setResult({ email: value, timestamp: new Date().toISOString(), error: "Network error" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <TerminalInput
        module="email breach check"
        placeholder="target@example.com"
        onSubmit={handleSubmit}
        loading={loading}
        prefix="hibp>"
      />

      {result?.error && (
        <ResultBlock title="ERROR" status="error" timestamp={result.timestamp}>
          <p className="text-xs font-mono text-terminal-red">{result.error}</p>
        </ResultBlock>
      )}

      {/* No API key mode */}
      {result?.mode === "no_key" && (
        <ResultBlock title="HIBP — API KEY NOT CONFIGURED" status="warning" timestamp={result.timestamp}>
          <p className="text-xs font-mono text-terminal-amber mb-3">{result.message}</p>
          <div className="space-y-2">
            <p className="text-[10px] font-mono text-terminal-text-dim tracking-widest">MANUAL CHECK SOURCES:</p>
            {result.alternativeSources?.map((src) => (
              <a
                key={src.name}
                href={src.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-xs font-mono text-terminal-cyan hover:text-glow-cyan transition-colors"
              >
                <ArrowSquareOut size={12} />
                {src.name} — {src.url}
              </a>
            ))}
          </div>
          <div className="mt-3 p-2 border border-terminal-border rounded text-[10px] font-mono text-terminal-text-muted">
            <span className="text-terminal-green">TIP:</span> Set{" "}
            <code className="text-terminal-cyan">HIBP_API_KEY</code> in your Vercel environment variables to enable live breach checking via HaveIBeenPwned v3 API.
          </div>
        </ResultBlock>
      )}

      {/* Not breached */}
      {result && !result.error && result.mode !== "no_key" && result.breached === false && (
        <ResultBlock title={`BREACH SCAN — ${result.email}`} status="success" timestamp={result.timestamp}>
          <div className="flex items-center gap-3">
            <Lock size={20} className="text-terminal-green text-glow shrink-0" weight="fill" />
            <div>
              <p className="text-sm font-mono text-terminal-green text-glow">No breaches found</p>
              <p className="text-[11px] font-mono text-terminal-text-muted mt-0.5">
                This email does not appear in any known public data breach indexed by HaveIBeenPwned.
              </p>
            </div>
          </div>
        </ResultBlock>
      )}

      {/* Breached */}
      {result && !result.error && result.mode !== "no_key" && result.breached === true && (
        <>
          <ResultBlock
            title={`BREACH SCAN — ${result.email}`}
            status="error"
            timestamp={result.timestamp}
            copyData={JSON.stringify(result, null, 2)}
          >
            <div className="flex items-center gap-3 mb-3">
              <Lock size={20} className="text-terminal-red text-glow-red shrink-0" weight="fill" />
              <div>
                <p className="text-sm font-mono text-terminal-red text-glow-red">
                  COMPROMISED — {result.breachCount} breach{result.breachCount !== 1 ? "es" : ""}
                </p>
                <p className="text-[11px] font-mono text-terminal-text-muted mt-0.5">
                  This email was found in {result.breachCount} known data breach{result.breachCount !== 1 ? "es" : ""}.
                </p>
              </div>
            </div>
          </ResultBlock>

          {/* Individual breaches */}
          {result.breaches?.map((b) => (
            <ResultBlock
              key={b.name}
              title={`BREACH — ${b.title}`}
              status="error"
              timestamp={b.breachDate}
            >
              <KVRow label="Service" value={b.title} accent="red" />
              <KVRow label="Domain" value={b.domain || "N/A"} />
              <KVRow
                label="Date"
                value={`${b.breachDate} (added: ${b.addedDate?.slice(0, 10) ?? "N/A"})`}
              />
              <KVRow
                label="Records"
                value={b.pwnCount.toLocaleString()}
                accent="amber"
              />
              <KVRow
                label="Data Types"
                value={
                  <div className="flex flex-wrap gap-1">
                    {b.dataClasses.map((dc) => (
                      <TagBadge key={dc} label={dc} color="red" />
                    ))}
                  </div>
                }
              />
              <KVRow
                label="Flags"
                value={
                  <div className="flex gap-1.5">
                    {b.isVerified && <TagBadge label="VERIFIED" color="amber" />}
                    {b.isSensitive && <TagBadge label="SENSITIVE" color="red" />}
                    {!b.isVerified && !b.isSensitive && <TagBadge label="UNVERIFIED" />}
                  </div>
                }
              />
            </ResultBlock>
          ))}
        </>
      )}
    </div>
  );
}
