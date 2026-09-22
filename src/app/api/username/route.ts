import { NextRequest, NextResponse } from "next/server";

// Platform definitions for username lookup
const PLATFORMS = [
  { name: "GitHub", url: "https://github.com/{username}", check: "https://github.com/{username}", icon: "github" },
  { name: "Twitter/X", url: "https://x.com/{username}", check: "https://x.com/{username}", icon: "twitter" },
  { name: "Instagram", url: "https://instagram.com/{username}", check: "https://www.instagram.com/{username}/", icon: "instagram" },
  { name: "Reddit", url: "https://reddit.com/u/{username}", check: "https://www.reddit.com/user/{username}/about.json", icon: "reddit" },
  { name: "TikTok", url: "https://tiktok.com/@{username}", check: "https://www.tiktok.com/@{username}", icon: "tiktok" },
  { name: "LinkedIn", url: "https://linkedin.com/in/{username}", check: "https://www.linkedin.com/in/{username}/", icon: "linkedin" },
  { name: "YouTube", url: "https://youtube.com/@{username}", check: "https://www.youtube.com/@{username}", icon: "youtube" },
  { name: "Pinterest", url: "https://pinterest.com/{username}", check: "https://www.pinterest.com/{username}/", icon: "pinterest" },
  { name: "Twitch", url: "https://twitch.tv/{username}", check: "https://www.twitch.tv/{username}", icon: "twitch" },
  { name: "Steam", url: "https://steamcommunity.com/id/{username}", check: "https://steamcommunity.com/id/{username}/", icon: "steam" },
  { name: "Dev.to", url: "https://dev.to/{username}", check: "https://dev.to/{username}", icon: "dev" },
  { name: "Medium", url: "https://medium.com/@{username}", check: "https://medium.com/@{username}", icon: "medium" },
  { name: "HackerNews", url: "https://news.ycombinator.com/user?id={username}", check: "https://hacker-news.firebaseio.com/v0/user/{username}.json", icon: "hackernews" },
  { name: "GitLab", url: "https://gitlab.com/{username}", check: "https://gitlab.com/{username}", icon: "gitlab" },
  { name: "Keybase", url: "https://keybase.io/{username}", check: "https://keybase.io/{username}", icon: "keybase" },
  { name: "Mastodon", url: "https://mastodon.social/@{username}", check: "https://mastodon.social/@{username}", icon: "mastodon" },
  { name: "Snapchat", url: "https://snapchat.com/add/{username}", check: "https://www.snapchat.com/add/{username}", icon: "snapchat" },
  { name: "Spotify", url: "https://open.spotify.com/user/{username}", check: "https://open.spotify.com/user/{username}", icon: "spotify" },
];

async function checkPlatform(
  platform: typeof PLATFORMS[0],
  username: string
): Promise<{ platform: string; url: string; found: boolean; icon: string }> {
  const url = platform.url.replace("{username}", username);
  const checkUrl = platform.check.replace("{username}", username);

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);

    const res = await fetch(checkUrl, {
      method: "GET",
      redirect: "follow",
      signal: controller.signal,
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; not4recon-osint/1.0)",
      },
    });

    clearTimeout(timeout);

    // Special handling for JSON APIs
    if (platform.name === "Reddit") {
      if (res.ok) {
        const data = await res.json() as { kind?: string };
        return { platform: platform.name, url, found: data.kind === "t2", icon: platform.icon };
      }
      return { platform: platform.name, url, found: false, icon: platform.icon };
    }

    if (platform.name === "HackerNews") {
      if (res.ok) {
        const data = await res.json() as { id?: string } | null;
        return { platform: platform.name, url, found: data !== null && typeof data === "object" && "id" in data, icon: platform.icon };
      }
      return { platform: platform.name, url, found: false, icon: platform.icon };
    }

    // For most platforms: 200 = found, 404 = not found
    const found = res.status === 200 || res.status === 301 || res.status === 302;
    return { platform: platform.name, url, found, icon: platform.icon };
  } catch {
    return { platform: platform.name, url, found: false, icon: platform.icon };
  }
}

export async function GET(req: NextRequest) {
  const username = req.nextUrl.searchParams.get("q");
  if (!username) {
    return NextResponse.json({ error: "Username parameter required" }, { status: 400 });
  }

  const clean = username.trim().replace(/^@/, "");

  if (clean.length < 2 || clean.length > 39) {
    return NextResponse.json({ error: "Username must be 2–39 characters" }, { status: 400 });
  }

  if (!/^[a-zA-Z0-9._-]+$/.test(clean)) {
    return NextResponse.json({ error: "Username contains invalid characters" }, { status: 400 });
  }

  // Run all checks in parallel
  const results = await Promise.all(
    PLATFORMS.map((p) => checkPlatform(p, clean))
  );

  const found = results.filter((r) => r.found);
  const notFound = results.filter((r) => !r.found);

  return NextResponse.json({
    username: clean,
    totalChecked: results.length,
    foundCount: found.length,
    found,
    notFound,
    timestamp: new Date().toISOString(),
  });
}
