"use client";

import { useState } from "react";
import TerminalInput from "@/components/TerminalInput";
import { ResultBlock, KVRow, TagBadge } from "@/components/ResultBlock";
import { ArrowSquareOut, Phone, MapPin, WifiHigh, MagnifyingGlass } from "@phosphor-icons/react";

interface PhoneSource {
  name: string;
  url: string;
  description: string;
}

interface PhoneCategory {
  category: string;
  sources: PhoneSource[];
}

interface PhoneResult {
  raw: string;
  parsed: {
    normalized: string;
    e164: string;
    countryCode: string;
    nationalNumber: string;
    lineType: string;
    isValid: boolean;
  };
  geoEstimate: {
    country: string;
    iso: string;
    region: string;
    flag: string;
    confidence: string;
    note: string;
  } | null;
  osintLinks: PhoneCategory[];
  footprintLinks: {
    whatsappDirect: string;
    googleDork: string;
    googleDorkUrl: string;
  };
  timestamp: string;
  error?: string;
}

export default function PhoneModule() {
  const [result, setResult] = useState<PhoneResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [openCats, setOpenCats] = useState<Set<string>>(new Set());

  const handleSubmit = async (value: string) => {
    setLoading(true);
    setResult(null);
    setOpenCats(new Set());
    try {
      const res = await fetch(`/api/phone?q=${encodeURIComponent(value)}`);
      const data = await res.json() as PhoneResult;
      setResult(data);
      // Open first 2 categories
      if (data.osintLinks) {
        setOpenCats(new Set(data.osintLinks.slice(0, 2).map((c) => c.category)));
      }
    } catch {
      setResult({ raw: value, parsed: { normalized: "", e164: "", countryCode: "", nationalNumber: "", lineType: "", isValid: false }, geoEstimate: null, osintLinks: [], footprintLinks: { whatsappDirect: "", googleDork: "", googleDorkUrl: "" }, timestamp: new Date().toISOString(), error: "Network error" });
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
        module="phone geolocation + footprinting"
        placeholder="+628123456789 or 08123456789"
        onSubmit={handleSubmit}
        loading={loading}
        prefix="phone>"
      />

      <div className="text-[10px] font-mono text-terminal-text-dim border border-terminal-border px-3 py-2 rounded">
        <span className="text-terminal-amber">ℹ INFO:</span> City-level geolocation requires carrier SS7 access (not public). This tool provides country-level geo from country code + open OSINT sources.
      </div>

      {result?.error && (
        <ResultBlock title="ERROR" status="error" timestamp={result.timestamp}>
          <p className="text-xs font-mono text-terminal-red">{result.error}</p>
        </ResultBlock>
      )}

      {result && !result.error && (
        <>
          {/* Parsed info */}
          <ResultBlock
            title={`PHONE — ${result.parsed.normalized}`}
            status="success"
            timestamp={result.timestamp}
            copyData={JSON.stringify(result.parsed, null, 2)}
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6">
              <div>
                <p className="text-[10px] font-mono text-terminal-text-dim tracking-widest mb-2 flex items-center gap-1.5">
                  <Phone size={10} /> NUMBER INFO
                </p>
                <KVRow label="E.164" value={result.parsed.e164} accent="green" />
                <KVRow label="Country Code" value={result.parsed.countryCode} accent="cyan" />
                <KVRow label="National" value={result.parsed.nationalNumber} />
                <KVRow label="Line Type" value={result.parsed.lineType} accent="amber" />
                <KVRow
                  label="Valid"
                  value={
                    <TagBadge
                      label={result.parsed.isValid ? "VALID FORMAT" : "INVALID"}
                      color={result.parsed.isValid ? "green" : "red"}
                    />
                  }
                />
              </div>

              {result.geoEstimate && (
                <div className="mt-4 sm:mt-0">
                  <p className="text-[10px] font-mono text-terminal-text-dim tracking-widest mb-2 flex items-center gap-1.5">
                    <MapPin size={10} /> GEO ESTIMATE
                  </p>
                  <KVRow label="Country" value={`${result.geoEstimate.flag} ${result.geoEstimate.country}`} accent="cyan" />
                  <KVRow label="ISO" value={result.geoEstimate.iso} />
                  <KVRow label="Region" value={result.geoEstimate.region} />
                  <KVRow label="Confidence" value={result.geoEstimate.confidence} />
                  <p className="text-[9px] font-mono text-terminal-text-dim mt-2 leading-relaxed">
                    {result.geoEstimate.note}
                  </p>
                </div>
              )}
            </div>
          </ResultBlock>

          {/* Quick actions */}
          <ResultBlock title="QUICK ACTIONS" status="info" timestamp={result.timestamp}>
            <div className="flex flex-wrap gap-2">
              <a
                href={result.footprintLinks.whatsappDirect}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-[11px] font-mono text-terminal-green hover:text-glow border border-terminal-border hover:border-terminal-green hover:border-opacity-40 px-2 py-1 rounded transition-all"
              >
                <ArrowSquareOut size={11} /> WhatsApp Check
              </a>
              <a
                href={result.footprintLinks.googleDorkUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-[11px] font-mono text-terminal-cyan hover:text-glow-cyan border border-terminal-border hover:border-terminal-cyan hover:border-opacity-40 px-2 py-1 rounded transition-all"
              >
                <MagnifyingGlass size={11} /> Google Dork
              </a>
            </div>
            <div className="mt-2">
              <p className="text-[9px] font-mono text-terminal-text-dim tracking-widest mb-1">DORK QUERY</p>
              <code className="text-[10px] font-mono text-terminal-amber">{result.footprintLinks.googleDork}</code>
            </div>
          </ResultBlock>

          {/* OSINT categories */}
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
                  <div className="px-3 py-2 border-t border-terminal-border bg-terminal-bg space-y-0">
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
