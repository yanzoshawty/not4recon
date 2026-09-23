import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const ip = req.nextUrl.searchParams.get("q");
  if (!ip) {
    return NextResponse.json({ error: "IP parameter required" }, { status: 400 });
  }

  const clean = ip.trim();

  // Validate IP format (basic)
  const ipv4 = /^(\d{1,3}\.){3}\d{1,3}$/;
  const ipv6 = /^[0-9a-fA-F:]+$/;
  if (!ipv4.test(clean) && !ipv6.test(clean)) {
    return NextResponse.json({ error: "Invalid IP address format" }, { status: 400 });
  }

  try {
    // ip-api.com — free, no key required, 45 req/min
    const target = `/${clean}`;
    const res = await fetch(
      `http://ip-api.com/json${target}?fields=status,message,country,countryCode,region,regionName,city,zip,lat,lon,timezone,isp,org,as,asname,reverse,mobile,proxy,hosting,query`
    );

    if (!res.ok) {
      throw new Error(`ip-api returned ${res.status}`);
    }

    const data = await res.json() as {
      status: string;
      message?: string;
      country: string;
      countryCode: string;
      region: string;
      regionName: string;
      city: string;
      zip: string;
      lat: number;
      lon: number;
      timezone: string;
      isp: string;
      org: string;
      as: string;
      asname: string;
      reverse: string;
      mobile: boolean;
      proxy: boolean;
      hosting: boolean;
      query: string;
    };

    if (data.status === "fail") {
      return NextResponse.json({ error: data.message ?? "Lookup failed" }, { status: 404 });
    }

    return NextResponse.json({
      ip: data.query,
      country: data.country,
      countryCode: data.countryCode,
      region: data.regionName,
      city: data.city,
      zip: data.zip,
      lat: data.lat,
      lon: data.lon,
      timezone: data.timezone,
      isp: data.isp,
      org: data.org,
      asn: data.as,
      asnName: data.asname,
      reverse: data.reverse,
      flags: {
        mobile: data.mobile,
        proxy: data.proxy,
        hosting: data.hosting,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    return NextResponse.json(
      { error: "Failed to fetch IP data", detail: String(err) },
      { status: 500 }
    );
  }
}
