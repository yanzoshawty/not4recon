"use client";

import { useState } from "react";
import TerminalInput from "@/components/TerminalInput";
import { ResultBlock, KVRow, TagBadge } from "@/components/ResultBlock";

interface DomainResult {
  domain: string;
  registrar: string;
  registrarUrl: string;
  registrantOrg: string;
  registrantCountry: string;
  abuseEmail: string;
  created: string;
  expires: string;
  updated: string;
  status: string[];
  nameservers: string[];
  records: { type: string; name: string; data: string; ttl: number }[];
  timestamp: string;
  error?: string;
}

const RECORD_COLORS: Record<string, "green" | "cyan" | "amber" | "red" | "default"> = {
  A: "green",
  AAAA: "cyan",
  MX: "amber",
  NS: "amber",
  CNAME: "cyan",
  TXT: "default",
  SOA: "default",
  CAA: "red",
  SRV: "default",
};

export default function DomainModule() {
  const [result, setResult] = useState<DomainResult | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (value: string) => {
    setLoading(true);
    setResult(null);
    try {
      const res = await fetch(`/api/domain?q=${encodeURIComponent(value)}`);
      const data = await res.json() as DomainResult;
      setResult(data);
    } catch {
      setResult({ domain: value, registrar: "", registrarUrl: "N/A", registrantOrg: "N/A", registrantCountry: "N/A", abuseEmail: "N/A", created: "", expires: "", updated: "", status: [], nameservers: [], records: [], timestamp: new Date().toISOString(), error: "Network error — check your connection" });
    } finally {
      setLoading(false);
    }
  };

  const copyData = result
    ? JSON.stringify(result, null, 2)
    : undefined;

  return (
    <div className="space-y-4">
      <TerminalInput
        module="domain / ip lookup"
        placeholder="example.com or 8.8.8.8"
        onSubmit={handleSubmit}
        loading={loading}
        prefix="whois>"
      />

      {result?.error && (
        <ResultBlock title="ERROR" status="error" timestamp={result.timestamp}>
          <p className="text-xs font-mono text-terminal-red">{result.error}</p>
        </ResultBlock>
      )}

      {result && !result.error && (
        <>
          {/* WHOIS / RDAP */}
          <ResultBlock
            title={`WHOIS — ${result.domain}`}
            status="success"
            timestamp={result.timestamp}
            copyData={copyData}
          >
            <div className="space-y-0">
              <KVRow label="Domain" value={result.domain} accent="green" />
              <KVRow label="Registrar" value={result.registrar || "N/A"} />
              <KVRow label="Reg. URL" value={result.registrarUrl !== "N/A" ? (
                <a href={result.registrarUrl} target="_blank" rel="noopener noreferrer" className="text-terminal-cyan hover:text-glow-cyan transition-colors truncate block">
                  {result.registrarUrl}
                </a>
              ) : "N/A"} />
              <KVRow label="Org" value={result.registrantOrg || "N/A"} accent="cyan" />
              <KVRow label="Country" value={result.registrantCountry || "N/A"} />
              <KVRow label="Abuse Email" value={result.abuseEmail !== "N/A" ? (
                <a href={`mailto:${result.abuseEmail}`} className="text-terminal-amber hover:text-glow-amber transition-colors">
                  {result.abuseEmail}
                </a>
              ) : "N/A"} />
              <KVRow label="Created" value={result.created} accent="cyan" />
              <KVRow label="Expires" value={result.expires} accent="amber" />
              <KVRow label="Updated" value={result.updated} />
              <KVRow
                label="Status"
                value={
                  <div className="flex flex-wrap gap-1">
                    {result.status.length > 0
                      ? result.status.map((s) => (
                          <TagBadge key={s} label={s.split(" ")[0]} color="cyan" />
                        ))
                      : <span className="text-terminal-text-dim">N/A</span>}
                  </div>
                }
              />
              <KVRow
                label="Nameservers"
                value={
                  <div className="flex flex-col gap-0.5">
                    {result.nameservers.length > 0
                      ? result.nameservers.map((ns) => (
                          <span key={ns} className="text-terminal-cyan text-glow-cyan">{ns}</span>
                        ))
                      : <span className="text-terminal-text-dim">N/A</span>}
                  </div>
                }
              />
            </div>
          </ResultBlock>

          {/* DNS Records */}
          {result.records.length > 0 && (
            <ResultBlock
              title={`DNS RECORDS — ${result.records.length} found`}
              status="info"
              timestamp={result.timestamp}
            >
              <div className="overflow-x-auto">
                <table className="w-full text-[11px] font-mono">
                  <thead>
                    <tr className="border-b border-terminal-border">
                      <th className="text-left text-terminal-text-dim py-1.5 pr-4 w-16">TYPE</th>
                      <th className="text-left text-terminal-text-dim py-1.5 pr-4">NAME</th>
                      <th className="text-left text-terminal-text-dim py-1.5 pr-4">DATA</th>
                      <th className="text-right text-terminal-text-dim py-1.5 w-16">TTL</th>
                    </tr>
                  </thead>
                  <tbody>
                    {result.records.map((r, i) => (
                      <tr key={i} className="border-b border-terminal-border last:border-0 hover:bg-terminal-bg-card-hover transition-colors">
                        <td className="py-1.5 pr-4">
                          <TagBadge label={r.type} color={RECORD_COLORS[r.type] ?? "default"} />
                        </td>
                        <td className="py-1.5 pr-4 text-terminal-text-secondary truncate max-w-[120px]">{r.name}</td>
                        <td className="py-1.5 pr-4 text-terminal-text-secondary break-all">{r.data}</td>
                        <td className="py-1.5 text-right text-terminal-text-dim">{r.ttl}s</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </ResultBlock>
          )}

          {result.records.length === 0 && (
            <ResultBlock title="DNS RECORDS" status="warning" timestamp={result.timestamp}>
              <p className="text-xs font-mono text-terminal-amber">
                No DNS records found via public resolver. Domain may not exist or is not publicly resolvable.
              </p>
            </ResultBlock>
          )}
        </>
      )}
    </div>
  );
}
