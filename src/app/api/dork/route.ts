import { NextRequest, NextResponse } from "next/server";

type DorkCategory = {
  label: string;
  description: string;
  queries: { label: string; query: string; severity: "info" | "low" | "medium" | "high" }[];
};

function generateDorks(target: string): DorkCategory[] {
  const t = target.trim().replace(/^https?:\/\//, "").replace(/\/.*$/, "");

  return [
    {
      label: "Sensitive Files & Directories",
      description: "Exposed configuration, backup, and sensitive files",
      queries: [
        { label: "Config files", query: `site:${t} ext:xml | ext:conf | ext:cnf | ext:reg | ext:inf | ext:rdp | ext:cfg | ext:txt`, severity: "high" },
        { label: "Database files", query: `site:${t} ext:sql | ext:dbf | ext:mdb`, severity: "high" },
        { label: "Backup files", query: `site:${t} ext:bkp | ext:bak | ext:old | ext:backup`, severity: "high" },
        { label: "Log files", query: `site:${t} ext:log`, severity: "medium" },
        { label: "Password files", query: `site:${t} inurl:password | inurl:passwd | inurl:credentials`, severity: "high" },
        { label: "SSH/SSL keys", query: `site:${t} ext:pem | ext:key | ext:ppk`, severity: "high" },
        { label: "Environment files", query: `site:${t} inurl:.env | inurl:.env.local | inurl:.env.production`, severity: "high" },
      ],
    },
    {
      label: "Login & Admin Panels",
      description: "Authentication portals and administrative interfaces",
      queries: [
        { label: "Admin panels", query: `site:${t} inurl:admin | inurl:administrator | inurl:adminpanel`, severity: "medium" },
        { label: "Login pages", query: `site:${t} inurl:login | inurl:signin | inurl:auth`, severity: "info" },
        { label: "Dashboard endpoints", query: `site:${t} inurl:dashboard | inurl:portal | inurl:cpanel`, severity: "medium" },
        { label: "WordPress admin", query: `site:${t} inurl:wp-admin | inurl:wp-login.php`, severity: "medium" },
        { label: "phpMyAdmin", query: `site:${t} inurl:phpmyadmin | inurl:pma`, severity: "high" },
      ],
    },
    {
      label: "Exposed Data & Documents",
      description: "Public documents that may contain sensitive information",
      queries: [
        { label: "PDF documents", query: `site:${t} ext:pdf`, severity: "info" },
        { label: "Excel/CSV files", query: `site:${t} ext:xls | ext:xlsx | ext:csv`, severity: "medium" },
        { label: "Word documents", query: `site:${t} ext:doc | ext:docx`, severity: "info" },
        { label: "Exposed directories", query: `site:${t} intitle:"index of" | intitle:"directory listing"`, severity: "high" },
        { label: "API documentation", query: `site:${t} inurl:api | inurl:swagger | inurl:openapi`, severity: "info" },
      ],
    },
    {
      label: "Subdomains & Infrastructure",
      description: "Infrastructure enumeration and subdomain discovery",
      queries: [
        { label: "All subdomains", query: `site:*.${t}`, severity: "info" },
        { label: "Development/staging", query: `site:dev.${t} | site:staging.${t} | site:test.${t} | site:beta.${t}`, severity: "medium" },
        { label: "API subdomains", query: `site:api.${t} | site:api-*.${t}`, severity: "info" },
        { label: "Exposed ports", query: `site:${t} inurl:8080 | inurl:8443 | inurl:3000 | inurl:8000`, severity: "medium" },
        { label: "S3/Cloud storage", query: `site:s3.amazonaws.com "${t}" | site:blob.core.windows.net "${t}"`, severity: "high" },
      ],
    },
    {
      label: "Error Messages & Debug Info",
      description: "Leaked error messages, stack traces, and debug information",
      queries: [
        { label: "Error messages", query: `site:${t} "error" | "exception" | "stack trace" | "fatal error"`, severity: "medium" },
        { label: "PHP errors", query: `site:${t} "Warning: mysql_" | "Warning: pg_" | "Warning: include"`, severity: "medium" },
        { label: "Debug mode", query: `site:${t} inurl:debug | inurl:test | "debug=true"`, severity: "medium" },
      ],
    },
    {
      label: "Technology Stack",
      description: "Identify technologies, frameworks, and software versions",
      queries: [
        { label: "CMS detection", query: `site:${t} inurl:wp-content | inurl:wp-includes | "Powered by WordPress"`, severity: "info" },
        { label: "Version disclosure", query: `site:${t} intext:"powered by" | intext:"version" | intext:"server"`, severity: "info" },
        { label: "Framework hints", query: `site:${t} "laravel" | "django" | "rails" | "symfony" | "express"`, severity: "info" },
        { label: "GitHub mentions", query: `site:github.com "${t}"`, severity: "info" },
      ],
    },
  ];
}

export async function GET(req: NextRequest) {
  const target = req.nextUrl.searchParams.get("q");
  if (!target) {
    return NextResponse.json({ error: "Target parameter required" }, { status: 400 });
  }

  const clean = target.trim().replace(/^https?:\/\//, "").replace(/\/.*$/, "");
  if (!clean || clean.length < 3) {
    return NextResponse.json({ error: "Invalid target" }, { status: 400 });
  }

  const dorks = generateDorks(clean);
  const totalQueries = dorks.reduce((sum, cat) => sum + cat.queries.length, 0);

  return NextResponse.json({
    target: clean,
    totalCategories: dorks.length,
    totalQueries,
    categories: dorks,
    googleSearchBase: "https://www.google.com/search?q=",
    timestamp: new Date().toISOString(),
  });
}
