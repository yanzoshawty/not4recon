"use client";

import { CheckCircle, XCircle, Warning, Info, Copy, Check } from "@phosphor-icons/react";
import { useState } from "react";

interface ResultBlockProps {
  title: string;
  status: "success" | "error" | "warning" | "info";
  children: React.ReactNode;
  timestamp?: string;
  copyData?: string;
}

export function ResultBlock({ title, status, children, timestamp, copyData }: ResultBlockProps) {
  const [copied, setCopied] = useState(false);

  const icons = {
    success: <CheckCircle size={14} className="text-terminal-green" weight="fill" />,
    error: <XCircle size={14} className="text-terminal-red" weight="fill" />,
    warning: <Warning size={14} className="text-terminal-amber" weight="fill" />,
    info: <Info size={14} className="text-terminal-cyan" weight="fill" />,
  };

  const borders = {
    success: "border-terminal-green border-opacity-20",
    error: "border-terminal-red border-opacity-20",
    warning: "border-terminal-amber border-opacity-20",
    info: "border-terminal-cyan border-opacity-20",
  };

  const topBars = {
    success: "bg-terminal-green",
    error: "bg-terminal-red",
    warning: "bg-terminal-amber",
    info: "bg-terminal-cyan",
  };

  const handleCopy = async () => {
    if (!copyData) return;
    await navigator.clipboard.writeText(copyData);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      className={`
        border rounded overflow-hidden
        bg-terminal-bg-card
        ${borders[status]}
        animate-fade-in-up
      `}
    >
      {/* Color bar */}
      <div className={`h-px w-full ${topBars[status]} opacity-60`} />

      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-terminal-border">
        <div className="flex items-center gap-2">
          {icons[status]}
          <span className="text-xs font-mono text-terminal-text-secondary tracking-wider">{title}</span>
        </div>
        <div className="flex items-center gap-2">
          {timestamp && (
            <span className="text-[10px] font-mono text-terminal-text-dim hidden sm:block">
              {timestamp}
            </span>
          )}
          {copyData && (
            <button
              onClick={handleCopy}
              className="flex items-center gap-1 text-[10px] font-mono text-terminal-text-muted hover:text-terminal-green transition-colors px-1.5 py-0.5 border border-terminal-border rounded hover:border-terminal-green hover:border-opacity-30"
            >
              {copied ? <Check size={10} /> : <Copy size={10} />}
              {copied ? "COPIED" : "COPY"}
            </button>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="p-3">{children}</div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// KV Row — key: value display
// ─────────────────────────────────────────────────────────────
export function KVRow({
  label,
  value,
  accent,
}: {
  label: string;
  value: string | React.ReactNode;
  accent?: "green" | "amber" | "cyan" | "red";
}) {
  const accents = {
    green: "text-terminal-green text-glow",
    amber: "text-terminal-amber text-glow-amber",
    cyan: "text-terminal-cyan text-glow-cyan",
    red: "text-terminal-red text-glow-red",
  };

  return (
    <div className="flex items-start gap-3 py-1 border-b border-terminal-border last:border-0">
      <span className="text-[11px] font-mono text-terminal-text-muted w-28 shrink-0 uppercase tracking-wider mt-0.5">
        {label}
      </span>
      <span
        className={`text-xs font-mono flex-1 break-all ${
          accent ? accents[accent] : "text-terminal-text-secondary"
        }`}
      >
        {value}
      </span>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Tag Badge
// ─────────────────────────────────────────────────────────────
export function TagBadge({
  label,
  color = "default",
}: {
  label: string;
  color?: "green" | "amber" | "cyan" | "red" | "default";
}) {
  const colors = {
    green: "border-terminal-green text-terminal-green bg-terminal-green-glow",
    amber: "border-terminal-amber text-terminal-amber bg-amber-500/5",
    cyan: "border-terminal-cyan text-terminal-cyan bg-cyan-500/5",
    red: "border-terminal-red text-terminal-red bg-red-500/5",
    default: "border-terminal-border text-terminal-text-muted bg-terminal-bg",
  };
  return (
    <span
      className={`inline-flex items-center px-1.5 py-0.5 border rounded text-[10px] font-mono tracking-wider ${colors[color]}`}
    >
      {label}
    </span>
  );
}

// ─────────────────────────────────────────────────────────────
// Severity Badge for dorks
// ─────────────────────────────────────────────────────────────
export function SeverityBadge({ level }: { level: "info" | "low" | "medium" | "high" }) {
  const map = {
    info: { label: "INFO", color: "cyan" as const },
    low: { label: "LOW", color: "green" as const },
    medium: { label: "MED", color: "amber" as const },
    high: { label: "HIGH", color: "red" as const },
  };
  const { label, color } = map[level];
  return <TagBadge label={label} color={color} />;
}
