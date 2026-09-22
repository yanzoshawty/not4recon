# not4recon

> **Browser-native OSINT terminal.** Investigate domains, IPs, emails, and digital footprints — no installation, no bloat, no compromises.

---

## What is not4recon?

**not4recon** is an open-source, browser-based OSINT (Open Source Intelligence) terminal built for security researchers, ethical hackers, and digital investigators. It aggregates public intelligence from multiple open sources into a single, clean terminal interface — inspired by tools found in Parrot OS Security.

No Shodan account. No complex setup. Just open the browser and start investigating.

---

## Features

| Module | Description | Data Source |
|---|---|---|
| **Domain / WHOIS** | DNS records + WHOIS registration data | dns.google + rdap.org |
| **IP Geolocation** | Country, ISP, ASN, proxy/VPN detection | ip-api.com (free) |
| **Email Breach Check** | Check against known data breaches | HaveIBeenPwned v3 |
| **Google Dorking** | Auto-generate 30+ targeted dork queries | Generated locally |
| **Username Lookup** | Scan 18 social platforms in parallel | Direct HTTP checks |

---

## Quick Start — Deploy to Vercel

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/ynz-code/not4recon)

**Manual deploy:**

```bash
# 1. Clone repo
git clone https://github.com/ynz-code/not4recon.git
cd not4recon

# 2. Install dependencies
npm install

# 3. Copy environment file
cp .env.example .env.local

# 4. Run locally
npm run dev
# Open http://localhost:3000
```

---

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `HIBP_API_KEY` | Optional | HaveIBeenPwned API key. Without it, breach check shows manual links. Get one at [haveibeenpwned.com/API/Key](https://haveibeenpwned.com/API/Key) |

**Setting on Vercel:**
1. Go to your project → Settings → Environment Variables
2. Add `HIBP_API_KEY` with your key value
3. Redeploy

All other modules (Domain, IP, Dorking, Username) work without any API key.

---

## API Endpoints

All endpoints are available under `/api/`:

```
GET /api/domain?q=example.com     → WHOIS + DNS records
GET /api/ip?q=8.8.8.8             → IP geolocation + ASN info
GET /api/ip?q=self                → Lookup your own public IP
GET /api/breach?q=user@email.com  → Email breach check
GET /api/dork?q=example.com       → Generate dork queries
GET /api/username?q=johndoe       → Scan 18 social platforms
```

---

## Tech Stack

- **Framework:** Next.js 15 (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS v3
- **Icons:** Phosphor Icons
- **Deploy:** Vercel

---

## Data Sources

| Source | Usage | Rate Limit |
|---|---|---|
| `dns.google` | DNS resolution (DoH) | None |
| `rdap.org` | Domain registration data | None |
| `ip-api.com` | IP geolocation | 45 req/min (free) |
| `haveibeenpwned.com` | Email breach database | Requires API key |
| Direct HTTP | Username platform checks | ~5s timeout/platform |

---

## Ethics & Legal

> ⚠️ **This tool is for authorized use only.**

- Only investigate targets you **own** or have **written permission** to test
- All data sources used are **publicly available**
- Google dork queries must only be run against **authorized targets**
- Do not use for stalking, harassment, or doxing
- Respect each platform's Terms of Service
- Unauthorized scanning may violate local and international laws

---

## Project Structure

```
not4recon/
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── domain/route.ts     ← WHOIS + DNS API
│   │   │   ├── ip/route.ts         ← Geolocation API
│   │   │   ├── breach/route.ts     ← HIBP breach check
│   │   │   ├── dork/route.ts       ← Dork generator
│   │   │   └── username/route.ts   ← Username scanner
│   │   ├── globals.css             ← Terminal design system
│   │   ├── layout.tsx
│   │   └── page.tsx                ← Main UI
│   └── components/
│       ├── TerminalHeader.tsx      ← Boot sequence + header
│       ├── TerminalInput.tsx       ← CLI-style input
│       ├── ResultBlock.tsx         ← Output display components
│       └── modules/                ← One file per OSINT module
│           ├── DomainModule.tsx
│           ├── IPModule.tsx
│           ├── BreachModule.tsx
│           ├── DorkModule.tsx
│           └── UsernameModule.tsx
├── .env.example
├── vercel.json
└── README.md
```

---

## Contributing

1. Fork the repository
2. Create your branch: `git checkout -b feature/new-module`
3. Commit your changes: `git commit -m 'feat: add subdomain enumeration module'`
4. Push and open a Pull Request

Planned modules: Subdomain enumeration (crt.sh), Metadata extractor, Shodan integration, VirusTotal hash lookup.

---

## License

MIT License — see [LICENSE](LICENSE) file.

---

---

# not4recon — Dokumentasi Bahasa Indonesia

> **Terminal OSINT berbasis browser.** Investigasi domain, IP, email, dan jejak digital — tanpa instalasi, tanpa ribet.

---

## Apa itu not4recon?

**not4recon** adalah tool OSINT (Open Source Intelligence) open-source berbasis browser, dirancang untuk security researcher, ethical hacker, dan digital investigator. Tool ini mengumpulkan intelijen publik dari berbagai sumber ke dalam satu antarmuka terminal yang bersih — terinspirasi dari tools di Parrot OS Security.

Tidak perlu akun Shodan. Tidak perlu setup rumit. Buka browser, langsung investigasi.

---

## Fitur

| Modul | Deskripsi | Sumber Data |
|---|---|---|
| **Domain / WHOIS** | DNS records + data registrasi WHOIS | dns.google + rdap.org |
| **IP Geolocation** | Negara, ISP, ASN, deteksi proxy/VPN | ip-api.com (gratis) |
| **Email Breach Check** | Cek kebocoran data email | HaveIBeenPwned v3 |
| **Google Dorking** | Generate 30+ query dork otomatis | Dibuat lokal |
| **Username Lookup** | Scan 18 platform sosial sekaligus | Direct HTTP checks |

---

## Cara Deploy ke Vercel

**Deploy manual:**

```bash
# 1. Clone repo
git clone https://github.com/ynz-code/not4recon.git
cd not4recon

# 2. Install dependencies
npm install

# 3. Copy file environment
cp .env.example .env.local

# 4. Jalankan lokal
npm run dev
# Buka http://localhost:3000
```

**Deploy ke Vercel:**
1. Push kode ke GitHub
2. Buka [vercel.com](https://vercel.com) → Import repository
3. Vercel otomatis detect Next.js, klik Deploy
4. (Opsional) Tambahkan `HIBP_API_KEY` di Settings → Environment Variables

---

## Environment Variables

| Variabel | Wajib? | Keterangan |
|---|---|---|
| `HIBP_API_KEY` | Tidak | API key HaveIBeenPwned. Tanpa ini, breach check tetap jalan tapi menampilkan link manual. Beli di [haveibeenpwned.com/API/Key](https://haveibeenpwned.com/API/Key) |

Semua modul lain (Domain, IP, Dorking, Username) jalan tanpa API key apapun.

---

## Cara Menggunakan

### Domain / WHOIS
Masukkan nama domain (contoh: `google.com`) untuk melihat:
- Data registrasi: registrar, tanggal buat, tanggal expired
- DNS records: A, AAAA, MX, NS, TXT, CNAME, dll
- Nameservers

### IP Geolocation
Masukkan alamat IP (contoh: `8.8.8.8`) untuk melihat:
- Negara, kota, koordinat
- ISP dan organisasi
- ASN (Autonomous System Number)
- Flag: apakah proxy/VPN, mobile, atau hosting

Klik **"→ lookup my own IP"** untuk cek IP kamu sendiri.

### Email Breach Check
Masukkan email untuk mengecek apakah pernah bocor di data breach publik.

Jika `HIBP_API_KEY` belum dikonfigurasi, tool akan tampilkan link untuk cek manual di situs HIBP dan alternatifnya.

### Google Dorking
Masukkan domain target untuk generate puluhan query Google Dork otomatis, dikelompokkan berdasarkan kategori:
- File sensitif & direktori
- Panel admin & login
- Dokumen dan data terekspos
- Subdomains & infrastruktur
- Error messages & debug info
- Technology stack

Setiap query bisa langsung dibuka di Google atau di-copy.

### Username Lookup
Masukkan username untuk scan 18 platform sekaligus:
GitHub, Twitter/X, Instagram, Reddit, TikTok, LinkedIn, YouTube, Pinterest, Twitch, Steam, Dev.to, Medium, HackerNews, GitLab, Keybase, Mastodon, Snapchat, Spotify.

---

## Etika & Hukum

> ⚠️ **Tool ini hanya untuk penggunaan yang sah dan berotorisasi.**

- Hanya investigasi target yang kamu **miliki** atau punya **izin tertulis** untuk ditest
- Semua sumber data yang digunakan adalah **data publik**
- Query Google Dork hanya boleh dijalankan terhadap **target berotorisasi**
- Jangan gunakan untuk stalking, harrasment, atau doxxing
- Hormati Terms of Service setiap platform
- Scanning tanpa izin bisa melanggar hukum Indonesia dan internasional

---

## Kontribusi

1. Fork repository ini
2. Buat branch baru: `git checkout -b fitur/modul-baru`
3. Commit perubahan: `git commit -m 'feat: tambah modul subdomain'`
4. Push dan buka Pull Request

Modul yang direncanakan: Subdomain enumeration (crt.sh), Metadata extractor, Integrasi Shodan, VirusTotal hash lookup.

---

## Lisensi

MIT License — bebas digunakan, dimodifikasi, dan didistribusikan dengan tetap mencantumkan credit.
