"use client";

import { useState, useRef, useEffect, KeyboardEvent } from "react";
import { MagnifyingGlass, X, ArrowElbowDownLeft } from "@phosphor-icons/react";

interface TerminalInputProps {
  module: string;
  placeholder: string;
  onSubmit: (value: string) => void;
  loading?: boolean;
  prefix?: string;
}

export default function TerminalInput({
  module,
  placeholder,
  onSubmit,
  loading = false,
  prefix = "$",
}: TerminalInputProps) {
  const [value, setValue] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleSubmit = () => {
    const trimmed = value.trim();
    if (!trimmed || loading) return;
    onSubmit(trimmed);
  };

  const handleKey = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") handleSubmit();
  };

  const handleClear = () => {
    setValue("");
    inputRef.current?.focus();
  };

  return (
    <div className="group relative">
      {/* Module label */}
      <div className="flex items-center gap-2 mb-1.5">
        <span className="text-[10px] font-mono text-terminal-text-muted tracking-widest uppercase">
          {module}
        </span>
        <div className="h-px flex-1 bg-terminal-border" />
      </div>

      {/* Input row */}
      <div
        className={`
          flex items-center gap-2 px-3 py-2.5
          border border-terminal-border rounded
          bg-terminal-bg-card
          transition-all duration-300 ease-[cubic-bezier(0.32,0.72,0,1)]
          focus-within:border-terminal-green focus-within:border-opacity-40
          focus-within:shadow-input-focus
          focus-within:bg-terminal-bg-card-hover
        `}
      >
        {/* Prompt prefix */}
        <span className="text-terminal-green font-mono text-sm shrink-0 select-none text-glow">
          {prefix}
        </span>

        {/* Input */}
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKey}
          placeholder={placeholder}
          disabled={loading}
          spellCheck={false}
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="none"
          className="
            flex-1 bg-transparent font-mono text-sm
            text-terminal-green placeholder:text-terminal-text-dim
            outline-none disabled:opacity-50 disabled:cursor-not-allowed
          "
        />

        {/* Actions */}
        <div className="flex items-center gap-1.5 shrink-0">
          {value && !loading && (
            <button
              onClick={handleClear}
              className="p-1 text-terminal-text-muted hover:text-terminal-red transition-colors duration-150 rounded"
              aria-label="Clear input"
            >
              <X size={12} weight="bold" />
            </button>
          )}

          {loading ? (
            <div className="flex items-center gap-1 text-terminal-text-muted">
              <LoadingDots />
            </div>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={!value.trim()}
              className="
                flex items-center gap-1.5 px-2 py-1
                border border-terminal-border rounded text-[10px] font-mono
                text-terminal-text-secondary
                hover:border-terminal-green hover:border-opacity-40 hover:text-terminal-green
                disabled:opacity-30 disabled:cursor-not-allowed
                transition-all duration-200 ease-[cubic-bezier(0.32,0.72,0,1)]
              "
              aria-label="Run query"
            >
              <MagnifyingGlass size={11} />
              <span className="hidden sm:inline">EXECUTE</span>
              <ArrowElbowDownLeft size={11} className="text-terminal-text-dim" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function LoadingDots() {
  return (
    <div className="flex gap-0.5 items-center">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="w-1 h-1 rounded-full bg-terminal-green animate-cursor-blink"
          style={{ animationDelay: `${i * 150}ms` }}
        />
      ))}
      <span className="text-[10px] ml-1 font-mono text-terminal-text-muted">scanning</span>
    </div>
  );
}
