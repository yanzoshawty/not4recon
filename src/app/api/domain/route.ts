import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const domain = req.nextUrl.searchParams.get("q");
  if (!domain) {
    return NextResponse.json({ error: "Domain parameter required" }, { status: 400 });
  }

  const clean = domain.replace(/^https?:\/\//, "").replace(/\/.*$/, "").trim();

  try {
    const [dnsRes, rdapRes] = await Promise.allSettled([
      fetch(`https://dns.google/resolve?name=${clean}&type=ANY`),
      fetch(`https://rdap.org/domain/${clean}`),
    ]);

    // DNS Records
    let dnsData: Record<string, unknown> | null = null;
    if (dnsRes.status === "fulfilled" && dnsRes.value.ok) {
      dnsData = await dnsRes.value.json();
    }

    // RDAP (WHOIS alternative, open standard)
    let rdapData: Record<string, unknown> | null = null;
    if (rdapRes.status === "fulfilled" && rdapRes.value.ok) {
      rdapData = await rdapRes.value.json();
    }

    // Parse DNS records
    const DNS_TYPES: Record<number, string> = {
      1: "A", 2: "NS", 5: "CNAME", 6: "SOA",
      15: "MX", 16: "TXT", 28: "AAAA", 33: "SRV", 257: "CAA",
    };

    const records: { type: string; name: string; data: string; ttl: number }[] = [];
    if (dnsData && Array.isArray((dnsData as { Answer?: unknown[] }).Answer)) {
      const answers = (dnsData as { Answer: { type: number; name: string; data: string; TTL: number }[] }).Answer;
      for (const r of answers) {
        records.push({
          type: DNS_TYPES[r.type] ?? `TYPE${r.type}`,
          name: r.name,
          data: r.data,
          ttl: r.TTL,
        });
      }
    }

    // Parse RDAP
    let registrar = "N/A";
    let createdDate = "N/A";
    let expiresDate = "N/A";
    let updatedDate = "N/A";
    let status: string[] = [];
    let nameservers: string[] = [];

    if (rdapData) {
      const r = rdapData as {
        entities?: { roles: string[]; vcardArray?: unknown[] }[];
        events?: { eventAction: string; eventDate: string }[];
        status?: string[];
        nameservers?: { ldhName: string }[];
      };

      // Registrar
      const registrarEntity = r.entities?.find((e) => e.roles?.includes("registrar"));
      if (registrarEntity?.vcardArray) {
        const vcard = registrarEntity.vcardArray as unknown[][];
        const fnEntry = (vcard[1] as unknown[][])?.find((v: unknown[]) => v[0] === "fn");
        if (fnEntry) registrar = fnEntry[3] as string;
      }

      // Dates
      const created = r.events?.find((e) => e.eventAction === "registration");
      const expires = r.events?.find((e) => e.eventAction === "expiration");
      const updated = r.events?.find((e) => e.eventAction === "last changed");
      if (created) createdDate = new Date(created.eventDate).toISOString().split("T")[0];
      if (expires) expiresDate = new Date(expires.eventDate).toISOString().split("T")[0];
      if (updated) updatedDate = new Date(updated.eventDate).toISOString().split("T")[0];

      status = r.status ?? [];
      nameservers = r.nameservers?.map((ns) => ns.ldhName) ?? [];
    }

    return NextResponse.json({
      domain: clean,
      registrar,
      created: createdDate,
      expires: expiresDate,
      updated: updatedDate,
      status,
      nameservers,
      records,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    return NextResponse.json(
      { error: "Failed to fetch domain data", detail: String(err) },
      { status: 500 }
    );
  }
}
