import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const name = req.nextUrl.searchParams.get("q");
  if (!name) {
    return NextResponse.json({ error: "Name parameter required" }, { status: 400 });
  }

  const clean = name.trim();
  const encoded = encodeURIComponent(clean);
  const parts = clean.split(/\s+/);
  const firstName = parts[0] ?? "";
  const lastName = parts[parts.length - 1] ?? "";

  // Generate username variants from name
  const usernameVariants = [
    clean.toLowerCase().replace(/\s+/g, ""),
    clean.toLowerCase().replace(/\s+/g, "_"),
    clean.toLowerCase().replace(/\s+/g, "."),
    `${firstName.toLowerCase()}${lastName.toLowerCase()}`,
    `${firstName.toLowerCase()}.${lastName.toLowerCase()}`,
    `${firstName.toLowerCase()}_${lastName.toLowerCase()}`,
    `${firstName.toLowerCase()}${lastName.charAt(0).toLowerCase()}`,
    `${firstName.charAt(0).toLowerCase()}${lastName.toLowerCase()}`,
    `${firstName.charAt(0).toLowerCase()}.${lastName.toLowerCase()}`,
  ].filter((v, i, arr) => v.length >= 3 && arr.indexOf(v) === i).slice(0, 6);

  // Search links — public sources
  const searchLinks = [
    {
      category: "Social Media",
      sources: [
        { name: "LinkedIn", url: `https://www.linkedin.com/search/results/people/?keywords=${encoded}`, description: "Professional network profile search" },
        { name: "Twitter/X", url: `https://twitter.com/search?q=${encoded}&f=user`, description: "Find Twitter/X accounts" },
        { name: "Facebook", url: `https://www.facebook.com/search/people/?q=${encoded}`, description: "Facebook people search" },
        { name: "Instagram", url: `https://www.instagram.com/explore/search/keyword/?q=${encoded}`, description: "Instagram username/name search" },
        { name: "TikTok", url: `https://www.tiktok.com/search/user?q=${encoded}`, description: "TikTok user search" },
      ],
    },
    {
      category: "Professional & Developer",
      sources: [
        { name: "GitHub", url: `https://github.com/search?q=${encoded}&type=users`, description: "GitHub developer profiles" },
        { name: "GitLab", url: `https://gitlab.com/search?search=${encoded}&scope=users`, description: "GitLab user search" },
        { name: "Dev.to", url: `https://dev.to/search?q=${encoded}`, description: "Dev.to developer profiles" },
        { name: "Stack Overflow", url: `https://stackoverflow.com/search?q=${encoded}&tab=Users`, description: "Stack Overflow contributor search" },
        { name: "Keybase", url: `https://keybase.io/${firstName.toLowerCase()}${lastName.toLowerCase()}`, description: "Keybase identity verification" },
      ],
    },
    {
      category: "Public Records & Data",
      sources: [
        { name: "Google", url: `https://www.google.com/search?q="${encoded}"`, description: "Full name Google search with quotes" },
        { name: "Google Images", url: `https://www.google.com/search?tbm=isch&q="${encoded}"`, description: "Image search for facial recognition context" },
        { name: "Bing", url: `https://www.bing.com/search?q="${encoded}"`, description: "Bing people search" },
        { name: "DuckDuckGo", url: `https://duckduckgo.com/?q="${encoded}"`, description: "Privacy-focused name search" },
        { name: "Pipl (manual)", url: `https://pipl.com/search/?q=${encoded}`, description: "Deep people search engine" },
      ],
    },
    {
      category: "Google Dorks for Name",
      sources: [
        { name: "Email addresses", url: `https://www.google.com/search?q="${encoded}"+email+OR+%40`, description: "Find email addresses associated with name" },
        { name: "Phone numbers", url: `https://www.google.com/search?q="${encoded}"+phone+OR+tel+OR+mobile`, description: "Find phone numbers linked to name" },
        { name: "Social profiles", url: `https://www.google.com/search?q="${encoded}"+site:linkedin.com+OR+site:twitter.com+OR+site:facebook.com`, description: "Find social media profiles" },
        { name: "Documents & mentions", url: `https://www.google.com/search?q="${encoded}"+filetype:pdf+OR+filetype:doc`, description: "Find documents mentioning this name" },
        { name: "News mentions", url: `https://www.google.com/search?q="${encoded}"&tbm=nws`, description: "News articles mentioning the person" },
        { name: "Forum posts", url: `https://www.google.com/search?q="${encoded}"+site:reddit.com+OR+site:quora.com`, description: "Forum and Q&A mentions" },
      ],
    },
    {
      category: "Username Enumeration",
      sources: usernameVariants.map((uname) => ({
        name: `@${uname}`,
        url: `/modules/username?q=${encodeURIComponent(uname)}`,
        description: `Scan 18 platforms for username "${uname}"`,
        isInternal: true,
        username: uname,
      })),
    },
  ];

  return NextResponse.json({
    name: clean,
    firstName,
    lastName,
    usernameVariants,
    searchLinks,
    totalSources: searchLinks.reduce((sum, cat) => sum + cat.sources.length, 0),
    timestamp: new Date().toISOString(),
  });
}
