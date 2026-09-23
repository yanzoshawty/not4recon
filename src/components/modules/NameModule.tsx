"use client";

import { useState } from "react";
import TerminalInput from "@/components/TerminalInput";
import { ResultBlock, KVRow, TagBadge } from "@/components/ResultBlock";
import { ArrowSquareOut, User, MagnifyingGlass, IdentificationCard } from "@phosphor-icons/react";

interface SearchSource {
  name: string;
  url: string;
  description: string;
  isInternal?: boolean;
  username?: string;
}

interface SearchCategory {
  category: string;
  sources: SearchSource[];
}

interface NameResult {
  name: string;
  firstName: string;
  lastName: string;
  usernameVariants: string[];
  searchLinks: SearchCategory[];
  totalSources: number;
  timestamp: string;
  error?: string;
}

function SourceRow({
  src,
  onUsernameClick,
}: {
  src: SearchSource;
  onUsernameClick?: (username: string) => void;
}) {
  return (
    <div className="flex items-start gap-2 py-1.5 border-b border-terminal-border last:border-0 hover:bg-terminal-bg-card-hover px-2 -mx-2 rounded transition-colors group">
      <div className="flex-1 min-w-0">
        <p className="text-[10px] font-mono text-terminal-text-muted">{src.description}</p>
      </div>
      {src.isInternal && onUsernameClick ? (
        <button
          onClick={() => onUsernameClick(src.username!)}
          className="flex items-center gap-1 text-[10px] font-mono text-terminal-green hover:text-glow transition-colors shrink-0 border border-terminal-border hover:border-terminal-green hover:border-opacity-40 px-1.5 py-0.5 rounded"
        >
          <MagnifyingGlass size={10} />
          {src.name}
        </button>
      ) : (
        <a
          href={src.url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1 text-[10px] font-mono text-terminal-cyan hover:text-glow-cyan transition-colors shrink-0"
        >
          <ArrowSquareOut size={11} />
          {src.name}
        </a>
      )}
    </div>
  );
}

export default function NameModule() {
  const [result, setResult] = useState<NameResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [openCats, setOpenCats] = useState<Set<string>>(new Set());
  const [usernameQueue, setUsernameQueue] = useState<string[]>([]);

  const handleSubmit = async (value: string) => {
    setLoading(true);
    setResult(null);
    setOpenCats(new Set());
    setUsernameQueue([]);
    try {
      const res = await fetch(`/api/name?q=${encodeURIComponent(value)}`);
      const data = await res.json() as NameResult;
      setResult(data);
      // Open first 2 categories by default
      if (data.searchLinks) {
        setOpenCats(new Set(data.searchLinks.slice(0, 2).map((c) => c.category)));
      }
    } catch {
      setResult({ name: value, firstName: "", lastName: "", usernameVariants: [], searchLinks: [], totalSources: 0, timestamp: new Date().toISOString(), error: "Network error" });
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

  const handleUsernameClick = (username: string) => {
    setUsernameQueue((prev) => [...new Set([...prev, username])]);
    // Open in username tab via URL — could be extended to route internally
    window.open(`https://www.google.com/search?q=${encodeURIComponent(username)}+social+media`, "_blank");
  };

  return (
    <div className="space-y-4">
      <TerminalInput
        module="osint by name"
        placeholder="First Last (e.g. John Doe)"
        onSubmit={handleSubmit}
        loading={loading}
        prefix="name>"
      />

      <div className="text-[10px] font-mono text-terminal-text-dim border border-terminal-border px-3 py-2 rounded">
        <span className="text-terminal-amber">⚠ ETHICS:</span> Only investigate public figures or individuals you have lawful reason to search. Respect privacy laws (GDPR, etc.).
      </div>

      {result?.error && (
        <ResultBlock title="ERROR" status="error" timestamp={result.timestamp}>
          <p className="text-xs font-mono text-terminal-red">{result.error}</p>
        </ResultBlock>
      )}

      {result && !result.error && (
        <>
          {/* Summary */}
          <ResultBlock
            title={`NAME OSINT — ${result.name}`}
            status="success"
            timestamp={result.timestamp}
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6">
              <div>
                <KVRow label="Full Name" value={result.name} accent="green" />
                <KVRow label="First" value={result.firstName || "N/A"} />
                <KVRow label="Last" value={result.lastName || "N/A"} />
                <KVRow label="Sources" value={`${result.totalSources} search targets`} accent="cyan" />
              </div>
              <div>
                <p className="text-[10px] font-mono text-terminal-text-dim tracking-widest mb-2 flex items-center gap-1.5 mt-2 sm:mt-0">
                  <IdentificationCard size={10} /> USERNAME VARIANTS
                </p>
                <div className="flex flex-wrap gap-1">
                  {result.usernameVariants.map((u) => (
                    <TagBadge key={u} label={`@${u}`} color="amber" />
                  ))}
                </div>
              </div>
            </div>
          </ResultBlock>

          {/* Search categories */}
          {result.searchLinks.map((cat) => {
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
                      <SourceRow
                        key={src.name}
                        src={src}
                        onUsernameClick={src.isInternal ? handleUsernameClick : undefined}
                      />
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
