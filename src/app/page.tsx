"use client";

import { useState } from "react";
import TerminalHeader from "@/components/TerminalHeader";
import DomainModule from "@/components/modules/DomainModule";
import IPModule from "@/components/modules/IPModule";
import BreachModule from "@/components/modules/BreachModule";
import DorkModule from "@/components/modules/DorkModule";
import UsernameModule from "@/components/modules/UsernameModule";
import SQLiModule from "@/components/modules/SQLiModule";
import SQLiURLModule from "@/components/modules/SQLiURLModule";
import NameModule from "@/components/modules/NameModule";
import {
  Globe,
  MapPin,
  Lock,
  MagnifyingGlass,
  UserCircle,
  GithubLogo,
  Warning,
  Database,
  IdentificationCard,
  LinkSimple,
} from "@phosphor-icons/react";

const MODULES = [
  {
    id: "domain",
    label: "Domain / WHOIS",
    shortLabel: "DOMAIN",
    icon: <Globe size={15} />,
    description: "DNS records + WHOIS via RDAP",
    component: <DomainModule />,
  },
  {
    id: "ip",
    label: "IP Geolocation",
    shortLabel: "GEOIP",
    icon: <MapPin size={15} />,
    description: "ISP, ASN, coordinates, flags",
    component: <IPModule />,
  },
  {
    id: "breach",
    label: "Breach Check",
    shortLabel: "BREACH",
    icon: <Lock size={15} />,
    description: "Email exposure via HIBP",
    component: <BreachModule />,
  },
  {
    id: "dork",
    label: "Google Dorking",
    shortLabel: "DORK",
    icon: <MagnifyingGlass size={15} />,
    description: "Auto-generate dork queries",
    component: <DorkModule />,
  },
  {
    id: "sqli",
    label: "SQLi Payloads",
    shortLabel: "SQLI",
    icon: <Database size={15} />,
    description: "SQL injection payload generator",
    component: <SQLiModule />,
  },
  {
    id: "sqli-url",
    label: "SQLi URL Analyzer",
    shortLabel: "SQLIURL",
    icon: <LinkSimple size={15} />,
    description: "Inject payloads into URL params",
    component: <SQLiURLModule />,
  },
  {
    id: "username",
    label: "Username Lookup",
    shortLabel: "USER",
    icon: <UserCircle size={15} />,
    description: "18 platforms in parallel",
    component: <UsernameModule />,
  },
  {
    id: "name",
    label: "OSINT by Name",
    shortLabel: "NAME",
    icon: <IdentificationCard size={15} />,
    description: "People search + username variants",
    component: <NameModule />,
  },
];

export default function Home() {
  const [activeModule, setActiveModule] = useState("domain");

  const active = MODULES.find((m) => m.id === activeModule)!;

  return (
    <div className="min-h-[100dvh] flex flex-col bg-terminal-bg">
      <TerminalHeader />

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <aside className="hidden md:flex flex-col w-52 border-r border-terminal-border bg-terminal-bg-secondary shrink-0">
          <nav className="flex-1 py-2">
            {MODULES.map((mod) => (
              <button
                key={mod.id}
                onClick={() => setActiveModule(mod.id)}
                className={`
                  w-full flex items-start gap-2.5 px-3 py-3
                  text-left transition-all duration-200
                  border-l-2
                  ${
                    activeModule === mod.id
                      ? "border-terminal-green bg-terminal-green-glow text-terminal-green"
                      : "border-transparent text-terminal-text-muted hover:text-terminal-text-secondary hover:bg-terminal-bg-card"
                  }
                `}
              >
                <span className={`shrink-0 mt-0.5 ${activeModule === mod.id ? "text-glow" : ""}`}>
                  {mod.icon}
                </span>
                <div>
                  <p className={`text-xs font-mono ${activeModule === mod.id ? "text-glow" : ""}`}>
                    {mod.label}
                  </p>
                  <p className="text-[10px] font-mono text-terminal-text-dim mt-0.5">
                    {mod.description}
                  </p>
                </div>
              </button>
            ))}
          </nav>

          {/* Sidebar footer */}
          <div className="p-3 border-t border-terminal-border space-y-2">
            <a
              href="https://github.com/ynz-code/not4recon"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-[10px] font-mono text-terminal-text-dim hover:text-terminal-green transition-colors"
            >
              <GithubLogo size={12} />
              github/not4recon
            </a>
            <div className="flex items-center gap-1.5 text-[10px] font-mono text-terminal-amber">
              <Warning size={11} />
              authorized use only
            </div>
          </div>
        </aside>

        {/* Mobile tab bar */}
        <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 border-t border-terminal-border bg-terminal-bg-secondary flex">
          {MODULES.map((mod) => (
            <button
              key={mod.id}
              onClick={() => setActiveModule(mod.id)}
              className={`
                flex-1 flex flex-col items-center gap-0.5 py-2.5
                text-[9px] font-mono tracking-wider transition-colors
                ${
                  activeModule === mod.id
                    ? "text-terminal-green"
                    : "text-terminal-text-dim"
                }
              `}
            >
              <span className={activeModule === mod.id ? "text-glow" : ""}>{mod.icon}</span>
              {mod.shortLabel}
            </button>
          ))}
        </div>

        {/* Main content */}
        <main className="flex-1 overflow-y-auto pb-20 md:pb-0">
          {/* Module header */}
          <div className="sticky top-0 z-10 px-4 py-3 border-b border-terminal-border bg-terminal-bg-secondary backdrop-blur-sm">
            <div className="flex items-center gap-2">
              <span className="text-terminal-green text-glow">{active.icon}</span>
              <span className="text-xs font-mono text-terminal-text-secondary">{active.label}</span>
              <span className="text-terminal-text-dim text-[10px] font-mono">—</span>
              <span className="text-[10px] font-mono text-terminal-text-dim">{active.description}</span>
            </div>
          </div>

          {/* Module content */}
          <div className="p-4 max-w-3xl">
            {active.component}
          </div>
        </main>
      </div>
    </div>
  );
}
