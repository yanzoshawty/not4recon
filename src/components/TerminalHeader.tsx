"use client";

import { useEffect, useState } from "react";
import {
  Terminal,
  WifiHigh,
  ShieldCheck,
  Eye,
} from "@phosphor-icons/react";

const BOOT_LINES = [
  "[ OK ] Initializing not4recon kernel modules...",
  "[ OK ] Loading OSINT intelligence engine v1.0.0",
  "[ OK ] Establishing secure DNS-over-HTTPS tunnel",
  "[ OK ] Mounting public intelligence sources",
  "[ OK ] not4recon ready — all systems nominal",
];

export default function TerminalHeader() {
  const [bootLines, setBootLines] = useState<string[]>([]);
  const [booted, setBooted] = useState(false);
  const [time, setTime] = useState("");

  useEffect(() => {
    let i = 0;
    const interval = setInterval(() => {
      if (i < BOOT_LINES.length) {
        setBootLines((prev) => [...prev, BOOT_LINES[i]]);
        i++;
      } else {
        clearInterval(interval);
        setTimeout(() => setBooted(true), 400);
      }
    }, 220);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const tick = () => setTime(new Date().toISOString().replace("T", " ").slice(0, 19) + " UTC");
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <header className="border-b border-terminal-border bg-terminal-bg-secondary">
      {/* Top bar */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-terminal-border">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-terminal-red opacity-80" />
          <div className="w-3 h-3 rounded-full bg-terminal-amber opacity-80" />
          <div className="w-3 h-3 rounded-full bg-terminal-green opacity-80" />
        </div>
        <span className="text-terminal-text-muted font-mono text-xs tracking-widest">
          not4recon — OSINT TERMINAL
        </span>
        <div className="flex items-center gap-3 text-xs text-terminal-text-muted font-mono">
          <span className="hidden sm:block">{time}</span>
          <WifiHigh size={14} className="text-terminal-green" weight="bold" />
        </div>
      </div>

      {/* Boot sequence */}
      {!booted && (
        <div className="px-4 py-3 space-y-0.5">
          {bootLines.map((line, i) => (
            <p
              key={i}
              className="text-xs font-mono text-terminal-text-secondary"
              style={{ animationDelay: `${i * 50}ms` }}
            >
              <span className="text-terminal-green">{(line ?? "").startsWith("[ OK ]") ? "[ OK ]" : ""}</span>
              {(line ?? "").replace("[ OK ]", "")}
            </p>
          ))}
          {bootLines.length < BOOT_LINES.length && (
            <span className="inline-block w-2 h-3 bg-terminal-green animate-cursor-blink" />
          )}
        </div>
      )}

      {/* Main header — shown after boot */}
      {booted && (
        <div className="px-4 py-5 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
          {/* Brand */}
          <div className="flex items-start gap-3">
            <div className="p-2 border border-terminal-border-active rounded bg-terminal-bg-card shadow-terminal-glow">
              <Eye size={24} className="text-terminal-green text-glow" weight="duotone" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold tracking-tighter text-terminal-green text-glow font-mono">
                  not4recon
                </h1>
                <span className="text-[10px] font-mono px-1.5 py-0.5 border border-terminal-green border-opacity-30 text-terminal-green opacity-60 rounded-sm tracking-widest">
                  v1.0.0
                </span>
              </div>
              <p className="text-terminal-text-secondary text-xs font-mono mt-0.5">
                Open Source Intelligence Terminal — browser-native, no installation
              </p>
            </div>
          </div>

          {/* Status pills */}
          <div className="flex items-center gap-2 flex-wrap">
            <StatusPill icon={<Terminal size={11} />} label="ACTIVE" color="green" />
            <StatusPill icon={<ShieldCheck size={11} />} label="ETHICAL USE ONLY" color="amber" />
            <StatusPill icon={<WifiHigh size={11} />} label="LIVE" color="cyan" />
          </div>
        </div>
      )}
    </header>
  );
}

function StatusPill({
  icon,
  label,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  color: "green" | "amber" | "cyan" | "red";
}) {
  const colors = {
    green: "border-terminal-green text-terminal-green bg-terminal-green-glow",
    amber: "border-terminal-amber text-terminal-amber bg-amber-500/5",
    cyan: "border-terminal-cyan text-terminal-cyan bg-cyan-500/5",
    red: "border-terminal-red text-terminal-red bg-red-500/5",
  };
  return (
    <span
      className={`flex items-center gap-1 px-2 py-0.5 border rounded text-[10px] font-mono tracking-widest ${colors[color]}`}
    >
      {icon}
      {label}
    </span>
  );
}
