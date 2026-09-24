import { NextRequest, NextResponse } from "next/server";

// Country code → country info mapping (comprehensive)
const COUNTRY_CODES: Record<string, { country: string; iso: string; region: string; flag: string }> = {
  "1": { country: "United States / Canada", iso: "US/CA", region: "North America", flag: "🇺🇸" },
  "7": { country: "Russia / Kazakhstan", iso: "RU/KZ", region: "Eastern Europe/Central Asia", flag: "🇷🇺" },
  "20": { country: "Egypt", iso: "EG", region: "Middle East/Africa", flag: "🇪🇬" },
  "27": { country: "South Africa", iso: "ZA", region: "Africa", flag: "🇿🇦" },
  "30": { country: "Greece", iso: "GR", region: "Europe", flag: "🇬🇷" },
  "31": { country: "Netherlands", iso: "NL", region: "Europe", flag: "🇳🇱" },
  "32": { country: "Belgium", iso: "BE", region: "Europe", flag: "🇧🇪" },
  "33": { country: "France", iso: "FR", region: "Europe", flag: "🇫🇷" },
  "34": { country: "Spain", iso: "ES", region: "Europe", flag: "🇪🇸" },
  "36": { country: "Hungary", iso: "HU", region: "Europe", flag: "🇭🇺" },
  "39": { country: "Italy", iso: "IT", region: "Europe", flag: "🇮🇹" },
  "40": { country: "Romania", iso: "RO", region: "Europe", flag: "🇷🇴" },
  "41": { country: "Switzerland", iso: "CH", region: "Europe", flag: "🇨🇭" },
  "43": { country: "Austria", iso: "AT", region: "Europe", flag: "🇦🇹" },
  "44": { country: "United Kingdom", iso: "GB", region: "Europe", flag: "🇬🇧" },
  "45": { country: "Denmark", iso: "DK", region: "Europe", flag: "🇩🇰" },
  "46": { country: "Sweden", iso: "SE", region: "Europe", flag: "🇸🇪" },
  "47": { country: "Norway", iso: "NO", region: "Europe", flag: "🇳🇴" },
  "48": { country: "Poland", iso: "PL", region: "Europe", flag: "🇵🇱" },
  "49": { country: "Germany", iso: "DE", region: "Europe", flag: "🇩🇪" },
  "51": { country: "Peru", iso: "PE", region: "South America", flag: "🇵🇪" },
  "52": { country: "Mexico", iso: "MX", region: "North America", flag: "🇲🇽" },
  "53": { country: "Cuba", iso: "CU", region: "Caribbean", flag: "🇨🇺" },
  "54": { country: "Argentina", iso: "AR", region: "South America", flag: "🇦🇷" },
  "55": { country: "Brazil", iso: "BR", region: "South America", flag: "🇧🇷" },
  "56": { country: "Chile", iso: "CL", region: "South America", flag: "🇨🇱" },
  "57": { country: "Colombia", iso: "CO", region: "South America", flag: "🇨🇴" },
  "58": { country: "Venezuela", iso: "VE", region: "South America", flag: "🇻🇪" },
  "60": { country: "Malaysia", iso: "MY", region: "Southeast Asia", flag: "🇲🇾" },
  "61": { country: "Australia", iso: "AU", region: "Oceania", flag: "🇦🇺" },
  "62": { country: "Indonesia", iso: "ID", region: "Southeast Asia", flag: "🇮🇩" },
  "63": { country: "Philippines", iso: "PH", region: "Southeast Asia", flag: "🇵🇭" },
  "64": { country: "New Zealand", iso: "NZ", region: "Oceania", flag: "🇳🇿" },
  "65": { country: "Singapore", iso: "SG", region: "Southeast Asia", flag: "🇸🇬" },
  "66": { country: "Thailand", iso: "TH", region: "Southeast Asia", flag: "🇹🇭" },
  "81": { country: "Japan", iso: "JP", region: "East Asia", flag: "🇯🇵" },
  "82": { country: "South Korea", iso: "KR", region: "East Asia", flag: "🇰🇷" },
  "84": { country: "Vietnam", iso: "VN", region: "Southeast Asia", flag: "🇻🇳" },
  "86": { country: "China", iso: "CN", region: "East Asia", flag: "🇨🇳" },
  "90": { country: "Turkey", iso: "TR", region: "Europe/Asia", flag: "🇹🇷" },
  "91": { country: "India", iso: "IN", region: "South Asia", flag: "🇮🇳" },
  "92": { country: "Pakistan", iso: "PK", region: "South Asia", flag: "🇵🇰" },
  "93": { country: "Afghanistan", iso: "AF", region: "South Asia", flag: "🇦🇫" },
  "94": { country: "Sri Lanka", iso: "LK", region: "South Asia", flag: "🇱🇰" },
  "95": { country: "Myanmar", iso: "MM", region: "Southeast Asia", flag: "🇲🇲" },
  "98": { country: "Iran", iso: "IR", region: "Middle East", flag: "🇮🇷" },
  "212": { country: "Morocco", iso: "MA", region: "Africa", flag: "🇲🇦" },
  "213": { country: "Algeria", iso: "DZ", region: "Africa", flag: "🇩🇿" },
  "216": { country: "Tunisia", iso: "TN", region: "Africa", flag: "🇹🇳" },
  "218": { country: "Libya", iso: "LY", region: "Africa", flag: "🇱🇾" },
  "220": { country: "Gambia", iso: "GM", region: "Africa", flag: "🇬🇲" },
  "221": { country: "Senegal", iso: "SN", region: "Africa", flag: "🇸🇳" },
  "234": { country: "Nigeria", iso: "NG", region: "Africa", flag: "🇳🇬" },
  "254": { country: "Kenya", iso: "KE", region: "Africa", flag: "🇰🇪" },
  "255": { country: "Tanzania", iso: "TZ", region: "Africa", flag: "🇹🇿" },
  "256": { country: "Uganda", iso: "UG", region: "Africa", flag: "🇺🇬" },
  "260": { country: "Zambia", iso: "ZM", region: "Africa", flag: "🇿🇲" },
  "263": { country: "Zimbabwe", iso: "ZW", region: "Africa", flag: "🇿🇼" },
  "351": { country: "Portugal", iso: "PT", region: "Europe", flag: "🇵🇹" },
  "352": { country: "Luxembourg", iso: "LU", region: "Europe", flag: "🇱🇺" },
  "353": { country: "Ireland", iso: "IE", region: "Europe", flag: "🇮🇪" },
  "354": { country: "Iceland", iso: "IS", region: "Europe", flag: "🇮🇸" },
  "358": { country: "Finland", iso: "FI", region: "Europe", flag: "🇫🇮" },
  "370": { country: "Lithuania", iso: "LT", region: "Europe", flag: "🇱🇹" },
  "371": { country: "Latvia", iso: "LV", region: "Europe", flag: "🇱🇻" },
  "372": { country: "Estonia", iso: "EE", region: "Europe", flag: "🇪🇪" },
  "380": { country: "Ukraine", iso: "UA", region: "Europe", flag: "🇺🇦" },
  "381": { country: "Serbia", iso: "RS", region: "Europe", flag: "🇷🇸" },
  "385": { country: "Croatia", iso: "HR", region: "Europe", flag: "🇭🇷" },
  "386": { country: "Slovenia", iso: "SI", region: "Europe", flag: "🇸🇮" },
  "420": { country: "Czech Republic", iso: "CZ", region: "Europe", flag: "🇨🇿" },
  "421": { country: "Slovakia", iso: "SK", region: "Europe", flag: "🇸🇰" },
  "880": { country: "Bangladesh", iso: "BD", region: "South Asia", flag: "🇧🇩" },
  "966": { country: "Saudi Arabia", iso: "SA", region: "Middle East", flag: "🇸🇦" },
  "971": { country: "UAE", iso: "AE", region: "Middle East", flag: "🇦🇪" },
  "972": { country: "Israel", iso: "IL", region: "Middle East", flag: "🇮🇱" },
  "973": { country: "Bahrain", iso: "BH", region: "Middle East", flag: "🇧🇭" },
  "974": { country: "Qatar", iso: "QA", region: "Middle East", flag: "🇶🇦" },
  "975": { country: "Bhutan", iso: "BT", region: "South Asia", flag: "🇧🇹" },
  "976": { country: "Mongolia", iso: "MN", region: "East Asia", flag: "🇲🇳" },
  "977": { country: "Nepal", iso: "NP", region: "South Asia", flag: "🇳🇵" },
  "992": { country: "Tajikistan", iso: "TJ", region: "Central Asia", flag: "🇹🇯" },
  "993": { country: "Turkmenistan", iso: "TM", region: "Central Asia", flag: "🇹🇲" },
  "994": { country: "Azerbaijan", iso: "AZ", region: "Central Asia", flag: "🇦🇿" },
  "995": { country: "Georgia", iso: "GE", region: "Central Asia", flag: "🇬🇪" },
  "996": { country: "Kyrgyzstan", iso: "KG", region: "Central Asia", flag: "🇰🇬" },
  "998": { country: "Uzbekistan", iso: "UZ", region: "Central Asia", flag: "🇺🇿" },
};

function parsePhoneNumber(raw: string): {
  normalized: string;
  e164: string;
  countryCode: string;
  nationalNumber: string;
  isValid: boolean;
  lineType: string;
} {
  // Strip everything except digits and leading +
  const cleaned = raw.replace(/[\s\-\(\)\.]/g, "");
  const digits = cleaned.replace(/^\+/, "");

  // Detect E.164
  let countryCode = "";
  let nationalNumber = "";

  // Try longest prefix match (1–4 digits)
  for (const len of [4, 3, 2, 1]) {
    const prefix = digits.slice(0, len);
    if (COUNTRY_CODES[prefix]) {
      countryCode = prefix;
      nationalNumber = digits.slice(len);
      break;
    }
  }

  if (!countryCode) {
    // Default assume US if no + and 10 digits
    if (digits.length === 10) {
      countryCode = "1";
      nationalNumber = digits;
    } else {
      countryCode = digits.slice(0, 2);
      nationalNumber = digits.slice(2);
    }
  }

  const e164 = `+${countryCode}${nationalNumber}`;
  const isValid = nationalNumber.length >= 6 && nationalNumber.length <= 13;

  // Basic line type heuristic from national number prefix
  let lineType = "Unknown";
  if (countryCode === "62") {
    // Indonesia specific
    const prefix3 = nationalNumber.slice(0, 3);
    const prefix2 = nationalNumber.slice(0, 2);
    if (["811","812","813","821","822","823","851","852","853"].includes(prefix3)) lineType = "Mobile (Telkomsel)";
    else if (["814","815","816","855","856","857","858"].includes(prefix3)) lineType = "Mobile (Indosat/IM3)";
    else if (["817","818","819","859","877","878"].includes(prefix3)) lineType = "Mobile (XL Axiata)";
    else if (["831","832","833","838"].includes(prefix3)) lineType = "Mobile (Axis)";
    else if (["895","896","897","898","899"].includes(prefix3)) lineType = "Mobile (3/Tri)";
    else if (["881","882","883","884","885","886","887","888","889"].includes(prefix3)) lineType = "Mobile (Smartfren)";
    else if (prefix2 === "21") lineType = "Landline (Jakarta)";
    else if (prefix2 === "22") lineType = "Landline (Bandung)";
    else if (prefix2 === "31") lineType = "Landline (Surabaya)";
    else lineType = "Mobile/Landline";
  } else if (countryCode === "1") {
    lineType = nationalNumber.length === 10 ? "Mobile/Landline (NANP)" : "Unknown";
  } else if (countryCode === "44") {
    const p = nationalNumber.slice(0, 2);
    if (["07","08"].includes(p)) lineType = "Mobile";
    else lineType = "Landline";
  } else {
    lineType = "Mobile (unverified)";
  }

  return {
    normalized: `+${countryCode} ${nationalNumber}`,
    e164,
    countryCode,
    nationalNumber,
    isValid,
    lineType,
  };
}

export async function GET(req: NextRequest) {
  const phone = req.nextUrl.searchParams.get("q");
  if (!phone) {
    return NextResponse.json({ error: "Phone number parameter required" }, { status: 400 });
  }

  const parsed = parsePhoneNumber(phone);
  const countryInfo = COUNTRY_CODES[parsed.countryCode];

  if (!parsed.isValid) {
    return NextResponse.json({ error: "Invalid phone number format. Use E.164 format: +628123456789" }, { status: 400 });
  }

  const encoded = encodeURIComponent(parsed.e164);
  const encodedNational = encodeURIComponent(parsed.nationalNumber);

  // OSINT search links
  const osintLinks = [
    {
      category: "Reverse Lookup",
      sources: [
        { name: "Truecaller", url: `https://www.truecaller.com/search/id/${encodedNational}`, description: "Caller ID and spam detection" },
        { name: "Sync.me", url: `https://sync.me/search/?number=${encoded}`, description: "Reverse phone lookup" },
        { name: "WhoCallsMe", url: `https://www.whocalledme.com/PhoneNumber/${parsed.nationalNumber}`, description: "Community-reported caller info" },
        { name: "NumLookup", url: `https://www.numlookup.com/?phone=${encoded}`, description: "Free reverse phone lookup" },
        { name: "SpamCalls", url: `https://spamcalls.net/en/search?q=${encoded}`, description: "Spam and scam number database" },
      ],
    },
    {
      category: "Messaging Apps",
      sources: [
        { name: "WhatsApp Check", url: `https://wa.me/${parsed.countryCode}${parsed.nationalNumber}`, description: "Open WhatsApp chat — shows if number is registered" },
        { name: "Telegram Search", url: `https://t.me/${parsed.nationalNumber}`, description: "Check Telegram username/number" },
        { name: "Viber", url: `viber://chat?number=${encoded}`, description: "Check if registered on Viber" },
      ],
    },
    {
      category: "Social Media Search",
      sources: [
        { name: "Google search", url: `https://www.google.com/search?q="${encoded}"`, description: "Full number Google search" },
        { name: "Google no country code", url: `https://www.google.com/search?q="${encodedNational}"`, description: "National number only search" },
        { name: "Facebook", url: `https://www.facebook.com/search/top?q=${encoded}`, description: "Facebook profile search by phone" },
        { name: "LinkedIn", url: `https://www.linkedin.com/search/results/people/?keywords=${encoded}`, description: "LinkedIn people search" },
        { name: "Twitter/X", url: `https://twitter.com/search?q=${encoded}`, description: "Tweet/profile search" },
        { name: "TikTok", url: `https://www.tiktok.com/search?q=${encoded}`, description: "TikTok search" },
      ],
    },
    {
      category: "Breach & Leak Databases",
      sources: [
        { name: "IntelX", url: `https://intelx.io/?s=${encoded}`, description: "Intelligence X breach database search" },
        { name: "DeHashed", url: `https://dehashed.com/search?query=${encoded}`, description: "Breach database with phone support" },
        { name: "Leak-Lookup", url: `https://leak-lookup.com/search`, description: "Breach lookup — search manually" },
        { name: "BreachDirectory", url: `https://breachdirectory.org/`, description: "Open breach directory" },
      ],
    },
    {
      category: "Carrier & Validation",
      sources: [
        { name: "Phonexa validate", url: `https://phonexa.com/tools/phone-validator/?phone=${encoded}`, description: "Free phone validator + carrier" },
        { name: "FreeTSR", url: `https://www.freecarrierlookup.com/`, description: "Free carrier lookup — enter manually" },
        { name: "National DNC", url: `https://www.donotcall.gov/verify.html`, description: "US Do Not Call registry check" },
      ],
    },
  ];

  // Geolocation estimate from country code
  const geoEstimate = countryInfo
    ? {
        country: countryInfo.country,
        iso: countryInfo.iso,
        region: countryInfo.region,
        flag: countryInfo.flag,
        confidence: "Country-level (from country code)",
        note: "Precise city-level geolocation requires carrier SS7 access — not available publicly",
      }
    : null;

  return NextResponse.json({
    raw: phone,
    parsed: {
      normalized: parsed.normalized,
      e164: parsed.e164,
      countryCode: `+${parsed.countryCode}`,
      nationalNumber: parsed.nationalNumber,
      lineType: parsed.lineType,
      isValid: parsed.isValid,
    },
    geoEstimate,
    osintLinks,
    footprintLinks: {
      whatsappDirect: `https://wa.me/${parsed.countryCode}${parsed.nationalNumber}`,
      googleDork: `"${parsed.e164}" OR "${parsed.nationalNumber}"`,
      googleDorkUrl: `https://www.google.com/search?q=%22${encoded}%22+OR+%22${encodedNational}%22`,
    },
    timestamp: new Date().toISOString(),
  });
}
