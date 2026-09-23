"use client";

import { useState, useEffect } from "react";
import TerminalInput from "@/components/TerminalInput";
import { ResultBlock, KVRow, TagBadge } from "@/components/ResultBlock";
import { MapPin, Robot, Shield, WifiHigh } from "@phosphor-icons/react";

interface IPResult {
  ip: string;
  country: string;
  countryCode: string;
  region: string;
  city: string;
  zip: string;
  lat: number;
  lon: number;
  timezone: string;
  isp: string;
  org: string;
  asn: string;
  asnName: string;
  reverse: string;
  flags: { mobile: boolean; proxy: boolean; hosting: boolean };
  timestamp: string;
  error?: string;
}

async function fetchIP(ip: string): Promise<IPResult> {
  const res = await fetch(`/api/ip?q=${encodeURIComponent(ip)}`);
  return res.json() as Promise<IPResult>;
}

// Client-side self IP detection via public API directly from browser
async function detectSelfIP(): Promise<string> {
  const res = await fetch("https://api.ipify.org?format=json");
  const data = await res.json() as { ip: string };
  return data.ip;
}

export default function IPModule() {
  const [result, setResult] = useState<IPResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [selfMode, setSelfMode] = useState(false);
  const [clientIP, setClientIP] = useState<string | null>(null);

  // Detect user's real IP on mount (client-side)
  useEffect(() => {
    detectSelfIP()
      .then((ip) => setClientIP(ip))
      .catch(() => setClientIP(null));
  }, []);

  const handleSubmit = async (value: string) => {
    setLoading(true);
    setResult(null);
    try {
      const data = await fetchIP(value);
      setResult(data);
    } catch {
      setResult({ ip: value, country: "", countryCode: "", region: "", city: "", zip: "", lat: 0, lon: 0, timezone: "", isp: "", org: "", asn: "", asnName: "", reverse: "", flags: { mobile: false, proxy: false, hosting: false }, timestamp: new Date().toISOString(), error: "Network error" });
    } finally {
      setLoading(false);
    }
  };

  const handleMyIP = async () => {
    setSelfMode(true);
    setLoading(true);
    setResult(null);
    try {
      // Use client-detected IP, not server IP
      const ip = clientIP ?? await detectSelfIP();
      const data = await fetchIP(ip);
      setResult(data);
    } catch {
      setResult({ ip: "self", country: "", countryCode: "", region: "", city: "", zip: "", lat: 0, lon: 0, timezone: "", isp: "", org: "", asn: "", asnName: "", reverse: "", flags: { mobile: false, proxy: false, hosting: false }, timestamp: new Date().toISOString(), error: "Could not determine your IP" });
    } finally {
      setLoading(false);
      setSelfMode(false);
    }
  };

  const copyData = result ? JSON.stringify(result, null, 2) : undefined;

  return (
    <div className="space-y-4">
      <TerminalInput
        module="ip geolocation"
        placeholder="8.8.8.8 or 2001:4860:4860::8888"
        onSubmit={handleSubmit}
        loading={loading}
        prefix="geoip>"
      />

      {/* My IP shortcut — shows detected IP */}
      <button
        onClick={handleMyIP}
        disabled={loading}
        className="text-[11px] font-mono text-terminal-text-muted hover:text-terminal-cyan border border-terminal-border hover:border-terminal-cyan hover:border-opacity-30 px-2 py-1 rounded transition-all duration-200 disabled:opacity-40"
      >
        {selfMode ? "querying..." : clientIP ? `→ lookup my IP (${clientIP})` : "→ lookup my own IP"}
      </button>

      {result?.error && (
        <ResultBlock title="ERROR" status="error" timestamp={result.timestamp}>
          <p className="text-xs font-mono text-terminal-red">{result.error}</p>
        </ResultBlock>
      )}

      {result && !result.error && (
        <ResultBlock
          title={`GEO — ${result.ip}`}
          status="success"
          timestamp={result.timestamp}
          copyData={copyData}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6">
            <div>
              <p className="text-[10px] font-mono text-terminal-text-dim tracking-widest mb-2 flex items-center gap-1.5">
                <MapPin size={10} /> LOCATION
              </p>
              <div className="space-y-0">
                <KVRow label="IP" value={result.ip} accent="green" />
                <KVRow label="Country" value={`${result.country} (${result.countryCode})`} accent="cyan" />
                <KVRow label="Region" value={result.region || "N/A"} />
                <KVRow label="City" value={result.city || "N/A"} />
                <KVRow label="ZIP" value={result.zip || "N/A"} />
                <KVRow label="Coordinates" value={`${result.lat}, ${result.lon}`} />
                <KVRow label="Timezone" value={result.timezone} />
              </div>
            </div>

            <div className="mt-4 md:mt-0">
              <p className="text-[10px] font-mono text-terminal-text-dim tracking-widest mb-2 flex items-center gap-1.5">
                <WifiHigh size={10} /> NETWORK
              </p>
              <div className="space-y-0">
                <KVRow label="ISP" value={result.isp || "N/A"} />
                <KVRow label="Org" value={result.org || "N/A"} />
                <KVRow label="ASN" value={result.asn || "N/A"} accent="amber" />
                <KVRow label="ASN Name" value={result.asnName || "N/A"} />
                <KVRow label="rDNS" value={result.reverse || "N/A"} />
              </div>

              <p className="text-[10px] font-mono text-terminal-text-dim tracking-widest mt-3 mb-2 flex items-center gap-1.5">
                <Shield size={10} /> FLAGS
              </p>
              <div className="flex flex-wrap gap-1.5">
                <TagBadge label="MOBILE" color={result.flags.mobile ? "amber" : "default"} />
                <TagBadge label="PROXY/VPN" color={result.flags.proxy ? "red" : "default"} />
                <TagBadge label="HOSTING" color={result.flags.hosting ? "cyan" : "default"} />
              </div>

              <a
                href={`https://www.openstreetmap.org/?mlat=${result.lat}&mlon=${result.lon}&zoom=10`}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-3 flex items-center gap-1.5 text-[11px] font-mono text-terminal-cyan hover:text-glow-cyan transition-colors"
              >
                <MapPin size={11} />
                → view on OpenStreetMap
              </a>
            </div>
          </div>
        </ResultBlock>
      )}
    </div>
  );
}
