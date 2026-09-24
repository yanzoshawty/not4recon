import { NextRequest, NextResponse } from "next/server";

// Disposable email domains list
const DISPOSABLE_DOMAINS = new Set([
  "mailinator.com","guerrillamail.com","10minutemail.com","throwam.com",
  "tempmail.com","yopmail.com","sharklasers.com","guerrillamailblock.com",
  "grr.la","guerrillamail.info","guerrillamail.biz","guerrillamail.de",
  "guerrillamail.net","guerrillamail.org","spam4.me","trashmail.com",
  "trashmail.me","trashmail.net","dispostable.com","mailnull.com",
  "spamgourmet.com","spamgourmet.net","spamgourmet.org","maildrop.cc",
  "getairmail.com","filzmail.com","throwam.com","fakeinbox.com",
  "mailexpire.com","bigpond.com","tempr.email","discard.email",
  "spamevader.com","fakemailgenerator.com","getnada.com","mailnesia.com",
]);

// Platform check definitions for Holehe-style checks
const EMAIL_PLATFORMS = [
  // Batch 1 — Social & Communication
  { name: "GitHub", url: "https://github.com/password_reset", field: "email", method: "POST", batch: 1 },
  { name: "Twitter/X", url: "https://twitter.com/i/flow/password_reset", field: "email_or_username", method: "POST", batch: 1 },
  { name: "Instagram", url: "https://www.instagram.com/accounts/password/reset/", field: "email", method: "POST", batch: 1 },
  { name: "Facebook", url: "https://www.facebook.com/login/identify/", field: "email", method: "POST", batch: 1 },
  { name: "LinkedIn", url: "https://www.linkedin.com/checkpoint/rp/request-password-reset", field: "email", method: "POST", batch: 1 },
  { name: "Reddit", url: "https://www.reddit.com/password", field: "email", method: "POST", batch: 1 },
  { name: "TikTok", url: "https://www.tiktok.com/passport/user/reset-password/", field: "email", method: "POST", batch: 1 },
  { name: "Pinterest", url: "https://www.pinterest.com/password/reset/", field: "email", method: "POST", batch: 1 },
  { name: "Snapchat", url: "https://accounts.snapchat.com/accounts/password_reset_request", field: "email", method: "POST", batch: 1 },
  { name: "Tumblr", url: "https://www.tumblr.com/forgot_password", field: "email", method: "POST", batch: 1 },

  // Batch 2 — Developer & Tech
  { name: "GitLab", url: "https://gitlab.com/users/password/new", field: "user[email]", method: "POST", batch: 2 },
  { name: "Stack Overflow", url: "https://stackoverflow.com/users/account-recovery", field: "email", method: "POST", batch: 2 },
  { name: "Dev.to", url: "https://dev.to/users/password/new", field: "user[email]", method: "POST", batch: 2 },
  { name: "Heroku", url: "https://id.heroku.com/account/password/reset", field: "email", method: "POST", batch: 2 },
  { name: "Digital Ocean", url: "https://cloud.digitalocean.com/reset_passwords/new", field: "email", method: "POST", batch: 2 },
  { name: "Vercel", url: "https://vercel.com/api/registration/forgot", field: "email", method: "POST", batch: 2 },
  { name: "Netlify", url: "https://app.netlify.com/reset-password", field: "email", method: "POST", batch: 2 },
  { name: "Cloudflare", url: "https://dash.cloudflare.com/forgot-password", field: "email", method: "POST", batch: 2 },
  { name: "npm", url: "https://www.npmjs.com/forgot", field: "email", method: "POST", batch: 2 },
  { name: "PyPI", url: "https://pypi.org/account/reset-password/", field: "email", method: "POST", batch: 2 },

  // Batch 3 — Shopping & Finance
  { name: "Amazon", url: "https://www.amazon.com/ap/forgotpassword", field: "email", method: "POST", batch: 3 },
  { name: "eBay", url: "https://signin.ebay.com/ws/iBayAPI.dll?ForgotPassword", field: "userid", method: "POST", batch: 3 },
  { name: "PayPal", url: "https://www.paypal.com/authflow/password-recovery/", field: "email", method: "POST", batch: 3 },
  { name: "Stripe", url: "https://dashboard.stripe.com/login", field: "email", method: "POST", batch: 3 },
  { name: "Shopify", url: "https://accounts.shopify.com/lookup", field: "email", method: "POST", batch: 3 },
  { name: "Etsy", url: "https://www.etsy.com/forgot-password", field: "email", method: "POST", batch: 3 },
  { name: "Coinbase", url: "https://www.coinbase.com/signin/forgot-password", field: "email", method: "POST", batch: 3 },
  { name: "Binance", url: "https://accounts.binance.com/en/user/password/reset", field: "email", method: "POST", batch: 3 },
  { name: "Steam", url: "https://help.steampowered.com/en/wizard/HelpWithLoginInfo", field: "input_username", method: "POST", batch: 3 },
  { name: "Epic Games", url: "https://www.epicgames.com/id/forgot-password", field: "email", method: "POST", batch: 3 },

  // Batch 4 — Content & Media
  { name: "Medium", url: "https://medium.com/m/signin", field: "email", method: "POST", batch: 4 },
  { name: "WordPress.com", url: "https://wordpress.com/lostpassword/", field: "user_login", method: "POST", batch: 4 },
  { name: "Spotify", url: "https://accounts.spotify.com/password-reset", field: "email", method: "POST", batch: 4 },
  { name: "Netflix", url: "https://www.netflix.com/LoginHelp", field: "email", method: "POST", batch: 4 },
  { name: "Disney+", url: "https://www.disneyplus.com/forgot-password", field: "email", method: "POST", batch: 4 },
  { name: "Twitch", url: "https://www.twitch.tv/user/forgot-password", field: "email", method: "POST", batch: 4 },
  { name: "YouTube", url: "https://accounts.google.com/signin/recovery", field: "email", method: "POST", batch: 4 },
  { name: "SoundCloud", url: "https://soundcloud.com/password/forgot", field: "email", method: "POST", batch: 4 },
  { name: "Duolingo", url: "https://www.duolingo.com/forgot_password", field: "email", method: "POST", batch: 4 },
  { name: "Canva", url: "https://www.canva.com/forgot-password", field: "email", method: "POST", batch: 4 },

  // Batch 5 — Productivity & Cloud
  { name: "Google", url: "https://accounts.google.com/signin/recovery", field: "email", method: "POST", batch: 5 },
  { name: "Microsoft", url: "https://account.live.com/password/reset", field: "MemberName", method: "POST", batch: 5 },
  { name: "Apple", url: "https://iforgot.apple.com/password/verify/appleid", field: "email", method: "POST", batch: 5 },
  { name: "Dropbox", url: "https://www.dropbox.com/forgot", field: "login_email", method: "POST", batch: 5 },
  { name: "Notion", url: "https://www.notion.so/api/v3/sendEmail", field: "email", method: "POST", batch: 5 },
  { name: "Slack", url: "https://slack.com/forgot-password", field: "email", method: "POST", batch: 5 },
  { name: "Discord", url: "https://discord.com/api/v9/auth/forgot", field: "email", method: "POST", batch: 5 },
  { name: "Zoom", url: "https://zoom.us/forgot_password", field: "email", method: "POST", batch: 5 },
  { name: "Trello", url: "https://trello.com/forgot", field: "email", method: "POST", batch: 5 },
  { name: "Asana", url: "https://app.asana.com/api/1.0/users/reset_password", field: "email", method: "POST", batch: 5 },
];

export async function GET(req: NextRequest) {
  const email = req.nextUrl.searchParams.get("q");
  const batchParam = req.nextUrl.searchParams.get("batch");

  if (!email) {
    return NextResponse.json({ error: "Email parameter required" }, { status: 400 });
  }

  const clean = email.trim().toLowerCase();
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(clean)) {
    return NextResponse.json({ error: "Invalid email format" }, { status: 400 });
  }

  const [localPart, domain] = clean.split("@");

  // MX record check via DNS over HTTPS
  let mxRecords: string[] = [];
  let mxValid = false;
  try {
    const mxRes = await fetch(`https://dns.google/resolve?name=${domain}&type=MX`);
    if (mxRes.ok) {
      const mxData = await mxRes.json() as { Answer?: { data: string; TTL: number }[] };
      if (mxData.Answer) {
        mxRecords = mxData.Answer.map((r) => r.data).sort();
        mxValid = mxRecords.length > 0;
      }
    }
  } catch { /* silently fail */ }

  // Domain A/AAAA check
  let domainExists = false;
  try {
    const aRes = await fetch(`https://dns.google/resolve?name=${domain}&type=A`);
    if (aRes.ok) {
      const aData = await aRes.json() as { Answer?: unknown[] };
      domainExists = (aData.Answer?.length ?? 0) > 0;
    }
  } catch { /* silently fail */ }

  // Disposable check
  const isDisposable = DISPOSABLE_DOMAINS.has(domain);

  // Email format analysis
  const isNumericLocal = /^\d+$/.test(localPart);
  const hasSpecialChars = /[+\-._]/.test(localPart);
  const localLength = localPart.length;

  // OSINT links
  const encoded = encodeURIComponent(clean);
  const osintLinks = [
    {
      category: "Breach Databases",
      sources: [
        { name: "HaveIBeenPwned", url: `https://haveibeenpwned.com/account/${encoded}`, description: "Check known data breaches" },
        { name: "IntelX", url: `https://intelx.io/?s=${encoded}`, description: "Intelligence X — dark web + breach search" },
        { name: "DeHashed", url: `https://dehashed.com/search?query=${encoded}`, description: "Comprehensive breach database" },
        { name: "BreachDirectory", url: `https://breachdirectory.org/`, description: "Free breach directory" },
        { name: "Leak-Lookup", url: `https://leak-lookup.com/search`, description: "Multi-source leak database" },
        { name: "Snusbase", url: `https://snusbase.com/`, description: "Database search engine" },
      ],
    },
    {
      category: "Social Media Search",
      sources: [
        { name: "Google exact", url: `https://www.google.com/search?q="${encoded}"`, description: "Exact email match search" },
        { name: "Google domain only", url: `https://www.google.com/search?q="${encodeURIComponent(domain)}"`, description: "Search by email domain" },
        { name: "LinkedIn", url: `https://www.linkedin.com/search/results/people/?keywords=${encoded}`, description: "Professional network search" },
        { name: "Facebook", url: `https://www.facebook.com/search/top?q=${encoded}`, description: "Facebook people search" },
        { name: "Twitter/X", url: `https://twitter.com/search?q=${encoded}`, description: "Twitter profile search" },
        { name: "GitHub", url: `https://github.com/search?q=${encoded}&type=users`, description: "GitHub developer search" },
      ],
    },
    {
      category: "Email Verification",
      sources: [
        { name: "MailboxValidator", url: `https://www.mailboxvalidator.com/demo?email=${encoded}`, description: "Free email validation + disposable check" },
        { name: "Hunter.io verify", url: `https://hunter.io/email-verifier/${encoded}`, description: "Email deliverability check" },
        { name: "Emailrep.io", url: `https://emailrep.io/${encoded}`, description: "Email reputation and risk score" },
        { name: "MxToolbox", url: `https://mxtoolbox.com/emailheader.aspx`, description: "Email header analyzer" },
      ],
    },
    {
      category: "Email Header Analysis",
      sources: [
        { name: "MxToolbox Header", url: "https://mxtoolbox.com/emailheader.aspx", description: "Paste raw header — parse routing, IPs, relay servers" },
        { name: "Google Admin Toolbox", url: "https://toolbox.googleapps.com/apps/messageheader/", description: "Google header analyzer — trace delivery path" },
        { name: "Mail Header Analyzer", url: "https://mailheader.org/", description: "Detailed header parser with IP geolocation" },
        { name: "WhatIsMyIPAddress Header", url: "https://whatismyipaddress.com/trace-email", description: "Email trace with sender IP lookup" },
      ],
    },
  ];

  // Platform batch info
  const batchNum = batchParam ? parseInt(batchParam) : null;
  const totalBatches = 5;
  const batchPlatforms = batchNum
    ? EMAIL_PLATFORMS.filter((p) => p.batch === batchNum)
    : EMAIL_PLATFORMS.filter((p) => p.batch === 1);

  return NextResponse.json({
    email: clean,
    analysis: {
      localPart,
      domain,
      isDisposable,
      isNumericLocal,
      hasSpecialChars,
      localLength,
      mxValid,
      mxRecords,
      domainExists,
      risk: isDisposable ? "high" : !mxValid ? "medium" : "low",
      notes: [
        isDisposable ? "⚠ Disposable/temporary email domain detected" : null,
        !mxValid ? "⚠ No MX records found — domain may not accept email" : null,
        !domainExists ? "⚠ Domain does not resolve — possibly fake" : null,
        isNumericLocal ? "ℹ Numeric local part — possible auto-generated address" : null,
        hasSpecialChars ? "ℹ Special chars in local part — may be email alias" : null,
      ].filter(Boolean),
    },
    platforms: {
      currentBatch: batchNum ?? 1,
      totalBatches,
      totalPlatforms: EMAIL_PLATFORMS.length,
      batchPlatforms: batchPlatforms.map((p) => ({
        name: p.name,
        url: p.url,
        method: p.method,
        fieldName: p.field,
        batch: p.batch,
      })),
    },
    osintLinks,
    googleDorks: [
      `"${clean}"`,
      `"${clean}" site:linkedin.com`,
      `"${clean}" site:github.com`,
      `"${clean}" filetype:pdf`,
      `"${domain}" intext:"${localPart}"`,
      `"${clean}" site:pastebin.com`,
    ],
    timestamp: new Date().toISOString(),
  });
}
