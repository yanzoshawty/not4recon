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
        { label: "Database files", query: `site:${t} ext:sql | ext:dbf | ext:mdb | ext:sqlite | ext:db`, severity: "high" },
        { label: "Backup files", query: `site:${t} ext:bkp | ext:bak | ext:old | ext:backup | ext:orig | ext:save`, severity: "high" },
        { label: "Log files", query: `site:${t} ext:log | ext:logs`, severity: "medium" },
        { label: "Password files", query: `site:${t} inurl:password | inurl:passwd | inurl:credentials | inurl:secret`, severity: "high" },
        { label: "SSH/SSL keys", query: `site:${t} ext:pem | ext:key | ext:ppk | ext:p12 | ext:pfx`, severity: "high" },
        { label: "Environment files", query: `site:${t} inurl:.env | inurl:.env.local | inurl:.env.production | inurl:.env.staging`, severity: "high" },
        { label: "Docker/K8s configs", query: `site:${t} ext:yml | ext:yaml intext:password | intext:secret | intext:token`, severity: "high" },
        { label: "Terraform state", query: `site:${t} ext:tfstate | inurl:terraform.tfstate`, severity: "high" },
        { label: "Certificate files", query: `site:${t} ext:crt | ext:cer | ext:csr`, severity: "medium" },
      ],
    },
    {
      label: "Login & Admin Panels",
      description: "Authentication portals and administrative interfaces",
      queries: [
        { label: "Admin panels", query: `site:${t} inurl:admin | inurl:administrator | inurl:adminpanel | inurl:admin-panel`, severity: "medium" },
        { label: "Login pages", query: `site:${t} inurl:login | inurl:signin | inurl:auth | inurl:authenticate`, severity: "info" },
        { label: "Dashboard endpoints", query: `site:${t} inurl:dashboard | inurl:portal | inurl:cpanel | inurl:controlpanel`, severity: "medium" },
        { label: "WordPress admin", query: `site:${t} inurl:wp-admin | inurl:wp-login.php`, severity: "medium" },
        { label: "phpMyAdmin", query: `site:${t} inurl:phpmyadmin | inurl:pma | inurl:myadmin`, severity: "high" },
        { label: "Jenkins CI", query: `site:${t} inurl:jenkins | intitle:"Dashboard [Jenkins]"`, severity: "high" },
        { label: "GitLab/Gitea", query: `site:${t} inurl:gitlab | inurl:gitea | inurl:/root/projects`, severity: "medium" },
        { label: "Grafana", query: `site:${t} inurl:grafana | intitle:"Grafana"`, severity: "medium" },
        { label: "Kibana", query: `site:${t} inurl:kibana | intitle:"Kibana"`, severity: "medium" },
        { label: "Jira/Confluence", query: `site:${t} inurl:jira | inurl:confluence | inurl:/secure/Dashboard`, severity: "medium" },
      ],
    },
    {
      label: "Exposed Data & Documents",
      description: "Public documents that may contain sensitive information",
      queries: [
        { label: "PDF documents", query: `site:${t} ext:pdf`, severity: "info" },
        { label: "Excel/CSV files", query: `site:${t} ext:xls | ext:xlsx | ext:csv`, severity: "medium" },
        { label: "Word documents", query: `site:${t} ext:doc | ext:docx`, severity: "info" },
        { label: "PowerPoint files", query: `site:${t} ext:ppt | ext:pptx`, severity: "info" },
        { label: "Exposed directories", query: `site:${t} intitle:"index of" | intitle:"directory listing" | intitle:"parent directory"`, severity: "high" },
        { label: "API documentation", query: `site:${t} inurl:api | inurl:swagger | inurl:openapi | inurl:api-docs`, severity: "info" },
        { label: "Internal wikis", query: `site:${t} inurl:wiki | inurl:confluence | intitle:"Internal" | intitle:"Confidential"`, severity: "medium" },
        { label: "Source code files", query: `site:${t} ext:php | ext:asp | ext:aspx | ext:jsp | ext:py | ext:rb`, severity: "medium" },
        { label: "Shell scripts", query: `site:${t} ext:sh | ext:bash | ext:ps1 | ext:bat | ext:cmd`, severity: "medium" },
        { label: "JSON data files", query: `site:${t} ext:json intext:password | intext:secret | intext:token | intext:key`, severity: "high" },
      ],
    },
    {
      label: "Subdomains & Infrastructure",
      description: "Infrastructure enumeration and subdomain discovery",
      queries: [
        { label: "All subdomains", query: `site:*.${t}`, severity: "info" },
        { label: "Dev/Staging/Test", query: `site:dev.${t} | site:staging.${t} | site:test.${t} | site:beta.${t} | site:qa.${t}`, severity: "medium" },
        { label: "API subdomains", query: `site:api.${t} | site:api-*.${t} | site:apis.${t}`, severity: "info" },
        { label: "Exposed ports", query: `site:${t} inurl:8080 | inurl:8443 | inurl:3000 | inurl:8000 | inurl:9000 | inurl:3306`, severity: "medium" },
        { label: "Mail/VPN subdomains", query: `site:mail.${t} | site:vpn.${t} | site:remote.${t} | site:webmail.${t}`, severity: "medium" },
        { label: "Monitoring/Analytics", query: `site:monitor.${t} | site:metrics.${t} | site:status.${t} | site:grafana.${t}`, severity: "medium" },
        { label: "Internal tools", query: `site:internal.${t} | site:intranet.${t} | site:corp.${t}`, severity: "high" },
        { label: "CDN/Static assets", query: `site:cdn.${t} | site:static.${t} | site:assets.${t} | site:media.${t}`, severity: "info" },
      ],
    },
    {
      label: "Cloud Storage & Secrets",
      description: "Exposed S3 buckets, Azure blobs, and cloud credentials",
      queries: [
        { label: "AWS S3 buckets", query: `site:s3.amazonaws.com "${t}"`, severity: "high" },
        { label: "S3 bucket domain pattern", query: `site:*.s3.amazonaws.com "${t}"`, severity: "high" },
        { label: "Azure Blob storage", query: `site:blob.core.windows.net "${t}"`, severity: "high" },
        { label: "Google Cloud Storage", query: `site:storage.googleapis.com "${t}"`, severity: "high" },
        { label: "AWS keys in public", query: `site:${t} "AKIA" | "ASIA" intext:secret`, severity: "high" },
        { label: "GCP service account", query: `site:${t} ext:json intext:"type" intext:"service_account"`, severity: "high" },
        { label: "Firebase exposed", query: `site:firebaseapp.com "${t}" | site:firebaseio.com "${t}"`, severity: "high" },
        { label: "Heroku apps", query: `site:herokuapp.com "${t}"`, severity: "info" },
        { label: "DigitalOcean Spaces", query: `site:digitaloceanspaces.com "${t}"`, severity: "high" },
        { label: "Exposed cloud configs", query: `site:${t} intext:"aws_access_key" | intext:"aws_secret" | intext:"azure_client_secret"`, severity: "high" },
      ],
    },
    {
      label: "API Keys & Hardcoded Secrets",
      description: "API keys, tokens, and credentials indexed in public pages",
      queries: [
        { label: "Generic API keys", query: `site:${t} intext:"api_key" | intext:"apikey" | intext:"api-key"`, severity: "high" },
        { label: "Stripe keys", query: `site:${t} intext:"sk_live_" | intext:"pk_live_"`, severity: "high" },
        { label: "Twilio keys", query: `site:${t} intext:"ACXXXXXXXX" | intext:"auth_token" | intext:"SK"`, severity: "high" },
        { label: "SendGrid tokens", query: `site:${t} intext:"SG." intext:"api"`, severity: "high" },
        { label: "GitHub tokens", query: `site:${t} intext:"ghp_" | intext:"github_token" | intext:"GITHUB_TOKEN"`, severity: "high" },
        { label: "JWT tokens", query: `site:${t} intext:"eyJ" ext:js | ext:json | ext:log`, severity: "high" },
        { label: "OAuth secrets", query: `site:${t} intext:"client_secret" | intext:"oauth_secret" | intext:"consumer_secret"`, severity: "high" },
        { label: "Slack webhook", query: `site:${t} intext:"hooks.slack.com/services/"`, severity: "high" },
        { label: "Google API keys", query: `site:${t} intext:"AIza" | intext:"google_api_key"`, severity: "high" },
        { label: "SSH private keys", query: `site:${t} intext:"BEGIN RSA PRIVATE KEY" | intext:"BEGIN OPENSSH PRIVATE KEY"`, severity: "high" },
        { label: "Database connection strings", query: `site:${t} intext:"mongodb://" | intext:"mysql://" | intext:"postgresql://"`, severity: "high" },
      ],
    },
    {
      label: "Exposed Git & CI/CD",
      description: "Exposed .git folders, GitLab CI, Jenkins, and pipeline secrets",
      queries: [
        { label: "Git directory exposed", query: `site:${t} inurl:"/.git/" intitle:"Index of"`, severity: "high" },
        { label: "Gitconfig exposed", query: `site:${t} inurl:".gitconfig" | inurl:".git/config"`, severity: "high" },
        { label: "GitHub Actions secrets", query: `site:github.com/${t} intext:"GITHUB_TOKEN" | intext:"AWS_SECRET"`, severity: "high" },
        { label: "Jenkins build logs", query: `site:${t} inurl:"/job/" inurl:"/console" | intitle:"Console Output"`, severity: "high" },
        { label: "GitLab CI pipelines", query: `site:${t} inurl:"/-/pipelines" | inurl:"/-/jobs"`, severity: "medium" },
        { label: "Travis CI config", query: `site:${t} inurl:".travis.yml" | inurl:"travis.ci"`, severity: "medium" },
        { label: "CircleCI config", query: `site:${t} inurl:".circleci/config.yml"`, severity: "medium" },
        { label: "Dockerfile exposed", query: `site:${t} inurl:"Dockerfile" | inurl:".dockerignore"`, severity: "medium" },
        { label: "Kubernetes configs", query: `site:${t} inurl:"kubeconfig" | inurl:"kube/config" | ext:yaml intext:"apiVersion"`, severity: "high" },
        { label: "Ansible playbooks", query: `site:${t} ext:yml intext:"hosts:" intext:"tasks:" intext:"password"`, severity: "high" },
        { label: "Helm charts", query: `site:${t} inurl:"values.yaml" intext:"password" | intext:"secret"`, severity: "high" },
      ],
    },
    {
      label: "IoT & SCADA Systems",
      description: "Industrial control systems and IoT devices via Google",
      queries: [
        { label: "Industrial SCADA", query: `site:${t} intitle:"SCADA" | intitle:"HMI" | intitle:"PLC" | intitle:"Industrial Control"`, severity: "high" },
        { label: "IP cameras", query: `site:${t} inurl:"/view/view.shtml" | intitle:"Live View - AXIS" | intitle:"Network Camera"`, severity: "high" },
        { label: "Printers exposed", query: `site:${t} intitle:"HP LaserJet" | intitle:"Xerox WorkCentre" | inurl:"printer/main.html"`, severity: "medium" },
        { label: "Router admin pages", query: `site:${t} intitle:"Router" inurl:"setup.cgi" | intitle:"ADSL" inurl:"admin"`, severity: "high" },
        { label: "Building automation", query: `site:${t} intitle:"BACnet" | intitle:"Niagara" | intitle:"Tridium"`, severity: "high" },
        { label: "VoIP systems", query: `site:${t} intitle:"Asterisk" | inurl:"/asterisk/" | intext:"SIP/2.0"`, severity: "high" },
        { label: "Smart meter/energy", query: `site:${t} intitle:"Power Monitor" | intitle:"Energy Monitor" | inurl:"/ems/"`, severity: "high" },
        { label: "Modbus/OPC endpoints", query: `site:${t} intext:"Modbus" | intext:"OPC-UA" | intext:"DNP3"`, severity: "high" },
      ],
    },
    {
      label: "Database Admin Panels",
      description: "Exposed database management interfaces",
      queries: [
        { label: "phpMyAdmin", query: `site:${t} inurl:phpmyadmin | intitle:"phpMyAdmin" intext:"Welcome to phpMyAdmin"`, severity: "high" },
        { label: "Adminer", query: `site:${t} inurl:adminer | intitle:"Adminer" intext:"Login - Adminer"`, severity: "high" },
        { label: "pgAdmin", query: `site:${t} inurl:pgadmin | intitle:"pgAdmin"`, severity: "high" },
        { label: "MongoDB Express", query: `site:${t} intitle:"Mongo Express" | inurl:"mongo-express"`, severity: "high" },
        { label: "Redis Commander", query: `site:${t} intitle:"Redis Commander" | inurl:"redis-commander"`, severity: "high" },
        { label: "ElasticSearch exposed", query: `site:${t} inurl:9200/_cat | inurl:9200/_nodes | intitle:"Kibana"`, severity: "high" },
        { label: "CouchDB", query: `site:${t} inurl:5984/_utils | intitle:"CouchDB - Futon"`, severity: "high" },
        { label: "Memcached stats", query: `site:${t} intitle:"Memcached Stats" | inurl:memcached-stats`, severity: "high" },
        { label: "SQL Server mgmt", query: `site:${t} inurl:"ReportServer" | intitle:"SQL Server Reporting"`, severity: "high" },
        { label: "Oracle Enterprise Mgr", query: `site:${t} inurl:"/em/" intitle:"Oracle Enterprise Manager"`, severity: "high" },
      ],
    },
    {
      label: "JWT & Session Token Leaks",
      description: "Leaked auth tokens and session data in public pages",
      queries: [
        { label: "JWT in JS files", query: `site:${t} ext:js intext:"eyJhbGciOiJ"`, severity: "high" },
        { label: "Bearer tokens", query: `site:${t} intext:"Bearer " intext:"Authorization"`, severity: "high" },
        { label: "Session cookies", query: `site:${t} intext:"PHPSESSID=" | intext:"JSESSIONID=" | intext:"ASP.NET_SessionId="`, severity: "high" },
        { label: "Access tokens", query: `site:${t} intext:"access_token" | intext:"accessToken" ext:js | ext:json`, severity: "high" },
        { label: "Refresh tokens", query: `site:${t} intext:"refresh_token" | intext:"refreshToken"`, severity: "high" },
        { label: "SAML assertions", query: `site:${t} intext:"SAMLResponse" | intext:"SAMLRequest"`, severity: "high" },
        { label: "OAuth codes", query: `site:${t} inurl:"code=" inurl:"state=" inurl:"oauth"`, severity: "high" },
        { label: "Password reset tokens", query: `site:${t} inurl:"token=" inurl:"reset" | inurl:"forgot-password"`, severity: "high" },
      ],
    },
    {
      label: "CMS Vulnerabilities",
      description: "WordPress, Drupal, Joomla, and other CMS-specific dorks",
      queries: [
        { label: "WordPress plugins", query: `site:${t} inurl:"/wp-content/plugins/" | inurl:"/wp-includes/"`, severity: "medium" },
        { label: "WordPress user enum", query: `site:${t} inurl:"?author=" | inurl:"/wp-json/wp/v2/users"`, severity: "medium" },
        { label: "WordPress config", query: `site:${t} inurl:wp-config.php | intext:"DB_PASSWORD" | intext:"DB_NAME"`, severity: "high" },
        { label: "WordPress uploads", query: `site:${t} inurl:"/wp-content/uploads/" ext:php`, severity: "high" },
        { label: "Drupal install", query: `site:${t} inurl:"/sites/default/files/" | inurl:"/misc/drupal.js"`, severity: "medium" },
        { label: "Drupal config", query: `site:${t} inurl:"/sites/default/settings.php"`, severity: "high" },
        { label: "Joomla config", query: `site:${t} inurl:"/configuration.php" | inurl:"/administrator/index.php"`, severity: "high" },
        { label: "Magento admin", query: `site:${t} inurl:"/index.php/admin" | inurl:"/admin/dashboard"`, severity: "high" },
        { label: "Shopify private", query: `site:${t} inurl:"/admin/products" | inurl:"/admin/orders"`, severity: "medium" },
        { label: "Laravel debug", query: `site:${t} intext:"Whoops! There was an error." | intitle:"Laravel" intext:"debug"`, severity: "high" },
      ],
    },
    {
      label: "Error Messages & Debug Info",
      description: "Leaked error messages, stack traces, and debug output",
      queries: [
        { label: "PHP errors", query: `site:${t} "Warning: mysql_" | "Warning: pg_" | "Warning: include" | "Parse error:"`, severity: "medium" },
        { label: "Python tracebacks", query: `site:${t} "Traceback (most recent call last)" | "Django Debug" | "Flask Debug"`, severity: "medium" },
        { label: "Java stack traces", query: `site:${t} "java.lang.NullPointerException" | "at org.springframework" | "Exception in thread"`, severity: "medium" },
        { label: "ASP.NET errors", query: `site:${t} "Server Error in '/' Application" | "ASP.NET is configured to show verbose error messages"`, severity: "medium" },
        { label: "SQL error messages", query: `site:${t} "You have an error in your SQL syntax" | "ORA-00933" | "PostgreSQL ERROR"`, severity: "high" },
        { label: "Debug mode active", query: `site:${t} inurl:debug | inurl:test | "debug=true" | "APP_DEBUG=true"`, severity: "medium" },
        { label: "Verbose server errors", query: `site:${t} intext:"Internal Server Error" intext:"nginx" | intext:"Apache"`, severity: "low" },
      ],
    },
    {
      label: "Technology Stack",
      description: "Identify technologies, frameworks, versions, and third-party tools",
      queries: [
        { label: "CMS detection", query: `site:${t} inurl:wp-content | "Powered by WordPress" | "Powered by Drupal"`, severity: "info" },
        { label: "Framework hints", query: `site:${t} "laravel" | "django" | "rails" | "symfony" | "express" | "fastapi"`, severity: "info" },
        { label: "Version disclosure", query: `site:${t} intext:"powered by" | intext:"version" | intext:"server:"`, severity: "info" },
        { label: "GitHub code mentions", query: `site:github.com "${t}"`, severity: "info" },
        { label: "Pastebin leaks", query: `site:pastebin.com "${t}"`, severity: "high" },
        { label: "npm/PyPI packages", query: `site:npmjs.com "${t}" | site:pypi.org "${t}"`, severity: "info" },
        { label: "Job postings tech stack", query: `"${t}" site:linkedin.com/jobs | site:indeed.com intext:"stack" | intext:"technologies"`, severity: "info" },
        { label: "Wayback machine", query: `site:web.archive.org "${t}"`, severity: "info" },
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
