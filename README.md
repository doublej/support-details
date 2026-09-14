# support-details

Device details you can share with support in one tap.

**Live:** https://support-details.jurrejan.com

Someone helping you asks which phone, browser or screen you have? Open the page and tap
**Share link**. The page reads the device (browser, system, screen, accessibility settings,
features, network hints, language and time) and packs everything into the link itself, so nothing
is uploaded or stored on a server. Whoever opens the link sees the same details in a read-only
view. Copy as text, email and a QR code to open the page on a phone are there too.

Made by [Jurre-Jan Smit](https://www.jurrejan.com).

## Requirements

- [Bun](https://bun.sh/)

## Getting Started

```bash
bun install
bun run dev
```

## Common Commands

| Command | Description |
|---------|-------------|
| `bun install` | Install dependencies |
| `bun run dev` | Start Vite dev server |
| `bun run build` | Build for production (static files in `build/`) |
| `bun run preview` | Preview production build |
| `bun run check` | Type-check with svelte-check |
| `bun run test` | Run tests |
| `bun run lint` | Lint with Biome |
| `just deploy` | Build and publish with `cdy` |

## Project Structure

```
src/
  app.html              # HTML template
  app.css               # design tokens and shared styles
  routes/+page.svelte   # the page: own report, received report, broken link
  lib/collect.ts        # reads the device
  lib/ua.ts             # friendly browser, system and device names
  lib/report.ts         # report link encoding and plain-text export
  lib/ui/               # page sections
```
