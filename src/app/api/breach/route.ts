import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const email = req.nextUrl.searchParams.get("q");
  if (!email) {
    return NextResponse.json({ error: "Email parameter required" }, { status: 400 });
  }

  const clean = email.trim().toLowerCase();

  // Basic email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(clean)) {
    return NextResponse.json({ error: "Invalid email format" }, { status: 400 });
  }

  const apiKey = process.env.HIBP_API_KEY;

  if (!apiKey) {
    // No API key — return informational response pointing to HIBP
    return NextResponse.json({
      email: clean,
      mode: "no_key",
      message: "HaveIBeenPwned API key not configured. Check the target manually.",
      hibpUrl: `https://haveibeenpwned.com/account/${encodeURIComponent(clean)}`,
      alternativeSources: [
        { name: "HaveIBeenPwned", url: `https://haveibeenpwned.com/account/${encodeURIComponent(clean)}` },
        { name: "DeHashed", url: "https://dehashed.com" },
        { name: "IntelX", url: "https://intelx.io" },
      ],
      timestamp: new Date().toISOString(),
    });
  }

  try {
    // HIBP v3 API — requires paid key
    const res = await fetch(
      `https://haveibeenpwned.com/api/v3/breachedaccount/${encodeURIComponent(clean)}?truncateResponse=false`,
      {
        headers: {
          "hibp-api-key": apiKey,
          "user-agent": "not4recon-osint-tool",
        },
      }
    );

    if (res.status === 404) {
      return NextResponse.json({
        email: clean,
        breached: false,
        breachCount: 0,
        breaches: [],
        timestamp: new Date().toISOString(),
      });
    }

    if (res.status === 401) {
      return NextResponse.json({ error: "Invalid HIBP API key" }, { status: 401 });
    }

    if (res.status === 429) {
      return NextResponse.json({ error: "Rate limit exceeded. Try again in 1 minute." }, { status: 429 });
    }

    if (!res.ok) {
      throw new Error(`HIBP API returned ${res.status}`);
    }

    const breaches = await res.json() as {
      Name: string;
      Title: string;
      Domain: string;
      BreachDate: string;
      AddedDate: string;
      DataClasses: string[];
      PwnCount: number;
      Description: string;
      IsVerified: boolean;
      IsSensitive: boolean;
    }[];

    return NextResponse.json({
      email: clean,
      breached: breaches.length > 0,
      breachCount: breaches.length,
      breaches: breaches.map((b) => ({
        name: b.Name,
        title: b.Title,
        domain: b.Domain,
        breachDate: b.BreachDate,
        addedDate: b.AddedDate,
        dataClasses: b.DataClasses,
        pwnCount: b.PwnCount,
        isVerified: b.IsVerified,
        isSensitive: b.IsSensitive,
      })),
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    return NextResponse.json(
      { error: "Failed to check breach data", detail: String(err) },
      { status: 500 }
    );
  }
}
